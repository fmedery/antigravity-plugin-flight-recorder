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

export type DeltaPolarity = "lower-is-better" | "higher-is-better" | "neutral";

export function fmtDeltaPct(ratio: number | null): string | null {
  if (ratio === null || !Number.isFinite(ratio)) return null;
  const pct = Math.round(ratio * 100);
  if (pct > 999) return ">+999%";
  if (pct < -999) return "<-999%";
  if (pct === 0) return "0%";
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

export function fmtDeltaPp(pp: number | null): string | null {
  if (pp === null || !Number.isFinite(pp)) return null;
  const rounded = Math.round(pp);
  if (rounded === 0) return null;
  return rounded > 0 ? `+${rounded}pp` : `${rounded}pp`;
}

export function deltaBadgeTone(
  delta: number | null,
  direction: DeltaPolarity
): "success" | "warning" | "neutral" {
  if (
    delta === null ||
    !Number.isFinite(delta) ||
    direction === "neutral" ||
    Math.abs(delta) < 0.005
  ) {
    return "neutral";
  }
  if (direction === "lower-is-better") {
    return delta < 0 ? "success" : "warning";
  }
  return delta > 0 ? "success" : "warning";
}

export function fmtUsd(usd: number | null): string {
  if (usd === null || !Number.isFinite(usd)) return "Unpriced";
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)} est.`;
  return `$${usd.toFixed(2)} est.`;
}

export function fmtUsdCompact(usd: number | null): string {
  if (usd === null || !Number.isFinite(usd)) return "Unpriced";
  if (usd === 0) return "$0.00";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
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

export function fmtDateSpan(
  startMs: number,
  endMs: number,
  nowMs = Date.now()
): string {
  if ((!startMs || startMs <= 0) && (!endMs || endMs <= 0)) return "";
  const a = startMs > 0 ? startMs : endMs;
  const b = endMs > 0 ? endMs : startMs;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);

  try {
    const dLo = new Date(lo);
    const dHi = new Date(hi);
    const curYear = new Date(nowMs).getFullYear();
    const sameDay =
      dLo.getFullYear() === dHi.getFullYear() &&
      dLo.getMonth() === dHi.getMonth() &&
      dLo.getDate() === dHi.getDate();
    const showYear =
      dLo.getFullYear() !== curYear || dHi.getFullYear() !== curYear;
    const opts: Intl.DateTimeFormatOptions = showYear
      ? { month: "short", day: "numeric", year: "numeric" }
      : { month: "short", day: "numeric" };
    const fmt = new Intl.DateTimeFormat(undefined, opts);
    if (sameDay) {
      return fmt.format(dLo);
    }
    if (typeof fmt.formatRange === "function") {
      return fmt.formatRange(dLo, dHi);
    }
    return `${fmt.format(dLo)} – ${fmt.format(dHi)}`;
  } catch {
    return "";
  }
}

import type {
  ConversationSummary,
  PluginSkillChildKind,
  TimeRangeWindow,
  ToolErrorSample
} from "../shared/types.js";

export function formatTimeRangeSummary(
  tr: TimeRangeWindow,
  hasActivity: boolean
): { label: string; span: string | null } {
  switch (tr.preset) {
    case "today":
      return {
        label: "Today",
        span: fmtDateSpan(tr.sinceMs ?? tr.untilMs, tr.untilMs, tr.untilMs) || null
      };
    case "7d":
      return {
        label: "Last 7 days",
        span: fmtDateSpan(tr.sinceMs ?? tr.untilMs, tr.untilMs, tr.untilMs) || null
      };
    case "30d":
      return {
        label: "Last 30 days",
        span: fmtDateSpan(tr.sinceMs ?? tr.untilMs, tr.untilMs, tr.untilMs) || null
      };
    case "all":
    default:
      return {
        label: "All time",
        span:
          hasActivity && (tr.firstActivityMs > 0 || tr.lastActivityMs > 0)
            ? fmtDateSpan(tr.firstActivityMs, tr.lastActivityMs, tr.untilMs) || null
            : null
      };
  }
}

export type KpiHelpKey =
  | "projects"
  | "chatsSubagents"
  | "totalTokens"
  | "cacheHitRatio"
  | "tokensAndCache"
  | "activeAgentTime"
  | "userWaitIdle"
  | "contextHealth"
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
  contextHealth: {
    title: "Context & Compaction Health",
    meaning:
      "Average peak single-step context size across sessions with token telemetry, the percentage staying under the 200k cliff, counts of sessions crossing 200k or 256k, and compaction or prefix-reset cache misses.",
    impact:
      "Keeping peak context below 200k preserves model recall and avoids forced compaction and full-rate cache re-reads. High peak context points to noisy skills, large file reads, or long threads that should be trimmed or delegated to subagents."
  },
  estCost: {
    title: "Estimated API Equivalent Cost",
    meaning:
      "Estimated USD across priced models, billed separately for uncached new input (full rate), cached reads (discounted rate), and output tokens (highest rate). Models without a rule in Pricing are excluded from the total and flagged as unpriced.",
    impact:
      "Shows which projects, models, plugins, and skills drive budget or subscription rate-limit usage. Open Pricing (or click the unpriced badge) to add custom per-1M rates so totals cover every model."
  }
};

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

export interface PluginWarningGuidance {
  meaning: string;
  remediation: string;
}

const PLUGIN_WARNING_GUIDANCE: Record<string, PluginWarningGuidance> = {
  "Unused load": {
    meaning:
      "A tool-backed skill stayed in context without invoking its CLI or MCP tools in that chat.",
    remediation:
      "Disable this plugin in Plugins Manager if you do not need it on this project, or tighten its trigger if you authored the skill."
  },
  "Duplicate read": {
    meaning:
      "The same skill instructions were loaded multiple times in a single conversation, carrying redundant tokens.",
    remediation:
      "This often happens in long sessions or after context compaction; starting a fresh chat avoids paying to carry them again."
  },
  "High markdown carry": {
    meaning:
      "Over 75% of this plugin or skill's token footprint came from static instruction markdown rather than tool outputs.",
    remediation:
      "Worth disabling when not actively used on a project, or keeping chats shorter so instructions are not carried across as many turns."
  }
};

export function describePluginWarning(warning: string): PluginWarningGuidance {
  return (
    PLUGIN_WARNING_GUIDANCE[warning] ?? {
      meaning: `Flight Recorder flagged "${warning}" while analyzing this plugin or skill's context carry.`,
      remediation:
        "Expand this row to inspect which sub-skills and tools drove context carry."
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
