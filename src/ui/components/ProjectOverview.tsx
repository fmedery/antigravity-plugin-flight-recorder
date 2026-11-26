import React, { useId, useMemo, useState } from "react";
import { TIME_RANGE_PRESETS } from "../../shared/timeRange.js";
import type {
  ContextHealthSummary,
  ConversationSummary,
  DashboardData,
  ModelAvailabilitySignal,
  ModelPricingRule,
  PeriodComparison,
  ProjectDetail,
  ProjectSummary,
  TimeRangePreset,
  TimeRangeWindow
} from "../../shared/types";
import {
  deltaBadgeTone,
  fmtBytes,
  fmtDateShort,
  fmtDeltaPct,
  fmtDeltaPp,
  fmtDuration,
  fmtK,
  fmtPct,
  fmtUsdCompact,
  groupProjectChats,
  type GroupedProjectChat
} from "../format";
import { CostCell } from "./CostCell";
import { KpiHelpTip } from "./KpiHelpTip";
import { KpiStatusPill } from "./KpiStatusPill";
import {
  ModelBreakdownPanel,
  ModelInlinePill,
  ModelMixBar,
  type ModelShareBasis
} from "./ModelBreakdown";
import { PluginSkillLeaderboard } from "./PluginSkillLeaderboard";
import { SkillToolMatrix } from "./SkillToolMatrix";
import { TabStrip, type TabItem } from "./TabStrip";
import { TimeRangeBar } from "./TimeRangeBar";

function rangeLongLabel(preset: TimeRangePreset): string {
  return TIME_RANGE_PRESETS.find((p) => p.key === preset)?.longLabel ?? "All time";
}

function fallbackDashboardTimeRange(dashboard: DashboardData): TimeRangeWindow {
  if (dashboard.timeRange) return dashboard.timeRange;
  const starts = dashboard.projects.map((p) => p.firstActivityMs).filter((x) => x > 0);
  const ends = dashboard.projects.map((p) => p.lastActivityMs).filter((x) => x > 0);
  return {
    preset: "all",
    sinceMs: null,
    untilMs: dashboard.generatedAtMs || Date.now(),
    firstActivityMs: starts.length > 0 ? Math.min(...starts) : 0,
    lastActivityMs: ends.length > 0 ? Math.max(...ends) : 0
  };
}

function fallbackProjectTimeRange(detail: ProjectDetail): TimeRangeWindow {
  if (detail.timeRange) return detail.timeRange;
  return {
    preset: "all",
    sinceMs: null,
    untilMs: Date.now(),
    firstActivityMs: detail.summary.firstActivityMs,
    lastActivityMs: detail.summary.lastActivityMs
  };
}

const EMPTY_CONTEXT_HEALTH: ContextHealthSummary = {
  measuredChatCount: 0,
  avgPeakContextTokens: 0,
  maxPeakContextTokens: 0,
  under200kCount: 0,
  under200kRatio: 0,
  cliff200kChats: 0,
  compaction256kChats: 0,
  compactionEventCount: 0
};

interface DeltaPillProps {
  text: string | null;
  tone: "success" | "warning" | "neutral";
  tooltip?: string;
}

const DeltaPill: React.FC<DeltaPillProps> = ({ text, tone, tooltip }) => {
  if (!text) return null;
  return (
    <span
      className={`badge badge-${tone} kpi-delta-pill`}
      title={tooltip}
      aria-label={tooltip}
    >
      {text}
    </span>
  );
};

interface ContextHealthCardProps {
  contextHealth?: ContextHealthSummary;
  hasAnyChats: boolean;
  periodComparison?: PeriodComparison | null;
}

const ContextHealthCard: React.FC<ContextHealthCardProps> = ({
  contextHealth,
  hasAnyChats,
  periodComparison
}) => {
  const ch = contextHealth ?? EMPTY_CONTEXT_HEALTH;
  const cmp = periodComparison?.hasPriorActivity ? periodComparison : null;
  const deltaText = cmp ? fmtDeltaPct(cmp.avgPeakContextDeltaPct) : null;
  const deltaTone = cmp
    ? deltaBadgeTone(cmp.avgPeakContextDeltaPct, "lower-is-better")
    : "neutral";
  const deltaTooltip =
    cmp && deltaText
      ? `${deltaText} avg peak context ${cmp.label} (${fmtK(ch.avgPeakContextTokens)} vs ${fmtK(cmp.priorAvgPeakContextTokens)})`
      : undefined;

  let subDetail = "";
  if (ch.measuredChatCount > 0) {
    if (ch.cliff200kChats === 0 && ch.compactionEventCount === 0) {
      subDetail = `Max ${fmtK(ch.maxPeakContextTokens)}`;
    } else {
      const parts: string[] = [];
      if (ch.cliff200kChats > 0) parts.push(`${ch.cliff200kChats} ≥200k`);
      if (ch.compaction256kChats > 0) parts.push(`${ch.compaction256kChats} ≥256k`);
      if (ch.compactionEventCount > 0) {
        parts.push(
          `${ch.compactionEventCount} reset${ch.compactionEventCount === 1 ? "" : "s"}`
        );
      }
      subDetail = parts.join(" · ");
    }
  }

  const sessionNoun = ch.measuredChatCount === 1 ? "session" : "sessions";
  const healthDetail =
    ch.cliff200kChats === 0 && ch.compactionEventCount === 0
      ? `${fmtPct(ch.under200kRatio)} of ${ch.measuredChatCount} measured ${sessionNoun} stayed under 200k peak context (max ${fmtK(ch.maxPeakContextTokens)}).`
      : `${fmtPct(ch.under200kRatio)} of ${ch.measuredChatCount} measured ${sessionNoun} stayed under 200k peak context (${subDetail}).`;

  return (
    <div className="kpi-card">
      <div className="kpi-label">
        <span>Context Health</span>
        <KpiHelpTip helpKey="contextHealth" />
      </div>
      <div className="kpi-value">
        {ch.measuredChatCount > 0 ? (
          <>
            <span>{fmtK(ch.avgPeakContextTokens)}</span>
            <span className="kpi-unit">avg peak</span>
            <DeltaPill text={deltaText} tone={deltaTone} tooltip={deltaTooltip} />
          </>
        ) : (
          <span>{hasAnyChats ? "N/A (legacy)" : "—"}</span>
        )}
      </div>
      <div className="kpi-sub">
        {ch.measuredChatCount > 0 ? (
          <>
            <KpiStatusPill
              kind="contextHealth"
              ratio={ch.under200kRatio}
              pillLabel={`${fmtPct(ch.under200kRatio)} <200k`}
              title="Context Health"
              detail={healthDetail}
            />
            <span>{subDetail}</span>
          </>
        ) : (
          <span>
            {hasAnyChats
              ? "Legacy transcripts without context size"
              : "No sessions in range"}
          </span>
        )}
      </div>
    </div>
  );
};

function buildKpiDeltas(
  periodComparison: PeriodComparison | null | undefined,
  curr: {
    chatCount: number;
    totalTokens: number;
    hasTokenTelemetry: boolean;
    cacheHitRatio: number;
    activeMs: number;
    estimatedCostUsd: number | null;
  }
) {
  const cmp = periodComparison?.hasPriorActivity ? periodComparison : null;
  const chatsText = cmp ? fmtDeltaPct(cmp.chatsDeltaPct) : null;
  const tokensText = cmp ? fmtDeltaPct(cmp.tokensDeltaPct) : null;
  const cacheHitText =
    cmp && curr.hasTokenTelemetry ? fmtDeltaPp(cmp.cacheHitDeltaPp) : null;
  const activeText = cmp ? fmtDeltaPct(cmp.activeMsDeltaPct) : null;
  const costText = cmp ? fmtDeltaPct(cmp.costDeltaPct) : null;

  return {
    chats: {
      text: chatsText,
      tone: "neutral" as const,
      tooltip:
        cmp && chatsText
          ? `${chatsText} chats ${cmp.label} (${curr.chatCount} vs ${cmp.priorChatCount})`
          : undefined
    },
    tokens: {
      text: tokensText,
      tone: cmp
        ? deltaBadgeTone(cmp.tokensDeltaPct, "lower-is-better")
        : ("neutral" as const),
      tooltip:
        cmp && tokensText
          ? `${tokensText} tokens ${cmp.label} (${fmtK(curr.totalTokens)} vs ${fmtK(cmp.priorTotalTokens)})`
          : undefined
    },
    cacheHit: {
      text: cacheHitText,
      tone:
        cmp && cmp.cacheHitDeltaPp !== null
          ? deltaBadgeTone(cmp.cacheHitDeltaPp / 100, "higher-is-better")
          : ("neutral" as const),
      tooltip:
        cmp && cacheHitText
          ? `${cacheHitText} cache hit ${cmp.label} (${fmtPct(curr.cacheHitRatio)} vs ${fmtPct(cmp.priorCacheHitRatio)})`
          : undefined
    },
    active: {
      text: activeText,
      tone: cmp
        ? deltaBadgeTone(cmp.activeMsDeltaPct, "lower-is-better")
        : ("neutral" as const),
      tooltip:
        cmp && activeText
          ? `${activeText} active time ${cmp.label} (${fmtDuration(curr.activeMs)} vs ${fmtDuration(cmp.priorActiveMs)})`
          : undefined
    },
    cost: {
      text: costText,
      tone: cmp
        ? deltaBadgeTone(cmp.costDeltaPct, "lower-is-better")
        : ("neutral" as const),
      tooltip:
        cmp && costText
          ? `${costText} est. cost ${cmp.label} (${fmtUsdCompact(curr.estimatedCostUsd)} vs ${fmtUsdCompact(cmp.priorEstimatedCostUsd)})`
          : undefined
    }
  };
}

interface AllProjectsProps {
  dashboard: DashboardData;
  canSendMessage?: boolean;
  timeRange?: TimeRangePreset;
  updatingRange?: boolean;
  onTimeRangeChange?: (preset: TimeRangePreset) => void;
  onSelectProject: (projectPath: string) => void;
  onSelectChat: (conversationId: string, stepIndex?: number) => void;
  onOpenSettings: () => void;
  onTroubleshootPrompt?: (prompt: string) => void;
}

type HomeTab = "projects" | "plugins" | "chats";
type ProjectSort = "lastActivityMs" | "cost" | "tokens" | "activeMs" | "chats";

export const AllProjectsView: React.FC<AllProjectsProps> = ({
  dashboard,
  canSendMessage = false,
  timeRange = "all",
  updatingRange = false,
  onTimeRangeChange,
  onSelectProject,
  onSelectChat,
  onOpenSettings,
  onTroubleshootPrompt
}) => {
  const [tab, setTab] = useState<HomeTab>("projects");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<ProjectSort>("lastActivityMs");
  const [modelBasis, setModelBasis] = useState<ModelShareBasis>("tokens");

  const rawTabId = useId();
  const tabIdPrefix = `home-tab-${rawTabId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? dashboard.projects.filter(
          (p) =>
            p.projectName.toLowerCase().includes(q) ||
            p.projectPath.toLowerCase().includes(q) ||
            p.models.some((m) => m.toLowerCase().includes(q)) ||
            p.topPluginsSkills.some((s) => s.toLowerCase().includes(q)) ||
            p.topSkills.some((s) => s.toLowerCase().includes(q)) ||
            p.topTools.some((t) => t.toLowerCase().includes(q)) ||
            ((p.swarmCount ?? 0) > 0 && q.length >= 2 && "swarm".includes(q))
        )
      : dashboard.projects;

    return [...list].sort((a, b) => {
      if (sortBy === "cost") {
        return (
          (b.tokens.estimatedCostUsd ?? -1) - (a.tokens.estimatedCostUsd ?? -1) ||
          b.time.activeMs - a.time.activeMs
        );
      }
      if (sortBy === "tokens") {
        const ta =
          a.tokens.inputTokens + a.tokens.cacheReadTokens + a.tokens.outputTokens;
        const tb =
          b.tokens.inputTokens + b.tokens.cacheReadTokens + b.tokens.outputTokens;
        return tb - ta;
      }
      if (sortBy === "activeMs") return b.time.activeMs - a.time.activeMs;
      if (sortBy === "chats") return b.chatCount - a.chatCount;
      return b.lastActivityMs - a.lastActivityMs;
    });
  }, [dashboard.projects, query, sortBy]);

  const tot = dashboard.totals;
  const grandTokens =
    tot.tokens.inputTokens + tot.tokens.cacheReadTokens + tot.tokens.outputTokens;
  const effectiveTimeRange = fallbackDashboardTimeRange(dashboard);
  const activeRangeLabel = rangeLongLabel(timeRange);
  const periodComparison = dashboard.periodComparison ?? null;
  const deltas = buildKpiDeltas(periodComparison, {
    chatCount: tot.chatCount,
    totalTokens: grandTokens,
    hasTokenTelemetry: tot.tokens.hasTokenTelemetry,
    cacheHitRatio: tot.tokens.cacheHitRatio,
    activeMs: tot.time.activeMs,
    estimatedCostUsd: tot.tokens.estimatedCostUsd
  });

  const homeTabs: Array<TabItem<HomeTab>> = [
    { key: "projects", label: `Projects (${dashboard.projects.length})` },
    { key: "plugins", label: "Plugins & Models" },
    { key: "chats", label: `Recent Chats (${dashboard.recentChats.length})` }
  ];

  return (
    <div>
      <TimeRangeBar
        value={timeRange}
        timeRange={effectiveTimeRange}
        hasActivity={tot.chatCount + tot.subagentCount > 0}
        loading={updatingRange}
        onChange={(next) => onTimeRangeChange?.(next)}
      />

      <div
        className={updatingRange ? "is-range-updating" : undefined}
        aria-busy={updatingRange || undefined}
      >
        <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Projects</span>
            <KpiHelpTip helpKey="projects" />
          </div>
          <div className="kpi-value">{tot.projectCount}</div>
          <div className="kpi-sub">
            <span>
              {tot.chatCount} chats (+{tot.subagentCount} sub
              {(tot.swarmCount ?? 0) > 0
                ? ` · ${tot.swarmCount} swarm${tot.swarmCount === 1 ? "" : "s"}`
                : ""}
              )
            </span>
            <DeltaPill
              text={deltas.chats.text}
              tone={deltas.chats.tone}
              tooltip={deltas.chats.tooltip}
            />
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Total Tokens</span>
            <KpiHelpTip helpKey="totalTokens" />
          </div>
          <div className="kpi-value">
            <span>{fmtK(grandTokens)}</span>
            <DeltaPill
              text={deltas.tokens.text}
              tone={deltas.tokens.tone}
              tooltip={deltas.tokens.tooltip}
            />
          </div>
          <div className="kpi-sub">
            {tot.tokens.hasTokenTelemetry &&
            tot.tokens.inputTokens + tot.tokens.cacheReadTokens > 0 ? (
              <>
                <KpiStatusPill
                  kind="cacheHit"
                  ratio={tot.tokens.cacheHitRatio}
                  pillLabel={`${fmtPct(tot.tokens.cacheHitRatio)} cache hit`}
                  title="Prompt Cache Hit"
                  detail={`${fmtPct(tot.tokens.cacheHitRatio)} of input context (${fmtK(tot.tokens.cacheReadTokens)} cached ÷ ${fmtK(tot.tokens.cacheReadTokens + tot.tokens.inputTokens)} total input; output excluded) was served from prompt cache.`}
                />
                <DeltaPill
                  text={deltas.cacheHit.text}
                  tone={deltas.cacheHit.tone}
                  tooltip={deltas.cacheHit.tooltip}
                />
              </>
            ) : tot.chatCount + tot.subagentCount === 0 ? (
              <span>No sessions in range</span>
            ) : tot.tokens.hasTokenTelemetry ? (
              <span>No input tokens</span>
            ) : (
              <span>No token telemetry</span>
            )}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Active Time</span>
            <KpiHelpTip helpKey="activeAgentTime" />
          </div>
          <div className="kpi-value">
            <span>{fmtDuration(tot.time.activeMs)}</span>
            <DeltaPill
              text={deltas.active.text}
              tone={deltas.active.tone}
              tooltip={deltas.active.tooltip}
            />
          </div>
          <div className="kpi-sub">
            {fmtDuration(tot.time.modelMs)} model · {fmtDuration(tot.time.toolWallMs)} tools
          </div>
        </div>
        <ContextHealthCard
          contextHealth={tot.contextHealth}
          hasAnyChats={tot.chatCount + tot.subagentCount > 0}
          periodComparison={periodComparison}
        />
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Est. Cost</span>
            <KpiHelpTip helpKey="estCost" />
          </div>
          <div className="kpi-value">
            <span>
              {tot.tokens.estimatedCostUsd === null &&
              tot.tokens.unpricedModels.length === 0
                ? "—"
                : fmtUsdCompact(tot.tokens.estimatedCostUsd)}
            </span>
            <DeltaPill
              text={deltas.cost.text}
              tone={deltas.cost.tone}
              tooltip={deltas.cost.tooltip}
            />
          </div>
          <div className="kpi-sub">
            {tot.tokens.unpricedModels.length > 0 ? (
              <button
                type="button"
                className="kpi-warning-btn"
                onClick={onOpenSettings}
              >
                {tot.tokens.unpricedModels.length} unpriced model(s)
              </button>
            ) : tot.tokens.cacheSavingsUsd !== null ? (
              `Saved ~${fmtUsdCompact(tot.tokens.cacheSavingsUsd)}`
            ) : tot.tokens.estimatedCostUsd === null ? (
              "No rateable model"
            ) : (
              "All models priced"
            )}
          </div>
        </div>
      </div>

      <TabStrip
        tabs={homeTabs}
        activeKey={tab}
        ariaLabel="Dashboard sections"
        idPrefix={tabIdPrefix}
        onSelect={setTab}
      />

      <div role="tabpanel" aria-labelledby={`${tabIdPrefix}-${tab}`}>
        {tab === "projects" && (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">All Tracked Projects</span>
              <div className="panel-controls">
                <input
                  type="text"
                  className="input-field input-field-sm"
                  placeholder="Filter projects, models, skills..."
                  aria-label="Filter projects"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <select
                  className="input-field input-field-sm"
                  aria-label="Sort projects"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as ProjectSort)}
                >
                  <option value="lastActivityMs">Sort: Recent</option>
                  <option value="cost">Sort: Cost</option>
                  <option value="tokens">Sort: Tokens</option>
                  <option value="activeMs">Sort: Active Time</option>
                  <option value="chats">Sort: Chats</option>
                </select>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Project</th>
                    <th scope="col" className="text-right">Chats</th>
                    <th scope="col" className="text-right">Tokens &amp; Cache</th>
                    <th scope="col" className="text-right">Active Time</th>
                    <th scope="col" className="text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ color: "var(--txt-tertiary)", padding: 14 }}>
                        {dashboard.projects.length === 0 && timeRange !== "all" ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span>No projects active in {activeRangeLabel.toLowerCase()}.</span>
                            {onTimeRangeChange && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => onTimeRangeChange("all")}
                              >
                                Show all time
                              </button>
                            )}
                          </span>
                        ) : (
                          "No matching projects found."
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((p: ProjectSummary) => {
                      const pTokens =
                        p.tokens.inputTokens +
                        p.tokens.cacheReadTokens +
                        p.tokens.outputTokens;

                      return (
                        <tr
                          key={p.projectPath}
                          className="clickable"
                          onClick={() => onSelectProject(p.projectPath)}
                        >
                          <td>
                            <div style={{ fontWeight: 600 }}>{p.projectName}</div>
                            <div
                              className="cell-sub truncate"
                              style={{ maxWidth: 340 }}
                              title={p.projectPath}
                            >
                              {p.projectPath}
                            </div>
                          </td>
                          <td className="text-right tabular">
                            <div className="metric-primary">{p.chatCount}</div>
                            {(p.subagentCount > 0 || (p.swarmCount ?? 0) > 0) && (
                              <div className="cell-sub">
                                {p.subagentCount > 0 ? `+${p.subagentCount} sub` : ""}
                                {p.subagentCount > 0 && (p.swarmCount ?? 0) > 0 ? " · " : ""}
                                {(p.swarmCount ?? 0) > 0
                                  ? `${p.swarmCount} swarm${p.swarmCount === 1 ? "" : "s"}`
                                  : ""}
                              </div>
                            )}
                          </td>
                          <td className="text-right tabular">
                            {p.tokens.hasTokenTelemetry ? (
                              <>
                                <div className="metric-primary">{fmtK(pTokens)}</div>
                                <div className="cell-sub metric-cache">
                                  {fmtPct(p.tokens.cacheHitRatio)} cache
                                </div>
                              </>
                            ) : (
                              <span className="cell-muted">N/A (legacy)</span>
                            )}
                          </td>
                          <td className="text-right tabular">
                            <div className="metric-primary">
                              {fmtDuration(p.time.activeMs)}
                            </div>
                          </td>
                          <td className="text-right tabular">
                            <CostCell
                              estimatedCostUsd={p.tokens.estimatedCostUsd}
                              unpricedModels={p.tokens.unpricedModels}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "plugins" && (
          <div>
            {tot.modelBreakdown.length > 0 && (
              <ModelBreakdownPanel
                title="Global Model Mix Across All Projects"
                breakdown={tot.modelBreakdown}
                pricingRules={dashboard.pricingRules}
                modelSignals={dashboard.modelSignals}
                latestGlobalActivityMs={dashboard.latestGlobalActivityMs}
                basis={modelBasis}
                onBasisChange={setModelBasis}
                unpricedModels={tot.tokens.unpricedModels}
                showChatsColumn
                collapsibleTable
                defaultExpanded={false}
                onOpenSettings={onOpenSettings}
              />
            )}

            {dashboard.pluginSkillMetrics.length > 0 && (
              <PluginSkillLeaderboard
                title="Plugins & Skills Impact (All Projects)"
                metrics={dashboard.pluginSkillMetrics}
                showProjectsColumn
                scopeLabel="all tracked projects"
                canSendMessage={canSendMessage}
                onSelectChat={onSelectChat}
                onTroubleshootPrompt={onTroubleshootPrompt}
              />
            )}

            {tot.modelBreakdown.length === 0 &&
              dashboard.pluginSkillMetrics.length === 0 && (
                <div
                  className="panel"
                  style={{
                    padding: 16,
                    color: "var(--txt-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap"
                  }}
                >
                  <span>
                    {timeRange !== "all"
                      ? `No plugin, skill, or model telemetry recorded in ${activeRangeLabel.toLowerCase()}.`
                      : "No plugin, skill, or model telemetry recorded yet."}
                  </span>
                  {timeRange !== "all" && onTimeRangeChange && (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => onTimeRangeChange("all")}
                    >
                      Show all time
                    </button>
                  )}
                </div>
              )}
          </div>
        )}

        {tab === "chats" && (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Recent Chats Across All Projects</span>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Chat</th>
                    <th scope="col" className="text-right">Tokens</th>
                    <th scope="col" className="text-right">Active</th>
                    <th scope="col" className="text-right">Est. Cost</th>
                    <th scope="col" className="text-right">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentChats.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ color: "var(--txt-tertiary)", padding: 14 }}>
                        {timeRange !== "all" ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span>No chats recorded in {activeRangeLabel.toLowerCase()}.</span>
                            {onTimeRangeChange && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                onClick={() => onTimeRangeChange("all")}
                              >
                                Show all time
                              </button>
                            )}
                          </span>
                        ) : (
                          "No chats recorded yet."
                        )}
                      </td>
                    </tr>
                  ) : (
                    dashboard.recentChats.slice(0, 20).map((c: ConversationSummary) => {
                      const cTok =
                        c.tokens.inputTokens +
                        c.tokens.cacheReadTokens +
                        c.tokens.outputTokens;
                      return (
                        <tr
                          key={c.conversationId}
                          className="clickable"
                          onClick={() => onSelectChat(c.conversationId)}
                        >
                          <td>
                            <div
                              className="truncate"
                              style={{ maxWidth: 360, fontWeight: 500 }}
                              title={c.title}
                            >
                              {c.swarmRole === "coordinator" ? (
                                <span
                                  className="badge badge-swarm"
                                  style={{ marginRight: 6 }}
                                >
                                  Swarm
                                </span>
                              ) : c.swarmRole === "worker" || c.subagentType === "swarm" ? (
                                <span
                                  className="badge badge-swarm"
                                  style={{ marginRight: 6 }}
                                >
                                  Swarm · {c.subagentRole || "worker"}
                                </span>
                              ) : (
                                c.parentConversationId && (
                                  <span
                                    className="badge badge-info"
                                    style={{ marginRight: 6 }}
                                  >
                                    Subagent
                                  </span>
                                )
                              )}
                              {c.title}
                            </div>
                            <div
                              className="cell-sub"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                flexWrap: "wrap"
                              }}
                            >
                              <span>{c.projectName}</span>
                              <ModelInlinePill
                                models={c.models}
                                breakdown={c.modelBreakdown}
                                pricingRules={dashboard.pricingRules}
                                modelSignals={dashboard.modelSignals}
                                latestGlobalActivityMs={dashboard.latestGlobalActivityMs}
                                maxWidth={170}
                              />
                            </div>
                          </td>
                          <td className="text-right tabular">
                            {c.tokens.hasTokenTelemetry ? fmtK(cTok) : "N/A (legacy)"}
                          </td>
                          <td className="text-right tabular">
                            {fmtDuration(c.time.activeMs)}
                          </td>
                          <td className="text-right tabular">
                            <CostCell
                              estimatedCostUsd={c.tokens.estimatedCostUsd}
                              unpricedModels={c.tokens.unpricedModels}
                            />
                          </td>
                          <td
                            className="text-right tabular"
                            style={{ color: "var(--txt-tertiary)" }}
                          >
                            {fmtDateShort(c.endedAtMs)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

interface ProjectDetailProps {
  detail: ProjectDetail;
  pricingRules?: ModelPricingRule[];
  modelSignals?: Record<string, ModelAvailabilitySignal>;
  latestGlobalActivityMs?: number;
  canSendMessage?: boolean;
  timeRange?: TimeRangePreset;
  updatingRange?: boolean;
  onTimeRangeChange?: (preset: TimeRangePreset) => void;
  onSelectChat: (conversationId: string, stepIndex?: number) => void;
  onOpenFile?: (filePath: string) => void;
  onOpenSettings: () => void;
  onTroubleshootPrompt?: (prompt: string) => void;
}

type ProjectTab = "overview" | "usage" | "chats";
type UsageSubtab = "plugins" | "models" | "tools" | "files";

interface ProjectChatRowProps {
  chat: ConversationSummary;
  pricingRules?: ModelPricingRule[];
  modelSignals?: Record<string, ModelAvailabilitySignal>;
  latestGlobalActivityMs?: number;
  isSubagent?: boolean;
  subagentCount?: number;
  isExpanded?: boolean;
  onToggleSubagents?: () => void;
  onSelect: (conversationId: string, stepIndex?: number) => void;
}

const ProjectChatRow: React.FC<ProjectChatRowProps> = ({
  chat,
  pricingRules = [],
  modelSignals,
  latestGlobalActivityMs = 0,
  isSubagent = false,
  subagentCount = 0,
  isExpanded = false,
  onToggleSubagents,
  onSelect
}) => {
  const cTok =
    chat.tokens.inputTokens +
    chat.tokens.cacheReadTokens +
    chat.tokens.outputTokens;
  const topSkillOrPlugin = chat.topPluginsSkills[0] || chat.skillsUsed[0] || "";

  return (
    <tr
      className={isSubagent ? "clickable subagent-row" : "clickable"}
      onClick={() => onSelect(chat.conversationId)}
    >
      <td style={isSubagent ? { paddingLeft: 22 } : undefined}>
        <div
          className="truncate"
          style={{
            maxWidth: 380,
            fontWeight: isSubagent ? 400 : 600
          }}
          title={chat.title}
        >
          {!isSubagent && chat.swarmRole === "coordinator" && (
            <span className="badge badge-swarm" style={{ marginRight: 6 }}>
              Swarm
            </span>
          )}
          {isSubagent && (
            <span
              className={
                chat.swarmRole === "worker" || chat.subagentType === "swarm"
                  ? "badge badge-swarm"
                  : "badge badge-info"
              }
              style={{ marginRight: 6 }}
            >
              {chat.swarmRole === "worker" || chat.subagentType === "swarm"
                ? `Swarm · ${chat.subagentRole || "worker"}`
                : chat.subagentRole || "Subagent"}
            </span>
          )}
          {chat.title}
        </div>
        <div
          className="cell-sub"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            marginTop: 2
          }}
        >
          <span>
            {fmtDateShort(chat.endedAtMs)} · {chat.turnCount} turns
            {topSkillOrPlugin ? ` · ${topSkillOrPlugin}` : ""}
          </span>
          <ModelInlinePill
            models={chat.models}
            breakdown={chat.modelBreakdown}
            pricingRules={pricingRules}
            modelSignals={modelSignals}
            latestGlobalActivityMs={latestGlobalActivityMs}
            maxWidth={190}
          />
          {subagentCount > 0 &&
            (onToggleSubagents ? (
              <button
                type="button"
                className={`subagent-toggle-btn ${chat.swarmRole === "coordinator" ? "is-swarm" : ""}`}
                aria-expanded={isExpanded}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSubagents();
                }}
              >
                <span aria-hidden="true">{isExpanded ? "▾" : "▸"}</span>
                +{subagentCount}{" "}
                {chat.swarmRole === "coordinator"
                  ? `worker${subagentCount === 1 ? "" : "s"}`
                  : "sub"}
              </button>
            ) : (
              <span
                className={
                  chat.swarmRole === "coordinator"
                    ? "badge badge-swarm"
                    : "badge badge-info"
                }
              >
                +{subagentCount}{" "}
                {chat.swarmRole === "coordinator"
                  ? `worker${subagentCount === 1 ? "" : "s"}`
                  : "sub"}
              </span>
            ))}
        </div>
      </td>
      <td className="text-right tabular">
        {chat.tokens.hasTokenTelemetry ? (
          <>
            <div className="metric-primary">{fmtK(cTok)}</div>
            <div className="cell-sub metric-cache">
              {fmtPct(chat.tokens.cacheHitRatio)} cache
            </div>
          </>
        ) : (
          <span className="cell-muted">N/A (legacy)</span>
        )}
      </td>
      <td className="text-right tabular">
        <div className="metric-primary">{fmtDuration(chat.time.activeMs)}</div>
      </td>
      <td className="text-right tabular">
        <CostCell
          estimatedCostUsd={chat.tokens.estimatedCostUsd}
          unpricedModels={chat.tokens.unpricedModels}
        />
      </td>
    </tr>
  );
};

interface ProjectChatsTableProps {
  groups: GroupedProjectChat[];
  pricingRules?: ModelPricingRule[];
  modelSignals?: Record<string, ModelAvailabilitySignal>;
  latestGlobalActivityMs?: number;
  expandedChatIds: Set<string>;
  onToggleGroup: (rootId: string) => void;
  onSelectChat: (conversationId: string, stepIndex?: number) => void;
}

const ProjectChatsTable: React.FC<ProjectChatsTableProps> = ({
  groups,
  pricingRules = [],
  modelSignals,
  latestGlobalActivityMs = 0,
  expandedChatIds,
  onToggleGroup,
  onSelectChat
}) => (
  <div className="table-wrap">
    <table className="data-table">
      <thead>
        <tr>
          <th scope="col">Chat</th>
          <th scope="col" className="text-right">Tokens &amp; Cache</th>
          <th scope="col" className="text-right">Active Time</th>
          <th scope="col" className="text-right">Est. Cost</th>
        </tr>
      </thead>
      <tbody>
        {groups.length === 0 ? (
          <tr>
            <td
              colSpan={4}
              style={{ color: "var(--txt-tertiary)", padding: 14 }}
            >
              No chats recorded for this project.
            </td>
          </tr>
        ) : (
          groups.map((g) => {
            const isExpanded = expandedChatIds.has(g.root.conversationId);
            return (
              <React.Fragment key={g.root.conversationId}>
                <ProjectChatRow
                  chat={g.root}
                  pricingRules={pricingRules}
                  modelSignals={modelSignals}
                  latestGlobalActivityMs={latestGlobalActivityMs}
                  subagentCount={g.subagents.length}
                  isExpanded={isExpanded}
                  onToggleSubagents={
                    g.subagents.length > 0
                      ? () => onToggleGroup(g.root.conversationId)
                      : undefined
                  }
                  onSelect={onSelectChat}
                />
                {isExpanded &&
                  g.subagents.map((sub) => (
                    <ProjectChatRow
                      key={sub.conversationId}
                      chat={sub}
                      pricingRules={pricingRules}
                      modelSignals={modelSignals}
                      latestGlobalActivityMs={latestGlobalActivityMs}
                      isSubagent
                      onSelect={onSelectChat}
                    />
                  ))}
              </React.Fragment>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

export const ProjectDetailView: React.FC<ProjectDetailProps> = ({
  detail,
  pricingRules = [],
  modelSignals,
  latestGlobalActivityMs = 0,
  canSendMessage = false,
  timeRange = "all",
  updatingRange = false,
  onTimeRangeChange,
  onSelectChat,
  onOpenFile,
  onOpenSettings,
  onTroubleshootPrompt
}) => {
  const [tab, setTab] = useState<ProjectTab>("overview");
  const [usageSubtab, setUsageSubtab] = useState<UsageSubtab>("plugins");
  const [expandedChatIds, setExpandedChatIds] = useState<Set<string>>(
    () => new Set()
  );
  const rawTabId = useId();
  const tabIdPrefix = `proj-tab-${rawTabId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const s = detail.summary;
  const totalTokens =
    s.tokens.inputTokens + s.tokens.cacheReadTokens + s.tokens.outputTokens;
  const effectiveTimeRange = fallbackProjectTimeRange(detail);
  const activeRangeLabel = rangeLongLabel(timeRange);
  const periodComparison = detail.periodComparison ?? null;
  const deltas = buildKpiDeltas(periodComparison, {
    chatCount: s.chatCount,
    totalTokens,
    hasTokenTelemetry: s.tokens.hasTokenTelemetry,
    cacheHitRatio: s.tokens.cacheHitRatio,
    activeMs: s.time.activeMs,
    estimatedCostUsd: s.tokens.estimatedCostUsd
  });

  const groupedChats = useMemo(
    () => groupProjectChats(detail.chats),
    [detail.chats]
  );

  const expandableIds = useMemo(
    () =>
      groupedChats
        .filter((g) => g.subagents.length > 0)
        .map((g) => g.root.conversationId),
    [groupedChats]
  );
  const allSubagentsExpanded =
    expandableIds.length > 0 &&
    expandableIds.every((id) => expandedChatIds.has(id));

  const toggleChatGroup = (rootId: string) => {
    setExpandedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) next.delete(rootId);
      else next.add(rootId);
      return next;
    });
  };

  const toggleAllSubagents = () => {
    if (allSubagentsExpanded) {
      setExpandedChatIds(new Set());
    } else {
      setExpandedChatIds(new Set(expandableIds));
    }
  };

  const projectTabs: Array<TabItem<ProjectTab>> = [
    { key: "overview", label: "Overview" },
    { key: "usage", label: "Usage" },
    { key: "chats", label: `Chats (${detail.chats.length})` }
  ];

  return (
    <div>
      <div style={{ marginTop: 10 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>{s.projectName}</h2>
        <div style={{ fontSize: 12, color: "var(--txt-tertiary)" }}>
          {s.projectPath}
        </div>
      </div>

      <TimeRangeBar
        value={timeRange}
        timeRange={effectiveTimeRange}
        hasActivity={detail.chats.length > 0}
        loading={updatingRange}
        onChange={(next) => onTimeRangeChange?.(next)}
      />

      <div
        className={updatingRange ? "is-range-updating" : undefined}
        aria-busy={updatingRange || undefined}
      >
        <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Chats</span>
            <KpiHelpTip helpKey="chatsSubagents" />
          </div>
          <div className="kpi-value">
            <span>{s.chatCount}</span>
            <span className="kpi-unit">(+{s.subagentCount} sub)</span>
            <DeltaPill
              text={deltas.chats.text}
              tone={deltas.chats.tone}
              tooltip={deltas.chats.tooltip}
            />
          </div>
          <div className="kpi-sub">
            {(s.swarmCount ?? 0) > 0 && (
              <span>
                {s.swarmCount} swarm{s.swarmCount === 1 ? "" : "s"} ·{" "}
              </span>
            )}
            {s.errorCount > 0
              ? `${s.errorCount} tool error${s.errorCount === 1 ? "" : "s"}`
              : "No tool errors"}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Total Tokens</span>
            <KpiHelpTip helpKey="totalTokens" />
          </div>
          <div className="kpi-value">
            <span>
              {detail.chats.length === 0
                ? "—"
                : s.tokens.hasTokenTelemetry
                  ? fmtK(totalTokens)
                  : "N/A (legacy)"}
            </span>
            <DeltaPill
              text={deltas.tokens.text}
              tone={deltas.tokens.tone}
              tooltip={deltas.tokens.tooltip}
            />
          </div>
          <div className="kpi-sub">
            {s.tokens.hasTokenTelemetry &&
            s.tokens.inputTokens + s.tokens.cacheReadTokens > 0 ? (
              <>
                <KpiStatusPill
                  kind="cacheHit"
                  ratio={s.tokens.cacheHitRatio}
                  pillLabel={`${fmtPct(s.tokens.cacheHitRatio)} cache hit`}
                  title="Prompt Cache Hit"
                  detail={`${fmtPct(s.tokens.cacheHitRatio)} of input context (${fmtK(s.tokens.cacheReadTokens)} cached ÷ ${fmtK(s.tokens.cacheReadTokens + s.tokens.inputTokens)} total input; output excluded) was served from prompt cache.`}
                />
                <DeltaPill
                  text={deltas.cacheHit.text}
                  tone={deltas.cacheHit.tone}
                  tooltip={deltas.cacheHit.tooltip}
                />
              </>
            ) : detail.chats.length === 0 ? (
              <span>No sessions in range</span>
            ) : s.tokens.hasTokenTelemetry ? (
              <span>No input tokens</span>
            ) : (
              <span>Legacy transcripts without token counters</span>
            )}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Active Time</span>
            <KpiHelpTip helpKey="activeAgentTime" />
          </div>
          <div className="kpi-value">
            <span>{fmtDuration(s.time.activeMs)}</span>
            <DeltaPill
              text={deltas.active.text}
              tone={deltas.active.tone}
              tooltip={deltas.active.tooltip}
            />
          </div>
          <div className="kpi-sub">
            {fmtDuration(s.time.userIdleMs)} idle excluded
          </div>
        </div>
        <ContextHealthCard
          contextHealth={s.contextHealth}
          hasAnyChats={detail.chats.length > 0}
          periodComparison={periodComparison}
        />
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Est. Cost</span>
            <KpiHelpTip helpKey="estCost" />
          </div>
          <div className="kpi-value">
            <span>
              {s.tokens.estimatedCostUsd === null &&
              s.tokens.unpricedModels.length === 0
                ? "—"
                : fmtUsdCompact(s.tokens.estimatedCostUsd)}
            </span>
            <DeltaPill
              text={deltas.cost.text}
              tone={deltas.cost.tone}
              tooltip={deltas.cost.tooltip}
            />
          </div>
          <div className="kpi-sub">
            {s.tokens.unpricedModels.length > 0 ? (
              <button
                type="button"
                className="kpi-warning-btn"
                onClick={onOpenSettings}
              >
                Set pricing
              </button>
            ) : s.tokens.cacheSavingsUsd !== null ? (
              `Saved ~${fmtUsdCompact(s.tokens.cacheSavingsUsd)}`
            ) : (
              "No rateable model"
            )}
          </div>
        </div>
      </div>

      {detail.chats.length === 0 && timeRange !== "all" && (
        <div className="panel range-empty-notice">
          <span>
            No activity in <strong>{s.projectName}</strong> for {activeRangeLabel.toLowerCase()}.
          </span>
          {onTimeRangeChange && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onTimeRangeChange("all")}
            >
              Show all time
            </button>
          )}
        </div>
      )}

      <TabStrip
        tabs={projectTabs}
        activeKey={tab}
        ariaLabel="Project sections"
        idPrefix={tabIdPrefix}
        onSelect={setTab}
      />

      <div role="tabpanel" aria-labelledby={`${tabIdPrefix}-${tab}`}>
        {tab === "overview" && (
          <div>
            {s.modelBreakdown.length > 0 && (
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Model Mix</span>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setUsageSubtab("models");
                      setTab("usage");
                    }}
                  >
                    View breakdown →
                  </button>
                </div>
                <div style={{ padding: "8px 12px" }}>
                  <ModelMixBar
                    breakdown={s.modelBreakdown}
                    pricingRules={pricingRules}
                    modelSignals={modelSignals}
                    latestGlobalActivityMs={latestGlobalActivityMs}
                    maxLabels={4}
                    compact
                  />
                </div>
              </div>
            )}

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="panel-title">Recent Chats</span>
                  {groupedChats.length > 0 && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        color: "var(--txt-tertiary)"
                      }}
                    >
                      {groupedChats.length} root · {s.subagentCount} subagents
                    </span>
                  )}
                </div>
                {detail.chats.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setTab("chats")}
                  >
                    View all ({detail.chats.length}) →
                  </button>
                )}
              </div>
              <ProjectChatsTable
                groups={groupedChats.slice(0, 5)}
                pricingRules={pricingRules}
                modelSignals={modelSignals}
                latestGlobalActivityMs={latestGlobalActivityMs}
                expandedChatIds={expandedChatIds}
                onToggleGroup={toggleChatGroup}
                onSelectChat={onSelectChat}
              />
            </div>

            {detail.pluginSkillMetrics.length > 0 && (
              <PluginSkillLeaderboard
                title="Top Plugins & Skills"
                metrics={detail.pluginSkillMetrics}
                defaultLimit={5}
                scopeLabel={`project "${s.projectName}"`}
                canSendMessage={canSendMessage}
                onSelectChat={onSelectChat}
                onTroubleshootPrompt={onTroubleshootPrompt}
                onViewAll={() => {
                  setUsageSubtab("plugins");
                  setTab("usage");
                }}
                viewAllLabel={`View all (${detail.pluginSkillMetrics.length}) →`}
              />
            )}
          </div>
        )}

        {tab === "usage" && (
          <div>
            <div className="subtab-bar" role="group" aria-label="Usage breakdown views">
              <button
                type="button"
                className={`basis-btn ${usageSubtab === "plugins" ? "active" : ""}`}
                onClick={() => setUsageSubtab("plugins")}
              >
                Plugins &amp; Skills ({detail.pluginSkillMetrics.length})
              </button>
              <button
                type="button"
                className={`basis-btn ${usageSubtab === "models" ? "active" : ""}`}
                onClick={() => setUsageSubtab("models")}
              >
                Models ({s.modelBreakdown.length})
              </button>
              <button
                type="button"
                className={`basis-btn ${usageSubtab === "tools" ? "active" : ""}`}
                onClick={() => setUsageSubtab("tools")}
              >
                Tools ({detail.skillToolMetrics.length})
              </button>
              <button
                type="button"
                className={`basis-btn ${usageSubtab === "files" ? "active" : ""}`}
                onClick={() => setUsageSubtab("files")}
              >
                Files ({detail.filesTouched.length})
              </button>
            </div>

            {usageSubtab === "plugins" && (
              <PluginSkillLeaderboard
                title="Plugins & Skills Impact"
                metrics={detail.pluginSkillMetrics}
                scopeLabel={`project "${s.projectName}"`}
                canSendMessage={canSendMessage}
                onSelectChat={onSelectChat}
                onTroubleshootPrompt={onTroubleshootPrompt}
              />
            )}

            {usageSubtab === "models" && (
              <ModelBreakdownPanel
                title="Project Model Breakdown"
                breakdown={s.modelBreakdown}
                pricingRules={pricingRules}
                modelSignals={modelSignals}
                latestGlobalActivityMs={latestGlobalActivityMs}
                unpricedModels={s.tokens.unpricedModels}
                showChatsColumn
                onOpenSettings={onOpenSettings}
              />
            )}

            {usageSubtab === "tools" && (
              <SkillToolMatrix
                metrics={detail.skillToolMetrics}
                scopeLabel={`project "${s.projectName}"`}
                canSendMessage={canSendMessage}
                onSelectChat={onSelectChat}
                onTroubleshootPrompt={onTroubleshootPrompt}
              />
            )}

            {usageSubtab === "files" && (
              <div className="panel">
                <div className="panel-caption">
                  Files touched in this project (<code>r</code> read · <code>e</code> edit · <code>c</code> create) — Context Carry is total tokens added and re-read in later steps.{onOpenFile ? " Click a path to open it." : ""}
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">File</th>
                        <th
                          scope="col"
                          className="text-right"
                          title="Counts of reads (r), edits (e), and creates (c)"
                        >
                          Touches
                        </th>
                        <th
                          scope="col"
                          className="text-right"
                          title="Total raw bytes returned when reading this file"
                        >
                          Read Size
                        </th>
                        <th
                          scope="col"
                          className="text-right"
                          title="Direct tokens from reading this file plus compounded cache re-reads across subsequent steps"
                        >
                          Context Carry
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.filesTouched.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            style={{ color: "var(--txt-tertiary)", padding: 14 }}
                          >
                            No file tool calls recorded for this project.
                          </td>
                        </tr>
                      ) : (
                        detail.filesTouched.map((f) => (
                          <tr key={f.path}>
                            <td>
                              {onOpenFile ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenFile(f.path)}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    color: "var(--txt-info)",
                                    textAlign: "left",
                                    fontFamily: "monospace"
                                  }}
                                >
                                  {f.path}
                                </button>
                              ) : (
                                <span style={{ fontFamily: "monospace" }}>
                                  {f.path}
                                </span>
                              )}
                            </td>
                            <td className="text-right tabular">
                              {[
                                f.reads > 0 ? `${f.reads}r` : "",
                                f.edits > 0 ? `${f.edits}e` : "",
                                f.creates > 0 ? `${f.creates}c` : ""
                              ]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </td>
                            <td className="text-right tabular">
                              {fmtBytes(f.totalBytesRead)}
                            </td>
                            <td className="text-right tabular">
                              +{fmtK(f.directTokens + f.compoundedCacheTokens)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "chats" && (
          <div className="panel">
            <div className="panel-header">
              <div>
                <span className="panel-title">Chats &amp; Subagents</span>
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: "var(--txt-tertiary)"
                  }}
                >
                  {groupedChats.length} root · {s.subagentCount} subagents
                </span>
              </div>
              {s.subagentCount > 0 && expandableIds.length > 0 && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={toggleAllSubagents}
                >
                  {allSubagentsExpanded
                    ? "Collapse all subagents"
                    : `Expand all subagents (${s.subagentCount})`}
                </button>
              )}
            </div>
            <ProjectChatsTable
              groups={groupedChats}
              expandedChatIds={expandedChatIds}
              onToggleGroup={toggleChatGroup}
              onSelectChat={onSelectChat}
            />
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
