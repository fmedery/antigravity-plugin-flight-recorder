import React, { useId, useMemo, useState } from "react";
import { TIME_RANGE_PRESETS } from "../../shared/timeRange.js";
import type {
  ConversationSummary,
  DashboardData,
  PluginSkillMetric,
  ProjectDetail,
  ProjectSummary,
  TimeRangePreset,
  TimeRangeWindow
} from "../../shared/types";
import {
  fmtBytes,
  fmtDateShort,
  fmtDuration,
  fmtK,
  fmtPct,
  fmtUsdCompact,
  groupProjectChats,
  type GroupedProjectChat
} from "../format";
import { CostCell } from "./CostCell";
import { KpiHelpTip } from "./KpiHelpTip";
import {
  ModelBreakdownPanel,
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

interface AllProjectsProps {
  dashboard: DashboardData;
  canSendMessage?: boolean;
  timeRange?: TimeRangePreset;
  updatingRange?: boolean;
  onTimeRangeChange?: (preset: TimeRangePreset) => void;
  onSelectProject: (projectPath: string) => void;
  onSelectChat: (conversationId: string, stepIndex?: number) => void;
  onOpenSettings: () => void;
  onOptimizeSkill?: (metric: PluginSkillMetric, prompt: string) => void;
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
  onOptimizeSkill
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
            p.topTools.some((t) => t.toLowerCase().includes(q))
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
            {tot.chatCount} chats (+{tot.subagentCount} sub)
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Total Tokens</span>
            <KpiHelpTip helpKey="totalTokens" />
          </div>
          <div className="kpi-value">{fmtK(grandTokens)}</div>
          <div className="kpi-sub">
            <span style={{ color: "var(--txt-success)", fontWeight: 600 }}>
              {fmtPct(tot.tokens.cacheHitRatio)} cache hit
            </span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Active Time</span>
            <KpiHelpTip helpKey="activeAgentTime" />
          </div>
          <div className="kpi-value">{fmtDuration(tot.time.activeMs)}</div>
          <div className="kpi-sub">
            {fmtDuration(tot.time.modelMs)} model · {fmtDuration(tot.time.toolWallMs)} tools
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Est. Cost</span>
            <KpiHelpTip helpKey="estCost" />
          </div>
          <div className="kpi-value">{fmtUsdCompact(tot.tokens.estimatedCostUsd)}</div>
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
                            {p.subagentCount > 0 && (
                              <div className="cell-sub">+{p.subagentCount} sub</div>
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
                onOptimizeSkill={onOptimizeSkill}
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
                              {c.parentConversationId && (
                                <span
                                  className="badge badge-info"
                                  style={{ marginRight: 6 }}
                                >
                                  Subagent
                                </span>
                              )}
                              {c.title}
                            </div>
                            <div className="cell-sub">{c.projectName}</div>
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
  canSendMessage?: boolean;
  timeRange?: TimeRangePreset;
  updatingRange?: boolean;
  onTimeRangeChange?: (preset: TimeRangePreset) => void;
  onSelectChat: (conversationId: string, stepIndex?: number) => void;
  onOpenFile?: (filePath: string) => void;
  onOpenSettings: () => void;
  onOptimizeSkill?: (metric: PluginSkillMetric, prompt: string) => void;
  onTroubleshootPrompt?: (prompt: string) => void;
}

type ProjectTab = "overview" | "usage" | "chats";
type UsageSubtab = "plugins" | "models" | "tools" | "files";

interface ProjectChatRowProps {
  chat: ConversationSummary;
  isSubagent?: boolean;
  subagentCount?: number;
  isExpanded?: boolean;
  onToggleSubagents?: () => void;
  onSelect: (conversationId: string, stepIndex?: number) => void;
}

const ProjectChatRow: React.FC<ProjectChatRowProps> = ({
  chat,
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
  const topDriver =
    chat.topPluginsSkills[0] || chat.skillsUsed[0] || chat.models[0] || "";

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
          {isSubagent && (
            <span className="badge badge-info" style={{ marginRight: 6 }}>
              {chat.subagentRole || "Subagent"}
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
            {topDriver ? ` · ${topDriver}` : ""}
          </span>
          {subagentCount > 0 &&
            (onToggleSubagents ? (
              <button
                type="button"
                className="subagent-toggle-btn"
                aria-expanded={isExpanded}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSubagents();
                }}
              >
                <span aria-hidden="true">{isExpanded ? "▾" : "▸"}</span>
                +{subagentCount} sub
              </button>
            ) : (
              <span className="badge badge-info">+{subagentCount} sub</span>
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
  expandedChatIds: Set<string>;
  onToggleGroup: (rootId: string) => void;
  onSelectChat: (conversationId: string, stepIndex?: number) => void;
}

const ProjectChatsTable: React.FC<ProjectChatsTableProps> = ({
  groups,
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
  canSendMessage = false,
  timeRange = "all",
  updatingRange = false,
  onTimeRangeChange,
  onSelectChat,
  onOpenFile,
  onOpenSettings,
  onOptimizeSkill,
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
            {s.chatCount}{" "}
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--txt-secondary)" }}>
              (+{s.subagentCount} sub)
            </span>
          </div>
          <div className="kpi-sub">
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
            {s.tokens.hasTokenTelemetry ? fmtK(totalTokens) : "N/A (legacy)"}
          </div>
          <div className="kpi-sub">
            {s.tokens.hasTokenTelemetry
              ? `${fmtPct(s.tokens.cacheHitRatio)} cache · Peak ${fmtK(s.tokens.peakContextTokens)}`
              : "Legacy transcripts without token counters"}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Active Time</span>
            <KpiHelpTip helpKey="activeAgentTime" />
          </div>
          <div className="kpi-value">{fmtDuration(s.time.activeMs)}</div>
          <div className="kpi-sub">
            {fmtDuration(s.time.userIdleMs)} idle excluded
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Est. Cost</span>
            <KpiHelpTip helpKey="estCost" />
          </div>
          <div className="kpi-value">{fmtUsdCompact(s.tokens.estimatedCostUsd)}</div>
          <div className="kpi-sub">
            {s.tokens.unpricedModels.length > 0 ? (
              <button
                type="button"
                className="kpi-warning-btn"
                onClick={onOpenSettings}
              >
                Set pricing
              </button>
            ) : (
              `Saved ~${fmtUsdCompact(s.tokens.cacheSavingsUsd)}`
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
                  <ModelMixBar breakdown={s.modelBreakdown} maxLabels={4} compact />
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
                onOptimizeSkill={onOptimizeSkill}
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
                onOptimizeSkill={onOptimizeSkill}
              />
            )}

            {usageSubtab === "models" && (
              <ModelBreakdownPanel
                title="Project Model Breakdown"
                breakdown={s.modelBreakdown}
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
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col">File</th>
                        <th scope="col" className="text-right">Touches</th>
                        <th scope="col" className="text-right">Read Size</th>
                        <th scope="col" className="text-right">Context Carry</th>
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
