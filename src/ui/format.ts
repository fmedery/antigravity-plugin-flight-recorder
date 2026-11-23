export function fmtK(n: number): string {
  if (!Number.isFinite(n)) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

export function fmtBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${Math.round(bytes)} B`;
}

export function fmtDuration(ms: number): string {
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

export function fmtPct(ratio: number): string {
  if (!Number.isFinite(ratio)) return "0%";
  return `${Math.round(ratio * 100)}%`;
}

export function fmtUsd(usd: number | null): string {
  if (usd === null || !Number.isFinite(usd)) return "Unpriced";
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)} est.`;
  return `$${usd.toFixed(2)} est.`;
}

export function fmtDateShort(ms: number): string {
  if (!ms || ms <= 0) return "—";
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "—";
  }
}

import type {
  ConversationSummary,
  DiagnosticFinding,
  PluginSkillChildKind,
  PluginSkillMetric,
  ToolErrorSample
} from "../shared/types.js";

export type KpiHelpKey =
  | "projects"
  | "chatsSubagents"
  | "totalTokens"
  | "cacheHitRatio"
  | "tokensAndCache"
  | "activeAgentTime"
  | "userWaitIdle"
  | "estCost";

export interface KpiHelpEntry {
  title: string;
  meaning: string;
  impact: string;
}

export const KPI_HELP_COPY: Record<KpiHelpKey, KpiHelpEntry> = {
  projects: {
    title: "Tracked Projects & Sessions",
    meaning:
      "Distinct workspaces inferred from Antigravity Hub, IDE, and CLI transcripts, broken down into root chats you started and child subagents they spawned.",
    impact:
      "Offloading heavy codebase searches or browser checks to subagents isolates their tokens in separate context windows, keeping your main chat smaller, faster, and less likely to hit context compaction."
  },
  chatsSubagents: {
    title: "Chats & Spawned Subagents",
    meaning:
      "Top-level conversations you started in this project alongside background research, browser, or coding subagents they launched.",
    impact:
      "Subagents run in isolated context windows so heavy searches do not bloat your main chat's prompt cache or push it toward context compaction."
  },
  totalTokens: {
    title: "Total Tokens Processed",
    meaning:
      "Sum of three separate, non-overlapping buckets across every model step: cached reads + uncached new input + generated output. Neither new input nor output tokens are inside the cache count (generated outputs only become cacheable as input history on later steps).",
    impact:
      "Large files, SKILL.md docs, or verbose tool outputs added early get re-read on every following step, multiplying total volume. Keep chats focused and peak context below ~200k to avoid slowdowns, recall loss, and compaction resets."
  },
  cacheHitRatio: {
    title: "Prompt Cache Hit Ratio",
    meaning:
      "Share of total input context served from the prompt cache: cached reads ÷ (cached reads + new input). Output tokens are excluded because generated tokens are never cached on the step they are produced—only prior input context is.",
    impact:
      "Cached reads typically cost 75–90% less than fresh input and prefill faster (Saved ~$ shows the estimated discount vs. paying full input rates). Idle pauses over ~4–5 min (TTL expiry), model switches, or context compaction break the cache and trigger full-rate re-reads."
  },
  tokensAndCache: {
    title: "Tokens, Peak Context & Cache",
    meaning:
      "Total tokens processed in this chat (cached reads + uncached new input + generated output), the share of input served from cache (output excluded), and peak single-step context size. Neither new input nor output is counted inside cached reads.",
    impact:
      "High cache hits cut input cost 75–90% and speed up responses, while crossing ~200k–256k peak context degrades recall and triggers prefix compaction—forcing files and skills to be re-read at full uncached cost."
  },
  activeAgentTime: {
    title: "Active Agent Time",
    meaning:
      "Wall-clock time the agent spent thinking and running tools, excluding your idle and approval pauses. Overlapping parallel tools and concurrent subagents are merged into real wall time, so model + tools can sum higher than the merged total.",
    impact:
      "Shows whether slowness comes from model reasoning or tool/command execution—helping you spot sequential tool bottlenecks, slow scripts or MCP servers, or heavier-than-needed models."
  },
  userWaitIdle: {
    title: "User Wait & Idle Time",
    meaning:
      "Elapsed time between turns or during permission/review pauses when no model step or tool was actively running.",
    impact:
      "Kept separate from Active Agent Time so your pauses never skew agent speed metrics, though idle gaps longer than ~4–5 minutes can expire the prompt cache and cause a cache miss on your next message."
  },
  estCost: {
    title: "Estimated API Equivalent Cost",
    meaning:
      "Estimated USD across priced models, billed separately for uncached new input (full rate), cached reads (discounted rate), and output tokens (highest rate). Models without a rule in Pricing are excluded from the total and flagged as unpriced.",
    impact:
      "Shows which projects, models, plugins, and skills drive budget or subscription rate-limit usage. Open Pricing (or click the unpriced badge) to add custom per-1M rates so totals cover every model."
  }
};

export function buildSkillOptimizationPrompt(
  metric: PluginSkillMetric,
  scopeLabel: string
): string {
  const spendPart =
    metric.drivenCostUsd !== null
      ? `${metric.costShare !== null ? `${fmtPct(metric.costShare)} of total spend (` : ""}${fmtUsd(metric.drivenCostUsd)}${metric.costShare !== null ? ")" : ""}`
      : `${fmtPct(metric.timeShare)} of active time (models unpriced)`;
  const instrPct =
    metric.totalTokens > 0
      ? Math.round((metric.instructionTokens / metric.totalTokens) * 100)
      : 0;
  const execPct = metric.totalTokens > 0 ? 100 - instrPct : 0;

  const childSummary = metric.children
    .slice(0, 8)
    .map((ch) => {
      const flags = [
        ch.isUnusedLoad ? "unused load" : "",
        ch.duplicateReads > 0 ? `${ch.duplicateReads}x duplicate read` : "",
        ch.errors > 0 ? `${ch.errors} errors` : ""
      ]
        .filter(Boolean)
        .join(", ");
      const costStr = ch.drivenCostUsd !== null ? `, ${fmtUsd(ch.drivenCostUsd)}` : "";
      return `- [${ch.kind}] ${ch.name}: ${fmtDuration(ch.drivenActiveMs)}${costStr}, +${fmtK(ch.instructionTokens)} instr / +${fmtK(ch.executionTokens)} exec, ${ch.calls} call(s)${flags ? ` (${flags})` : ""}`;
    })
    .join("\n");

  const pathsLine =
    metric.targetPaths.length > 0
      ? `\nRelevant files: ${metric.targetPaths.slice(0, 5).join(", ")}`
      : "";
  const rxLine = metric.prescription
    ? `\nDetected issue: ${metric.prescription}`
    : "";
  const errLines =
    metric.errors > 0 && metric.errorSamples && metric.errorSamples.length > 0
      ? [
          `Recorded errors (${metric.errors}):`,
          ...metric.errorSamples.slice(0, 3).map(
            (s) =>
              `- [${s.toolName}]${s.target ? ` (${s.target})` : ""}${s.count > 1 ? ` (${s.count}x)` : ""}: ${s.message}`
          )
        ]
      : [];

  return [
    `In ${scopeLabel}, help me optimize how we use ${metric.kind.toLowerCase()} "${metric.name}".`,
    `Impact: ${spendPart}, ${fmtPct(metric.timeShare)} of active time (${fmtDuration(metric.drivenActiveMs)}), +${fmtK(metric.totalTokens)} context footprint (${instrPct}% instruction markdown / ${execPct}% tool execution).${pathsLine}${rxLine}`,
    ...(childSummary ? ["Breakdown:", childSummary] : []),
    ...errLines,
    "Please inspect the relevant SKILL.md / rules / tool usage and propose concrete ways to reduce wasted tokens, cache carry, and active time while preserving quality."
  ].join("\n");
}

export interface GroupedProjectChat {
  root: ConversationSummary;
  subagents: ConversationSummary[];
  lastActivityMs: number;
}

export function groupProjectChats(
  chats: ConversationSummary[]
): GroupedProjectChat[] {
  if (chats.length === 0) return [];
  const byId = new Map<string, ConversationSummary>(
    chats.map((c) => [c.conversationId, c])
  );

  const resolveRootId = (chat: ConversationSummary): string => {
    const visited = new Set<string>([chat.conversationId]);
    let cur = chat;
    while (cur.parentConversationId && byId.has(cur.parentConversationId)) {
      if (visited.has(cur.parentConversationId)) {
        return chat.conversationId;
      }
      visited.add(cur.parentConversationId);
      cur = byId.get(cur.parentConversationId)!;
    }
    return cur.conversationId;
  };

  const roots: ConversationSummary[] = [];
  const subagentsByRoot = new Map<string, ConversationSummary[]>();

  for (const chat of chats) {
    const rootId = resolveRootId(chat);
    if (rootId === chat.conversationId) {
      roots.push(chat);
    } else {
      const list = subagentsByRoot.get(rootId) ?? [];
      list.push(chat);
      subagentsByRoot.set(rootId, list);
    }
  }

  return roots
    .map((root) => {
      const subagents = [
        ...(subagentsByRoot.get(root.conversationId) ?? [])
      ].sort(
        (a, b) =>
          b.endedAtMs - a.endedAtMs ||
          a.conversationId.localeCompare(b.conversationId)
      );
      const lastActivityMs = subagents.reduce(
        (max, sub) => Math.max(max, sub.endedAtMs),
        root.endedAtMs
      );
      return { root, subagents, lastActivityMs };
    })
    .sort(
      (a, b) =>
        b.lastActivityMs - a.lastActivityMs ||
        a.root.conversationId.localeCompare(b.root.conversationId)
    );
}

const SEVERITY_RANK: Record<DiagnosticFinding["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2
};

export function selectTopDiagnostics(
  diagnostics: DiagnosticFinding[],
  limit = 3
): DiagnosticFinding[] {
  const cap = Math.max(0, limit);
  if (cap === 0 || diagnostics.length === 0) return [];
  return [...diagnostics]
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
        (b.impactTokens ?? 0) - (a.impactTokens ?? 0) ||
        (b.impactMs ?? 0) - (a.impactMs ?? 0)
    )
    .slice(0, cap);
}

export interface DiagnosticGuidance {
  categoryLabel: string;
  meaning: string;
  remediation: string;
}

export function describeDiagnostic(
  finding: DiagnosticFinding
): DiagnosticGuidance {
  switch (finding.category) {
    case "compaction_cliff":
      if (finding.severity === "critical" || /256k/i.test(finding.title)) {
        return {
          categoryLabel: "Context Ceiling",
          meaning:
            "Context passed the ~256k soft compaction ceiling, where earlier conversation history gets summarized or trimmed and the prompt cache prefix resets.",
          remediation:
            "Start a fresh chat or run /compact at a clean milestone, delegate broad codebase reads to subagents, and keep huge raw logs out of the main thread."
        };
      }
      return {
        categoryLabel: "Context Cliff",
        meaning:
          "Context crossed ~200k tokens, where recall softens, step latency rises, and forced compaction (~256k) approaches.",
        remediation:
          "Delegate multi-file exploration to research subagents, read targeted line ranges instead of whole files, and split unrelated follow-ups into a new chat."
      };

    case "cache_miss":
      if (/idle gap/i.test(finding.detail)) {
        return {
          categoryLabel: "Cache Expired (Idle)",
          meaning:
            "A 4+ minute pause expired the prompt cache TTL, so prior context had to be re-processed at full uncached input rates.",
          remediation:
            "Expected after stepping away—no fix needed for normal breaks; batching quick follow-ups within a few minutes keeps the cache warm."
        };
      }
      if (/model changed/i.test(finding.detail)) {
        return {
          categoryLabel: "Cache Miss (Model Switch)",
          meaning:
            "Switching models mid-conversation invalidated the previous model's prompt cache, forcing uncached input re-reads.",
          remediation:
            "Expected in intentional two-phase workflows (such as Plan to Execute); otherwise keep one model pinned across tightly coupled steps."
        };
      }
      return {
        categoryLabel: "Cache Reset",
        meaning:
          "A prompt prefix change (typically context compaction or an earlier prompt edit) invalidated the prompt cache and triggered full-rate uncached input reads.",
        remediation:
          "Keep chats focused under ~200k so compaction does not trigger mid-task, and open a fresh chat for separate workstreams."
      };

    case "token_driver":
      return {
        categoryLabel: "Heavy Context Carry",
        meaning:
          "A large tool output, file read, or skill doc stayed in history and was re-read from the prompt cache on every following step, multiplying total token volume.",
        remediation:
          "Read specific line ranges rather than full files, filter noisy command output (using head, grep, or quiet flags), or offload broad discovery to a subagent."
      };

    case "unused_skill":
      if (/duplicate/i.test(finding.title)) {
        return {
          categoryLabel: "Duplicate Skill Read",
          meaning:
            "The same SKILL.md instruction file was read multiple times in one chat, adding redundant carried tokens on every subsequent step.",
          remediation:
            "If authoring this skill, remove instructions that tell the agent to re-read SKILL.md mid-chat; otherwise low priority unless it repeats often."
        };
      }
      return {
        categoryLabel: "Unused Skill Load",
        meaning:
          "A tool-backed SKILL.md stayed in context without any of its CLI or MCP tools being invoked, paying instruction carry with no tool work.",
        remediation:
          "If authoring this skill, narrow its YAML description trigger so it only loads when needed; for third-party plugins, disable ones you rarely use."
      };

    case "high_skill_overhead":
      return {
        categoryLabel: "Skill Markdown Overhead",
        meaning:
          "Over 75% of this plugin or skill's context footprint came from static SKILL.md or reference markdown carried in cache rather than tool execution.",
        remediation:
          "Move bulky tables and examples out of SKILL.md into on-demand references/ files, or click Optimize With Agent in Plugins & Skills."
      };

    case "tool_thrash":
      return {
        categoryLabel: "Retry Loop",
        meaning:
          "Repeated failures on the same tool or target burned extra turns, wall time, and carried error context across subsequent steps.",
        remediation:
          "Check the error preview for stale edit targets, missing auth/env, or flaky commands, then fix the underlying command or add a workspace rule."
      };

    case "subagent_candidate":
      return {
        categoryLabel: "Subagent Opportunity",
        meaning:
          "One main-chat turn ran many read-only file, search, or command lookups whose outputs remained in the parent prompt cache for every later step.",
        remediation:
          "Delegate broad codebase discovery to a research subagent so only a concise summary enters your main chat's context."
      };

    case "slow_step":
      if (/long model step/i.test(finding.title)) {
        return {
          categoryLabel: "Slow Model Step",
          meaning:
            "A single model reasoning or generation call took an unusually long wall-clock stretch due to large context, extended thinking, or long output.",
          remediation:
            "Use a faster model tier for routine edits or lookups, trim accumulated context, or split large generation prompts into smaller steps."
        };
      }
      return {
        categoryLabel: "Slow Tool Call",
        meaning:
          "A single command, test/build run, or MCP call dominated active wall-clock time during this step.",
        remediation:
          "Run targeted tests or incremental builds while iterating, batch independent calls in parallel, or check stalled MCP/network servers."
      };

    case "repeated_read":
      return {
        categoryLabel: "Repeated File Read",
        meaning:
          "The same file was read 3 or more times in one conversation, re-injecting its contents into prompt history and adding context carry.",
        remediation:
          "Often benign during iterative multi-file edits; if frequent, keep chats shorter so earlier reads are not compacted out of context."
      };

    case "error_retry":
      return {
        categoryLabel: "Tool Execution Error",
        meaning:
          "A tool or shell command returned an execution error, adding failure output to context and requiring a recovery step.",
        remediation:
          "A one-off TDD test failure or self-recovered error needs no action; investigate only if the same failure recurs across chats (broken env, missing auth, or bad script)."
      };

    case "model_split":
      if (finding.severity === "warning") {
        return {
          categoryLabel: "Model Switch (Cache Miss)",
          meaning:
            "Switching models mid-conversation caused at least one prompt cache miss, forcing uncached input re-reads.",
          remediation:
            "Expected for intentional Plan to Execute transitions; otherwise keep one model pinned during tightly coupled steps."
        };
      }
      return {
        categoryLabel: "Model Switch",
        meaning:
          "Multiple models ran during this chat while preserving prompt cache hits across transitions.",
        remediation: "Informational only—no action needed."
      };
  }
}

export interface PluginWarningGuidance {
  meaning: string;
  remediation: string;
}

const PLUGIN_WARNING_GUIDANCE: Record<string, PluginWarningGuidance> = {
  "Unused load": {
    meaning:
      "A tool-backed SKILL.md stayed in context without invoking its CLI or MCP tools in that chat.",
    remediation:
      "Tighten the skill's YAML description trigger (if authoring) or disable unused plugins so they do not auto-load."
  },
  "Duplicate read": {
    meaning:
      "The same SKILL.md was read multiple times in a single conversation, carrying redundant instruction tokens.",
    remediation:
      "Avoid re-reading SKILL.md mid-chat when authoring skills; expand the row to see which sub-skill repeated."
  },
  "High markdown carry": {
    meaning:
      "Over 75% of this plugin or skill's token footprint came from static instruction markdown rather than tool outputs.",
    remediation:
      "Move large reference tables or examples out of SKILL.md into on-demand references/ files, or click Optimize With Agent."
  }
};

export function describePluginWarning(warning: string): PluginWarningGuidance {
  return (
    PLUGIN_WARNING_GUIDANCE[warning] ?? {
      meaning: `Flight Recorder flagged "${warning}" while analyzing this plugin or skill's context carry.`,
      remediation:
        "Expand this row to inspect sub-skills and tools, or click Optimize With Agent for tailored suggestions."
    }
  );
}

export type ErrorBadgeKind =
  | "Plugin"
  | "Skill"
  | PluginSkillChildKind
  | "Tool"
  | "Subagent";

export interface ErrorBadgeGuidance {
  summary: string;
  meaning: string;
  remediation: string;
}

function detectSampleRemediation(
  kind: ErrorBadgeKind,
  samples?: ToolErrorSample[]
): string | null {
  if (!samples || samples.length === 0) return null;
  const combined = samples
    .map((s) => `${s.toolName} ${s.target ?? ""} ${s.message}`)
    .join(" ");

  if (
    /\b(?:command not found|not recognized as|unknown option|unknown flag|unrecognized option|invalid argument|usage:)\b/i.test(
      combined
    )
  ) {
    return "A CLI binary is missing from PATH or was invoked with an unrecognized flag or subcommand. Verify the tool is installed and check whether the skill instructions pass outdated CLI flags.";
  }
  if (
    /\b(?:401|403|unauthorized|unauthenticated|forbidden|sign in|login|token expired|permission denied|eacces|eperm)\b/i.test(
      combined
    )
  ) {
    return "Authentication or permissions blocked the call. Reconnect the plugin account in Plugins Manager, refresh expired credentials, or verify file and sandbox permissions.";
  }
  if (/\b(?:enoent|no such file|does not exist|not found|cannot find)\b/i.test(combined)) {
    if (kind === "SubSkill" || kind === "Reference" || kind === "Skill") {
      return "The error points to a missing or renamed file path. Check whether SKILL.md references an outdated file under references/ or scripts/, or ignore if it was a one-off guessed path that recovered on the next step.";
    }
    return "The error points to a missing file, script, or resource path. Verify the referenced file or script exists in the workspace or plugin bundle, or ignore if it was a one-off typo that self-recovered.";
  }
  if (/\b(?:timeout|timed out|econnrefused|enotfound|socket hang up|502|503|network)\b/i.test(combined)) {
    return "A network request, local server, or MCP backend timed out or refused the connection. Verify the target service is running and reachable, or reduce batch sizes if a script is hanging.";
  }
  return null;
}

export function describeErrorBadge(
  kind: ErrorBadgeKind,
  errorCount: number,
  name?: string,
  samples?: ToolErrorSample[]
): ErrorBadgeGuidance {
  const plural = errorCount === 1 ? "" : "s";
  const targetSuffix = name ? ` on ${name}` : "";
  const matchedRemediation = detectSampleRemediation(kind, samples);

  switch (kind) {
    case "SubSkill":
    case "Reference":
    case "Skill":
      return {
        summary: `${errorCount} failed skill file read${plural}${targetSuffix} — click to inspect error details and what to do`,
        meaning:
          "Tool call(s) reading this skill's SKILL.md or reference files returned an error (such as a missing or moved path), not a failing code test in your repository. Each failed read added error text to context and required a recovery step.",
        remediation:
          matchedRemediation ??
          "Inspect the recorded error preview below to see which path failed. A one-off mis-guessed path that recovered immediately needs no action; if the same SKILL.md or reference file fails repeatedly, fix the broken path or link inside the skill."
      };

    case "CLI":
      return {
        summary: `${errorCount} failed CLI/script execution${plural}${targetSuffix} — click to inspect error details and what to do`,
        meaning:
          "Invocation(s) of this plugin's CLI binary or helper script exited with a non-zero exit code or execution error, adding failure output to prompt context and triggering a recovery step.",
        remediation:
          matchedRemediation ??
          "Check the error preview below for the command and exit output. Guard scripts rejecting invalid state (such as TDD or verification checks) or one-off command typos that self-recovered need no action; fix recurring missing-binary, bad-flag, or broken-script errors."
      };

    case "MCP":
      return {
        summary: `${errorCount} failed MCP call${plural}${targetSuffix} — click to inspect error details and what to do`,
        meaning:
          "MCP tool call(s) returned an error response (isError or step failure), burning extra model turns and carrying error output across subsequent steps.",
        remediation:
          matchedRemediation ??
          "Check the error preview below. If failures stem from expired credentials, rate limits, or an unreachable MCP server, reconnect the plugin account or check the server; one-off validation errors that self-recovered need no action."
      };

    case "Plugin":
      return {
        summary: `${errorCount} tool, CLI, MCP, or skill-file error${plural}${targetSuffix} — click to inspect what failed and what to do`,
        meaning:
          "Tool, CLI script, MCP server, or skill-file calls attributed to this plugin returned errors across this scope, adding failure output to context and potentially triggering retries.",
        remediation:
          matchedRemediation ??
          "Inspect the error previews below or click any child err badge in the breakdown table to pinpoint which sub-skill, script, or MCP tool failed. One-off self-recovered errors or expected guard rejections need no action; fix recurring auth, missing-path, or bad-flag failures."
      };

    case "Subagent":
      return {
        summary: `${errorCount} failed subagent dispatch${errorCount === 1 ? "" : "es"}${targetSuffix} — click to inspect error details and what to do`,
        meaning:
          "Subagent dispatch call(s) returned an error (launch failure, invalid arguments, or execution timeout), requiring the parent agent to retry or fall back.",
        remediation:
          matchedRemediation ??
          "Check the error preview below for invalid subagent type/role arguments, workspace conflicts, or timeouts, then inspect the failing chat step."
      };

    case "Tool":
      return {
        summary: `${errorCount} failed tool call${plural}${targetSuffix} — click to inspect error details and what to do`,
        meaning:
          "Calls to this tool returned execution errors (such as a non-zero exit code, stale edit target, or failed file read), adding error text to context and triggering recovery.",
        remediation:
          matchedRemediation ??
          "Check the error preview below. Harmless one-off failures (such as an expected red TDD test run or a stale edit target that self-corrected) need no action; investigate only if the same command, path, or permission failure recurs across chats."
      };
  }
}

export function buildErrorTroubleshootingPrompt(input: {
  name: string;
  kind: ErrorBadgeKind;
  parentName?: string;
  errorCount: number;
  scopeLabel: string;
  targetPaths?: string[];
  samples?: ToolErrorSample[];
}): string {
  const qualified = input.parentName
    ? `${input.kind} "${input.name}" under ${input.parentName}`
    : `${input.kind} "${input.name}"`;
  const guidance = describeErrorBadge(
    input.kind,
    input.errorCount,
    input.name,
    input.samples
  );
  const sampleLines = (input.samples ?? []).slice(0, 5).map((s) => {
    const locParts = [
      s.childName && (input.kind === "Plugin" || input.kind === "Skill")
        ? `${s.childKind ?? "Item"}: ${s.childName}`
        : "",
      s.target ? `target: ${s.target}` : "",
      s.conversationTitle ? `chat: "${s.conversationTitle}"` : "",
      s.stepIndex !== undefined ? `step ${s.stepIndex}` : ""
    ].filter(Boolean);
    const repeat = s.count > 1 ? ` (${s.count}x)` : "";
    return `- [${s.toolName}]${repeat}${locParts.length > 0 ? ` (${locParts.join(", ")})` : ""}: ${s.message}`;
  });
  const pathsLine =
    input.targetPaths && input.targetPaths.length > 0
      ? `\nRelevant paths: ${input.targetPaths.slice(0, 5).join(", ")}`
      : "";

  return [
    `In ${input.scopeLabel}, help me investigate ${input.errorCount} recorded error${input.errorCount === 1 ? "" : "s"} for ${qualified}.`,
    `Context: ${guidance.meaning}${pathsLine}`,
    ...(sampleLines.length > 0
      ? ["Recorded error previews:", ...sampleLines]
      : [
          "No sample previews were attached; inspect the relevant chat steps or SKILL.md files."
        ]),
    "Please determine whether each error is benign/self-recovered (such as an expected TDD test failure or one-off typo) or an actionable issue (broken SKILL.md path/flag, missing auth, or failing script), and propose or apply a concrete fix if needed."
  ].join("\n");
}
