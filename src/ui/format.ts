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

  return [
    `In ${scopeLabel}, help me optimize how we use ${metric.kind.toLowerCase()} "${metric.name}".`,
    `Impact: ${spendPart}, ${fmtPct(metric.timeShare)} of active time (${fmtDuration(metric.drivenActiveMs)}), +${fmtK(metric.totalTokens)} context footprint (${instrPct}% instruction markdown / ${execPct}% tool execution).${pathsLine}${rxLine}`,
    ...(childSummary ? ["Breakdown:", childSummary] : []),
    "Please inspect the relevant SKILL.md / rules / tool usage and propose concrete ways to reduce wasted tokens, cache carry, and active time while preserving quality."
  ].join("\n");
}
