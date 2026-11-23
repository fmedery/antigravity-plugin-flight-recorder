import React, { useMemo, useState } from "react";
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
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set()
  );

  const keyedFindings = useMemo(
    () => findings.map((f, idx) => ({ f, itemKey: `${f.id}::${idx}` })),
    [findings]
  );

  const severityCounts = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let info = 0;
    for (const f of findings) {
      if (f.severity === "critical") critical += 1;
      else if (f.severity === "warning") warning += 1;
      else info += 1;
    }
    return { critical, warning, info };
  }, [findings]);

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

  const allExpanded =
    keyedFindings.length > 0 &&
    keyedFindings.every(({ itemKey }) => expandedKeys.has(itemKey));

  const toggleItem = (itemKey: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedKeys(new Set());
    } else {
      setExpandedKeys(new Set(keyedFindings.map((k) => k.itemKey)));
    }
  };

  const renderFinding = (f: DiagnosticFinding, itemKey: string) => {
    const isOpen = expandedKeys.has(itemKey);
    const guidance = describeDiagnostic(f);

    return (
      <>
        <button
          type="button"
          className="diag-summary-btn"
          aria-expanded={isOpen}
          onClick={() => toggleItem(itemKey)}
        >
          <span className="diag-summary-main">
            <span className="diag-chevron" aria-hidden="true">
              {isOpen ? "▾" : "▸"}
            </span>
            <span className={badgeForSeverity(f.severity)}>
              {f.severity.toUpperCase()}
            </span>
            <strong className="diag-summary-title">{f.title}</strong>
            <span className="diag-summary-citation">{f.citation}</span>
          </span>
          <span className="diag-summary-impact tabular">
            {f.impactTokens !== null && f.impactTokens > 0 && (
              <span>+{fmtK(f.impactTokens)} tok</span>
            )}
            {f.impactMs !== null && f.impactMs > 0 && (
              <span>{fmtDuration(f.impactMs)}</span>
            )}
          </span>
        </button>

        {isOpen && (
          <div className="diag-expanded-body">
            <div className="diag-detail-row">
              <span className="badge badge-neutral" style={{ marginRight: 6 }}>
                {guidance.categoryLabel}
              </span>
              <span className="diag-detail">{f.detail}</span>
            </div>

            <div className={`diag-guidance diag-guidance-${f.severity}`}>
              <div className="diag-guidance-row">
                <strong>What it means:</strong> {guidance.meaning}
              </div>
              <div className="diag-guidance-row">
                <strong>Possible remediation:</strong> {guidance.remediation}
              </div>
            </div>

            {(f.stepIndex !== null && onJumpToStep) ||
            (canSendMessage && onAskAgent) ? (
              <div className="diag-actions">
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
            ) : null}
          </div>
        )}
      </>
    );
  };

  if (embedded) {
    return (
      <div>
        {keyedFindings.map(({ f, itemKey }) => (
          <div key={itemKey} className="diag-embedded-row">
            {renderFinding(f, itemKey)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      {findings.length > 1 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginBottom: 8
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {severityCounts.critical > 0 && (
              <span className="badge badge-danger">
                {severityCounts.critical} critical
              </span>
            )}
            {severityCounts.warning > 0 && (
              <span className="badge badge-warning">
                {severityCounts.warning} warning
              </span>
            )}
            {severityCounts.info > 0 && (
              <span className="badge badge-info">
                {severityCounts.info} info
              </span>
            )}
            <span style={{ fontSize: 12, color: "var(--txt-tertiary)" }}>
              Click any issue to inspect details and remediation
            </span>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={toggleAll}
          >
            {allExpanded ? "Collapse all" : "Expand all"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {keyedFindings.map(({ f, itemKey }) => (
          <div key={itemKey} className="panel" style={{ marginTop: 0 }}>
            {renderFinding(f, itemKey)}
          </div>
        ))}
      </div>
    </div>
  );
};
