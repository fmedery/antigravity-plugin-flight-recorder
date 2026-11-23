import React, { useEffect, useMemo, useState } from "react";
import type {
  ConversationDetail,
  DiagnosticFinding,
  PluginSkillMetric
} from "../../shared/types";
import { fmtDuration, fmtK, fmtPct, fmtUsd } from "../format";
import { ModelBreakdownPanel, ModelMixBar } from "./ModelBreakdown";
import { PluginSkillLeaderboard } from "./PluginSkillLeaderboard";
import { KpiHelpTip } from "./KpiHelpTip";
import { SkillToolMatrix } from "./SkillToolMatrix";
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

type ChatTab = "waterfall" | "models" | "tokens" | "plugins" | "why" | "skills";

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
  const [tab, setTab] = useState<ChatTab>("waterfall");
  const [highlightStep, setHighlightStep] = useState<number | null>(
    initialHighlightStep
  );
  const [editingProj, setEditingProj] = useState(false);
  const [projInput, setProjInput] = useState(detail.summary.projectPath);
  const [showSubagents, setShowSubagents] = useState(false);

  useEffect(() => {
    if (initialHighlightStep !== undefined && initialHighlightStep !== null) {
      setHighlightStep(initialHighlightStep);
      setTab("waterfall");
    }
  }, [initialHighlightStep]);

  const subagentTotals = useMemo(() => {
    const subs = detail.subagents;
    const count = subs.length;
    let inputTokens = 0;
    let cacheReadTokens = 0;
    let outputTokens = 0;
    let totalActiveMs = 0;
    let costSum = 0;
    let anyPriced = false;
    let hasTokenTelemetry = false;

    for (const sub of subs) {
      inputTokens += sub.tokens.inputTokens;
      cacheReadTokens += sub.tokens.cacheReadTokens;
      outputTokens += sub.tokens.outputTokens;
      totalActiveMs += sub.time.activeMs;
      if (sub.tokens.hasTokenTelemetry) hasTokenTelemetry = true;
      if (sub.tokens.estimatedCostUsd !== null) {
        anyPriced = true;
        costSum += sub.tokens.estimatedCostUsd;
      }
    }

    const totalTokens = inputTokens + cacheReadTokens + outputTokens;
    const denom = inputTokens + cacheReadTokens;
    return {
      count,
      totalTokens,
      cacheHitRatio: denom > 0 ? cacheReadTokens / denom : 0,
      hasTokenTelemetry,
      totalActiveMs,
      estimatedCostUsd: anyPriced ? costSum : null
    };
  }, [detail.subagents]);

  const s = detail.summary;
  const totalTokens =
    s.tokens.inputTokens + s.tokens.cacheReadTokens + s.tokens.outputTokens;

  const handleSaveProject = async () => {
    await onAssignProject(s.conversationId, projInput);
    setEditingProj(false);
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
                  className="input-field"
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

        {s.modelBreakdown.length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {s.models.map((m) => {
              const unpriced = s.tokens.unpricedModels.includes(m);
              return (
                <span
                  key={m}
                  className={`badge ${unpriced ? "badge-warning" : "badge-neutral"}`}
                  style={unpriced ? { cursor: "pointer" } : undefined}
                  onClick={unpriced ? onOpenSettings : undefined}
                  title={unpriced ? "Click to configure pricing for this model" : undefined}
                >
                  {m}
                  {unpriced ? " (Unpriced)" : ""}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {s.modelBreakdown.length > 0 && (
        <div
          className="panel"
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap"
          }}
        >
          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
            <ModelMixBar
              breakdown={s.modelBreakdown}
              maxLabels={s.modelBreakdown.length}
            />
          </div>
          {detail.modelSwitches.length > 0 && (
            <button
              type="button"
              className="badge badge-info"
              style={{ border: "none", cursor: "pointer", flexShrink: 0 }}
              onClick={() => setTab("models")}
            >
              {detail.modelSwitches.length} switch
              {detail.modelSwitches.length === 1 ? "" : "es"}
            </button>
          )}
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Active Agent Time</span>
            <KpiHelpTip helpKey="activeAgentTime" />
          </div>
          <div className="kpi-value">{fmtDuration(s.time.activeMs)}</div>
          <div className="kpi-sub">
            {fmtDuration(s.time.modelMs)} model · {fmtDuration(s.time.toolWallMs)} tools (
            {s.time.parallelismFactor}x)
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>User Wait / Idle</span>
            <KpiHelpTip helpKey="userWaitIdle" />
          </div>
          <div className="kpi-value">{fmtDuration(s.time.userIdleMs)}</div>
          <div className="kpi-sub">
            {s.turnCount} turns · {s.toolCallCount} tool calls
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Tokens &amp; Cache</span>
            <KpiHelpTip helpKey="tokensAndCache" />
          </div>
          <div className="kpi-value">
            {s.tokens.hasTokenTelemetry ? (
              <>
                {fmtK(totalTokens)}{" "}
                <span style={{ fontSize: 13, color: "var(--txt-success)" }}>
                  ({fmtPct(s.tokens.cacheHitRatio)})
                </span>
              </>
            ) : (
              "N/A (legacy)"
            )}
          </div>
          <div className="kpi-sub">
            {s.tokens.hasTokenTelemetry
              ? `Peak ${fmtK(s.tokens.peakContextTokens)} · ${fmtK(s.tokens.inputTokens)} new`
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

      {detail.subagents.length > 0 && (
        <div className="panel">
          <div
            style={{
              padding: "8px 12px",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12
              }}
            >
              <span style={{ fontWeight: 600 }}>Spawned Subagents</span>
              <span className="badge badge-info tabular">
                {subagentTotals.count}{" "}
                {subagentTotals.count === 1 ? "subagent" : "subagents"}
              </span>
              <span className="tabular">
                Tokens:{" "}
                <strong>
                  {subagentTotals.hasTokenTelemetry
                    ? fmtK(subagentTotals.totalTokens)
                    : "N/A (legacy)"}
                </strong>
                {subagentTotals.hasTokenTelemetry ? (
                  <span style={{ color: "var(--txt-success)" }}>
                    {" "}
                    ({fmtPct(subagentTotals.cacheHitRatio)} cache)
                  </span>
                ) : null}
              </span>
              <span className="tabular">
                Total Time:{" "}
                <strong>{fmtDuration(subagentTotals.totalActiveMs)}</strong>
              </span>
              {subagentTotals.estimatedCostUsd !== null && (
                <span className="tabular">
                  Est. Cost:{" "}
                  <strong>{fmtUsd(subagentTotals.estimatedCostUsd)}</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowSubagents((v) => !v)}
            >
              {showSubagents ? "Hide list" : "Show list"}
            </button>
          </div>

          {showSubagents && (
            <div
              style={{
                borderTop: "1px solid var(--bdr-secondary)",
                padding: "8px 12px",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                maxHeight: 220,
                overflowY: "auto",
                background: "var(--bg-primary)"
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
          )}
        </div>
      )}

      <div className="tab-strip">
        <button
          type="button"
          className={`tab-pill ${tab === "waterfall" ? "active" : ""}`}
          onClick={() => setTab("waterfall")}
        >
          Chat Waterfall
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === "models" ? "active" : ""}`}
          onClick={() => setTab("models")}
        >
          Models ({s.modelBreakdown.length}
          {detail.modelSwitches.length > 0
            ? ` · ${detail.modelSwitches.length} sw`
            : ""}
          )
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === "tokens" ? "active" : ""}`}
          onClick={() => setTab("tokens")}
        >
          Tokens &amp; Cache
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
          className={`tab-pill ${tab === "why" ? "active" : ""}`}
          onClick={() => setTab("why")}
        >
          Why &amp; Bottlenecks ({detail.diagnostics.length})
        </button>
        <button
          type="button"
          className={`tab-pill ${tab === "skills" ? "active" : ""}`}
          onClick={() => setTab("skills")}
        >
          All Tools ({detail.skillToolMetrics.length})
        </button>
      </div>

      {tab === "waterfall" && (
        <TimelineWaterfall
          turns={detail.turns}
          plannerSteps={detail.plannerSteps}
          toolCalls={detail.toolCalls}
          highlightStepIndex={highlightStep}
        />
      )}

      {tab === "models" && (
        <ModelBreakdownPanel
          title="Chat Model Mix & Orchestrator Switches"
          breakdown={s.modelBreakdown}
          switches={detail.modelSwitches}
          unpricedModels={s.tokens.unpricedModels}
          onOpenSettings={onOpenSettings}
          onJumpToStep={(stepIdx) => {
            setHighlightStep(stepIdx);
            setTab("waterfall");
          }}
        />
      )}

      {tab === "tokens" && (
        <TokenBreakdownChart
          plannerSteps={detail.plannerSteps}
          diagnostics={detail.diagnostics}
        />
      )}

      {tab === "plugins" && (
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
          onJumpToStep={(stepIdx) => {
            setHighlightStep(stepIdx);
            setTab("waterfall");
          }}
          onOptimizeSkill={onOptimizeSkill}
        />
      )}

      {tab === "why" && (
        <WhyPanel
          findings={detail.diagnostics}
          canSendMessage={canSendMessage}
          onJumpToStep={(stepIdx) => {
            setHighlightStep(stepIdx);
            setTab("waterfall");
          }}
          onAskAgent={onAskAgent}
        />
      )}

      {tab === "skills" && (
        <SkillToolMatrix
          metrics={detail.skillToolMetrics}
          scopeLabel={`conversation "${s.title}" (${s.conversationId.slice(0, 8)})`}
          currentConversationId={s.conversationId}
          canSendMessage={canSendMessage}
          onSelectChat={onSelectChat}
          onJumpToStep={(stepIdx) => {
            setHighlightStep(stepIdx);
            setTab("waterfall");
          }}
          onTroubleshootPrompt={onTroubleshootPrompt}
        />
      )}
    </div>
  );
};
