import React, { useMemo, useState } from "react";
import { pathTailSegments } from "../../shared/paths";
import type {
  PlannerStepRecord,
  ToolCallRecord,
  TurnRecord
} from "../../shared/types";
import { fmtBytes, fmtDuration, fmtK } from "../format";
import { buildModelColorMap, getModelColor } from "../modelColors";

interface Props {
  turns: TurnRecord[];
  plannerSteps: PlannerStepRecord[];
  toolCalls: ToolCallRecord[];
  highlightStepIndex?: number | null;
}

interface WaterfallItem {
  id: string;
  kind: "model" | "tool";
  stepIndex: number;
  turnIndex: number;
  name: string;
  badge: string;
  badgeVariant: "info" | "warning" | "danger" | "success" | "neutral";
  barColor: string;
  activeOffsetMs: number;
  durationMs: number;
  outputLabel: string;
  directTokens: number;
  compoundedTokens: number;
  argsPreview: string;
  why: string;
  isParallelBatch?: boolean;
  parallelFactor?: number;
}

export const TimelineWaterfall: React.FC<Props> = ({
  turns,
  plannerSteps,
  toolCalls,
  highlightStepIndex
}) => {
  const { turnGroups, totalActiveTimelineMs, allItems, distinctModels, modelColors } = useMemo(() => {
    let cursorMs = 0;
    const flatItems: WaterfallItem[] = [];
    const groups: Array<{
      turn: TurnRecord;
      items: WaterfallItem[];
    }> = [];

    const globalIdxByStep = new Map<PlannerStepRecord, number>();
    const switchFromByStep = new Map<PlannerStepRecord, string>();
    const modelSet = new Set<string>();

    for (let i = 0; i < plannerSteps.length; i++) {
      const ps = plannerSteps[i];
      globalIdxByStep.set(ps, i);
      const curModel = (ps.model || "").trim() || "unknown";
      modelSet.add(curModel);
      if (i > 0) {
        const prevModel = (plannerSteps[i - 1].model || "").trim() || "unknown";
        if (prevModel !== curModel) {
          switchFromByStep.set(ps, prevModel);
        }
      }
    }

    const modelList = Array.from(modelSet);
    const hasMultiModel = modelList.length > 1;
    const colorMap = buildModelColorMap(modelList);

    const orderedTurns =
      turns.length > 0
        ? turns
        : [
            {
              turnIndex: 0,
              promptPreview: "Conversation activity",
              slashCommand: null,
              startedAtMs: 0,
              endedAtMs: 0,
              activeMs: 0,
              modelMs: 0,
              toolWallMs: 0,
              userIdleBeforeMs: 0,
              inputTokens: 0,
              cacheReadTokens: 0,
              outputTokens: 0,
              cacheHitRatio: 0
            }
          ];

    for (const turn of orderedTurns) {
      const turnItems: WaterfallItem[] = [];
      const steps = plannerSteps.filter((s) => s.turnIndex === turn.turnIndex);

      for (const ps of steps) {
        const psGlobalIdx = globalIdxByStep.get(ps) ?? 0;
        const switchedFrom = switchFromByStep.get(ps);
        const isModelSwitch = Boolean(switchedFrom);

        let badge = "Model";
        let badgeVariant: WaterfallItem["badgeVariant"] = "info";
        if (isModelSwitch && ps.isCacheMiss) {
          badge = "Switch + Miss";
          badgeVariant = "warning";
        } else if (isModelSwitch) {
          badge = "Model Switch";
          badgeVariant = "info";
        } else if (ps.isCacheMiss) {
          badge = "Cache Miss";
          badgeVariant = "warning";
        }

        const modelDur = Math.max(150, ps.modelDurationMs);
        const modelItem: WaterfallItem = {
          id: `ps-${ps.stepIndex}-${psGlobalIdx}`,
          kind: "model",
          stepIndex: ps.stepIndex,
          turnIndex: turn.turnIndex,
          name: `Planner #${ps.stepIndex} (${ps.model})`,
          badge,
          badgeVariant,
          barColor: hasMultiModel
            ? (colorMap.get((ps.model || "").trim() || "unknown") ?? getModelColor(ps.model))
            : "var(--chart-model)",
          activeOffsetMs: cursorMs,
          durationMs: modelDur,
          outputLabel: `${fmtK(ps.outputTokens)} out`,
          directTokens: ps.inputTokens,
          compoundedTokens: 0,
          argsPreview: `Context: ${fmtK(ps.totalContextTokens)} | Cache Read: ${fmtK(ps.cacheReadTokens)}`,
          why:
            ps.isCacheMiss && ps.cacheMissCause
              ? ps.cacheMissCause
              : isModelSwitch
                ? `Model switched (${switchedFrom} → ${ps.model}) · ${ps.attributedSummary || "Model planning & response generation"}`
                : ps.attributedSummary || "Model planning & response generation"
        };
        cursorMs += modelDur;
        turnItems.push(modelItem);
        flatItems.push(modelItem);

        const batchTools = toolCalls.filter(
          (tc) => tc.plannerStepIndex === ps.stepIndex
        );
        if (batchTools.length > 0) {
          const batchMinStart = Math.min(
            ...batchTools
              .map((t) => t.startedAtMs ?? 0)
              .filter((x) => x > 0),
            Number.POSITIVE_INFINITY
          );
          const batchMaxEnd = Math.max(
            ...batchTools.map(
              (t) => t.completedAtMs ?? (t.startedAtMs ?? 0) + t.durationMs
            ),
            0
          );
          const sumDur = batchTools.reduce((s, t) => s + t.durationMs, 0);
          const batchWall =
            Number.isFinite(batchMinStart) && batchMaxEnd > batchMinStart
              ? batchMaxEnd - batchMinStart
              : Math.max(...batchTools.map((t) => t.durationMs), 200);
          const parallelRatio =
            batchWall > 0 && batchTools.length > 1
              ? Number((sumDur / batchWall).toFixed(1))
              : 1;

          batchTools.forEach((tc, idx) => {
            const relStart =
              Number.isFinite(batchMinStart) &&
              tc.startedAtMs &&
              tc.startedAtMs >= batchMinStart
                ? tc.startedAtMs - batchMinStart
                : 0;
            const dur = Math.max(120, tc.durationMs);

            let badge = "Tool";
            let badgeVariant: WaterfallItem["badgeVariant"] = "neutral";
            let barColor = "var(--chart-cache)";

            if (tc.isError) {
              badge = "Error";
              badgeVariant = "danger";
              barColor = "var(--chart-error)";
            } else if (tc.category === "skill") {
              badge = "Skill";
              badgeVariant = "warning";
              barColor = "var(--chart-skill)";
            } else if (tc.category === "subagent") {
              badge = "Subagent";
              badgeVariant = "info";
              barColor = "var(--chart-subagent)";
            } else if (tc.category === "mcp") {
              badge = tc.mcpServer ? `MCP:${tc.mcpServer}` : "MCP";
              badgeVariant = "info";
              barColor = "var(--chart-output)";
            } else if (
              idx === batchTools.length - 1 &&
              parallelRatio >= 1.3
            ) {
              badge = `${parallelRatio}x parallel`;
              badgeVariant = "success";
            }

            const toolLabel = tc.skillName
              ? `${tc.toolName}: ${tc.skillName}`
              : tc.targetPath
                ? `${tc.toolName}: ${pathTailSegments(tc.targetPath, 2)}`
                : tc.toolName;

            const toolItem: WaterfallItem = {
              id: `tc-${tc.id}-${tc.stepIndex}`,
              kind: "tool",
              stepIndex: tc.stepIndex,
              turnIndex: turn.turnIndex,
              name: toolLabel,
              badge,
              badgeVariant,
              barColor,
              activeOffsetMs: cursorMs + relStart,
              durationMs: dur,
              outputLabel: fmtBytes(tc.resultBytes),
              directTokens: tc.attributedInputTokens,
              compoundedTokens: tc.compoundedCacheTokens,
              argsPreview: tc.argsPreview,
              why: tc.isError
                ? tc.errorPreview || "Tool returned an error"
                : tc.attributedInputTokens > 0
                  ? `Attributed +${fmtK(tc.attributedInputTokens)} new tokens (+${fmtK(tc.compoundedCacheTokens)} cache carry)`
                  : tc.argsPreview || "Executed tool step",
              isParallelBatch: batchTools.length > 1,
              parallelFactor: parallelRatio
            };
            turnItems.push(toolItem);
            flatItems.push(toolItem);
          });

          cursorMs += Math.max(150, batchWall);
        }
      }

      groups.push({ turn, items: turnItems });
    }

    return {
      turnGroups: groups,
      totalActiveTimelineMs: Math.max(cursorMs, 1),
      allItems: flatItems,
      distinctModels: modelList,
      modelColors: colorMap
    };
  }, [turns, plannerSteps, toolCalls]);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedItem = useMemo(() => {
    if (highlightStepIndex !== undefined && highlightStepIndex !== null) {
      const byHighlight = allItems.find(
        (it) => it.stepIndex === highlightStepIndex
      );
      if (byHighlight && !selectedId) return byHighlight;
    }
    if (selectedId) {
      const found = allItems.find((it) => it.id === selectedId);
      if (found) return found;
    }
    return allItems[0] ?? null;
  }, [allItems, selectedId, highlightStepIndex]);

  if (allItems.length === 0) {
    return (
      <div className="panel" style={{ padding: 16, color: "var(--txt-tertiary)" }}>
        No steps recorded in this conversation yet.
      </div>
    );
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">
            Step-by-Step Active Waterfall (click any bar to inspect)
          </span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 12, color: "var(--txt-secondary)" }}>
            {distinctModels.length > 1 ? (
              <>
                {distinctModels.slice(0, 5).map((m) => (
                  <span key={m} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: 2,
                        background: modelColors.get(m) ?? getModelColor(m)
                      }}
                    />
                    {m}
                  </span>
                ))}
                {distinctModels.length > 5 && (
                  <span style={{ color: "var(--txt-tertiary)" }}>
                    +{distinctModels.length - 5} more
                  </span>
                )}
              </>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--chart-model)" }} />
                Model
              </span>
            )}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--chart-skill)" }} />
              Skill
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--chart-cache)" }} />
              Tool
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--chart-subagent)" }} />
              Subagent
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--chart-error)" }} />
              Error
            </span>
            <span className="tabular" style={{ color: "var(--txt-tertiary)" }}>
              0s → {fmtDuration(totalActiveTimelineMs)}
            </span>
          </div>
        </div>

        <div>
          {turnGroups.map(({ turn, items }) => (
            <React.Fragment key={turn.turnIndex}>
              {turn.userIdleBeforeMs > 2000 && (
                <div
                  style={{
                    padding: "4px 10px",
                    textAlign: "center",
                    fontSize: 12,
                    color: "var(--txt-tertiary)",
                    background: "var(--bg-primary)",
                    borderBottom: "1px dashed var(--bdr-primary)"
                  }}
                >
                  ⋯ User Wait / Idle Gap: {fmtDuration(turn.userIdleBeforeMs)} (excluded from active agent time) ⋯
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "6px 10px",
                  background: "var(--bg-tertiary)",
                  borderBottom: "1px solid var(--bdr-secondary)",
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                <span className="truncate">
                  Turn {turn.turnIndex + 1}
                  {turn.slashCommand ? ` (${turn.slashCommand})` : ""} — {turn.promptPreview}
                </span>
                <span className="tabular" style={{ color: "var(--txt-secondary)", fontWeight: 500, flexShrink: 0 }}>
                  {fmtDuration(turn.activeMs)} active
                </span>
              </div>

              {items.map((item) => {
                const leftPct = Math.max(
                  0,
                  Math.min(97, (item.activeOffsetMs / totalActiveTimelineMs) * 100)
                );
                const widthPct = Math.max(
                  1.5,
                  Math.min(100 - leftPct, (item.durationMs / totalActiveTimelineMs) * 100)
                );
                const isSelected = selectedItem?.id === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`wf-row ${isSelected ? "selected" : ""}`}
                  >
                    <div className="wf-label">
                      <span
                        className="truncate"
                        style={{ fontWeight: isSelected ? 600 : 400 }}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <span className={`badge badge-${item.badgeVariant}`}>
                        {item.badge}
                      </span>
                    </div>
                    <div className="wf-track">
                      <div
                        className="wf-bar"
                        style={{
                          left: `${leftPct.toFixed(2)}%`,
                          width: `${widthPct.toFixed(2)}%`,
                          background: item.barColor
                        }}
                      />
                    </div>
                    <div
                      className="tabular text-right"
                      style={{ width: 58, flexShrink: 0, fontWeight: 500 }}
                    >
                      {fmtDuration(item.durationMs)}
                    </div>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {selectedItem && (
        <div
          className="panel"
          style={{
            padding: "9px 12px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10
          }}
        >
          <div style={{ minWidth: 0, flex: "1 1 280px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className={`badge badge-${selectedItem.badgeVariant}`}>
                {selectedItem.badge}
              </span>
              <strong>{selectedItem.name}</strong>
              <span style={{ color: "var(--txt-tertiary)" }}>
                (Step {selectedItem.stepIndex}, Turn {selectedItem.turnIndex + 1})
              </span>
            </div>
            <div style={{ marginTop: 3, color: "var(--txt-secondary)", fontSize: 12 }}>
              {selectedItem.why}
            </div>
            {selectedItem.argsPreview && (
              <div
                className="truncate"
                style={{
                  marginTop: 2,
                  color: "var(--txt-tertiary)",
                  fontSize: 12,
                  fontFamily: "monospace"
                }}
                title={selectedItem.argsPreview}
              >
                {selectedItem.argsPreview}
              </div>
            )}
          </div>

          <div
            className="tabular"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              fontSize: 12,
              flexShrink: 0
            }}
          >
            <span>
              Duration: <strong>{fmtDuration(selectedItem.durationMs)}</strong>
            </span>
            <span>
              Size: <strong>{selectedItem.outputLabel}</strong>
            </span>
            <span>
              Direct: <strong>+{fmtK(selectedItem.directTokens)}</strong>
            </span>
            {selectedItem.compoundedTokens > 0 && (
              <span style={{ color: "var(--txt-info)" }}>
                Cache Carry: <strong>+{fmtK(selectedItem.compoundedTokens)}</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
