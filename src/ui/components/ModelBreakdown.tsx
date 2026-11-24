import React, { useMemo, useState } from "react";
import type { ModelSwitchEvent, ModelUsageMetric } from "../../shared/types";
import { fmtDuration, fmtK, fmtPct } from "../format";
import { buildModelColorMap, getModelColor } from "../modelColors";
import { CostCell } from "./CostCell";

export type ModelShareBasis = "tokens" | "steps" | "time";

function resolveBasis(
  breakdown: ModelUsageMetric[],
  requestedBasis: ModelShareBasis
): { effectiveBasis: ModelShareBasis; fellBackToSteps: boolean } {
  if (
    requestedBasis === "tokens" &&
    !breakdown.some((m) => m.totalTokens > 0)
  ) {
    return { effectiveBasis: "steps", fellBackToSteps: true };
  }
  return { effectiveBasis: requestedBasis, fellBackToSteps: false };
}

function getShare(m: ModelUsageMetric, basis: ModelShareBasis): number {
  if (basis === "steps") return m.stepShare;
  if (basis === "time") return m.timeShare;
  return m.tokenShare;
}

interface ModelMixBarProps {
  breakdown: ModelUsageMetric[];
  basis?: ModelShareBasis;
  maxLabels?: number;
  compact?: boolean;
}

export const ModelMixBar: React.FC<ModelMixBarProps> = ({
  breakdown,
  basis = "tokens",
  maxLabels = 3,
  compact = false
}) => {
  const { effectiveBasis, fellBackToSteps } = resolveBasis(breakdown, basis);

  const sorted = useMemo(
    () =>
      [...breakdown].sort(
        (a, b) =>
          getShare(b, effectiveBasis) - getShare(a, effectiveBasis) ||
          b.steps - a.steps
      ),
    [breakdown, effectiveBasis]
  );

  const colorMap = useMemo(
    () => buildModelColorMap(sorted.map((m) => m.model)),
    [sorted]
  );
  const colorFor = (model: string): string =>
    colorMap.get(model) ?? getModelColor(model);

  if (sorted.length === 0) {
    return <span style={{ color: "var(--txt-tertiary)" }}>—</span>;
  }

  const nonZero = sorted.filter((m) => getShare(m, effectiveBasis) > 0);
  const visible = sorted.slice(0, maxLabels);
  const hiddenCount = sorted.length - visible.length;

  return (
    <div style={{ minWidth: 0 }}>
      <div
        className="model-bar"
        style={{ height: compact ? 6 : 8 }}
        role="img"
        aria-label="Model usage share"
      >
        {nonZero.map((m) => {
          const share = getShare(m, effectiveBasis);
          const pct = (share * 100).toFixed(1);
          const title = `${m.model}: ${pct}% ${effectiveBasis} (${Math.round(m.tokenShare * 100)}% tokens · ${fmtK(m.totalTokens)} tok, ${Math.round(m.stepShare * 100)}% steps · ${m.steps}, ${Math.round(m.timeShare * 100)}% model time · ${fmtDuration(m.modelDurationMs)})`;
          return (
            <div
              key={m.model}
              className="model-bar-seg"
              style={{
                width: `${Math.max(2, share * 100).toFixed(2)}%`,
                background: colorFor(m.model)
              }}
              title={title}
            />
          );
        })}
      </div>

      <div className="model-mix-legend" style={{ marginTop: compact ? 4 : 6 }}>
        {visible.map((m) => {
          const share = getShare(m, effectiveBasis);
          return (
            <span
              key={m.model}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                minWidth: 0,
                maxWidth: compact ? 150 : 230
              }}
              title={m.model}
            >
              <span
                className="model-dot"
                style={{ background: colorFor(m.model) }}
              />
              <strong className="tabular">{Math.round(share * 100)}%</strong>
              <span className="truncate">{m.model}</span>
            </span>
          );
        })}
        {hiddenCount > 0 && (
          <span style={{ color: "var(--txt-tertiary)" }}>
            +{hiddenCount} more
          </span>
        )}
        {fellBackToSteps && (
          <span style={{ color: "var(--txt-tertiary)" }}>(by steps)</span>
        )}
      </div>
    </div>
  );
};

interface ModelBreakdownPanelProps {
  title?: string;
  breakdown: ModelUsageMetric[];
  basis?: ModelShareBasis;
  onBasisChange?: (b: ModelShareBasis) => void;
  switches?: ModelSwitchEvent[];
  unpricedModels?: string[];
  showChatsColumn?: boolean;
  collapsibleTable?: boolean;
  defaultExpanded?: boolean;
  onOpenSettings?: () => void;
  onJumpToStep?: (stepIndex: number) => void;
}

export const ModelBreakdownPanel: React.FC<ModelBreakdownPanelProps> = ({
  title = "Model Breakdown",
  breakdown,
  basis: controlledBasis,
  onBasisChange,
  switches,
  unpricedModels = [],
  showChatsColumn = false,
  collapsibleTable = false,
  defaultExpanded = true,
  onOpenSettings,
  onJumpToStep
}) => {
  const [internalBasis, setInternalBasis] = useState<ModelShareBasis>("tokens");
  const [expanded, setExpanded] = useState<boolean>(defaultExpanded);

  const activeBasis = controlledBasis ?? internalBasis;
  const setBasis = (b: ModelShareBasis) => {
    if (onBasisChange) onBasisChange(b);
    else setInternalBasis(b);
  };

  const { effectiveBasis, fellBackToSteps } = resolveBasis(
    breakdown,
    activeBasis
  );
  const hasAnyTokens = useMemo(
    () => breakdown.some((m) => m.totalTokens > 0),
    [breakdown]
  );

  const sorted = useMemo(
    () =>
      [...breakdown].sort(
        (a, b) =>
          getShare(b, effectiveBasis) - getShare(a, effectiveBasis) ||
          b.steps - a.steps ||
          b.modelDurationMs - a.modelDurationMs ||
          a.model.localeCompare(b.model)
      ),
    [breakdown, effectiveBasis]
  );

  const colorMap = useMemo(() => {
    const names = sorted.map((m) => m.model);
    if (switches) {
      for (const sw of switches) {
        names.push(sw.fromModel, sw.toModel);
      }
    }
    return buildModelColorMap(names);
  }, [sorted, switches]);
  const colorFor = (model: string): string =>
    colorMap.get(model) ?? getModelColor(model);

  if (sorted.length === 0) {
    return null;
  }

  const showTable = !collapsibleTable || expanded;

  return (
    <div className="panel">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className="panel-title">{title}</span>
          {fellBackToSteps && (
            <span className="badge badge-neutral">by steps (legacy)</span>
          )}
          {switches && switches.length > 0 && (
            <span className="badge badge-info">
              {switches.length} switch{switches.length === 1 ? "" : "es"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div className="basis-toggle" role="group" aria-label="Share metric basis">
            <button
              type="button"
              className={`basis-btn ${activeBasis === "tokens" ? "active" : ""}`}
              onClick={() => setBasis("tokens")}
            >
              Tokens
            </button>
            <button
              type="button"
              className={`basis-btn ${activeBasis === "steps" ? "active" : ""}`}
              onClick={() => setBasis("steps")}
            >
              Steps
            </button>
            <button
              type="button"
              className={`basis-btn ${activeBasis === "time" ? "active" : ""}`}
              onClick={() => setBasis("time")}
            >
              Model Time
            </button>
          </div>

          {collapsibleTable && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Hide table" : `Show table (${sorted.length})`}
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "10px 12px" }}>
        <div
          className="model-bar"
          style={{ height: 12 }}
          role="img"
          aria-label="Stacked model share bar"
        >
          {sorted
            .filter((m) => getShare(m, effectiveBasis) > 0)
            .map((m) => {
              const share = getShare(m, effectiveBasis);
              return (
                <div
                  key={m.model}
                  className="model-bar-seg"
                  style={{
                    width: `${Math.max(1.5, share * 100).toFixed(2)}%`,
                    background: colorFor(m.model)
                  }}
                  title={`${m.model}: ${(share * 100).toFixed(1)}%`}
                />
              );
            })}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 8
          }}
        >
          {sorted.map((m) => {
            const share = getShare(m, effectiveBasis);
            const pct = Math.round(share * 100);
            return (
              <span key={m.model} className="badge badge-neutral">
                <span
                  className="model-dot"
                  style={{ background: colorFor(m.model) }}
                />
                <strong className="tabular">{pct}%</strong>
                <span>{m.model}</span>
              </span>
            );
          })}
        </div>
      </div>

      {showTable && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Model</th>
                <th scope="col">Share</th>
                <th scope="col" className="text-right">Tokens &amp; Cache</th>
                <th scope="col" className="text-right">Model Time</th>
                <th scope="col" className="text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => {
                const share = getShare(m, effectiveBasis);
                const isUnpriced =
                  m.estimatedCostUsd === null || unpricedModels.includes(m.model);
                const color = colorFor(m.model);
                return (
                  <tr key={m.model}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span
                          className="model-dot"
                          style={{ background: color }}
                        />
                        <span style={{ fontWeight: 600 }}>{m.model}</span>
                        {isUnpriced && (
                          <button
                            type="button"
                            className="badge badge-warning"
                            style={{
                              border: "none",
                              cursor: onOpenSettings ? "pointer" : "default"
                            }}
                            onClick={onOpenSettings}
                            title={
                              onOpenSettings
                                ? "Click to configure pricing for this model"
                                : undefined
                            }
                          >
                            Unpriced
                          </button>
                        )}
                      </div>
                      <div className="cell-sub" style={{ paddingLeft: 14 }}>
                        {m.steps} steps ({fmtPct(m.stepShare)})
                        {showChatsColumn ? ` · ${m.chatCount} chats` : ""}
                      </div>
                    </td>
                    <td style={{ minWidth: 130 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            flex: 1,
                            height: 6,
                            background: "var(--bg-tertiary)",
                            borderRadius: 999,
                            overflow: "hidden"
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.max(2, share * 100).toFixed(1)}%`,
                              height: "100%",
                              background: color,
                              borderRadius: 999
                            }}
                          />
                        </div>
                        <span
                          className="tabular text-right"
                          style={{ width: 42, fontWeight: 600 }}
                        >
                          {(share * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="text-right tabular">
                      {m.totalTokens > 0 || hasAnyTokens ? (
                        <>
                          <span>{fmtK(m.totalTokens)}</span>{" "}
                          <span style={{ color: "var(--txt-success)", fontWeight: 600 }}>
                            ({fmtPct(m.cacheHitRatio)})
                          </span>
                        </>
                      ) : (
                        "N/A (legacy)"
                      )}
                    </td>
                    <td className="text-right tabular">
                      {fmtDuration(m.modelDurationMs)}{" "}
                      <span style={{ color: "var(--txt-tertiary)" }}>
                        ({fmtPct(m.timeShare)})
                      </span>
                    </td>
                    <td className="text-right tabular">
                      <CostCell estimatedCostUsd={m.estimatedCostUsd} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {switches && switches.length > 0 && (() => {
        const renderSwitchesList = () => (
          <div>
            {switches.map((sw, idx) => (
              <div key={`${sw.stepIndex}-${idx}`} className="switch-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
                  <span className="badge badge-neutral tabular">
                    Step {sw.stepIndex} · Turn {sw.turnIndex + 1}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 500 }}>
                    <span
                      className="model-dot"
                      style={{ background: colorFor(sw.fromModel) }}
                    />
                    <span>{sw.fromModel}</span>
                    <span style={{ color: "var(--txt-tertiary)" }}>→</span>
                    <span
                      className="model-dot"
                      style={{ background: colorFor(sw.toModel) }}
                    />
                    <span>{sw.toModel}</span>
                  </span>
                  <span style={{ color: "var(--txt-secondary)" }}>
                    {sw.trigger}
                  </span>
                  {sw.isCacheMiss && (
                    <span className="badge badge-warning tabular">
                      Cache Miss (+{fmtK(sw.inputTokensAfter)} uncached)
                    </span>
                  )}
                </div>

                {onJumpToStep && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => onJumpToStep(sw.stepIndex)}
                  >
                    Inspect Step
                  </button>
                )}
              </div>
            ))}
          </div>
        );

        if (switches.length > 5) {
          return (
            <div style={{ borderTop: "1px solid var(--bdr-secondary)" }}>
              <details className="err-samples-details" style={{ padding: "8px 12px" }}>
                <summary>Model Switches ({switches.length})</summary>
                <div style={{ marginTop: 6 }}>{renderSwitchesList()}</div>
              </details>
            </div>
          );
        }

        return (
          <div style={{ borderTop: "1px solid var(--bdr-secondary)" }}>
            <div
              style={{
                padding: "8px 12px",
                fontWeight: 600,
                fontSize: 12,
                background: "var(--bg-secondary)",
                borderBottom: "1px solid var(--bdr-secondary)"
              }}
            >
              Model Switches ({switches.length})
            </div>
            {renderSwitchesList()}
          </div>
        );
      })()}
    </div>
  );
};
