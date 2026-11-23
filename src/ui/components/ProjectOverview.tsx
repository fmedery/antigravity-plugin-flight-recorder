import React, { useId, useMemo, useRef, useState } from "react";
import type {
  ConversationSummary,
  DashboardData,
  DiagnosticFinding,
  PluginSkillMetric,
  ProjectDetail,
  ProjectSummary
} from "../../shared/types";
import {
  fmtBytes,
  fmtDateShort,
  fmtDuration,
  fmtK,
  fmtPct,
  fmtUsd,
  groupProjectChats,
  selectTopDiagnostics
} from "../format";
import {
  ModelBreakdownPanel,
  ModelMixBar,
  type ModelShareBasis
} from "./ModelBreakdown";
import { PluginSkillLeaderboard } from "./PluginSkillLeaderboard";
import { KpiHelpTip } from "./KpiHelpTip";
import { SkillToolMatrix } from "./SkillToolMatrix";
import { WhyPanel } from "./WhyPanel";

interface AllProjectsProps {
  dashboard: DashboardData;
  canSendMessage?: boolean;
  onSelectProject: (projectPath: string) => void;
  onSelectChat: (conversationId: string, stepIndex?: number) => void;
  onOpenSettings: () => void;
  onOptimizeSkill?: (metric: PluginSkillMetric, prompt: string) => void;
}

type ProjectSort = "lastActivityMs" | "tokens" | "activeMs" | "chats";

export const AllProjectsView: React.FC<AllProjectsProps> = ({
  dashboard,
  canSendMessage = false,
  onSelectProject,
  onSelectChat,
  onOpenSettings,
  onOptimizeSkill
}) => {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<ProjectSort>("lastActivityMs");
  const [modelBasis, setModelBasis] = useState<ModelShareBasis>("tokens");

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

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Projects</span>
            <KpiHelpTip helpKey="projects" />
          </div>
          <div className="kpi-value">{tot.projectCount}</div>
          <div className="kpi-sub">
            {tot.chatCount} chats · {tot.subagentCount} subagents
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Total Tokens</span>
            <KpiHelpTip helpKey="totalTokens" />
          </div>
          <div className="kpi-value">{fmtK(grandTokens)}</div>
          <div className="kpi-sub">
            {fmtK(tot.tokens.cacheReadTokens)} cached · {fmtK(tot.tokens.inputTokens)} new ·{" "}
            {fmtK(tot.tokens.outputTokens)} out
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Cache Hit Ratio</span>
            <KpiHelpTip helpKey="cacheHitRatio" />
          </div>
          <div className="kpi-value" style={{ color: "var(--txt-success)" }}>
            {fmtPct(tot.tokens.cacheHitRatio)}
          </div>
          <div className="kpi-sub">
            {tot.tokens.cacheSavingsUsd !== null
              ? `Saved ~${fmtUsd(tot.tokens.cacheSavingsUsd)}`
              : `${fmtK(tot.tokens.cacheReadTokens)} cached`}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Active Agent Time</span>
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
          <div className="kpi-value">{fmtUsd(tot.tokens.estimatedCostUsd)}</div>
          <div className="kpi-sub">
            {tot.tokens.unpricedModels.length > 0 ? (
              <button
                type="button"
                className="btn btn-sm"
                onClick={onOpenSettings}
                style={{ padding: "1px 6px" }}
              >
                {tot.tokens.unpricedModels.length} unpriced model(s)
              </button>
            ) : (
              "All models priced"
            )}
          </div>
        </div>
      </div>

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

      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">All Tracked Projects</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Filter projects, models, plugins, skills..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="input-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProjectSort)}
            >
              <option value="lastActivityMs">Sort: Recent</option>
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
                <th>Project</th>
                <th className="text-right">Chats</th>
                <th>Model Mix</th>
                <th>Plugins &amp; Skills</th>
                <th className="text-right">Tokens</th>
                <th className="text-right">Cache</th>
                <th className="text-right">Active Time</th>
                <th className="text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ color: "var(--txt-tertiary)", padding: 14 }}>
                    No matching projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p: ProjectSummary) => {
                  const pTokens =
                    p.tokens.inputTokens +
                    p.tokens.cacheReadTokens +
                    p.tokens.outputTokens;
                  const badges = p.topPluginsSkills.slice(0, 4);

                  return (
                    <tr
                      key={p.projectPath}
                      className="clickable"
                      onClick={() => onSelectProject(p.projectPath)}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.projectName}</div>
                        <div
                          className="truncate"
                          style={{
                            maxWidth: 260,
                            fontSize: 12,
                            color: "var(--txt-tertiary)"
                          }}
                          title={p.projectPath}
                        >
                          {p.projectPath}
                        </div>
                      </td>
                      <td className="text-right tabular">
                        {p.chatCount}
                        {p.subagentCount > 0 && (
                          <span style={{ color: "var(--txt-tertiary)" }}>
                            {" "}
                            (+{p.subagentCount})
                          </span>
                        )}
                      </td>
                      <td style={{ minWidth: 200, maxWidth: 270 }}>
                        <ModelMixBar
                          breakdown={p.modelBreakdown}
                          basis={modelBasis}
                          maxLabels={3}
                          compact
                        />
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {badges.length > 0 ? (
                            badges.map((b) => (
                              <span key={b} className="badge badge-neutral">
                                {b}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: "var(--txt-tertiary)" }}>—</span>
                          )}
                        </div>
                      </td>
                      <td className="text-right tabular">
                        {p.tokens.hasTokenTelemetry ? fmtK(pTokens) : "N/A (legacy)"}
                      </td>
                      <td
                        className="text-right tabular"
                        style={{
                          color: p.tokens.hasTokenTelemetry
                            ? "var(--txt-success)"
                            : "var(--txt-tertiary)",
                          fontWeight: p.tokens.hasTokenTelemetry ? 600 : 400
                        }}
                      >
                        {p.tokens.hasTokenTelemetry ? fmtPct(p.tokens.cacheHitRatio) : "—"}
                      </td>
                      <td className="text-right tabular">
                        {fmtDuration(p.time.activeMs)}
                      </td>
                      <td className="text-right tabular">
                        {p.tokens.estimatedCostUsd === null ? (
                          <span className="badge badge-warning">Unpriced</span>
                        ) : (
                          <span>
                            {fmtUsd(p.tokens.estimatedCostUsd)}
                            {p.tokens.unpricedModels.length > 0 && (
                              <span
                                className="badge badge-warning"
                                style={{ marginLeft: 4 }}
                              >
                                +unpriced
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dashboard.pluginSkillMetrics.length > 0 && (
        <PluginSkillLeaderboard
          title="Plugins & Skills Impact (All Projects)"
          metrics={dashboard.pluginSkillMetrics}
          showProjectsColumn
          defaultLimit={8}
          scopeLabel="all tracked projects"
          canSendMessage={canSendMessage}
          onSelectChat={onSelectChat}
          onOptimizeSkill={onOptimizeSkill}
        />
      )}

      {dashboard.recentChats.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Recent Chats Across All Projects</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Chat</th>
                  <th>Project</th>
                  <th className="text-right">Tokens</th>
                  <th className="text-right">Cache</th>
                  <th className="text-right">Active</th>
                  <th className="text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentChats.slice(0, 12).map((c: ConversationSummary) => {
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
                          style={{ maxWidth: 320, fontWeight: 500 }}
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
                      </td>
                      <td>
                        <span className="badge badge-neutral">{c.projectName}</span>
                      </td>
                      <td className="text-right tabular">
                        {c.tokens.hasTokenTelemetry ? fmtK(cTok) : "N/A (legacy)"}
                      </td>
                      <td className="text-right tabular">
                        {c.tokens.hasTokenTelemetry ? fmtPct(c.tokens.cacheHitRatio) : "—"}
                      </td>
                      <td className="text-right tabular">
                        {fmtDuration(c.time.activeMs)}
                      </td>
                      <td
                        className="text-right tabular"
                        style={{ color: "var(--txt-tertiary)" }}
                      >
                        {fmtDateShort(c.endedAtMs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProjectDetailProps {
  detail: ProjectDetail;
  canSendMessage?: boolean;
  onSelectChat: (conversationId: string, stepIndex?: number) => void;
  onOpenFile?: (filePath: string) => void;
  onOpenSettings: () => void;
  onAskAgent?: (finding: DiagnosticFinding) => void;
  onOptimizeSkill?: (metric: PluginSkillMetric, prompt: string) => void;
  onTroubleshootPrompt?: (prompt: string) => void;
}

type ProjectTab =
  | "overview"
  | "plugins"
  | "why"
  | "chats"
  | "models"
  | "skills"
  | "files";

interface ProjectChatRowProps {
  chat: ConversationSummary;
  isSubagent?: boolean;
  subagentCount?: number;
  isExpanded?: boolean;
  onToggleSubagents?: () => void;
  onSelect: (conversationId: string) => void;
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
  const skillBadges = (
    chat.topPluginsSkills.length > 0 ? chat.topPluginsSkills : chat.skillsUsed
  ).slice(0, 2);

  return (
    <tr
      className={isSubagent ? "clickable subagent-row" : "clickable"}
      onClick={() => onSelect(chat.conversationId)}
    >
      <td style={isSubagent ? { paddingLeft: 22 } : undefined}>
        <div
          className="truncate"
          style={{
            maxWidth: 320,
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
          style={{
            fontSize: 12,
            color: "var(--txt-tertiary)",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            marginTop: 2
          }}
        >
          <span>
            {fmtDateShort(chat.endedAtMs)} · {chat.surface}
            {chat.hasLiveHooks ? " · live hooks" : ""}
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
      <td style={{ minWidth: 190, maxWidth: 260 }}>
        {skillBadges.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 4
            }}
            title={
              chat.skillsUsed.length > 0
                ? `Skills loaded: ${chat.skillsUsed.join(", ")}`
                : undefined
            }
          >
            {skillBadges.map((sk) => (
              <span key={sk} className="badge badge-warning">
                {sk}
              </span>
            ))}
          </div>
        )}
        {chat.modelBreakdown.length > 0 ? (
          <ModelMixBar breakdown={chat.modelBreakdown} maxLabels={2} compact />
        ) : (
          chat.models.slice(0, 1).map((m) => (
            <span key={m} className="badge badge-neutral">
              {m}
            </span>
          ))
        )}
      </td>
      <td className="text-right tabular">{chat.turnCount}</td>
      <td className="text-right tabular">
        {chat.tokens.hasTokenTelemetry ? fmtK(cTok) : "N/A (legacy)"}
      </td>
      <td className="text-right tabular">
        {chat.tokens.hasTokenTelemetry ? fmtPct(chat.tokens.cacheHitRatio) : "—"}
      </td>
      <td className="text-right tabular">{fmtDuration(chat.time.activeMs)}</td>
      <td className="text-right tabular">
        {fmtUsd(chat.tokens.estimatedCostUsd)}
      </td>
    </tr>
  );
};

export const ProjectDetailView: React.FC<ProjectDetailProps> = ({
  detail,
  canSendMessage = false,
  onSelectChat,
  onOpenFile,
  onOpenSettings,
  onAskAgent,
  onOptimizeSkill,
  onTroubleshootPrompt
}) => {
  const [tab, setTab] = useState<ProjectTab>("overview");
  const [expandedChatIds, setExpandedChatIds] = useState<Set<string>>(
    () => new Set()
  );
  const rawTabId = useId();
  const tabIdPrefix = `proj-tab-${rawTabId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const tabRefs = useRef<Partial<Record<ProjectTab, HTMLButtonElement | null>>>(
    {}
  );

  const supportsFocusGroup =
    typeof HTMLElement !== "undefined" &&
    Object.hasOwn(HTMLElement.prototype, "focusGroup");

  const s = detail.summary;
  const totalTokens =
    s.tokens.inputTokens + s.tokens.cacheReadTokens + s.tokens.outputTokens;

  const groupedChats = useMemo(
    () => groupProjectChats(detail.chats),
    [detail.chats]
  );
  const topFindings = useMemo(
    () => selectTopDiagnostics(detail.diagnostics, 3),
    [detail.diagnostics]
  );
  const diagnosticCounts = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let info = 0;
    for (const d of detail.diagnostics) {
      if (d.severity === "critical") critical += 1;
      else if (d.severity === "warning") warning += 1;
      else info += 1;
    }
    return { critical, warning, info };
  }, [detail.diagnostics]);

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

  const projectTabs: Array<{ key: ProjectTab; label: string }> = [
    { key: "overview", label: "Overview" },
    {
      key: "plugins",
      label: `Plugins & Skills (${detail.pluginSkillMetrics.length})`
    },
    {
      key: "why",
      label: `Why & Bottlenecks (${detail.diagnostics.length})`
    },
    { key: "chats", label: `Chats & Tasks (${detail.chats.length})` },
    { key: "models", label: `Models (${s.modelBreakdown.length})` },
    { key: "skills", label: `All Tools (${detail.skillToolMetrics.length})` },
    { key: "files", label: `Files Touched (${detail.filesTouched.length})` }
  ];

  const selectTab = (next: ProjectTab, focusButton = false) => {
    setTab(next);
    const el = tabRefs.current[next];
    if (el) {
      if (focusButton) el.focus();
      try {
        el.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          container: "nearest"
        } as ScrollIntoViewOptions & { container?: string });
      } catch {
        el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
      }
    }
  };

  return (
    <div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 16 }}>{s.projectName}</h2>
          <div style={{ fontSize: 12, color: "var(--txt-tertiary)" }}>
            {s.projectPath}
          </div>
        </div>
        {s.modelBreakdown.length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {s.models.map((m) => (
              <span
                key={m}
                className={`badge ${
                  s.tokens.unpricedModels.includes(m)
                    ? "badge-warning"
                    : "badge-neutral"
                }`}
              >
                {m}
                {s.tokens.unpricedModels.includes(m) ? " (Unpriced)" : ""}
              </span>
            ))}
          </div>
        )}
      </div>

      {s.modelBreakdown.length > 0 && (
        <div className="panel" style={{ padding: "8px 12px" }}>
          <ModelMixBar
            breakdown={s.modelBreakdown}
            maxLabels={s.modelBreakdown.length}
          />
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Chats &amp; Subagents</span>
            <KpiHelpTip helpKey="chatsSubagents" />
          </div>
          <div className="kpi-value">
            {s.chatCount}{" "}
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--txt-secondary)" }}>
              (+{s.subagentCount} sub)
            </span>
          </div>
          <div className="kpi-sub">
            {s.slashCommands.join(" ") || "No slash commands"}
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
              ? `Peak ${fmtK(s.tokens.peakContextTokens)} · ${fmtPct(s.tokens.cacheHitRatio)} cache`
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
            {s.time.subagentMs > 0
              ? `${fmtDuration(s.time.subagentMs)} agent-time across ${s.subagentCount} subagents · `
              : ""}
            {s.time.parallelismFactor}x tool parallel · {fmtDuration(s.time.userIdleMs)} idle
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Est. Cost</span>
            <KpiHelpTip helpKey="estCost" />
          </div>
          <div className="kpi-value">{fmtUsd(s.tokens.estimatedCostUsd)}</div>
          <div className="kpi-sub">
            {s.tokens.unpricedModels.length > 0 ? (
              <button
                type="button"
                className="btn btn-sm"
                onClick={onOpenSettings}
                style={{ padding: "1px 6px" }}
              >
                Set pricing
              </button>
            ) : (
              `Saved ~${fmtUsd(s.tokens.cacheSavingsUsd)}`
            )}
          </div>
        </div>
      </div>

      <div
        className="tab-strip"
        role="tablist"
        aria-label="Project sections"
        {...({ focusgroup: "tablist nomemory" } as Record<string, string>)}
      >
        {projectTabs.map((t, idx) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              ref={(el) => {
                tabRefs.current[t.key] = el;
              }}
              type="button"
              role="tab"
              id={`${tabIdPrefix}-${t.key}`}
              aria-selected={isActive}
              className={`tab-pill ${isActive ? "active" : ""}`}
              tabIndex={supportsFocusGroup ? undefined : isActive ? 0 : -1}
              {...(isActive
                ? ({ focusgroupstart: "" } as Record<string, string>)
                : {})}
              onClick={() => selectTab(t.key)}
              onFocus={() => {
                if (tab !== t.key) selectTab(t.key);
              }}
              onKeyDown={(e) => {
                if (supportsFocusGroup) return;
                let targetIdx: number | null = null;
                if (e.key === "ArrowRight") {
                  targetIdx = (idx + 1) % projectTabs.length;
                } else if (e.key === "ArrowLeft") {
                  targetIdx =
                    (idx - 1 + projectTabs.length) % projectTabs.length;
                } else if (e.key === "Home") {
                  targetIdx = 0;
                } else if (e.key === "End") {
                  targetIdx = projectTabs.length - 1;
                }
                if (targetIdx !== null) {
                  e.preventDefault();
                  selectTab(projectTabs[targetIdx].key, true);
                }
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" aria-labelledby={`${tabIdPrefix}-${tab}`}>
        {tab === "overview" && (
          <div>
            <div className="panel">
              <div className="panel-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6
                  }}
                >
                  <span className="panel-title">
                    Top Bottlenecks &amp; Diagnostics
                  </span>
                  {diagnosticCounts.critical > 0 && (
                    <span className="badge badge-danger">
                      {diagnosticCounts.critical} critical
                    </span>
                  )}
                  {diagnosticCounts.warning > 0 && (
                    <span className="badge badge-warning">
                      {diagnosticCounts.warning} warning
                    </span>
                  )}
                  {diagnosticCounts.info > 0 && (
                    <span className="badge badge-info">
                      {diagnosticCounts.info} info
                    </span>
                  )}
                  {detail.diagnostics.length > topFindings.length && (
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--txt-tertiary)"
                      }}
                    >
                      Showing top {topFindings.length} of{" "}
                      {detail.diagnostics.length}
                    </span>
                  )}
                </div>
                {detail.diagnostics.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => selectTab("why")}
                  >
                    View all {detail.diagnostics.length} →
                  </button>
                )}
              </div>
              <WhyPanel
                embedded
                findings={topFindings}
                canSendMessage={canSendMessage}
                onAskAgent={onAskAgent}
                emptyMessage="No notable token spikes, cache misses, or slow bottlenecks detected in this project."
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
                onViewAll={() => selectTab("plugins")}
                viewAllLabel={`View all (${detail.pluginSkillMetrics.length}) →`}
              />
            )}

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="panel-title">Root Chats</span>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 12,
                      color: "var(--txt-tertiary)"
                    }}
                  >
                    {groupedChats.length} root chat
                    {groupedChats.length === 1 ? "" : "s"}
                    {s.subagentCount > 0
                      ? ` · ${s.subagentCount} subagents nested`
                      : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => selectTab("chats")}
                >
                  View all {detail.chats.length} chats &amp; tasks →
                </button>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Chat</th>
                      <th>Skills &amp; Models</th>
                      <th className="text-right">Turns</th>
                      <th className="text-right">Tokens</th>
                      <th className="text-right">Cache</th>
                      <th className="text-right">Active</th>
                      <th className="text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedChats.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{ color: "var(--txt-tertiary)", padding: 14 }}
                        >
                          No chats recorded for this project.
                        </td>
                      </tr>
                    ) : (
                      groupedChats
                        .slice(0, 5)
                        .map((g) => (
                          <ProjectChatRow
                            key={g.root.conversationId}
                            chat={g.root}
                            subagentCount={g.subagents.length}
                            onSelect={onSelectChat}
                          />
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Chat / Subagent</th>
                    <th>Skills &amp; Models</th>
                    <th className="text-right">Turns</th>
                    <th className="text-right">Tokens</th>
                    <th className="text-right">Cache</th>
                    <th className="text-right">Active</th>
                    <th className="text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedChats.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ color: "var(--txt-tertiary)", padding: 14 }}
                      >
                        No chats recorded for this project.
                      </td>
                    </tr>
                  ) : (
                    groupedChats.map((g) => {
                      const isExpanded = expandedChatIds.has(
                        g.root.conversationId
                      );
                      return (
                        <React.Fragment key={g.root.conversationId}>
                          <ProjectChatRow
                            chat={g.root}
                            subagentCount={g.subagents.length}
                            isExpanded={isExpanded}
                            onToggleSubagents={
                              g.subagents.length > 0
                                ? () => toggleChatGroup(g.root.conversationId)
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
          </div>
        )}

        {tab === "models" && (
          <ModelBreakdownPanel
            title="Project Model Breakdown"
            breakdown={s.modelBreakdown}
            unpricedModels={s.tokens.unpricedModels}
            showChatsColumn
            onOpenSettings={onOpenSettings}
          />
        )}

        {tab === "plugins" && (
          <PluginSkillLeaderboard
            title="Plugins & Skills Impact"
            metrics={detail.pluginSkillMetrics}
            scopeLabel={`project "${s.projectName}"`}
            canSendMessage={canSendMessage}
            onSelectChat={onSelectChat}
            onOptimizeSkill={onOptimizeSkill}
          />
        )}

        {tab === "skills" && (
          <SkillToolMatrix
            metrics={detail.skillToolMetrics}
            scopeLabel={`project "${s.projectName}"`}
            canSendMessage={canSendMessage}
            onSelectChat={onSelectChat}
            onTroubleshootPrompt={onTroubleshootPrompt}
          />
        )}

        {tab === "files" && (
          <div className="panel">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>File Path</th>
                    <th className="text-right">Reads</th>
                    <th className="text-right">Edits</th>
                    <th className="text-right">Creates</th>
                    <th className="text-right">Bytes Read</th>
                    <th className="text-right">Direct + Cache Carry</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.filesTouched.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
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
                        <td className="text-right tabular">{f.reads}</td>
                        <td className="text-right tabular">{f.edits}</td>
                        <td className="text-right tabular">{f.creates}</td>
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

        {tab === "why" && (
          <WhyPanel
            findings={detail.diagnostics}
            canSendMessage={canSendMessage}
            onAskAgent={onAskAgent}
          />
        )}
      </div>
    </div>
  );
};
