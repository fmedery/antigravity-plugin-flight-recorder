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

import type { PluginSkillMetric } from "../shared/types.js";

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
      "Workspaces inferred from Antigravity Hub, IDE, and CLI transcripts, plus total root chats and spawned subagents.",
    impact:
      "Splitting broad exploration into subagents keeps individual parent chats leaner and prevents context compaction."
  },
  chatsSubagents: {
    title: "Chats & Spawned Subagents",
    meaning:
      "Top-level user conversations in this project alongside background research, browser, or coding subagents they launched.",
    impact:
      "Subagents run in isolated context windows so heavy codebase searches do not bloat your main chat's prompt cache."
  },
  totalTokens: {
    title: "Total Tokens Processed",
    meaning:
      "Sum of uncached new input tokens, cached context reads, and model output tokens across every planner step.",
    impact:
      "Large SKILL.md files or verbose tool outputs read early get re-read on every subsequent step—keep peak context below the 200k cliff."
  },
  cacheHitRatio: {
    title: "Prompt Cache Hit Ratio",
    meaning:
      "Share of input context served from the prompt cache instead of billed and processed as fresh uncached input.",
    impact:
      "Cached tokens typically cost 75–90% less and prefill faster; >4 min idle gaps, model switches, or context compaction trigger expensive cache misses."
  },
  tokensAndCache: {
    title: "Tokens, Peak Context & Cache",
    meaning:
      "Total tokens processed in this chat (with prompt cache hit %) alongside peak single-step context size and fresh uncached input.",
    impact:
      "Crossing 200k–256k peak context degrades recall and triggers prefix compaction, forcing skills and files to be re-read at full uncached cost."
  },
  activeAgentTime: {
    title: "Active Agent Time",
    meaning:
      "Wall-clock time the agent spent thinking and running tools (merging parallel tool calls and excluding user idle/approval waits).",
    impact:
      "Highlights whether latency comes from heavy model reasoning, sequential tool calls that could run in parallel, or slow workflow plugins."
  },
  userWaitIdle: {
    title: "User Wait & Idle Time",
    meaning:
      "Elapsed time between turns or during permission/review pauses when no model step or tool was actively executing.",
    impact:
      "Excluded from Active Agent Time so pauses never skew plugin speed, though idle gaps over ~4–5 minutes can expire the prompt cache TTL."
  },
  estCost: {
    title: "Estimated API Equivalent Spend",
    meaning:
      "Estimated USD value of uncached input, cache reads, and output tokens using your configured per-1M model pricing rules.",
    impact:
      "Reveals which plugins, skills, and model choices consume the most quota/budget; configure custom rates in Pricing for any unpriced models."
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

  return [
    `In ${scopeLabel}, help me optimize how we use ${metric.kind.toLowerCase()} "${metric.name}".`,
    `Impact: ${spendPart}, ${fmtPct(metric.timeShare)} of active time (${fmtDuration(metric.drivenActiveMs)}), +${fmtK(metric.totalTokens)} context footprint (${instrPct}% instruction markdown / ${execPct}% tool execution).${pathsLine}${rxLine}`,
    ...(childSummary ? ["Breakdown:", childSummary] : []),
    "Please inspect the relevant SKILL.md / rules / tool usage and propose concrete ways to reduce wasted tokens, cache carry, and active time while preserving quality."
  ].join("\n");
}
