import React from "react";
import type { DiagnosticFinding } from "../../shared/types";
import { describeDiagnostic, fmtDuration, fmtK } from "../format";

interface Props {
  findings: DiagnosticFinding[];
  canSendMessage?: boolean;
  embedded?: boolean;
  emptyMessage?: string;
  onJumpToStep?: (stepIndex: number) => void;
  onAskAgent?: (finding: DiagnosticFinding) => void;
}

function badgeForSeverity(sev: DiagnosticFinding["severity"]): string {
  if (sev === "critical") return "badge badge-danger";
  if (sev === "warning") return "badge badge-warning";
  return "badge badge-info";
}

export const WhyPanel: React.FC<Props> = ({
  findings,
  canSendMessage,
  embedded = false,
  emptyMessage,
  onJumpToStep,
  onAskAgent
}) => {
  const emptyText =
    emptyMessage ??
    "No notable token spikes, cache misses, or slow bottlenecks detected.";

  if (findings.length === 0) {
    if (embedded) {
      return (
        <div
          style={{
            padding: "12px 14px",
            color: "var(--txt-tertiary)",
            fontSize: 12
          }}
        >
          {emptyText}
        </div>
      );
    }
    return (
      <div
        className="panel"
        style={{ padding: 16, color: "var(--txt-tertiary)" }}
      >
        {emptyText}
      </div>
    );
  }

  const renderFindingBody = (f: DiagnosticFinding) => {
    const guidance = describeDiagnostic(f);
    return (
      <>
        <div className="diag-header">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              flex: "1 1 300px",
              minWidth: 0
            }}
          >
            <span className={badgeForSeverity(f.severity)}>
              {f.severity.toUpperCase()}
            </span>
            <span className="badge badge-neutral">
              {guidance.categoryLabel}
            </span>
            <strong>{f.title}</strong>
            <span className="badge badge-neutral">{f.citation}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0
            }}
          >
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

        <div className="diag-detail">{f.detail}</div>

        <div className={`diag-guidance diag-guidance-${f.severity}`}>
          <div className="diag-guidance-row">
            <strong>What it means:</strong> {guidance.meaning}
          </div>
          <div className="diag-guidance-row">
            <strong>Possible remediation:</strong> {guidance.remediation}
          </div>
        </div>
      </>
    );
  };

  if (embedded) {
    return (
      <div>
        {findings.map((f) => (
          <div key={f.id} className="diag-embedded-row">
            {renderFindingBody(f)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 10
      }}
    >
      {findings.map((f) => (
        <div
          key={f.id}
          className="panel"
          style={{ marginTop: 0, padding: "10px 12px" }}
        >
          {renderFindingBody(f)}
        </div>
      ))}
    </div>
  );
};
