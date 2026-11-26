import React, { useEffect, useId, useMemo, useState } from "react";
import type {
  ConversationDetail,
  ModelAvailabilitySignal,
  ModelPricingRule
} from "../../shared/types";
import { fmtDateSpan, fmtDuration, fmtK, fmtPct, fmtUsdCompact } from "../format";
import { KpiHelpTip } from "./KpiHelpTip";
import { KpiStatusPill } from "./KpiStatusPill";
import { ModelBreakdownPanel, ModelInlinePill } from "./ModelBreakdown";
import { PluginSkillLeaderboard } from "./PluginSkillLeaderboard";
import { SkillToolMatrix } from "./SkillToolMatrix";
import { TabStrip, type TabItem } from "./TabStrip";
import { TimelineWaterfall } from "./TimelineWaterfall";
import { TokenBreakdownChart } from "./TokenBreakdownChart";

interface Props {
  detail: ConversationDetail;
  pricingRules?: ModelPricingRule[];
  modelSignals?: Record<string, ModelAvailabilitySignal>;
  latestGlobalActivityMs?: number;
  knownProjects: string[];
  canSendMessage: boolean;
  initialHighlightStep?: number | null;
  onAssignProject: (conversationId: string, projectPath: string) => Promise<void>;
  onSelectChat: (conversationId: string, stepIndex?: number) => void;
  onOpenSettings: () => void;
  onTroubleshootPrompt?: (prompt: string) => void;
}

type ChatTab = "timeline" | "tokens" | "plugins";
type PluginsToolsSubtab = "plugins" | "tools";
type ModelScope = "combined" | "parent" | "subagents";

export const ChatDetailView: React.FC<Props> = ({
  detail,
  pricingRules = [],
  modelSignals,
  latestGlobalActivityMs = 0,
  knownProjects,
  canSendMessage,
  initialHighlightStep = null,
  onAssignProject,
  onSelectChat,
  onOpenSettings,
  onTroubleshootPrompt
}) => {
  const [tab, setTab] = useState<ChatTab>("timeline");
  const [pluginsSubtab, setPluginsSubtab] =
    useState<PluginsToolsSubtab>("plugins");
  const [modelScope, setModelScope] = useState<ModelScope>("combined");
  const [highlightStep, setHighlightStep] = useState<number | null>(
    initialHighlightStep
  );
  const [editingProj, setEditingProj] = useState(false);
  const [projInput, setProjInput] = useState(detail.summary.projectPath);
  const [showSubagents, setShowSubagents] = useState(false);

  const s = detail.summary;
  const isSwarmCoordinator = s.swarmRole === "coordinator";
  const isSwarmWorker = s.swarmRole === "worker" || s.subagentType === "swarm";
  const hasSwarmChildren = detail.subagents.some(
    (sub) => sub.swarmRole === "worker" || sub.subagentType === "swarm"
  );
  const isSwarmScope = isSwarmCoordinator || hasSwarmChildren;
  const isSwarmWithWorkers = isSwarmScope && detail.subagents.length > 0;
  const [kpiScope, setKpiScope] = useState<"combined" | "parent">(() =>
    isSwarmWithWorkers ? "combined" : "parent"
  );

  const rawTabId = useId();
  const tabIdPrefix = `chat-tab-${rawTabId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    setModelScope("combined");
    setKpiScope(isSwarmWithWorkers ? "combined" : "parent");
  }, [detail.summary.conversationId, isSwarmWithWorkers]);

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

  const parentTotalTokens =
    s.tokens.inputTokens + s.tokens.cacheReadTokens + s.tokens.outputTokens;
  const usingCombinedKpis = isSwarmWithWorkers && kpiScope === "combined";
  const kpiTokens =
    usingCombinedKpis && detail.combinedTokens ? detail.combinedTokens : s.tokens;
  const kpiTotalTokens =
    kpiTokens.inputTokens + kpiTokens.cacheReadTokens + kpiTokens.outputTokens;
  const kpiActiveMs = usingCombinedKpis
    ? (detail.scopeActiveMs ?? s.time.activeMs)
    : s.time.activeMs;

  const handleSaveProject = async () => {
    await onAssignProject(s.conversationId, projInput);
    setEditingProj(false);
  };

  const chatTabs: Array<TabItem<ChatTab>> = [
    { key: "timeline", label: "Timeline" },
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
            {isSwarmCoordinator && (
              <span
                className="badge badge-swarm"
                title={
                  s.swarmTitle
                    ? `Swarm: ${s.swarmTitle}`
                    : "Swarm coordinator session"
                }
              >
                Swarm Coordinator
              </span>
            )}
            {isSwarmWorker && (
              <span className="badge badge-swarm">
                Swarm Worker{s.subagentRole ? ` · ${s.subagentRole}` : ""}
              </span>
            )}
            {isSwarmWorker && s.parentConversationId && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onSelectChat(s.parentConversationId!)}
              >
                ← Parent coordinator
              </button>
            )}
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
                className={`subagent-toggle-btn ${isSwarmScope ? "is-swarm" : ""}`}
                aria-expanded={showSubagents}
                onClick={() => setShowSubagents((v) => !v)}
              >
                +{detail.subagents.length}{" "}
                {isSwarmScope ? "worker" : "subagent"}
                {detail.subagents.length === 1 ? "" : "s"}{" "}
                <span aria-hidden="true">{showSubagents ? "▾" : "▸"}</span>
              </button>
            )}
          </div>
          {s.swarmTitle && s.swarmTitle !== s.title && (
            <div
              style={{
                marginTop: 2,
                fontSize: 12,
                color: "var(--txt-secondary)"
              }}
            >
              Swarm goal: <strong>{s.swarmTitle}</strong>
            </div>
          )}

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
            {(s.startedAtMs > 0 || s.endedAtMs > 0) && (
              <span className="tabular" style={{ color: "var(--txt-tertiary)" }}>
                · {fmtDateSpan(s.startedAtMs, s.endedAtMs)}
              </span>
            )}
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
              {isSwarmScope ? "Swarm Workers" : "Spawned Subagents"} (
              {subagentTotals.count} ·{" "}
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
            {detail.subagents.map((sub) => {
              const subTok =
                sub.tokens.inputTokens +
                sub.tokens.cacheReadTokens +
                sub.tokens.outputTokens;
              const subName =
                sub.subagentRole ||
                (sub.subagentType === "swarm" ? "worker" : sub.subagentType) ||
                "Subagent";
              const taskDesc = sub.subagentRole
                ? detail.swarmTasks?.[sub.subagentRole]
                : undefined;
              const subModelsLabel =
                sub.models.length > 0 ? sub.models.join(", ") : "unknown";
              const isSwarmChild =
                sub.swarmRole === "worker" || sub.subagentType === "swarm";
              return (
                <button
                  key={sub.conversationId}
                  type="button"
                  className="btn btn-sm subagent-chip-btn"
                  title={`${subName} · Models: ${subModelsLabel}${taskDesc ? ` · Task: ${taskDesc}` : ""}`}
                  onClick={() => onSelectChat(sub.conversationId)}
                >
                  {isSwarmChild && !isSwarmScope && (
                    <span className="badge badge-swarm">Swarm</span>
                  )}
                  <span>{subName}</span>
                  {taskDesc && (
                    <span
                      className="truncate"
                      style={{
                        maxWidth: 160,
                        color: "var(--txt-tertiary)",
                        fontSize: 11
                      }}
                    >
                      ({taskDesc})
                    </span>
                  )}
                  <ModelInlinePill
                    models={sub.models}
                    breakdown={sub.modelBreakdown}
                    pricingRules={pricingRules}
                    modelSignals={modelSignals}
                    latestGlobalActivityMs={latestGlobalActivityMs}
                    maxWidth={180}
                  />
                  <span>
                    · {fmtDuration(sub.time.activeMs)} ·{" "}
                    {sub.tokens.hasTokenTelemetry
                      ? `${fmtK(subTok)} tok`
                      : "N/A (legacy)"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isSwarmWithWorkers && (
        <div
          className="subtab-bar"
          role="group"
          aria-label="Swarm KPI scope"
          style={{ marginTop: 10 }}
        >
          <button
            type="button"
            className={`basis-btn ${kpiScope === "combined" ? "active" : ""}`}
            aria-pressed={kpiScope === "combined"}
            onClick={() => setKpiScope("combined")}
          >
            Combined Swarm (Coordinator + {detail.subagents.length} worker
            {detail.subagents.length === 1 ? "" : "s"})
          </button>
          <button
            type="button"
            className={`basis-btn ${kpiScope === "parent" ? "active" : ""}`}
            aria-pressed={kpiScope === "parent"}
            onClick={() => setKpiScope("parent")}
          >
            Coordinator only
          </button>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Active Time</span>
            <KpiHelpTip helpKey="activeAgentTime" />
          </div>
          <div className="kpi-value">{fmtDuration(kpiActiveMs)}</div>
          <div className="kpi-sub">
            {usingCombinedKpis
              ? `Merged wall time · Coord ${fmtDuration(s.time.activeMs)} · ${detail.subagents.length} worker${detail.subagents.length === 1 ? "" : "s"}`
              : `${fmtDuration(s.time.modelMs)} model · ${fmtDuration(s.time.toolWallMs)} tools`}
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
            {kpiTokens.hasTokenTelemetry ? fmtK(kpiTotalTokens) : "N/A (legacy)"}
          </div>
          <div className="kpi-sub">
            {kpiTokens.hasTokenTelemetry &&
            kpiTokens.inputTokens + kpiTokens.cacheReadTokens > 0 ? (
              <>
                <KpiStatusPill
                  kind="cacheHit"
                  ratio={kpiTokens.cacheHitRatio}
                  pillLabel={`${fmtPct(kpiTokens.cacheHitRatio)} cache`}
                  title="Prompt Cache Hit"
                  detail={`${fmtPct(kpiTokens.cacheHitRatio)} of input context (${fmtK(kpiTokens.cacheReadTokens)} cached ÷ ${fmtK(kpiTokens.cacheReadTokens + kpiTokens.inputTokens)} total input; output excluded) was served from prompt cache.`}
                />
                <span>
                  {usingCombinedKpis
                    ? `Coord ${fmtK(parentTotalTokens)} · Workers ${fmtK(subagentTotals.totalTokens)}`
                    : `Peak ${fmtK(kpiTokens.peakContextTokens)}`}
                </span>
              </>
            ) : kpiTokens.hasTokenTelemetry ? (
              <span>
                {usingCombinedKpis
                  ? `Coord ${fmtK(parentTotalTokens)} · Workers ${fmtK(subagentTotals.totalTokens)}`
                  : "No input tokens"}
              </span>
            ) : (
              <span>Legacy transcript without token counters</span>
            )}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">
            <span>Est. Cost</span>
            <KpiHelpTip helpKey="estCost" />
          </div>
          <div className="kpi-value">
            {kpiTokens.estimatedCostUsd === null &&
            kpiTokens.unpricedModels.length === 0
              ? "—"
              : fmtUsdCompact(kpiTokens.estimatedCostUsd)}
          </div>
          <div className="kpi-sub">
            {kpiTokens.unpricedModels.length > 0 ? (
              <button
                type="button"
                className="kpi-warning-btn"
                onClick={onOpenSettings}
              >
                Add model rate
              </button>
            ) : kpiTokens.cacheSavingsUsd !== null ? (
              `Saved ~${fmtUsdCompact(kpiTokens.cacheSavingsUsd)}`
            ) : (
              "No rateable model"
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

        {tab === "tokens" && (() => {
          const hasSubagentModels =
            detail.subagents.length > 0 &&
            (detail.subagentModelBreakdown?.length ?? 0) > 0;
          const activeScope: ModelScope = hasSubagentModels ? modelScope : "parent";
          const subUnpriced = Array.from(
            new Set(detail.subagents.flatMap((sub) => sub.tokens.unpricedModels))
          );
          const combinedUnpriced = Array.from(
            new Set([...s.tokens.unpricedModels, ...subUnpriced])
          );
          const subCount = detail.subagents.length;
          const subPlural = subCount === 1 ? "" : "s";
          const childNoun = isSwarmScope ? "worker" : "subagent";
          const parentNoun = isSwarmScope ? "Coordinator" : "Orchestrator";

          const panelProps =
            activeScope === "combined"
              ? {
                  title: "Model Mix & Switches",
                  subtitle: `${parentNoun} + ${subCount} ${childNoun}${subPlural}`,
                  breakdown: detail.combinedModelBreakdown ?? s.modelBreakdown,
                  unpricedModels: combinedUnpriced,
                  showChatsColumn: true,
                  switches: detail.modelSwitches,
                  switchesTitle: `${parentNoun} Model Switches`
                }
              : activeScope === "subagents"
                ? {
                    title: isSwarmScope
                      ? "Swarm Worker Model Mix"
                      : "Subagent Model Mix",
                    subtitle: `${subCount} ${childNoun}${subPlural}`,
                    breakdown: detail.subagentModelBreakdown ?? [],
                    unpricedModels: subUnpriced,
                    showChatsColumn: true,
                    switches: undefined,
                    switchesTitle: undefined
                  }
                : {
                    title: "Model Mix & Switches",
                    subtitle: hasSubagentModels ? `${parentNoun} only` : undefined,
                    breakdown: s.modelBreakdown,
                    unpricedModels: s.tokens.unpricedModels,
                    showChatsColumn: false,
                    switches: detail.modelSwitches,
                    switchesTitle: "Model Switches"
                  };

          return (
            <div>
              <TokenBreakdownChart plannerSteps={detail.plannerSteps} />
              {hasSubagentModels && (
                <div
                  className="subtab-bar"
                  role="group"
                  aria-label="Model breakdown scope"
                >
                  <button
                    type="button"
                    className={`basis-btn ${activeScope === "combined" ? "active" : ""}`}
                    aria-pressed={activeScope === "combined"}
                    onClick={() => setModelScope("combined")}
                  >
                    Combined ({isSwarmScope ? "Coordinator" : "Parent"} +{" "}
                    {subCount} {isSwarmScope ? `worker${subPlural}` : "sub"})
                  </button>
                  <button
                    type="button"
                    className={`basis-btn ${activeScope === "parent" ? "active" : ""}`}
                    aria-pressed={activeScope === "parent"}
                    onClick={() => setModelScope("parent")}
                  >
                    {parentNoun} only
                  </button>
                  <button
                    type="button"
                    className={`basis-btn ${activeScope === "subagents" ? "active" : ""}`}
                    aria-pressed={activeScope === "subagents"}
                    onClick={() => setModelScope("subagents")}
                  >
                    {isSwarmScope ? "Workers" : "Subagents"} only ({subCount})
                  </button>
                </div>
              )}
              <ModelBreakdownPanel
                title={panelProps.title}
                subtitle={panelProps.subtitle}
                breakdown={panelProps.breakdown}
                pricingRules={pricingRules}
                modelSignals={modelSignals}
                latestGlobalActivityMs={latestGlobalActivityMs}
                switches={panelProps.switches}
                switchesTitle={panelProps.switchesTitle}
                unpricedModels={panelProps.unpricedModels}
                showChatsColumn={panelProps.showChatsColumn}
                onOpenSettings={onOpenSettings}
                onJumpToStep={jumpToTimelineStep}
              />
            </div>
          );
        })()}

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
                    ? `Includes ${detail.subagents.length} ${
                        isSwarmScope ? "worker" : "subagent"
                      }${detail.subagents.length === 1 ? "" : "s"}`
                    : undefined
                }
                metrics={detail.pluginSkillMetrics}
                scopeLabel={`conversation "${s.title}" (${s.conversationId.slice(0, 8)})`}
                currentConversationId={s.conversationId}
                canSendMessage={canSendMessage}
                onSelectChat={onSelectChat}
                onJumpToStep={jumpToTimelineStep}
                onTroubleshootPrompt={onTroubleshootPrompt}
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
