import React, { useEffect, useMemo, useState } from "react";
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
  displayDurationMs?: number;
  outputLabel: string;
  directTokens: number;
  compoundedTokens: number;
  argsPreview: string;
  why: string;
  isParallelBatch?: boolean;
  parallelFactor?: number;
}

interface TurnGroup {
  turn: TurnRecord;
  items: WaterfallItem[];
  turnTimelineMs: number;
  errorCount: number;
  cacheMissCount: number;
  hasSubagent: boolean;
  modelsUsed: string[];
}

export const TimelineWaterfall: React.FC<Props> = ({
  turns,
  plannerSteps,
  toolCalls,
  highlightStepIndex
}) => {
  const { turnGroups, allItems, modelColors } = useMemo(() => {
    const flatItems: WaterfallItem[] = [];
    const groups: TurnGroup[] = [];

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
      let turnCursorMs = 0;
      let errorCount = 0;
      let cacheMissCount = 0;
      let hasSubagent = false;
      const turnModels = new Set<string>();
      const turnItems: WaterfallItem[] = [];
      const steps = plannerSteps.filter((s) => s.turnIndex === turn.turnIndex);

      for (const ps of steps) {
        const psGlobalIdx = globalIdxByStep.get(ps) ?? 0;
        const switchedFrom = switchFromByStep.get(ps);
        const isModelSwitch = Boolean(switchedFrom);
        const cleanModel = (ps.model || "").trim() || "unknown";
        turnModels.add(cleanModel);
        if (ps.isCacheMiss) cacheMissCount += 1;

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
            ? (colorMap.get(cleanModel) ?? getModelColor(ps.model))
            : "var(--chart-model)",
          activeOffsetMs: turnCursorMs,
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
        turnCursorMs += modelDur;
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
            if (tc.isError) errorCount += 1;
            if (tc.category === "subagent") hasSubagent = true;

            const relStart =
              Number.isFinite(batchMinStart) &&
              tc.startedAtMs &&
              tc.startedAtMs >= batchMinStart
                ? tc.startedAtMs - batchMinStart
                : 0;
            const isSwarmWait = tc.toolName === "swarm_wait";
            const isSwarmBoard =
              tc.toolName === "read_board" ||
              tc.toolName === "post_board" ||
              tc.toolName === "swarm_post";
            const rawDur = Math.max(120, tc.durationMs);
            const dur = isSwarmWait ? Math.min(rawDur, 10_000) : rawDur;

            let tBadge = "Tool";
            let tBadgeVariant: WaterfallItem["badgeVariant"] = "neutral";
            let barColor = "var(--chart-cache)";

            if (tc.isError) {
              tBadge = "Error";
              tBadgeVariant = "danger";
              barColor = "var(--chart-error)";
            } else if (tc.category === "skill") {
              tBadge = "Skill";
              tBadgeVariant = "warning";
              barColor = "var(--chart-skill)";
            } else if (tc.toolName === "swarm" && tc.category === "subagent") {
              tBadge = "Swarm Spawn";
              tBadgeVariant = "info";
              barColor = "var(--chart-subagent)";
            } else if (tc.toolName === "swarm") {
              tBadge = "Swarm";
              tBadgeVariant = "info";
              barColor = "var(--chart-subagent)";
            } else if (isSwarmWait) {
              tBadge = "Swarm Wait";
              tBadgeVariant = "neutral";
              barColor = "var(--bdr-primary)";
            } else if (isSwarmBoard) {
              tBadge = "Board";
              tBadgeVariant = "info";
              barColor = "var(--chart-subagent)";
            } else if (tc.category === "subagent") {
              tBadge = "Subagent";
              tBadgeVariant = "info";
              barColor = "var(--chart-subagent)";
            } else if (tc.category === "mcp") {
              tBadge = tc.mcpServer ? `MCP:${tc.mcpServer}` : "MCP";
              tBadgeVariant = "info";
              barColor = "var(--chart-output)";
            } else if (
              idx === batchTools.length - 1 &&
              parallelRatio >= 1.3
            ) {
              tBadge = `${parallelRatio}x parallel`;
              tBadgeVariant = "success";
            }

            let toolLabel = tc.skillName
              ? `${tc.toolName}: ${tc.skillName}`
              : tc.targetPath
                ? `${tc.toolName}: ${pathTailSegments(tc.targetPath, 2)}`
                : tc.toolName;
            if (tc.toolName === "swarm") {
              const roleMatch = tc.argsPreview.match(/Role:\s*([^|]+)/i);
              const actionMatch = tc.argsPreview.match(/Action:\s*([^|]+)/i);
              if (tc.category === "subagent") {
                toolLabel = roleMatch
                  ? `swarm add: ${roleMatch[1].trim()}`
                  : "swarm add";
              } else if (actionMatch) {
                toolLabel = `swarm: ${actionMatch[1].trim()}`;
              }
            }

            const toolItem: WaterfallItem = {
              id: `tc-${tc.id}-${tc.stepIndex}`,
              kind: "tool",
              stepIndex: tc.stepIndex,
              turnIndex: turn.turnIndex,
              name: toolLabel,
              badge: tBadge,
              badgeVariant: tBadgeVariant,
              barColor,
              activeOffsetMs: turnCursorMs + relStart,
              durationMs: dur,
              ...(isSwarmWait ? { displayDurationMs: tc.durationMs } : {}),
              outputLabel: fmtBytes(tc.resultBytes),
              directTokens: tc.attributedInputTokens,
              compoundedTokens: tc.compoundedCacheTokens,
              argsPreview: tc.argsPreview,
              why: tc.isError
                ? tc.errorPreview || "Tool returned an error"
                : isSwarmWait
                  ? "Parked waiting on swarm board (excluded from active time)"
                  : tc.attributedInputTokens > 0
                    ? `Attributed +${fmtK(tc.attributedInputTokens)} new tokens (+${fmtK(tc.compoundedCacheTokens)} cache carry)`
                    : tc.argsPreview || "Executed tool step",
              isParallelBatch: batchTools.length > 1,
              parallelFactor: parallelRatio
            };
            turnItems.push(toolItem);
            flatItems.push(toolItem);
          });

          turnCursorMs += Math.max(150, batchWall);
        }
      }

      groups.push({
        turn,
        items: turnItems,
        turnTimelineMs: Math.max(turnCursorMs, 1),
        errorCount,
        cacheMissCount,
        hasSubagent,
        modelsUsed: Array.from(turnModels)
      });
    }

    return {
      turnGroups: groups,
      allItems: flatItems,
      modelColors: colorMap
    };
  }, [turns, plannerSteps, toolCalls]);

  const [expandedTurns, setExpandedTurns] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (highlightStepIndex !== undefined && highlightStepIndex !== null) {
      const target = allItems.find((it) => it.stepIndex === highlightStepIndex);
      if (target) initial.add(target.turnIndex);
    } else if (turnGroups.length === 1) {
      initial.add(turnGroups[0].turn.turnIndex);
    }
    return initial;
  });

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (highlightStepIndex !== undefined && highlightStepIndex !== null) {
      const target = allItems.find((it) => it.stepIndex === highlightStepIndex);
      if (target) return target.id;
    }
    return null;
  });

  useEffect(() => {
    if (highlightStepIndex === undefined || highlightStepIndex === null) return;
    const target = allItems.find((it) => it.stepIndex === highlightStepIndex);
    if (!target) return;
    setExpandedTurns((prev) => {
      if (prev.has(target.turnIndex)) return prev;
      const next = new Set(prev);
      next.add(target.turnIndex);
      return next;
    });
    setSelectedId(target.id);
  }, [highlightStepIndex, allItems]);

  if (allItems.length === 0) {
    return (
      <div className="panel" style={{ padding: 16, color: "var(--txt-tertiary)" }}>
        No steps recorded in this conversation yet.
      </div>
    );
  }

  const allTurnsExpanded =
    turnGroups.length > 0 &&
    turnGroups.every((g) => expandedTurns.has(g.turn.turnIndex));

  const toggleTurn = (turnIndex: number) => {
    setExpandedTurns((prev) => {
      const next = new Set(prev);
      if (next.has(turnIndex)) next.delete(turnIndex);
      else next.add(turnIndex);
      return next;
    });
  };

  const toggleAllTurns = () => {
    if (allTurnsExpanded) {
      setExpandedTurns(new Set());
    } else {
      setExpandedTurns(new Set(turnGroups.map((g) => g.turn.turnIndex)));
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-title">Conversation Timeline</span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              color: "var(--txt-tertiary)",
              fontWeight: 400
            }}
          >
            Each row is a user turn. Click a turn to inspect its model and tool steps.
          </span>
        </div>
        {turnGroups.length > 1 && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={toggleAllTurns}
          >
            {allTurnsExpanded ? "Collapse all" : `Expand all (${turnGroups.length})`}
          </button>
        )}
      </div>

      <div>
        {turnGroups.map(
          ({
            turn,
            items,
            turnTimelineMs,
            errorCount,
            cacheMissCount,
            hasSubagent,
            modelsUsed
          }) => {
            const isTurnOpen = expandedTurns.has(turn.turnIndex);
            const activeSub = `${fmtDuration(turn.modelMs)} model · ${fmtDuration(turn.toolWallMs)} tools`;

            return (
              <React.Fragment key={turn.turnIndex}>
                {turn.userIdleBeforeMs > 2000 && (
                  <div className="wf-idle-divider">
                    Paused {fmtDuration(turn.userIdleBeforeMs)} before next prompt
                  </div>
                )}

                <button
                  type="button"
                  className="wf-turn-row"
                  aria-expanded={isTurnOpen}
                  onClick={() => toggleTurn(turn.turnIndex)}
                >
                  <span className="wf-turn-main">
                    <span className="diag-chevron" aria-hidden="true">
                      {isTurnOpen ? "▾" : "▸"}
                    </span>
                    <strong style={{ flexShrink: 0 }}>
                      Turn {turn.turnIndex + 1}
                    </strong>
                    {turn.slashCommand && (
                      <span className="badge badge-info">{turn.slashCommand}</span>
                    )}
                    <span className="truncate wf-turn-prompt" title={turn.promptPreview}>
                      {turn.promptPreview}
                    </span>
                  </span>

                  <span className="wf-turn-meta tabular">
                    {errorCount > 0 && (
                      <span className="badge badge-danger">{errorCount} err</span>
                    )}
                    {cacheMissCount > 0 && (
                      <span className="badge badge-warning">Cache miss</span>
                    )}
                    <span style={{ color: "var(--txt-tertiary)" }}>
                      {items.length} step{items.length === 1 ? "" : "s"}
                    </span>
                    {turn.inputTokens > 0 && (
                      <span style={{ color: "var(--txt-secondary)" }}>
                        +{fmtK(turn.inputTokens)} new
                      </span>
                    )}
                    <strong title={activeSub}>{fmtDuration(turn.activeMs)}</strong>
                  </span>
                </button>

                {isTurnOpen && (
                  <div className="wf-turn-body">
                    <div className="wf-turn-legend">
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                        {modelsUsed.length > 1 ? (
                          modelsUsed.slice(0, 4).map((m) => (
                            <span
                              key={m}
                              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 2,
                                  background: modelColors.get(m) ?? getModelColor(m)
                                }}
                              />
                              {m}
                            </span>
                          ))
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 2,
                                background: "var(--chart-model)"
                              }}
                            />
                            Model
                          </span>
                        )}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              background: "var(--chart-skill)"
                            }}
                          />
                          Skill
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              background: "var(--chart-cache)"
                            }}
                          />
                          Tool
                        </span>
                        {hasSubagent && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: 2,
                                background: "var(--chart-subagent)"
                              }}
                            />
                            Subagent
                          </span>
                        )}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 2,
                              background: "var(--chart-error)"
                            }}
                          />
                          Error
                        </span>
                      </div>
                      <span className="tabular" style={{ color: "var(--txt-tertiary)" }}>
                        0s → {fmtDuration(turnTimelineMs)}
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          fontSize: 12,
                          color: "var(--txt-tertiary)"
                        }}
                      >
                        No step telemetry recorded for this turn.
                      </div>
                    ) : (
                      items.map((item) => {
                        const leftPct = Math.max(
                          0,
                          Math.min(97, (item.activeOffsetMs / turnTimelineMs) * 100)
                        );
                        const widthPct = Math.max(
                          1.5,
                          Math.min(
                            100 - leftPct,
                            (item.durationMs / turnTimelineMs) * 100
                          )
                        );
                        const isSelected = selectedId === item.id;

                        return (
                          <React.Fragment key={item.id}>
                            <button
                              type="button"
                              aria-expanded={isSelected}
                              onClick={() =>
                                setSelectedId((prev) =>
                                  prev === item.id ? null : item.id
                                )
                              }
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
                                {fmtDuration(item.displayDurationMs ?? item.durationMs)}
                              </div>
                            </button>

                            {isSelected && (
                              <div className="wf-step-detail">
                                <div className="wf-step-detail-main">
                                  <div>
                                    <span
                                      className={`badge badge-${item.badgeVariant}`}
                                      style={{ marginRight: 6 }}
                                    >
                                      Step {item.stepIndex}
                                    </span>
                                    <span style={{ color: "var(--txt-secondary)" }}>
                                      {item.why}
                                    </span>
                                  </div>
                                  {item.argsPreview && (
                                    <div
                                      className="truncate"
                                      style={{
                                        marginTop: 3,
                                        color: "var(--txt-tertiary)",
                                        fontSize: 11,
                                        fontFamily: "monospace"
                                      }}
                                      title={item.argsPreview}
                                    >
                                      {item.argsPreview}
                                    </div>
                                  )}
                                </div>
                                <div className="wf-step-detail-metrics tabular">
                                  <span>
                                    Duration: <strong>{fmtDuration(item.displayDurationMs ?? item.durationMs)}</strong>
                                  </span>
                                  <span>
                                    Size: <strong>{item.outputLabel}</strong>
                                  </span>
                                  <span>
                                    Direct: <strong>+{fmtK(item.directTokens)}</strong>
                                  </span>
                                  {item.compoundedTokens > 0 && (
                                    <span style={{ color: "var(--txt-info)" }}>
                                      Cache Carry:{" "}
                                      <strong>+{fmtK(item.compoundedTokens)}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          }
        )}
      </div>
    </div>
  );
};
