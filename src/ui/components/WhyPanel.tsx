import React from "react";
import type { DiagnosticFinding } from "../../shared/types";
import { fmtDuration, fmtK } from "../format";

interface Props {
  findings: DiagnosticFinding[];
  canSendMessage?: boolean;
  onJumpToStep?: (stepIndex: number) => void;
  onAskAgent?: (finding: DiagnosticFinding) => void;
}

export const WhyPanel: React.FC<Props> = ({
  findings,
  canSendMessage,
  onJumpToStep,
  onAskAgent
}) => {
  if (findings.length === 0) {
    return (
      <div className="panel" style={{ padding: 16, color: "var(--txt-tertiary)" }}>
        No notable token spikes, cache misses, or slow bottlenecks detected.
      </div>
    );
  }

  const badgeForSeverity = (sev: DiagnosticFinding["severity"]): string => {
    if (sev === "critical") return "badge badge-danger";
    if (sev === "warning") return "badge badge-warning";
    return "badge badge-info";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
      {findings.map((f) => (
        <div
          key={f.id}
          className="panel"
          style={{
            marginTop: 0,
            padding: "10px 12px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10
          }}
        >
          <div style={{ flex: "1 1 300px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span className={badgeForSeverity(f.severity)}>
                {f.severity.toUpperCase()}
              </span>
              <strong>{f.title}</strong>
              <span className="badge badge-neutral">{f.citation}</span>
            </div>
            <div style={{ marginTop: 4, color: "var(--txt-secondary)" }}>
              {f.detail}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {f.impactTokens !== null && f.impactTokens > 0 && (
              <span className="tabular" style={{ fontWeight: 600 }}>
                +{fmtK(f.impactTokens)} tok
              </span>
            )}
            {f.impactMs !== null && f.impactMs > 0 && (
              <span className="tabular" style={{ fontWeight: 600 }}>
                {fmtDuration(f.impactMs)}
              </span>
            )}
            {f.stepIndex !== null && onJumpToStep && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onJumpToStep(f.stepIndex!)}
              >
                Inspect Step
              </button>
            )}
            {canSendMessage && onAskAgent && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => onAskAgent(f)}
              >
                Ask Agent
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
