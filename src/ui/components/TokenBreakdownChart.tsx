import React, { useMemo, useState } from "react";
import type { DiagnosticFinding, PlannerStepRecord } from "../../shared/types";
import { fmtK, fmtPct, fmtUsd } from "../format";
import { buildModelColorMap, getModelColor } from "../modelColors";

interface Props {
  plannerSteps: PlannerStepRecord[];
  diagnostics?: DiagnosticFinding[];
}

export const TokenBreakdownChart: React.FC<Props> = ({ plannerSteps }) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(() => {
    const missIdx = plannerSteps.findIndex((s) => s.isCacheMiss);
    return missIdx >= 0 ? missIdx : Math.max(0, plannerSteps.length - 1);
  });

  const safeIdx = Math.min(selectedIdx, Math.max(0, plannerSteps.length - 1));
  const selectedStep = plannerSteps[safeIdx] ?? null;

  const { maxVal, peakContext, svgWidth, chartHeight, barW, colStep, leftPad } =
    useMemo(() => {
      const count = Math.max(1, plannerSteps.length);
      const maxTok = Math.max(
        1000,
        ...plannerSteps.map(
          (s) => s.cacheReadTokens + s.inputTokens + s.outputTokens
        )
      );
      const peakCtx = Math.max(
        0,
        ...plannerSteps.map((s) => s.totalContextTokens)
      );
      const scaleCeiling =
        maxTok >= 220_000
          ? Math.max(maxTok * 1.12, 270_000)
          : maxTok >= 160_000
            ? Math.max(maxTok * 1.12, 215_000)
            : maxTok * 1.12;
      const lPad = 48;
      const stepW = count <= 10 ? 64 : count <= 20 ? 38 : 26;
      const w = Math.max(540, lPad + 24 + count * stepW);
      return {
        maxVal: scaleCeiling,
        peakContext: peakCtx,
        svgWidth: w,
        chartHeight: 150,
        barW: Math.max(12, stepW - 14),
        colStep: stepW,
        leftPad: lPad
      };
    }, [plannerSteps]);

  const distinctModels = useMemo(
    () =>
      Array.from(
        new Set(plannerSteps.map((s) => (s.model || "").trim() || "unknown"))
      ),
    [plannerSteps]
  );

  const modelColorMap = useMemo(
    () => buildModelColorMap(distinctModels),
    [distinctModels]
  );
  const colorForModel = (model: string): string => {
    const key = (model || "").trim() || "unknown";
    return modelColorMap.get(key) ?? getModelColor(key);
  };

  if (plannerSteps.length === 0) {
    return (
      <div className="panel" style={{ padding: 16, color: "var(--txt-tertiary)" }}>
        No model token records found for this conversation.
      </div>
    );
  }

  const chartTop = 22;
  const chartBottom = chartTop + chartHeight;

  return (
    <div>
      {selectedStep && (
        <div
          className="panel"
          style={{
            padding: "8px 12px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <strong>
              Step {selectedStep.stepIndex} (Turn {selectedStep.turnIndex + 1})
            </strong>
            <span className="badge badge-neutral">{selectedStep.model}</span>
            {selectedStep.isCacheMiss && (
              <span className="badge badge-warning">Cache Miss</span>
            )}
            <span style={{ color: "var(--txt-secondary)" }}>
              {selectedStep.attributedSummary}
            </span>
          </div>
          <div className="tabular" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span>
              Cache: <strong>{fmtK(selectedStep.cacheReadTokens)}</strong> (
              {fmtPct(selectedStep.cacheHitRatio)})
            </span>
            <span>
              New Input: <strong>{fmtK(selectedStep.inputTokens)}</strong>
            </span>
            <span>
              Output: <strong>{fmtK(selectedStep.outputTokens)}</strong>
            </span>
            <span>
              Cost: <strong>{fmtUsd(selectedStep.estimatedCostUsd)}</strong>
            </span>
          </div>
        </div>
      )}

      <div className="panel" style={{ padding: "10px 12px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 8,
            fontSize: 12,
            color: "var(--txt-secondary)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>Token &amp; Cache Breakdown by Planner Step (click/hover a step)</span>
            {peakContext > 0 && (
              <span
                className={`badge ${
                  peakContext >= 256_000
                    ? "badge-danger"
                    : peakContext >= 200_000
                      ? "badge-warning"
                      : "badge-neutral"
                }`}
                title="Antigravity warns above 200k context and soft-compacts near ~256k"
              >
                Peak: {fmtK(peakContext)} ({Math.round((peakContext / 200_000) * 100)}% of 200k cliff)
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--chart-cache)" }} />
              Cache Read
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--chart-model)" }} />
              New Input
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--chart-output)" }} />
              Output
            </span>
          </div>
        </div>

        {distinctModels.length > 1 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
              fontSize: 11,
              color: "var(--txt-secondary)"
            }}
          >
            <span style={{ color: "var(--txt-tertiary)" }}>Step model bar:</span>
            {distinctModels.slice(0, 6).map((m) => (
              <span key={m} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span className="model-dot" style={{ background: colorForModel(m) }} />
                <span>{m}</span>
              </span>
            ))}
          </div>
        )}

        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${chartBottom + 30}`}
            style={{ width: "100%", minWidth: Math.min(svgWidth, 520), height: "auto", display: "block" }}
            role="img"
            aria-label="Planner step stacked token chart"
          >
            {[0, 0.5, 1].map((frac) => {
              const val = Math.round(maxVal * frac);
              const y = chartBottom - frac * chartHeight;
              return (
                <g key={frac}>
                  <line
                    x1={leftPad}
                    y1={y}
                    x2={svgWidth - 10}
                    y2={y}
                    stroke="var(--bdr-secondary)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={leftPad - 6}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--txt-tertiary)"
                    fontSize="12"
                  >
                    {val === 0 ? "0" : fmtK(val)}
                  </text>
                </g>
              );
            })}

            {maxVal >= 160_000 && 200_000 <= maxVal && (
              <g>
                <line
                  x1={leftPad}
                  y1={chartBottom - (200_000 / maxVal) * chartHeight}
                  x2={svgWidth - 10}
                  y2={chartBottom - (200_000 / maxVal) * chartHeight}
                  stroke="var(--txt-warning)"
                  strokeWidth={1.2}
                  strokeDasharray="4 3"
                />
                <text
                  x={svgWidth - 14}
                  y={chartBottom - (200_000 / maxVal) * chartHeight - 4}
                  textAnchor="end"
                  fill="var(--txt-warning)"
                  fontSize="11"
                  fontWeight="600"
                >
                  200k cliff
                </text>
              </g>
            )}

            {maxVal >= 220_000 && 256_000 <= maxVal && (
              <g>
                <line
                  x1={leftPad}
                  y1={chartBottom - (256_000 / maxVal) * chartHeight}
                  x2={svgWidth - 10}
                  y2={chartBottom - (256_000 / maxVal) * chartHeight}
                  stroke="var(--txt-danger)"
                  strokeWidth={1.2}
                  strokeDasharray="4 3"
                />
                <text
                  x={svgWidth - 14}
                  y={chartBottom - (256_000 / maxVal) * chartHeight - 4}
                  textAnchor="end"
                  fill="var(--txt-danger)"
                  fontSize="11"
                  fontWeight="600"
                >
                  256k compaction
                </text>
              </g>
            )}

            {plannerSteps.map((s, idx) => {
              const x = leftPad + 10 + idx * colStep;
              const hCache = (s.cacheReadTokens / maxVal) * chartHeight;
              const hInput = (s.inputTokens / maxVal) * chartHeight;
              const hOut = (s.outputTokens / maxVal) * chartHeight;
              const yCache = chartBottom - hCache;
              const yInput = yCache - hInput;
              const yOut = yInput - hOut;
              const isSel = idx === safeIdx;

              return (
                <g
                  key={`${s.stepIndex}-${idx}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedIdx(idx)}
                  onMouseEnter={() => setSelectedIdx(idx)}
                >
                  {isSel && (
                    <rect
                      x={x - 4}
                      y={chartTop - 4}
                      width={barW + 8}
                      height={chartHeight + 8}
                      rx={4}
                      fill="var(--bg-info)"
                      stroke="var(--ring)"
                      strokeWidth={1}
                    />
                  )}
                  {hCache > 0 && (
                    <rect
                      x={x}
                      y={yCache}
                      width={barW}
                      height={hCache}
                      fill="var(--chart-cache)"
                    />
                  )}
                  {hInput > 0 && (
                    <rect
                      x={x}
                      y={yInput}
                      width={barW}
                      height={hInput}
                      fill="var(--chart-model)"
                    />
                  )}
                  {hOut > 0 && (
                    <rect
                      x={x}
                      y={yOut}
                      width={barW}
                      height={Math.max(2, hOut)}
                      rx={2}
                      fill="var(--chart-output)"
                    />
                  )}
                  {s.isCacheMiss && (
                    <text
                      x={x + barW / 2}
                      y={Math.max(13, yOut - 4)}
                      textAnchor="middle"
                      fill="var(--txt-warning)"
                      fontSize="12"
                      fontWeight="700"
                    >
                      Miss
                    </text>
                  )}
                  <rect
                    x={x}
                    y={chartBottom + 2}
                    width={barW}
                    height={3}
                    rx={1.5}
                    fill={colorForModel(s.model)}
                  >
                    <title>{s.model}</title>
                  </rect>
                  <text
                    x={x + barW / 2}
                    y={chartBottom + 18}
                    textAnchor="middle"
                    fill={isSel ? "var(--txt-primary)" : "var(--txt-tertiary)"}
                    fontSize="12"
                    fontWeight={isSel ? "600" : "400"}
                  >
                    S{s.stepIndex}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
