import React, { useEffect, useId, useMemo, useState } from "react";
import type {
  ConversationDetail,
  DiagnosticFinding,
  PluginSkillMetric
} from "../../shared/types";
import { fmtDuration, fmtK, fmtPct, fmtUsd } from "../format";
import { KpiHelpTip } from "./KpiHelpTip";
import { ModelBreakdownPanel } from "./ModelBreakdown";
import { PluginSkillLeaderboard } from "./PluginSkillLeaderboard";
import { SkillToolMatrix } from "./SkillToolMatrix";
import { TabStrip, type TabItem } from "./TabStrip";
import { TimelineWaterfall } from "./TimelineWaterfall";
import { TokenBreakdownChart } from "./TokenBreakdownChart";
import { WhyPanel } from "./WhyPanel";

interface Props {
  detail: ConversationDetail;
  knownProjects: string[];
  canSendMessage: boolean;
  initialHighlightStep?: number | null;
  onAssignProject: (conversationId: string, projectPath: string) => Promise<void>;
  onSelectChat: (conversationId: string, stepIndex?: number) => void;
  onOpenSettings: () => void;
  onAskAgent: (finding: DiagnosticFinding) => void;
  onOptimizeSkill?: (metric: PluginSkillMetric, prompt: string) => void;
  onTroubleshootPrompt?: (prompt: string) => void;
}

type ChatTab = "timeline" | "issues" | "tokens" | "plugins";
type PluginsToolsSubtab = "plugins" | "tools";

export const ChatDetailView: React.FC<Props> = ({
  detail,
  knownProjects,
  canSendMessage,
  initialHighlightStep = null,
  onAssignProject,
  onSelectChat,
  onOpenSettings,
  onAskAgent,
  onOptimizeSkill,
  onTroubleshootPrompt
}) => {
  const [tab, setTab] = useState<ChatTab>("timeline");
  const [pluginsSubtab, setPluginsSubtab] =
    useState<PluginsToolsSubtab>("plugins");
  const [highlightStep, setHighlightStep] = useState<number | null>(
    initialHighlightStep
  );
  const [editingProj, setEditingProj] = useState(false);
  const [projInput, setProjInput] = useState(detail.summary.projectPath);
  const [showSubagents, setShowSubagents] = useState(false);

  const rawTabId = useId();
  const tabIdPrefix = `chat-tab-${rawTabId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    if (initialHighlightStep !== undefined && initialHighlightStep !== null) {
      setHighlightStep(initialHighlightStep);
      setTab("timeline");
    }
  }, [initialHighlightStep]);

  const subagentTotals = useMemo(() => {
    const subs = detail.subagents;
    let totalActiveMs = 0;
    let totalTokens = 0;
    let hasTokenTelemetry = false;

    for (const sub of subs) {
      totalTokens +=
        sub.tokens.inputTokens +
        sub.tokens.cacheReadTokens +
        sub.tokens.outputTokens;
      totalActiveMs += sub.time.activeMs;
      if (sub.tokens.hasTokenTelemetry) hasTokenTelemetry = true;
    }

    return {
      count: subs.length,
      totalTokens,
      hasTokenTelemetry,
      totalActiveMs
    };
  }, [detail.subagents]);

  const s = detail.summary;
  const totalTokens =
    s.tokens.inputTokens + s.tokens.cacheReadTokens + s.tokens.outputTokens;

  const handleSaveProject = async () => {
    await onAssignProject(s.conversationId, projInput);
    setEditingProj(false);
  };

  const chatTabs: Array<TabItem<ChatTab>> = [
    { key: "timeline", label: "Timeline" },
    { key: "issues", label: `Issues (${detail.diagnostics.length})` },
    { key: "tokens", label: "Tokens & Models" },
    { key: "plugins", label: "Plugins & Tools" }
  ];

  const jumpToTimelineStep = (stepIdx: number) => {
    setHighlightStep(stepIdx);
    setTab("timeline");
  };

  return (
    <div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>{s.title}</h2>
            {s.slashCommands.map((cmd) => (
              <span key={cmd} className="badge badge-info">
                {cmd}
              </span>
            ))}
            {s.hasLiveHooks && (
              <span className="badge badge-success">Live Hooks</span>
            )}
            {detail.subagents.length > 0 && (
              <button
                type="button"
                className="subagent-toggle-btn"
                aria-expanded={showSubagents}
                onClick={() => setShowSubagents((v) => !v)}
              >
                +{detail.subagents.length} subagent
                {detail.subagents.length === 1 ? "" : "s"}{" "}
                <span aria-hidden="true">{showSubagents ? "▾" : "▸"}</span>
              </button>
            )}
          </div>

          <div
            style={{
              marginTop: 4,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "var(--txt-secondary)"
            }}
          >
            <span>
              Project: <strong>{s.projectName}</strong> ({s.projectSource})
            </span>
            {!editingProj ? (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  setProjInput(s.projectPath);
                  setEditingProj(true);
                }}
              >
                Reassign
              </button>
            ) : (
              <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                <input
                  type="text"
                  list="tracker-projects-list"
                  className="input-field input-field-sm"
                  style={{ width: 220 }}
                  value={projInput}
                  onChange={(e) => setProjInput(e.target.value)}
                />
                <datalist id="tracker-projects-list">
                  {knownProjects.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={handleSaveProject}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setEditingProj(false)}
                >
                  Cancel
                </button>
              </span>
            )}
            <span style={{ color: "var(--txt-tertiary)" }}>
              ID: {s.conversationId.slice(0, 8)}…
            </span>
          </div>
        </div>
      </div>

      {showSubagents && detail.subagents.length > 0 && (
        <div className="panel" style={{ padding: "8px 12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 6,
              fontSize: 12
            }}
          >
            <strong>
              Spawned Subagents ({subagentTotals.count} ·{" "}
              {fmtDuration(subagentTotals.totalActiveMs)}
              {subagentTotals.hasTokenTelemetry
                ? ` · ${fmtK(subagentTotals.totalTokens)} tok`
                : ""}
              )
            </strong>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              maxHeight: 180,
              overflowY: "auto"
            }}
          >
            {detail.subagents.map((sub) => (
              <button
                key={sub.conversationId}
                type="button"
                className="btn btn-sm"
                onClick={() => onSelectChat(sub.conversationId)}
              >
                {sub.subagentRole || sub.subagentType || "Subagent"} ·{" "}
                {fmtDuration(sub.time.activeMs)} ·{" "}
                {sub.tokens.hasTokenTelemetry
                  ? `${fmtK(
                      sub.tokens.inputTokens +
                        sub.tokens.cacheReadTokens +
                        sub.tokens.outputTokens
                    )} tok`
                  : "N/A (legacy)"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Active Time</span>
            <KpiHelpTip helpKey="activeAgentTime" />
          </div>
          <div className="kpi-value">{fmtDuration(s.time.activeMs)}</div>
          <div className="kpi-sub">
            {fmtDuration(s.time.modelMs)} model · {fmtDuration(s.time.toolWallMs)} tools
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Turns &amp; Wait</span>
            <KpiHelpTip helpKey="userWaitIdle" />
          </div>
          <div className="kpi-value">{s.turnCount} turns</div>
          <div className="kpi-sub">{fmtDuration(s.time.userIdleMs)} idle</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Tokens &amp; Cache</span>
            <KpiHelpTip helpKey="tokensAndCache" />
          </div>
          <div className="kpi-value">
            {s.tokens.hasTokenTelemetry ? fmtK(totalTokens) : "N/A (legacy)"}
          </div>
          <div className="kpi-sub">
            {s.tokens.hasTokenTelemetry
              ? `${fmtPct(s.tokens.cacheHitRatio)} cache · Peak ${fmtK(s.tokens.peakContextTokens)}`
              : "Legacy transcript without token counters"}
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
                Add model rate
              </button>
            ) : (
              `Saved ~${fmtUsd(s.tokens.cacheSavingsUsd)}`
            )}
          </div>
        </div>
      </div>

      <TabStrip
        tabs={chatTabs}
        activeKey={tab}
        ariaLabel="Chat analysis sections"
        idPrefix={tabIdPrefix}
        onSelect={setTab}
      />

      <div role="tabpanel" aria-labelledby={`${tabIdPrefix}-${tab}`}>
        {tab === "timeline" && (
          <TimelineWaterfall
            turns={detail.turns}
            plannerSteps={detail.plannerSteps}
            toolCalls={detail.toolCalls}
            highlightStepIndex={highlightStep}
          />
        )}

        {tab === "issues" && (
          <WhyPanel
            findings={detail.diagnostics}
            canSendMessage={canSendMessage}
            onJumpToStep={jumpToTimelineStep}
            onAskAgent={onAskAgent}
          />
        )}

        {tab === "tokens" && (
          <div>
            <TokenBreakdownChart plannerSteps={detail.plannerSteps} />
            <ModelBreakdownPanel
              title="Model Mix & Switches"
              breakdown={s.modelBreakdown}
              switches={detail.modelSwitches}
              unpricedModels={s.tokens.unpricedModels}
              onOpenSettings={onOpenSettings}
              onJumpToStep={jumpToTimelineStep}
            />
          </div>
        )}

        {tab === "plugins" && (
          <div>
            <div className="subtab-bar" role="group" aria-label="Plugins and tools views">
              <button
                type="button"
                className={`basis-btn ${pluginsSubtab === "plugins" ? "active" : ""}`}
                onClick={() => setPluginsSubtab("plugins")}
              >
                Plugins &amp; Skills ({detail.pluginSkillMetrics.length})
              </button>
              <button
                type="button"
                className={`basis-btn ${pluginsSubtab === "tools" ? "active" : ""}`}
                onClick={() => setPluginsSubtab("tools")}
              >
                All Tools ({detail.skillToolMetrics.length})
              </button>
            </div>

            {pluginsSubtab === "plugins" ? (
              <PluginSkillLeaderboard
                title="Plugins & Skills Impact"
                subtitle={
                  detail.subagents.length > 0
                    ? `Includes ${detail.subagents.length} subagent${
                        detail.subagents.length === 1 ? "" : "s"
                      }`
                    : undefined
                }
                metrics={detail.pluginSkillMetrics}
                scopeLabel={`conversation "${s.title}" (${s.conversationId.slice(0, 8)})`}
                currentConversationId={s.conversationId}
                canSendMessage={canSendMessage}
                onSelectChat={onSelectChat}
                onJumpToStep={jumpToTimelineStep}
                onOptimizeSkill={onOptimizeSkill}
              />
            ) : (
              <SkillToolMatrix
                metrics={detail.skillToolMetrics}
                scopeLabel={`conversation "${s.title}" (${s.conversationId.slice(0, 8)})`}
                currentConversationId={s.conversationId}
                canSendMessage={canSendMessage}
                onSelectChat={onSelectChat}
                onJumpToStep={jumpToTimelineStep}
                onTroubleshootPrompt={onTroubleshootPrompt}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
