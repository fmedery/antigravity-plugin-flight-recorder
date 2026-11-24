import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  aggregateCosts,
  estimateStepCost
} from "../shared/pricing.js";
import { pathBaseName } from "../shared/paths.js";
import {
  resolveTimeRangeBounds,
  type TimeRangeQuery
} from "../shared/timeRange.js";
import type {
  ConversationDetail,
  ConversationSummary,
  DiagnosticFinding,
  FileTouchRecord,
  ModelPricingRule,
  ModelSwitchEvent,
  ModelUsageMetric,
  PlannerStepRecord,
  PluginSkillMetric,
  ProjectDetail,
  ProjectSource,
  ProjectSummary,
  DashboardData,
  SkillToolMetric,
  SurfaceType,
  TimeSummary,
  TokenSummary,
  ToolCallRecord,
  ToolErrorSample,
  TurnRecord
} from "../shared/types.js";
import type {
  HookEventRow,
  PersistConversationInput,
  StoredConversationRow,
  TrackerDatabase
} from "./db.js";
import type { ParsedTranscript } from "./transcriptParser.js";
import {
  addErrorSample,
  clearInstalledPluginsCache,
  computeScopeSkillEfficiency,
  discoverInstalledPlugins,
  finalizeErrorSamples,
  formatErrorSampleTarget,
  mergePluginSkillMetrics,
  normalizeErrorSampleMessage,
  resolveToolPluginAndChild,
  resolveToolPluginOrSkill,
  type ConversationEfficiencyInput,
  type InstalledPluginInfo,
  type InstalledPluginRegistry
} from "./skillEfficiency.js";

export {
  clearInstalledPluginsCache,
  computeScopeSkillEfficiency,
  discoverInstalledPlugins,
  mergePluginSkillMetrics,
  resolveToolPluginAndChild,
  resolveToolPluginOrSkill,
  type ConversationEfficiencyInput,
  type InstalledPluginInfo,
  type InstalledPluginRegistry
};

export interface AnalyzeMeta {
  surface: SurfaceType;
  projectPath: string;
  projectSource: ProjectSource;
  parentConversationId: string | null;
  subagentRole: string | null;
  subagentType: string | null;
}

interface Interval {
  start: number;
  end: number;
}

function mergeIntervalsWallMs(intervals: Interval[]): number {
  if (intervals.length === 0) return 0;
  const sorted = intervals
    .filter((iv) => iv.end >= iv.start && iv.start > 0)
    .sort((a, b) => a.start - b.start);
  if (sorted.length === 0) return 0;

  let total = 0;
  let curStart = sorted[0].start;
  let curEnd = sorted[0].end;

  for (let i = 1; i < sorted.length; i++) {
    const iv = sorted[i];
    if (iv.start <= curEnd) {
      if (iv.end > curEnd) curEnd = iv.end;
    } else {
      total += curEnd - curStart;
      curStart = iv.start;
      curEnd = iv.end;
    }
  }
  total += curEnd - curStart;
  return total;
}

function formatShortTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatDurationShort(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(totalSec / 60);
  const remSec = totalSec % 60;
  if (min < 60) return `${min}m ${remSec}s`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hr}h ${remMin}m`;
}

export function analyzeConversation(
  parsed: ParsedTranscript,
  hookEvents: HookEventRow[],
  meta: AnalyzeMeta
): PersistConversationInput {
  const stepToTools = new Map<number, typeof parsed.toolCalls>();
  for (const tc of parsed.toolCalls) {
    const list = stepToTools.get(tc.plannerStepIndex) ?? [];
    list.push(tc);
    stepToTools.set(tc.plannerStepIndex, list);
  }

  // Build lookup maps from hook events for higher-precision end times & termination reason.
  let terminationReason: string | null = null;
  const stopOrPostEvents = hookEvents.filter(
    (h) => h.hookEventName === "Stop" || h.hookEventName === "PostInvocation"
  );
  for (let i = hookEvents.length - 1; i >= 0; i--) {
    if (hookEvents[i].terminationReason) {
      terminationReason = hookEvents[i].terminationReason;
      break;
    }
  }

  // First pass on planner steps: detect cache misses.
  const plannerStepsAnalyzed: Array<
    Omit<PlannerStepRecord, "estimatedCostUsd"> & {
      attributionNote: string;
    }
  > = [];

  for (let i = 0; i < parsed.plannerSteps.length; i++) {
    const step = parsed.plannerSteps[i];
    const prev = i > 0 ? parsed.plannerSteps[i - 1] : null;
    const prevContext = prev ? prev.totalContextTokens : 0;

    let isCacheMiss = false;
    let cacheMissCause: string | null = null;

    if (prev && prevContext > 1000 && step.cacheReadTokens < prevContext * 0.8) {
      isCacheMiss = true;
      const gapMs =
        step.createdAtMs > 0 && prev.createdAtMs > 0
          ? step.createdAtMs - prev.createdAtMs
          : 0;
      if (step.turnIndex > prev.turnIndex && gapMs >= 4 * 60 * 1000) {
        cacheMissCause = "Idle gap expired prompt cache TTL";
      } else if (step.model && prev.model && step.model !== prev.model) {
        cacheMissCause = `Model changed (${prev.model} → ${step.model})`;
      } else {
        cacheMissCause = "Context compaction or prefix reset";
      }
    }

    const hitDenom = step.inputTokens + step.cacheReadTokens;
    plannerStepsAnalyzed.push({
      stepIndex: step.stepIndex,
      turnIndex: step.turnIndex,
      model: step.model,
      createdAtMs: step.createdAtMs,
      completedAtMs: null,
      modelDurationMs: 0,
      inputTokens: step.inputTokens,
      cacheReadTokens: step.cacheReadTokens,
      outputTokens: step.outputTokens,
      totalContextTokens: step.totalContextTokens,
      cacheHitRatio: hitDenom > 0 ? step.cacheReadTokens / hitDenom : 0,
      isCacheMiss,
      cacheMissCause,
      thinkingChars: step.thinkingChars,
      contentChars: step.contentChars,
      toolCallCount: step.toolCallCount,
      status: step.status,
      attributedSummary:
        i === 0 ? "System prompt & initial request" : "",
      attributionNote: ""
    });
  }

  // Compute remaining steps before next cache reset for each planner step.
  const remainingStepsAfter = new Array<number>(plannerStepsAnalyzed.length).fill(0);
  for (let i = 0; i < plannerStepsAnalyzed.length; i++) {
    let count = 0;
    for (let j = i + 1; j < plannerStepsAnalyzed.length; j++) {
      if (plannerStepsAnalyzed[j].isCacheMiss) break;
      count += 1;
    }
    remainingStepsAfter[i] = count;
  }

  // Attribute inputTokens proportionally to intervening tool calls.
  const analyzedTools: Array<Omit<ToolCallRecord, "id">> = parsed.toolCalls.map((tc) => ({
    stepIndex: tc.stepIndex,
    plannerStepIndex: tc.plannerStepIndex,
    turnIndex: tc.turnIndex,
    toolCallId: tc.toolCallId,
    toolName: tc.toolName,
    category: tc.category,
    mcpServer: tc.mcpServer,
    skillName: tc.skillName,
    skillPlugin: tc.skillPlugin,
    targetPath: tc.targetPath,
    childConversationId: tc.childConversationId,
    startedAtMs: tc.startedAtMs,
    completedAtMs: tc.completedAtMs,
    durationMs: tc.durationMs,
    argsPreview: tc.argsPreview,
    resultBytes: tc.resultBytes,
    estResultTokens: tc.estResultTokens,
    attributedInputTokens: 0,
    compoundedCacheTokens: 0,
    isError: tc.isError,
    errorPreview: tc.errorPreview
  }));

  const toolsByPlanner = new Map<number, typeof analyzedTools>();
  for (const tc of analyzedTools) {
    const arr = toolsByPlanner.get(tc.plannerStepIndex) ?? [];
    arr.push(tc);
    toolsByPlanner.set(tc.plannerStepIndex, arr);
  }

  for (let i = 1; i < plannerStepsAnalyzed.length; i++) {
    const curr = plannerStepsAnalyzed[i];
    const prev = plannerStepsAnalyzed[i - 1];
    const prevTools = toolsByPlanner.get(prev.stepIndex) ?? [];

    // Estimate how much of curr.inputTokens came from a new user turn vs tool results.
    let promptEstTokens = 0;
    if (curr.turnIndex > prev.turnIndex) {
      const turn = parsed.turns.find((t) => t.turnIndex === curr.turnIndex);
      if (turn) {
        promptEstTokens = Math.ceil(turn.promptBytes / 4);
      }
    }

    const totalToolEst = prevTools.reduce((sum, tc) => sum + tc.estResultTokens, 0);
    // On cache miss, only attribute incremental growth beyond previous context if positive,
    // otherwise attribute proportionally up to totalToolEst so tools aren't blamed for full TTL reset.
    const attributablePool = curr.isCacheMiss
      ? Math.min(curr.inputTokens, totalToolEst + promptEstTokens)
      : curr.inputTokens;

    const denom = totalToolEst + promptEstTokens;
    const carryMultiplier = remainingStepsAfter[i];

    if (prevTools.length > 0 && denom > 0 && attributablePool > 0) {
      const toolShare = attributablePool * (totalToolEst / denom);
      for (const tc of prevTools) {
        const share =
          totalToolEst > 0 ? Math.round(toolShare * (tc.estResultTokens / totalToolEst)) : 0;
        tc.attributedInputTokens = share;
        tc.compoundedCacheTokens = share * carryMultiplier;
      }
      const topTool = [...prevTools].sort(
        (a, b) => b.attributedInputTokens - a.attributedInputTokens
      )[0];
      curr.attributedSummary = curr.isCacheMiss
        ? `${curr.cacheMissCause ?? "Cache miss"} (+${formatShortTokens(curr.inputTokens)} uncached)`
        : `Driven by ${topTool.skillName ?? topTool.toolName} (+${formatShortTokens(topTool.attributedInputTokens)})`;
    } else if (curr.isCacheMiss) {
      curr.attributedSummary = curr.cacheMissCause ?? "Cache miss / reset";
    } else if (curr.turnIndex > prev.turnIndex) {
      curr.attributedSummary = "User follow-up prompt";
    } else {
      curr.attributedSummary = "Model continuation";
    }
  }

  // Compute model durations & completion boundaries per step.
  const consumedHookIds = new Set<number>();
  let extraApprovalIdleMs = 0;

  for (let i = 0; i < plannerStepsAnalyzed.length; i++) {
    const step = plannerStepsAnalyzed[i];
    const tools = toolsByPlanner.get(step.stepIndex) ?? [];
    const nextStep = i + 1 < plannerStepsAnalyzed.length ? plannerStepsAnalyzed[i + 1] : null;
    const estFallbackMs = Math.max(
      400,
      Math.min(180_000, Math.round((step.outputTokens / 65) * 1000))
    );

    if (tools.length > 0) {
      const validStarts = tools
        .map((t) => t.startedAtMs)
        .filter((ms): ms is number => ms !== null && ms > 0);
      const firstToolStart = validStarts.length > 0 ? Math.min(...validStarts) : null;

      if (
        firstToolStart !== null &&
        step.createdAtMs > 0 &&
        firstToolStart >= step.createdAtMs
      ) {
        const rawGap = firstToolStart - step.createdAtMs;
        if (rawGap > 300_000) {
          // Gaps > 5m before first tool execution represent approval waits or sleep, not model thinking.
          step.modelDurationMs = estFallbackMs;
          extraApprovalIdleMs += rawGap - estFallbackMs;
          step.completedAtMs = step.createdAtMs + estFallbackMs;
        } else {
          step.modelDurationMs = rawGap;
          step.completedAtMs = firstToolStart;
        }
      } else {
        step.modelDurationMs = estFallbackMs;
        step.completedAtMs =
          step.createdAtMs > 0 ? step.createdAtMs + estFallbackMs : null;
      }
    } else {
      // Tool-less step: bound strictly by the earliest next step, next turn, or 5m cap.
      const nextTurn = parsed.turns.find((t) => t.turnIndex === step.turnIndex + 1);
      const upperBound = Math.min(
        nextStep && nextStep.createdAtMs > step.createdAtMs
          ? nextStep.createdAtMs
          : Number.POSITIVE_INFINITY,
        nextTurn && nextTurn.createdAtMs > step.createdAtMs
          ? nextTurn.createdAtMs
          : Number.POSITIVE_INFINITY,
        step.createdAtMs > 0 ? step.createdAtMs + 300_000 : Number.POSITIVE_INFINITY
      );

      const hookMatch = stopOrPostEvents.find(
        (h) =>
          !consumedHookIds.has(h.id) &&
          step.createdAtMs > 0 &&
          h.tsMs >= step.createdAtMs &&
          h.tsMs <= upperBound &&
          (!nextStep ||
            nextStep.createdAtMs <= step.createdAtMs ||
            h.tsMs <= nextStep.createdAtMs)
      );
      if (hookMatch && step.createdAtMs > 0) {
        consumedHookIds.add(hookMatch.id);
        step.modelDurationMs = Math.max(
          100,
          Math.min(300_000, hookMatch.tsMs - step.createdAtMs)
        );
        step.completedAtMs = hookMatch.tsMs;
      } else {
        step.modelDurationMs = estFallbackMs;
        step.completedAtMs =
          step.createdAtMs > 0 ? step.createdAtMs + estFallbackMs : null;
      }
    }
  }

  // Turn aggregation + User Idle gap calculation.
  const turnRecords: TurnRecord[] = [];
  let prevTurnEndMs = 0;

  for (let tIdx = 0; tIdx < parsed.turns.length; tIdx++) {
    const t = parsed.turns[tIdx];
    const tSteps = plannerStepsAnalyzed.filter((s) => s.turnIndex === t.turnIndex);
    const tTools = analyzedTools.filter((tc) => tc.turnIndex === t.turnIndex);

    const modelMs = tSteps.reduce((sum, s) => sum + s.modelDurationMs, 0);
    const toolIntervals: Interval[] = tTools
      .filter((tc) => tc.startedAtMs !== null && tc.startedAtMs > 0)
      .map((tc) => ({
        start: tc.startedAtMs!,
        end: Math.max(tc.startedAtMs!, tc.completedAtMs ?? tc.startedAtMs! + tc.durationMs)
      }));
    const toolWallMs = mergeIntervalsWallMs(toolIntervals);
    const activeMs = modelMs + toolWallMs;

    const startCandidates = [
      t.createdAtMs,
      ...tSteps.map((s) => s.createdAtMs).filter((ms) => ms > 0)
    ].filter((ms) => ms > 0);
    const startedAtMs = startCandidates.length > 0 ? Math.min(...startCandidates) : 0;

    const endCandidates = [
      startedAtMs,
      ...tSteps.map((s) => s.completedAtMs ?? s.createdAtMs).filter((ms) => ms > 0),
      ...tTools.map((tc) => tc.completedAtMs ?? tc.startedAtMs ?? 0).filter((ms) => ms > 0)
    ].filter((ms) => ms > 0);
    const endedAtMs = endCandidates.length > 0 ? Math.max(...endCandidates) : startedAtMs;

    const userIdleBeforeMs =
      tIdx > 0 && prevTurnEndMs > 0 && startedAtMs > prevTurnEndMs
        ? startedAtMs - prevTurnEndMs
        : 0;
    prevTurnEndMs = endedAtMs;

    const inputTokens = tSteps.reduce((sum, s) => sum + s.inputTokens, 0);
    const cacheReadTokens = tSteps.reduce((sum, s) => sum + s.cacheReadTokens, 0);
    const outputTokens = tSteps.reduce((sum, s) => sum + s.outputTokens, 0);
    const denom = inputTokens + cacheReadTokens;

    turnRecords.push({
      turnIndex: t.turnIndex,
      promptPreview: t.promptPreview,
      slashCommand: t.slashCommand,
      startedAtMs,
      endedAtMs,
      activeMs,
      modelMs,
      toolWallMs,
      userIdleBeforeMs,
      inputTokens,
      cacheReadTokens,
      outputTokens,
      cacheHitRatio: denom > 0 ? cacheReadTokens / denom : 0
    });
  }

  // Files touched aggregation
  const filesMap = new Map<string, FileTouchRecord>();
  for (const tc of analyzedTools) {
    if (!tc.targetPath) continue;
    const existing = filesMap.get(tc.targetPath) ?? {
      path: tc.targetPath,
      reads: 0,
      edits: 0,
      creates: 0,
      totalBytesRead: 0,
      directTokens: 0,
      compoundedCacheTokens: 0,
      lastTouchedAtMs: 0
    };
    if (tc.toolName === "write_file") {
      existing.creates += 1;
    } else if (
      tc.toolName === "edit_file" ||
      tc.toolName === "replace_file_content" ||
      tc.toolName === "multi_replace_file_content"
    ) {
      existing.edits += 1;
    } else {
      existing.reads += 1;
      existing.totalBytesRead += tc.resultBytes;
    }
    existing.directTokens += tc.attributedInputTokens;
    existing.compoundedCacheTokens += tc.compoundedCacheTokens;
    const touchTs = tc.completedAtMs ?? tc.startedAtMs ?? 0;
    if (touchTs > existing.lastTouchedAtMs) existing.lastTouchedAtMs = touchTs;
    filesMap.set(tc.targetPath, existing);
  }
  const filesTouched = Array.from(filesMap.values()).sort(
    (a, b) =>
      b.compoundedCacheTokens + b.directTokens - (a.compoundedCacheTokens + a.directTokens)
  );

  // Conversation totals
  const inputTokens = plannerStepsAnalyzed.reduce((s, p) => s + p.inputTokens, 0);
  const cacheReadTokens = plannerStepsAnalyzed.reduce((s, p) => s + p.cacheReadTokens, 0);
  const outputTokens = plannerStepsAnalyzed.reduce((s, p) => s + p.outputTokens, 0);
  const peakContextTokens = plannerStepsAnalyzed.reduce(
    (max, p) => Math.max(max, p.totalContextTokens),
    0
  );

  const modelMs = turnRecords.reduce((s, t) => s + t.modelMs, 0);
  const toolWallMs = turnRecords.reduce((s, t) => s + t.toolWallMs, 0);
  const toolSumMs = analyzedTools.reduce((s, tc) => s + tc.durationMs, 0);
  const userIdleMs =
    turnRecords.reduce((s, t) => s + t.userIdleBeforeMs, 0) + extraApprovalIdleMs;
  const startedAtMs =
    turnRecords.length > 0 && turnRecords[0].startedAtMs > 0
      ? turnRecords[0].startedAtMs
      : parsed.startedAtMs;
  const endedAtMs =
    turnRecords.length > 0
      ? Math.max(parsed.endedAtMs, ...turnRecords.map((t) => t.endedAtMs))
      : parsed.endedAtMs;
  const rawActiveMs = modelMs + toolWallMs;
  const wallClockMs = endedAtMs > startedAtMs ? endedAtMs - startedAtMs : rawActiveMs;
  const activeMs =
    wallClockMs > 0 ? Math.min(rawActiveMs, wallClockMs) : rawActiveMs;

  const errorCount = analyzedTools.filter((t) => t.isError).length;
  const skillsUsed = Array.from(
    new Set(
      analyzedTools
        .map((t) => t.skillName)
        .filter((s): s is string => typeof s === "string" && s.length > 0)
    )
  ).sort();

  const diagnostics = buildDiagnostics(
    plannerStepsAnalyzed,
    analyzedTools,
    filesTouched
  );

  let title = parsed.title;
  const hasExplicitPrompt = parsed.hasExplicitUserPrompt ?? true;
  if (!hasExplicitPrompt || title === parsed.conversationId.slice(0, 8)) {
    const roleOrType = meta.subagentRole || meta.subagentType;
    if (roleOrType && parsed.systemTaskPreview) {
      title = `${roleOrType} — ${parsed.systemTaskPreview}`.slice(0, 80);
    } else if (roleOrType) {
      title = roleOrType;
    } else if (parsed.systemTaskPreview) {
      title = parsed.systemTaskPreview.slice(0, 76);
    }
  }

  return {
    conversationId: parsed.conversationId,
    title,
    surface: meta.surface,
    transcriptPath: parsed.transcriptPath,
    projectPath: meta.projectPath,
    projectSource: meta.projectSource,
    parentConversationId: meta.parentConversationId,
    subagentRole: meta.subagentRole,
    subagentType: meta.subagentType,
    startedAtMs,
    endedAtMs,
    terminationReason,
    models: parsed.models,
    slashCommands: parsed.slashCommands,
    skillsUsed,
    hasLiveHooks: hookEvents.length > 0,
    hasTokenTelemetry: parsed.hasTokenTelemetry ?? parsed.plannerSteps.length > 0,
    inputTokens,
    cacheReadTokens,
    outputTokens,
    peakContextTokens,
    activeMs,
    modelMs,
    toolWallMs,
    toolSumMs,
    userIdleMs,
    wallClockMs,
    errorCount,
    turns: turnRecords,
    plannerSteps: plannerStepsAnalyzed.map(({ attributionNote: _unused, ...rest }) => rest),
    toolCalls: analyzedTools,
    diagnostics,
    filesTouched,
    indexedAtMs: Date.now()
  };
}

function buildDiagnostics(
  plannerSteps: Array<Omit<PlannerStepRecord, "estimatedCostUsd">>,
  toolCalls: Array<Omit<ToolCallRecord, "id">>,
  filesTouched: FileTouchRecord[]
): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  // 1. Top token drivers (by direct + compounded impact)
  const topTokenTools = [...toolCalls]
    .filter((tc) => tc.attributedInputTokens > 0 || tc.compoundedCacheTokens > 0)
    .sort(
      (a, b) =>
        b.attributedInputTokens +
        b.compoundedCacheTokens -
        (a.attributedInputTokens + a.compoundedCacheTokens)
    )
    .slice(0, 5);

  for (const tc of topTokenTools) {
    const label = tc.skillName
      ? `Skill: ${tc.skillName}`
      : tc.mcpServer
        ? `MCP ${tc.mcpServer}: ${tc.toolName}`
        : `${tc.toolName}${tc.targetPath ? ` (${pathBaseName(tc.targetPath)})` : ""}`;
    findings.push({
      id: `tok-${tc.stepIndex}-${tc.toolName}`,
      severity: tc.compoundedCacheTokens > 25_000 ? "warning" : "info",
      category: "token_driver",
      title: `Token driver: ${label}`,
      detail: `${(tc.resultBytes / 1024).toFixed(1)} KB output added ~${formatShortTokens(tc.attributedInputTokens)} direct input tokens and ~${formatShortTokens(tc.compoundedCacheTokens)} compounded cache reads.`,
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      impactTokens: tc.attributedInputTokens + tc.compoundedCacheTokens,
      impactMs: tc.durationMs,
      citation: `Step ${tc.stepIndex} (Turn ${tc.turnIndex + 1})`
    });
  }

  // 2. Cache misses / resets
  for (const step of plannerSteps) {
    if (!step.isCacheMiss) continue;
    findings.push({
      id: `miss-${step.stepIndex}`,
      severity: "warning",
      category: "cache_miss",
      title: `Cache miss at Step ${step.stepIndex}`,
      detail: `${step.cacheMissCause ?? "Prompt cache reset"} — ${formatShortTokens(step.inputTokens)} uncached input tokens (${Math.round(step.cacheHitRatio * 100)}% cache hit).`,
      stepIndex: step.stepIndex,
      turnIndex: step.turnIndex,
      impactTokens: step.inputTokens,
      impactMs: step.modelDurationMs,
      citation: `Planner Step ${step.stepIndex}`
    });
  }

  // 3. Top slowest steps (tools & model)
  const slowestCandidates: Array<{
    id: string;
    title: string;
    detail: string;
    stepIndex: number;
    turnIndex: number;
    ms: number;
  }> = [];
  for (const tc of toolCalls) {
    if (tc.durationMs >= 1500) {
      slowestCandidates.push({
        id: `slow-tc-${tc.stepIndex}-${tc.toolName}`,
        title: `Slow tool: ${tc.toolName}${tc.argsPreview ? ` (${tc.argsPreview.slice(0, 48)})` : ""}`,
        detail: `Took ${formatDurationShort(tc.durationMs)}${tc.isError ? " and exited with an error" : ""}.`,
        stepIndex: tc.stepIndex,
        turnIndex: tc.turnIndex,
        ms: tc.durationMs
      });
    }
  }
  for (const ps of plannerSteps) {
    if (ps.modelDurationMs >= 3000) {
      slowestCandidates.push({
        id: `slow-ps-${ps.stepIndex}`,
        title: `Long model step: ${ps.model} (Step ${ps.stepIndex})`,
        detail: `Model thinking/generation took ${formatDurationShort(ps.modelDurationMs)} (${formatShortTokens(ps.outputTokens)} output tokens).`,
        stepIndex: ps.stepIndex,
        turnIndex: ps.turnIndex,
        ms: ps.modelDurationMs
      });
    }
  }
  slowestCandidates
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 5)
    .forEach((item) => {
      findings.push({
        id: item.id,
        severity: item.ms >= 10_000 ? "warning" : "info",
        category: "slow_step",
        title: item.title,
        detail: item.detail,
        stepIndex: item.stepIndex,
        turnIndex: item.turnIndex,
        impactTokens: null,
        impactMs: item.ms,
        citation: `Step ${item.stepIndex}`
      });
    });

  // 4. Repeated reads of the same file
  for (const f of filesTouched) {
    if (f.reads >= 3) {
      findings.push({
        id: `reread-${f.path}`,
        severity: "info",
        category: "repeated_read",
        title: `Repeated reads: ${pathBaseName(f.path)} (${f.reads}×)`,
        detail: `${f.path} was read ${f.reads} times (${(f.totalBytesRead / 1024).toFixed(1)} KB total), contributing ~${formatShortTokens(f.directTokens)} direct tokens.`,
        stepIndex: null,
        turnIndex: null,
        impactTokens: f.directTokens,
        impactMs: null,
        citation: f.path
      });
    }
  }

  // 5. Errors & failed commands
  for (const tc of toolCalls) {
    if (!tc.isError) continue;
    findings.push({
      id: `err-${tc.stepIndex}-${tc.toolName}`,
      severity: "critical",
      category: "error_retry",
      title: `Tool error: ${tc.toolName} at Step ${tc.stepIndex}`,
      detail: tc.errorPreview ?? "Tool reported an execution error.",
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      impactTokens: tc.attributedInputTokens,
      impactMs: tc.durationMs,
      citation: `Step ${tc.stepIndex}`
    });
  }

  // 6. Orchestrator model switches (model_split)
  if (plannerSteps.length > 0) {
    let switchCount = 0;
    let missCount = 0;
    let missUncachedTokens = 0;
    let firstSwitch: { stepIndex: number; turnIndex: number } | null = null;
    const modelTotals = new Map<string, { tokens: number; steps: number }>();

    for (let i = 0; i < plannerSteps.length; i++) {
      const ps = plannerSteps[i];
      const normModel = (ps.model || "").trim() || "unknown";
      const curTotals = modelTotals.get(normModel) ?? { tokens: 0, steps: 0 };
      curTotals.tokens += ps.inputTokens + ps.cacheReadTokens + ps.outputTokens;
      curTotals.steps += 1;
      modelTotals.set(normModel, curTotals);

      if (i > 0) {
        const prevModel = (plannerSteps[i - 1].model || "").trim() || "unknown";
        if (prevModel !== normModel) {
          switchCount += 1;
          if (!firstSwitch) {
            firstSwitch = { stepIndex: ps.stepIndex, turnIndex: ps.turnIndex };
          }
          if (ps.isCacheMiss) {
            missCount += 1;
            missUncachedTokens += ps.inputTokens;
          }
        }
      }
    }

    if (switchCount > 0 && firstSwitch) {
      const grandTokens = Array.from(modelTotals.values()).reduce(
        (sum, v) => sum + v.tokens,
        0
      );
      const grandSteps = plannerSteps.length;
      const mixParts = Array.from(modelTotals.entries())
        .sort((a, b) => b[1].tokens - a[1].tokens || b[1].steps - a[1].steps)
        .slice(0, 4)
        .map(([model, v]) => {
          const pct =
            grandTokens > 0
              ? Math.round((v.tokens / grandTokens) * 100)
              : Math.round((v.steps / grandSteps) * 100);
          return `${pct}% ${model}`;
        });

      const missNote =
        missCount > 0
          ? `${missCount} switch(es) triggered a prompt cache miss (+${formatShortTokens(missUncachedTokens)} uncached input).`
          : "All switches preserved prompt cache.";

      findings.push({
        id: "model-split-summary",
        severity: missCount > 0 ? "warning" : "info",
        category: "model_split",
        title: `Orchestrator switched models ${switchCount}× across ${modelTotals.size} models`,
        detail: `Model mix${grandTokens > 0 ? "" : " (by steps)"}: ${mixParts.join(", ")} · ${missNote}`,
        stepIndex: firstSwitch.stepIndex,
        turnIndex: firstSwitch.turnIndex,
        impactTokens: missUncachedTokens > 0 ? missUncachedTokens : null,
        impactMs: null,
        citation: `Step ${firstSwitch.stepIndex}`
      });
    }
  }

  return findings;
}

export function aggregateSkillToolMetrics(
  toolCalls: Array<
    ToolCallRecord & { conversationId?: string; conversationTitle?: string }
  >,
  plannerSteps: Array<Pick<PlannerStepRecord, "stepIndex" | "model" | "inputTokens" | "cacheReadTokens" | "outputTokens">>,
  pricingRules: ModelPricingRule[]
): SkillToolMetric[] {
  const stepModelMap = new Map<number, string>();
  for (const ps of plannerSteps) {
    stepModelMap.set(ps.stepIndex, ps.model);
  }

  const map = new Map<
    string,
    SkillToolMetric & {
      costKnown: boolean;
      costAcc: number;
      intervals: Interval[];
      unplacedDurationMs: number;
      errorSamplesMap: Map<string, ToolErrorSample>;
    }
  >();

  for (const tc of toolCalls) {
    let category: SkillToolMetric["category"] = "Tool";
    let name = tc.toolName;
    let pluginOrServer: string | null = null;

    if (tc.category === "skill" && tc.skillName) {
      category = "Skill";
      name = tc.skillName;
      pluginOrServer = tc.skillPlugin;
    } else if (tc.category === "mcp") {
      category = "MCP";
      pluginOrServer = tc.mcpServer;
      name = tc.mcpServer ? `${tc.mcpServer}:${tc.toolName}` : tc.toolName;
    } else if (tc.category === "subagent") {
      category = "Subagent";
      const roleMatch = tc.argsPreview.match(/Role:\s*([^|]+)/i);
      const typeMatch = tc.argsPreview.match(/Type:\s*([^|]+)/i);
      name = roleMatch?.[1]?.trim() || typeMatch?.[1]?.trim() || tc.toolName;
      pluginOrServer = typeMatch?.[1]?.trim() ?? null;
    }

    const key = `${category}:${name}`;
    const entry = map.get(key) ?? {
      key,
      name,
      category,
      pluginOrServer,
      calls: 0,
      errors: 0,
      totalDurationMs: 0,
      resultBytes: 0,
      directTokens: 0,
      compoundedCacheTokens: 0,
      estimatedCostUsd: null,
      costKnown: false,
      costAcc: 0,
      intervals: [],
      unplacedDurationMs: 0,
      errorSamplesMap: new Map<string, ToolErrorSample>()
    };

    entry.calls += 1;
    if (tc.isError) {
      entry.errors += 1;
      addErrorSample(
        entry.errorSamplesMap,
        {
          message: normalizeErrorSampleMessage(tc.errorPreview),
          toolName: tc.toolName,
          target: formatErrorSampleTarget(tc),
          count: 1,
          ...(tc.conversationId ? { conversationId: tc.conversationId } : {}),
          ...(tc.conversationTitle
            ? { conversationTitle: tc.conversationTitle }
            : {}),
          stepIndex: tc.stepIndex
        },
        false
      );
    }
    if (tc.startedAtMs !== null && tc.startedAtMs > 0) {
      entry.intervals.push({
        start: tc.startedAtMs,
        end: Math.max(
          tc.startedAtMs,
          tc.completedAtMs ?? tc.startedAtMs + tc.durationMs
        )
      });
    } else {
      entry.unplacedDurationMs += tc.durationMs;
    }
    entry.resultBytes += tc.resultBytes;
    entry.directTokens += tc.attributedInputTokens;
    entry.compoundedCacheTokens += tc.compoundedCacheTokens;

    const model = stepModelMap.get(tc.plannerStepIndex) ?? "";
    const stepEst = estimateStepCost(
      {
        inputTokens: tc.attributedInputTokens,
        cacheReadTokens: tc.compoundedCacheTokens,
        outputTokens: 0
      },
      model,
      pricingRules
    );
    if (!stepEst.unpriced && stepEst.totalUsd !== null) {
      entry.costKnown = true;
      entry.costAcc += stepEst.totalUsd;
    }

    map.set(key, entry);
  }

  return Array.from(map.values())
    .map(
      ({
        costKnown,
        costAcc,
        intervals,
        unplacedDurationMs,
        errorSamplesMap,
        ...rest
      }) => {
        const samples = finalizeErrorSamples(errorSamplesMap, 3);
        return {
          ...rest,
          ...(samples.length > 0 ? { errorSamples: samples } : {}),
          totalDurationMs: mergeIntervalsWallMs(intervals) + unplacedDurationMs,
          estimatedCostUsd: costKnown ? costAcc : null
        };
      }
    )
    .sort(
      (a, b) =>
        b.compoundedCacheTokens + b.directTokens - (a.compoundedCacheTokens + a.directTokens) ||
        b.totalDurationMs - a.totalDurationMs
    );
}

export function aggregatePluginSkillMetrics(
  toolCalls: Array<ToolCallRecord & { conversationId?: string }>,
  plannerSteps: Array<
    Pick<PlannerStepRecord, "stepIndex" | "model"> &
      Partial<Omit<PlannerStepRecord, "stepIndex" | "model" | "estimatedCostUsd">> & {
        conversationId?: string;
      }
  >,
  pricingRules: ModelPricingRule[],
  registry: InstalledPluginRegistry = discoverInstalledPlugins(),
  fallbackChatCount = 1
): PluginSkillMetric[] {
  const convIds = new Set<string>();
  for (const ps of plannerSteps) {
    convIds.add(ps.conversationId || "__default__");
  }
  for (const tc of toolCalls) {
    convIds.add(tc.conversationId || "__default__");
  }
  if (convIds.size === 0) return [];

  const convInputs: ConversationEfficiencyInput[] = Array.from(convIds).map((cid) => {
    const cSteps = plannerSteps
      .filter((ps) => (ps.conversationId || "__default__") === cid)
      .map((ps) => ({
        stepIndex: ps.stepIndex,
        turnIndex: ps.turnIndex ?? 0,
        model: ps.model,
        createdAtMs: ps.createdAtMs ?? 0,
        completedAtMs: ps.completedAtMs ?? null,
        modelDurationMs: ps.modelDurationMs ?? 0,
        inputTokens: ps.inputTokens ?? 0,
        cacheReadTokens: ps.cacheReadTokens ?? 0,
        outputTokens: ps.outputTokens ?? 0,
        totalContextTokens:
          ps.totalContextTokens ?? (ps.inputTokens ?? 0) + (ps.cacheReadTokens ?? 0),
        cacheHitRatio: ps.cacheHitRatio ?? 0,
        isCacheMiss: ps.isCacheMiss ?? false,
        cacheMissCause: ps.cacheMissCause ?? null,
        thinkingChars: ps.thinkingChars ?? 0,
        contentChars: ps.contentChars ?? 0,
        toolCallCount: ps.toolCallCount ?? 0,
        status: ps.status ?? "DONE",
        attributedSummary: ps.attributedSummary ?? ""
      }));
    const cTools = toolCalls.filter(
      (tc) => (tc.conversationId || "__default__") === cid
    );
    return {
      conversationId: cid === "__default__" ? "" : cid,
      parentConversationId: null,
      activeMs: 0,
      hasTokenTelemetry: true,
      plannerSteps: cSteps,
      toolCalls: cTools,
      filesTouched: []
    };
  });

  return computeScopeSkillEfficiency(convInputs, pricingRules, {
    registry,
    fallbackChatCount
  }).pluginSkillMetrics;
}

const PROJECT_NAME_TTL_MS = 30_000;
const projectNameCache = new Map<string, { name: string; expiresAt: number }>();

export function clearProjectNameCache(): void {
  projectNameCache.clear();
}

function readTextSafe(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    if (!fs.statSync(filePath).isFile()) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function extractTomlSectionName(
  content: string,
  targetSections: string[]
): string | null {
  let currentSection = "";
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const secMatch = line.match(/^\[([^\]]+)\]/);
    if (secMatch) {
      currentSection = secMatch[1].trim();
      continue;
    }
    if (targetSections.includes(currentSection)) {
      const nameMatch = line.match(/^name\s*=\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch[1].trim()) {
        return nameMatch[1].trim();
      }
    }
  }
  return null;
}

function extractOriginRepoNameFromConfig(configText: string): string | null {
  let inOrigin = false;
  for (const rawLine of configText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith(";")) continue;
    if (line.startsWith("[")) {
      inOrigin = /^\[remote\s+"origin"\]$/i.test(line);
      continue;
    }
    if (inOrigin) {
      const urlMatch = line.match(/^url\s*=\s*(.+)$/);
      if (urlMatch) {
        const cleaned = urlMatch[1]
          .trim()
          .replace(/\/+$/, "")
          .replace(/\.git$/i, "");
        const sepIdx = Math.max(
          cleaned.lastIndexOf("/"),
          cleaned.lastIndexOf(":")
        );
        const repo = sepIdx >= 0 ? cleaned.slice(sepIdx + 1).trim() : cleaned;
        if (repo) return repo;
      }
    }
  }
  return null;
}

function resolveGitOriginRepoName(projectPath: string): string | null {
  const dotGit = path.join(projectPath, ".git");
  try {
    if (!fs.existsSync(dotGit)) return null;
    const st = fs.statSync(dotGit);
    const configCandidates: string[] = [];

    if (st.isDirectory()) {
      configCandidates.push(path.join(dotGit, "config"));
    } else if (st.isFile()) {
      const pointer = fs.readFileSync(dotGit, "utf8");
      const gitDirMatch = pointer.match(/^gitdir:\s*(.+)$/im);
      if (gitDirMatch) {
        const resolvedGitDir = path.resolve(projectPath, gitDirMatch[1].trim());
        configCandidates.push(path.join(resolvedGitDir, "config"));
        const commonDirText = readTextSafe(path.join(resolvedGitDir, "commondir"));
        if (commonDirText && commonDirText.trim()) {
          const commonDir = path.resolve(resolvedGitDir, commonDirText.trim());
          configCandidates.push(path.join(commonDir, "config"));
        }
      }
    }

    for (const cfgPath of configCandidates) {
      const cfg = readTextSafe(cfgPath);
      if (!cfg) continue;
      const repo = extractOriginRepoNameFromConfig(cfg);
      if (repo) return repo;
    }
  } catch {
    return null;
  }
  return null;
}

function resolveProjectDisplayName(projectPath: string): string {
  // 1. plugin.json
  const pluginText = readTextSafe(path.join(projectPath, "plugin.json"));
  if (pluginText) {
    try {
      const parsed = JSON.parse(pluginText) as Record<string, unknown>;
      if (typeof parsed.displayName === "string" && parsed.displayName.trim()) {
        return parsed.displayName.trim();
      }
      if (typeof parsed.name === "string" && parsed.name.trim()) {
        return parsed.name.trim();
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  // 2. package.json
  const pkgText = readTextSafe(path.join(projectPath, "package.json"));
  if (pkgText) {
    try {
      const parsed = JSON.parse(pkgText) as Record<string, unknown>;
      if (typeof parsed.displayName === "string" && parsed.displayName.trim()) {
        return parsed.displayName.trim();
      }
      if (typeof parsed.name === "string" && parsed.name.trim()) {
        const rawName = parsed.name.trim();
        const unscoped = rawName.startsWith("@") && rawName.includes("/")
          ? rawName.slice(rawName.indexOf("/") + 1).trim()
          : rawName;
        if (unscoped && !["root", "app"].includes(unscoped.toLowerCase())) {
          return unscoped;
        }
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  // 3. pyproject.toml
  const pyText = readTextSafe(path.join(projectPath, "pyproject.toml"));
  if (pyText) {
    const pyName = extractTomlSectionName(pyText, ["project", "tool.poetry"]);
    if (pyName) return pyName;
  }

  // 4. Cargo.toml
  const cargoText = readTextSafe(path.join(projectPath, "Cargo.toml"));
  if (cargoText) {
    const cargoName = extractTomlSectionName(cargoText, ["package"]);
    if (cargoName) return cargoName;
  }

  // 5. go.mod
  const goModText = readTextSafe(path.join(projectPath, "go.mod"));
  if (goModText) {
    const modMatch = goModText.match(/^\s*module\s+(\S+)/m);
    if (modMatch) {
      const seg = modMatch[1].trim().split("/").pop();
      if (seg) return seg;
    }
  }

  // 6. Git origin remote repository name
  const gitName = resolveGitOriginRepoName(projectPath);
  if (gitName) return gitName;

  // 7. Directory basename fallback
  return pathBaseName(projectPath) || projectPath;
}

export function projectDisplayName(projectPath: string): string {
  if (!projectPath || projectPath === "Unassigned") return "Unassigned";

  const now = Date.now();
  const cached = projectNameCache.get(projectPath);
  if (cached && cached.expiresAt > now) {
    return cached.name;
  }

  const name = resolveProjectDisplayName(projectPath);
  projectNameCache.set(projectPath, {
    name,
    expiresAt: now + PROJECT_NAME_TTL_MS
  });
  return name;
}

function compareModelUsage(a: ModelUsageMetric, b: ModelUsageMetric): number {
  return (
    b.totalTokens - a.totalTokens ||
    b.steps - a.steps ||
    b.modelDurationMs - a.modelDurationMs ||
    a.model.localeCompare(b.model)
  );
}

export function aggregateModelUsage(
  steps: Array<
    Pick<
      PlannerStepRecord,
      "model" | "inputTokens" | "cacheReadTokens" | "outputTokens" | "modelDurationMs"
    > & { conversationId?: string }
  >,
  pricingRules: ModelPricingRule[],
  fallbackChatCount = 1
): ModelUsageMetric[] {
  if (steps.length === 0) return [];

  const buckets = new Map<
    string,
    {
      steps: number;
      inputTokens: number;
      cacheReadTokens: number;
      outputTokens: number;
      totalTokens: number;
      modelDurationMs: number;
      chatIds: Set<string>;
      anyPriced: boolean;
      costSum: number;
    }
  >();

  let grandSteps = 0;
  let grandTokens = 0;
  let grandModelMs = 0;

  for (const step of steps) {
    const model = (step.model || "").trim() || "unknown";
    const bucket = buckets.get(model) ?? {
      steps: 0,
      inputTokens: 0,
      cacheReadTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      modelDurationMs: 0,
      chatIds: new Set<string>(),
      anyPriced: false,
      costSum: 0
    };

    const stepTotal = step.inputTokens + step.cacheReadTokens + step.outputTokens;
    bucket.steps += 1;
    bucket.inputTokens += step.inputTokens;
    bucket.cacheReadTokens += step.cacheReadTokens;
    bucket.outputTokens += step.outputTokens;
    bucket.totalTokens += stepTotal;
    bucket.modelDurationMs += step.modelDurationMs;
    if (step.conversationId) {
      bucket.chatIds.add(step.conversationId);
    }

    const est = estimateStepCost(step, model, pricingRules);
    if (!est.unpriced && est.totalUsd !== null) {
      bucket.anyPriced = true;
      bucket.costSum += est.totalUsd;
    }

    buckets.set(model, bucket);
    grandSteps += 1;
    grandTokens += stepTotal;
    grandModelMs += step.modelDurationMs;
  }

  return Array.from(buckets.entries())
    .map(([model, b]) => {
      const denom = b.inputTokens + b.cacheReadTokens;
      return {
        model,
        steps: b.steps,
        stepShare: grandSteps > 0 ? b.steps / grandSteps : 0,
        inputTokens: b.inputTokens,
        cacheReadTokens: b.cacheReadTokens,
        outputTokens: b.outputTokens,
        totalTokens: b.totalTokens,
        tokenShare: grandTokens > 0 ? b.totalTokens / grandTokens : 0,
        cacheHitRatio: denom > 0 ? b.cacheReadTokens / denom : 0,
        modelDurationMs: b.modelDurationMs,
        timeShare: grandModelMs > 0 ? b.modelDurationMs / grandModelMs : 0,
        estimatedCostUsd: b.anyPriced ? b.costSum : null,
        chatCount: b.chatIds.size > 0 ? b.chatIds.size : fallbackChatCount
      };
    })
    .sort(compareModelUsage);
}

export function mergeModelBreakdowns(
  lists: ModelUsageMetric[][]
): ModelUsageMetric[] {
  const buckets = new Map<
    string,
    {
      steps: number;
      inputTokens: number;
      cacheReadTokens: number;
      outputTokens: number;
      totalTokens: number;
      modelDurationMs: number;
      chatCount: number;
      anyPriced: boolean;
      costSum: number;
    }
  >();

  let grandSteps = 0;
  let grandTokens = 0;
  let grandModelMs = 0;

  for (const list of lists) {
    for (const item of list) {
      const model = (item.model || "").trim() || "unknown";
      const cur = buckets.get(model) ?? {
        steps: 0,
        inputTokens: 0,
        cacheReadTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        modelDurationMs: 0,
        chatCount: 0,
        anyPriced: false,
        costSum: 0
      };

      cur.steps += item.steps;
      cur.inputTokens += item.inputTokens;
      cur.cacheReadTokens += item.cacheReadTokens;
      cur.outputTokens += item.outputTokens;
      cur.totalTokens += item.totalTokens;
      cur.modelDurationMs += item.modelDurationMs;
      cur.chatCount += item.chatCount;
      if (item.estimatedCostUsd !== null) {
        cur.anyPriced = true;
        cur.costSum += item.estimatedCostUsd;
      }

      buckets.set(model, cur);
      grandSteps += item.steps;
      grandTokens += item.totalTokens;
      grandModelMs += item.modelDurationMs;
    }
  }

  return Array.from(buckets.entries())
    .map(([model, b]) => {
      const denom = b.inputTokens + b.cacheReadTokens;
      return {
        model,
        steps: b.steps,
        stepShare: grandSteps > 0 ? b.steps / grandSteps : 0,
        inputTokens: b.inputTokens,
        cacheReadTokens: b.cacheReadTokens,
        outputTokens: b.outputTokens,
        totalTokens: b.totalTokens,
        tokenShare: grandTokens > 0 ? b.totalTokens / grandTokens : 0,
        cacheHitRatio: denom > 0 ? b.cacheReadTokens / denom : 0,
        modelDurationMs: b.modelDurationMs,
        timeShare: grandModelMs > 0 ? b.modelDurationMs / grandModelMs : 0,
        estimatedCostUsd: b.anyPriced ? b.costSum : null,
        chatCount: b.chatCount
      };
    })
    .sort(compareModelUsage);
}

export function extractModelSwitches(
  plannerSteps: Array<
    Pick<
      PlannerStepRecord,
      "stepIndex" | "turnIndex" | "model" | "createdAtMs" | "isCacheMiss" | "inputTokens"
    >
  >,
  turns: Array<Pick<TurnRecord, "turnIndex" | "promptPreview">>,
  toolCalls: Array<Pick<ToolCallRecord, "plannerStepIndex" | "toolName">>
): ModelSwitchEvent[] {
  if (plannerSteps.length < 2) return [];

  const turnMap = new Map<number, string>();
  for (const t of turns) {
    turnMap.set(t.turnIndex, t.promptPreview);
  }

  const toolsByPlannerStep = new Map<number, string[]>();
  for (const tc of toolCalls) {
    const arr = toolsByPlannerStep.get(tc.plannerStepIndex) ?? [];
    arr.push(tc.toolName);
    toolsByPlannerStep.set(tc.plannerStepIndex, arr);
  }

  const switches: ModelSwitchEvent[] = [];
  for (let i = 1; i < plannerSteps.length; i++) {
    const prev = plannerSteps[i - 1];
    const curr = plannerSteps[i];
    const fromModel = (prev.model || "").trim() || "unknown";
    const toModel = (curr.model || "").trim() || "unknown";
    if (fromModel === toModel) continue;

    const prevTools = toolsByPlannerStep.get(prev.stepIndex) ?? [];
    let trigger = "Mid-turn model switch";
    if (prevTools.includes("exit_plan_mode")) {
      trigger = "Plan → Execute handoff (exit_plan_mode)";
    } else if (prevTools.includes("enter_plan_mode")) {
      trigger = "Entered Plan Mode (enter_plan_mode)";
    } else if (
      prevTools.includes("invoke_subagent") ||
      prevTools.includes("swarm")
    ) {
      trigger = "Orchestrator delegation step";
    } else if (curr.turnIndex > prev.turnIndex) {
      const prompt = turnMap.get(curr.turnIndex);
      trigger = prompt
        ? `New turn: "${prompt.slice(0, 60)}"`
        : `New turn ${curr.turnIndex + 1}`;
    }

    switches.push({
      stepIndex: curr.stepIndex,
      turnIndex: curr.turnIndex,
      fromModel,
      toModel,
      createdAtMs: curr.createdAtMs,
      isCacheMiss: curr.isCacheMiss,
      inputTokensAfter: curr.inputTokens,
      trigger
    });
  }

  return switches;
}

export function buildConversationSummary(
  row: StoredConversationRow,
  plannerSteps: Array<Omit<PlannerStepRecord, "estimatedCostUsd">>,
  toolCalls: ToolCallRecord[],
  turnCount: number,
  pricingRules: ModelPricingRule[],
  subagents: StoredConversationRow[] = []
): ConversationSummary {
  const cost = aggregateCosts(plannerSteps, pricingRules);
  const modelBreakdown = aggregateModelUsage(plannerSteps, pricingRules, 1);
  const denom = row.inputTokens + row.cacheReadTokens;
  const subagentMs = subagents.reduce((sum, s) => sum + s.activeMs, 0);
  const registry = discoverInstalledPlugins();
  const resolvedParents = new Set<string>();
  for (const tc of toolCalls) {
    const hit = resolveToolPluginOrSkill(tc, registry);
    if (hit) resolvedParents.add(hit.name);
  }

  return {
    conversationId: row.conversationId,
    title: row.title,
    surface: row.surface,
    projectPath: row.projectPath,
    projectName: projectDisplayName(row.projectPath),
    projectSource: row.projectSource,
    parentConversationId: row.parentConversationId,
    subagentRole: row.subagentRole,
    subagentType: row.subagentType,
    startedAtMs: row.startedAtMs,
    endedAtMs: row.endedAtMs,
    terminationReason: row.terminationReason,
    models: modelBreakdown.length > 0 ? modelBreakdown.map((m) => m.model) : row.models,
    modelBreakdown,
    slashCommands: row.slashCommands,
    turnCount,
    stepCount: plannerSteps.length,
    toolCallCount: toolCalls.length,
    errorCount: row.errorCount,
    skillsUsed: row.skillsUsed,
    topPluginsSkills: Array.from(resolvedParents).slice(0, 6),
    tokens: {
      inputTokens: row.inputTokens,
      cacheReadTokens: row.cacheReadTokens,
      outputTokens: row.outputTokens,
      peakContextTokens: row.peakContextTokens,
      cacheHitRatio: denom > 0 ? row.cacheReadTokens / denom : 0,
      hasTokenTelemetry: row.hasTokenTelemetry,
      estimatedCostUsd: cost.estimatedCostUsd,
      cacheSavingsUsd: cost.cacheSavingsUsd,
      unpricedModels: cost.unpricedModels
    },
    time: {
      activeMs: row.activeMs,
      modelMs: row.modelMs,
      toolWallMs: row.toolWallMs,
      toolSumMs: row.toolSumMs,
      parallelismFactor:
        row.toolWallMs > 0 ? Number((row.toolSumMs / row.toolWallMs).toFixed(2)) : 1,
      subagentMs,
      userIdleMs: row.userIdleMs,
      wallClockMs: row.wallClockMs
    },
    hasLiveHooks: row.hasLiveHooks
  };
}

export function buildConversationDetail(
  db: TrackerDatabase,
  conversationId: string
): ConversationDetail | null {
  const row = db.getConversationRecord(conversationId);
  if (!row) return null;

  const pricingRules = db.getPricingRules();
  const turns = db.getTurnsForConversation(conversationId);
  const rawSteps = db.getPlannerStepsForConversation(conversationId);
  const toolCalls = db.getToolCallsForConversation(conversationId);
  const allConvs = db.getAllConversationRecords();
  const childrenByParent = new Map<string, StoredConversationRow[]>();
  for (const c of allConvs) {
    if (c.parentConversationId) {
      const list = childrenByParent.get(c.parentConversationId) ?? [];
      list.push(c);
      childrenByParent.set(c.parentConversationId, list);
    }
  }
  const subagentRows: StoredConversationRow[] = [];
  const visitedDesc = new Set<string>([conversationId]);
  const descQueue = [conversationId];
  while (descQueue.length > 0 && visitedDesc.size < 256) {
    const curId = descQueue.shift()!;
    for (const childRow of childrenByParent.get(curId) ?? []) {
      if (!visitedDesc.has(childRow.conversationId)) {
        visitedDesc.add(childRow.conversationId);
        subagentRows.push(childRow);
        descQueue.push(childRow.conversationId);
      }
    }
  }

  const plannerSteps: PlannerStepRecord[] = rawSteps.map((ps) => {
    const est = estimateStepCost(ps, ps.model, pricingRules);
    return {
      ...ps,
      estimatedCostUsd: est.totalUsd
    };
  });

  const subagentEffInputs: ConversationEfficiencyInput[] = [];
  const subagents = subagentRows.map((child) => {
    const cSteps = db.getPlannerStepsForConversation(child.conversationId);
    const cTools = db.getToolCallsForConversation(child.conversationId);
    const cTurns = db.getTurnsForConversation(child.conversationId);
    subagentEffInputs.push({
      conversationId: child.conversationId,
      title: child.title,
      parentConversationId: child.parentConversationId,
      activeMs: child.activeMs,
      hasTokenTelemetry: child.hasTokenTelemetry,
      plannerSteps: cSteps,
      toolCalls: cTools,
      filesTouched: child.filesTouched
    });
    return buildConversationSummary(
      child,
      cSteps,
      cTools,
      cTurns.length,
      pricingRules
    );
  });

  const summary = buildConversationSummary(
    row,
    rawSteps,
    toolCalls,
    turns.length,
    pricingRules,
    subagentRows
  );

  const skillToolMetrics = aggregateSkillToolMetrics(
    toolCalls.map((tc) => ({
      ...tc,
      conversationId: row.conversationId,
      conversationTitle: row.title
    })),
    rawSteps,
    pricingRules
  );

  const chatEff = computeScopeSkillEfficiency(
    [
      {
        conversationId: row.conversationId,
        title: row.title,
        parentConversationId: row.parentConversationId,
        activeMs: row.activeMs,
        hasTokenTelemetry: row.hasTokenTelemetry,
        plannerSteps: rawSteps,
        toolCalls,
        filesTouched: row.filesTouched
      },
      ...subagentEffInputs
    ],
    pricingRules
  );

  const topForRoot = chatEff.topPluginsByConv.get(row.conversationId);
  if (topForRoot && topForRoot.length > 0) {
    summary.topPluginsSkills = topForRoot;
  }
  for (const sub of subagents) {
    const subTop = chatEff.topPluginsByConv.get(sub.conversationId);
    if (subTop && subTop.length > 0) {
      sub.topPluginsSkills = subTop;
    }
  }

  const liveDiagnostics =
    chatEff.diagnosticsByConv.get(row.conversationId) ?? row.diagnostics;

  const modelSwitches = extractModelSwitches(plannerSteps, turns, toolCalls);

  return {
    summary,
    turns,
    plannerSteps,
    modelSwitches,
    toolCalls,
    skillToolMetrics,
    pluginSkillMetrics: chatEff.pluginSkillMetrics,
    filesTouched: row.filesTouched,
    diagnostics: liveDiagnostics,
    subagents,
    scopeActiveMs: chatEff.scopeActiveMs
  };
}

function mergeTokenSummaries(items: TokenSummary[]): TokenSummary {
  let inputTokens = 0;
  let cacheReadTokens = 0;
  let outputTokens = 0;
  let peakContextTokens = 0;
  let costSum = 0;
  let savingsSum = 0;
  let anyPriced = false;
  const unpriced = new Set<string>();

  for (const item of items) {
    inputTokens += item.inputTokens;
    cacheReadTokens += item.cacheReadTokens;
    outputTokens += item.outputTokens;
    if (item.peakContextTokens > peakContextTokens) {
      peakContextTokens = item.peakContextTokens;
    }
    if (item.estimatedCostUsd !== null) {
      anyPriced = true;
      costSum += item.estimatedCostUsd;
    }
    if (item.cacheSavingsUsd !== null) {
      savingsSum += item.cacheSavingsUsd;
    }
    for (const m of item.unpricedModels) {
      unpriced.add(m);
    }
  }

  const denom = inputTokens + cacheReadTokens;
  const hasTokenTelemetry = items.some((i) => i.hasTokenTelemetry);
  return {
    inputTokens,
    cacheReadTokens,
    outputTokens,
    peakContextTokens,
    cacheHitRatio: denom > 0 ? cacheReadTokens / denom : 0,
    hasTokenTelemetry,
    estimatedCostUsd: anyPriced ? costSum : null,
    cacheSavingsUsd: anyPriced ? savingsSum : null,
    unpricedModels: Array.from(unpriced).sort()
  };
}

function mergeFileTouches(lists: FileTouchRecord[][]): FileTouchRecord[] {
  const map = new Map<string, FileTouchRecord>();
  for (const list of lists) {
    for (const f of list) {
      const cur = map.get(f.path) ?? {
        path: f.path,
        reads: 0,
        edits: 0,
        creates: 0,
        totalBytesRead: 0,
        directTokens: 0,
        compoundedCacheTokens: 0,
        lastTouchedAtMs: 0
      };
      cur.reads += f.reads;
      cur.edits += f.edits;
      cur.creates += f.creates;
      cur.totalBytesRead += f.totalBytesRead;
      cur.directTokens += f.directTokens;
      cur.compoundedCacheTokens += f.compoundedCacheTokens;
      if (f.lastTouchedAtMs > cur.lastTouchedAtMs) {
        cur.lastTouchedAtMs = f.lastTouchedAtMs;
      }
      map.set(f.path, cur);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) =>
      b.compoundedCacheTokens + b.directTokens - (a.compoundedCacheTokens + a.directTokens)
  );
}

function rowActivityMs(row: StoredConversationRow): number {
  return row.endedAtMs > 0 ? row.endedAtMs : row.startedAtMs;
}

function matchesTimeRange(
  row: StoredConversationRow,
  sinceMs: number | null
): boolean {
  return sinceMs === null ? true : rowActivityMs(row) >= sinceMs;
}

function emptyTokenSummary(): TokenSummary {
  return {
    inputTokens: 0,
    cacheReadTokens: 0,
    outputTokens: 0,
    peakContextTokens: 0,
    cacheHitRatio: 0,
    hasTokenTelemetry: false,
    estimatedCostUsd: 0,
    cacheSavingsUsd: 0,
    unpricedModels: []
  };
}

function emptyTimeSummary(): TimeSummary {
  return {
    activeMs: 0,
    modelMs: 0,
    toolWallMs: 0,
    toolSumMs: 0,
    parallelismFactor: 1,
    subagentMs: 0,
    userIdleMs: 0,
    wallClockMs: 0
  };
}

export function buildProjectDetail(
  db: TrackerDatabase,
  projectPath: string,
  options?: TimeRangeQuery
): ProjectDetail | null {
  const bounds = resolveTimeRangeBounds(options);
  const allRows = db.getAllConversationRecords();
  const allProjectRows = allRows.filter((r) => r.projectPath === projectPath);
  if (allProjectRows.length === 0) return null;

  const projectRows = allProjectRows.filter((r) =>
    matchesTimeRange(r, bounds.sinceMs)
  );

  if (projectRows.length === 0) {
    return {
      summary: {
        projectPath,
        projectName: projectDisplayName(projectPath),
        chatCount: 0,
        subagentCount: 0,
        firstActivityMs: 0,
        lastActivityMs: 0,
        models: [],
        modelBreakdown: [],
        topSkills: [],
        topPluginsSkills: [],
        topTools: [],
        mcpServers: [],
        slashCommands: [],
        tokens: emptyTokenSummary(),
        time: emptyTimeSummary(),
        errorCount: 0
      },
      chats: [],
      skillToolMetrics: [],
      pluginSkillMetrics: [],
      filesTouched: [],
      diagnostics: [],
      timeRange: {
        preset: bounds.preset,
        sinceMs: bounds.sinceMs,
        untilMs: bounds.untilMs,
        firstActivityMs: 0,
        lastActivityMs: 0
      }
    };
  }

  const pricingRules = db.getPricingRules();
  const rowIds = new Set(projectRows.map((r) => r.conversationId));

  const summaries: ConversationSummary[] = [];
  const effInputs: ConversationEfficiencyInput[] = [];
  const allSteps: Array<
    Omit<PlannerStepRecord, "estimatedCostUsd"> & { conversationId?: string }
  > = [];
  const allTools: Array<
    ToolCallRecord & { conversationId?: string; conversationTitle?: string }
  > = [];

  for (const r of projectRows) {
    const steps = db.getPlannerStepsForConversation(r.conversationId);
    const tools = db.getToolCallsForConversation(r.conversationId);
    const turns = db.getTurnsForConversation(r.conversationId);
    const children = projectRows.filter(
      (c) => c.parentConversationId === r.conversationId
    );
    summaries.push(
      buildConversationSummary(r, steps, tools, turns.length, pricingRules, children)
    );
    effInputs.push({
      conversationId: r.conversationId,
      title: r.title,
      parentConversationId: r.parentConversationId,
      activeMs: r.activeMs,
      hasTokenTelemetry: r.hasTokenTelemetry,
      plannerSteps: steps,
      toolCalls: tools,
      filesTouched: r.filesTouched
    });
    for (const st of steps) {
      allSteps.push({ ...st, conversationId: r.conversationId });
    }
    for (const tc of tools) {
      allTools.push({
        ...tc,
        conversationId: r.conversationId,
        conversationTitle: r.title
      });
    }
  }

  const topLevel = summaries.filter(
    (s) => !s.parentConversationId || !rowIds.has(s.parentConversationId)
  );
  const subagents = summaries.filter(
    (s) => s.parentConversationId && rowIds.has(s.parentConversationId)
  );

  const topTimeSource = topLevel.length > 0 ? topLevel : summaries;
  const activeIntervals: Interval[] = [];
  for (const ps of allSteps) {
    if (ps.createdAtMs > 0 && ps.modelDurationMs > 0) {
      const end =
        ps.completedAtMs && ps.completedAtMs >= ps.createdAtMs
          ? ps.completedAtMs
          : ps.createdAtMs + ps.modelDurationMs;
      activeIntervals.push({ start: ps.createdAtMs, end });
    }
  }
  for (const tc of allTools) {
    if (tc.startedAtMs !== null && tc.startedAtMs > 0) {
      const end = Math.max(
        tc.startedAtMs,
        tc.completedAtMs ?? tc.startedAtMs + tc.durationMs
      );
      activeIntervals.push({ start: tc.startedAtMs, end });
    }
  }
  const mergedProjectWallMs = mergeIntervalsWallMs(activeIntervals);
  const fallbackTopActiveMs = topTimeSource.reduce((s, c) => s + c.time.activeMs, 0);
  const activeMs = mergedProjectWallMs > 0 ? mergedProjectWallMs : fallbackTopActiveMs;

  const skillToolMetrics = aggregateSkillToolMetrics(
    allTools,
    allSteps,
    pricingRules
  );

  const projEff = computeScopeSkillEfficiency(effInputs, pricingRules, {
    scopeActiveMsOverride: activeMs
  });
  const pluginSkillMetrics = projEff.pluginSkillMetrics;

  for (const s of summaries) {
    const convParents = projEff.topPluginsByConv.get(s.conversationId);
    if (convParents) {
      s.topPluginsSkills = convParents;
    }
  }

  const topSkills = skillToolMetrics
    .filter((m) => m.category === "Skill")
    .map((m) => m.name)
    .slice(0, 6);
  const topPluginsSkills = pluginSkillMetrics.slice(0, 6).map((m) => m.name);
  const topTools = skillToolMetrics
    .filter((m) => m.category === "Tool")
    .map((m) => m.name)
    .slice(0, 6);
  const mcpServers = Array.from(
    new Set(
      skillToolMetrics
        .filter((m) => m.category === "MCP" && m.pluginOrServer)
        .map((m) => m.pluginOrServer!)
    )
  ).sort();

  const modelBreakdown = aggregateModelUsage(allSteps, pricingRules, projectRows.length);
  const fallbackSortedModels = Array.from(
    new Set(projectRows.flatMap((r) => r.models))
  ).sort();
  const models =
    modelBreakdown.length > 0
      ? modelBreakdown.map((m) => m.model)
      : fallbackSortedModels;
  const slashCommands = Array.from(
    new Set(projectRows.flatMap((r) => r.slashCommands))
  ).sort();

  const positiveStarts = projectRows
    .map((r) => (r.startedAtMs > 0 ? r.startedAtMs : r.endedAtMs))
    .filter((x) => x > 0);
  const firstActivityMs =
    positiveStarts.length > 0 ? Math.min(...positiveStarts) : 0;
  const lastActivityMs = Math.max(
    ...projectRows.map((r) => rowActivityMs(r)),
    0
  );

  const modelMs = summaries.reduce((s, c) => s + c.time.modelMs, 0);
  const toolWallMs = summaries.reduce((s, c) => s + c.time.toolWallMs, 0);
  const toolSumMs = summaries.reduce((s, c) => s + c.time.toolSumMs, 0);
  const subagentMs = subagents.reduce((s, c) => s + c.time.activeMs, 0);
  const userIdleMs = topTimeSource.reduce((s, c) => s + c.time.userIdleMs, 0);
  const wallClockMs =
    lastActivityMs > firstActivityMs ? lastActivityMs - firstActivityMs : activeMs;

  const time: TimeSummary = {
    activeMs,
    modelMs,
    toolWallMs,
    toolSumMs,
    parallelismFactor:
      toolWallMs > 0 ? Number((toolSumMs / toolWallMs).toFixed(2)) : 1,
    subagentMs,
    userIdleMs,
    wallClockMs
  };

  const tokens = mergeTokenSummaries(summaries.map((s) => s.tokens));
  const errorCount = summaries.reduce((s, c) => s + c.errorCount, 0);

  const diagnostics = projectRows
    .flatMap((r) => {
      const live = projEff.diagnosticsByConv.get(r.conversationId) ?? r.diagnostics;
      return live.map((d) => ({
        ...d,
        citation: `${r.title.slice(0, 32)} · ${d.citation}`
      }));
    })
    .sort((a, b) => (b.impactTokens ?? 0) - (a.impactTokens ?? 0))
    .slice(0, 12);

  const summary: ProjectSummary = {
    projectPath,
    projectName: projectDisplayName(projectPath),
    chatCount: topLevel.length,
    subagentCount: subagents.length,
    firstActivityMs,
    lastActivityMs,
    models,
    modelBreakdown,
    topSkills,
    topPluginsSkills,
    topTools,
    mcpServers,
    slashCommands,
    tokens,
    time,
    errorCount
  };

  return {
    summary,
    chats: summaries.sort((a, b) => b.endedAtMs - a.endedAtMs),
    skillToolMetrics,
    pluginSkillMetrics,
    filesTouched: mergeFileTouches(projectRows.map((r) => r.filesTouched)),
    diagnostics,
    timeRange: {
      preset: bounds.preset,
      sinceMs: bounds.sinceMs,
      untilMs: bounds.untilMs,
      firstActivityMs,
      lastActivityMs
    }
  };
}

export function buildDashboardData(
  db: TrackerDatabase,
  options?: TimeRangeQuery
): DashboardData {
  const bounds = resolveTimeRangeBounds(options);
  const allRows = db
    .getAllConversationRecords()
    .filter((r) => matchesTimeRange(r, bounds.sinceMs));
  const pricingRules = db.getPricingRules();

  const byProject = new Map<string, StoredConversationRow[]>();
  for (const r of allRows) {
    const arr = byProject.get(r.projectPath) ?? [];
    arr.push(r);
    byProject.set(r.projectPath, arr);
  }

  const projectDetails: ProjectDetail[] = [];
  for (const projectPath of byProject.keys()) {
    const detail = buildProjectDetail(db, projectPath, bounds);
    if (detail && detail.chats.length > 0) projectDetails.push(detail);
  }
  const projects = projectDetails
    .map((d) => d.summary)
    .sort((a, b) => b.lastActivityMs - a.lastActivityMs);

  const positiveFirsts = projects
    .map((p) => p.firstActivityMs)
    .filter((x) => x > 0);
  const firstActivityMs =
    positiveFirsts.length > 0 ? Math.min(...positiveFirsts) : 0;
  const lastActivityMs = projects.reduce(
    (max, p) => (p.lastActivityMs > max ? p.lastActivityMs : max),
    0
  );

  const totalsTokens =
    projects.length > 0
      ? mergeTokenSummaries(projects.map((p) => p.tokens))
      : emptyTokenSummary();
  const totalsModelBreakdown = mergeModelBreakdowns(
    projects.map((p) => p.modelBreakdown)
  );
  const totalActiveMs = projects.reduce((s, p) => s + p.time.activeMs, 0);

  const pluginSkillMetrics = mergePluginSkillMetrics(
    projectDetails.map((d) => ({
      projectPath: d.summary.projectPath,
      metrics: d.pluginSkillMetrics
    })),
    {
      activeMs: totalActiveMs,
      estimatedCostUsd: totalsTokens.estimatedCostUsd,
      contextTokens: totalsTokens.inputTokens + totalsTokens.cacheReadTokens
    }
  );

  const recentChats: ConversationSummary[] = allRows.slice(0, 25).map((r) => {
    const steps = db.getPlannerStepsForConversation(r.conversationId);
    const tools = db.getToolCallsForConversation(r.conversationId);
    const turns = db.getTurnsForConversation(r.conversationId);
    const children = allRows.filter(
      (c) => c.parentConversationId === r.conversationId
    );
    return buildConversationSummary(
      r,
      steps,
      tools,
      turns.length,
      pricingRules,
      children
    );
  });

  const totalToolWall = projects.reduce((s, p) => s + p.time.toolWallMs, 0);
  const totalToolSum = projects.reduce((s, p) => s + p.time.toolSumMs, 0);

  return {
    generatedAtMs: Date.now(),
    timeRange: {
      preset: bounds.preset,
      sinceMs: bounds.sinceMs,
      untilMs: bounds.untilMs,
      firstActivityMs,
      lastActivityMs
    },
    totals: {
      projectCount: projects.length,
      chatCount: projects.reduce((s, p) => s + p.chatCount, 0),
      subagentCount: projects.reduce((s, p) => s + p.subagentCount, 0),
      tokens: totalsTokens,
      time: {
        activeMs: projects.reduce((s, p) => s + p.time.activeMs, 0),
        modelMs: projects.reduce((s, p) => s + p.time.modelMs, 0),
        toolWallMs: totalToolWall,
        toolSumMs: totalToolSum,
        parallelismFactor:
          totalToolWall > 0
            ? Number((totalToolSum / totalToolWall).toFixed(2))
            : 1,
        subagentMs: projects.reduce((s, p) => s + p.time.subagentMs, 0),
        userIdleMs: projects.reduce((s, p) => s + p.time.userIdleMs, 0),
        wallClockMs: projects.reduce((s, p) => s + p.time.wallClockMs, 0)
      },
      errorCount: projects.reduce((s, p) => s + p.errorCount, 0),
      modelBreakdown: totalsModelBreakdown
    },
    projects,
    pluginSkillMetrics,
    recentChats,
    pricingRules,
    unpricedModels: totalsTokens.unpricedModels
  };
}
