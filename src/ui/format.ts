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
