import React, { useMemo, useState } from "react";
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
  fmtUsd
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
  onSelectChat: (conversationId: string) => void;
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
  onSelectChat: (conversationId: string) => void;
  onOpenFile?: (filePath: string) => void;
  onOpenSettings: () => void;
  onAskAgent?: (finding: DiagnosticFinding) => void;
  onOptimizeSkill?: (metric: PluginSkillMetric, prompt: string) => void;
}

type ProjectTab = "overview" | "chats" | "models" | "plugins" | "skills" | "files";

export const ProjectDetailView: React.FC<ProjectDetailProps> = ({
  detail,
  canSendMessage = false,
  onSelectChat,
  onOpenFile,
  onOpenSettings,
  onAskAgent,
  onOptimizeSkill
}) => {
  const [tab, setTab] = useState<ProjectTab>("chats");
  const s = detail.summary;
  const totalTokens =
    s.tokens.inputTokens + s.tokens.cacheReadTokens + s.tokens.outputTokens;

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

      <div className="tab-strip">
        <button
          type="button"
          className={`tab-pill ${tab === "chats" ? "active" : ""}`}
          onClick={() => setTab("chats")}
        >
          Chats &amp; Tasks ({detail.chats.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === "models" ? "active" : ""}`}
          onClick={() => setTab("models")}
        >
          Models ({s.modelBreakdown.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === "plugins" ? "active" : ""}`}
          onClick={() => setTab("plugins")}
        >
          Plugins &amp; Skills ({detail.pluginSkillMetrics.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === "skills" ? "active" : ""}`}
          onClick={() => setTab("skills")}
        >
          All Tools ({detail.skillToolMetrics.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === "files" ? "active" : ""}`}
          onClick={() => setTab("files")}
        >
          Files Touched ({detail.filesTouched.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === "overview" ? "active" : ""}`}
          onClick={() => setTab("overview")}
        >
          Why &amp; Bottlenecks ({detail.diagnostics.length})
        </button>
      </div>

      {tab === "chats" && (
        <div className="panel">
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
                {detail.chats.map((c) => {
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
                          style={{
                            maxWidth: 320,
                            fontWeight: c.parentConversationId ? 400 : 600,
                            paddingLeft: c.parentConversationId ? 14 : 0
                          }}
                          title={c.title}
                        >
                          {c.parentConversationId && (
                            <span
                              className="badge badge-info"
                              style={{ marginRight: 6 }}
                            >
                              {c.subagentRole || "Subagent"}
                            </span>
                          )}
                          {c.title}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--txt-tertiary)" }}>
                          {fmtDateShort(c.endedAtMs)} · {c.surface}
                          {c.hasLiveHooks ? " · live hooks" : ""}
                        </div>
                      </td>
                      <td style={{ minWidth: 190, maxWidth: 260 }}>
                        {(c.topPluginsSkills.length > 0 || c.skillsUsed.length > 0) && (
                          <div
                            style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}
                            title={
                              c.skillsUsed.length > 0
                                ? `Skills loaded: ${c.skillsUsed.join(", ")}`
                                : undefined
                            }
                          >
                            {(c.topPluginsSkills.length > 0
                              ? c.topPluginsSkills
                              : c.skillsUsed
                            )
                              .slice(0, 2)
                              .map((sk) => (
                                <span key={sk} className="badge badge-warning">
                                  {sk}
                                </span>
                              ))}
                          </div>
                        )}
                        {c.modelBreakdown.length > 0 ? (
                          <ModelMixBar breakdown={c.modelBreakdown} maxLabels={2} compact />
                        ) : (
                          c.models.slice(0, 1).map((m) => (
                            <span key={m} className="badge badge-neutral">
                              {m}
                            </span>
                          ))
                        )}
                      </td>
                      <td className="text-right tabular">{c.turnCount}</td>
                      <td className="text-right tabular">
                        {c.tokens.hasTokenTelemetry ? fmtK(cTok) : "N/A (legacy)"}
                      </td>
                      <td className="text-right tabular">
                        {c.tokens.hasTokenTelemetry ? fmtPct(c.tokens.cacheHitRatio) : "—"}
                      </td>
                      <td className="text-right tabular">
                        {fmtDuration(c.time.activeMs)}
                      </td>
                      <td className="text-right tabular">
                        {fmtUsd(c.tokens.estimatedCostUsd)}
                      </td>
                    </tr>
                  );
                })}
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
          onOptimizeSkill={onOptimizeSkill}
        />
      )}

      {tab === "skills" && <SkillToolMatrix metrics={detail.skillToolMetrics} />}

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
                    <td colSpan={6} style={{ color: "var(--txt-tertiary)", padding: 14 }}>
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
                          <span style={{ fontFamily: "monospace" }}>{f.path}</span>
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

      {tab === "overview" && (
        <WhyPanel
          findings={detail.diagnostics}
          canSendMessage={canSendMessage}
          onAskAgent={onAskAgent}
        />
      )}
    </div>
  );
};
