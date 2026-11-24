import React, { useMemo, useState } from "react";
import type { PluginSkillMetric } from "../../shared/types";
import {
  buildErrorTroubleshootingPrompt,
  buildSkillOptimizationPrompt,
  describeErrorBadge,
  describePluginWarning,
  fmtDuration,
  fmtK,
  fmtPct,
  fmtUsdCompact
} from "../format";
import { CostCell } from "./CostCell";
import { ErrorGuidanceBlock } from "./ErrorGuidanceBlock";

interface Props {
  title?: string;
  subtitle?: string;
  metrics: PluginSkillMetric[];
  showProjectsColumn?: boolean;
  defaultLimit?: number;
  scopeLabel?: string;
  currentConversationId?: string;
  canSendMessage?: boolean;
  onOptimizeSkill?: (metric: PluginSkillMetric, prompt: string) => void;
  onSelectChat?: (conversationId: string, stepIndex?: number) => void;
  onJumpToStep?: (stepIndex: number) => void;
  onViewAll?: () => void;
  viewAllLabel?: string;
}

type KindFilter = "All" | "Plugin" | "Skill";
type ImpactBasis = "spend" | "context";

export const PluginSkillLeaderboard: React.FC<Props> = ({
  title = "Most Token-Hungry Plugins & Skills",
  subtitle,
  metrics,
  showProjectsColumn = false,
  defaultLimit,
  scopeLabel = "current scope",
  currentConversationId,
  canSendMessage = false,
  onOptimizeSkill,
  onSelectChat,
  onJumpToStep,
  onViewAll,
  viewAllLabel
}) => {
  const [filter, setFilter] = useState<KindFilter>("All");
  const [basis, setBasis] = useState<ImpactBasis>("spend");
  const [showAll, setShowAll] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [expandedErrorChildKeys, setExpandedErrorChildKeys] = useState<
    Set<string>
  >(() => new Set());

  const counts = useMemo(() => {
    let plugins = 0;
    let skills = 0;
    for (const m of metrics) {
      if (m.kind === "Plugin") plugins += 1;
      else skills += 1;
    }
    return { all: metrics.length, plugins, skills };
  }, [metrics]);

  const showKindFilter = counts.plugins > 0 && counts.skills > 0;

  const sortedAndFiltered = useMemo(() => {
    const base =
      !showKindFilter || filter === "All"
        ? metrics
        : metrics.filter((m) => m.kind === filter);
    return [...base].sort((a, b) => {
      if (basis === "context") {
        return (
          b.totalTokens - a.totalTokens ||
          b.drivenActiveMs - a.drivenActiveMs ||
          a.name.localeCompare(b.name)
        );
      }
      const aCost = a.drivenCostUsd ?? -1;
      const bCost = b.drivenCostUsd ?? -1;
      if (aCost !== bCost && (aCost >= 0 || bCost >= 0)) {
        return bCost - aCost;
      }
      return (
        b.drivenActiveMs - a.drivenActiveMs ||
        b.totalTokens - a.totalTokens ||
        a.name.localeCompare(b.name)
      );
    });
  }, [metrics, filter, basis, showKindFilter]);

  const visible =
    defaultLimit && !showAll
      ? sortedAndFiltered.slice(0, defaultLimit)
      : sortedAndFiltered;
  const hasMore = Boolean(
    defaultLimit && sortedAndFiltered.length > defaultLimit
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleChildError = (errKey: string) => {
    setExpandedErrorChildKeys((prev) => {
      const next = new Set(prev);
      if (next.has(errKey)) next.delete(errKey);
      else next.add(errKey);
      return next;
    });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <span className="panel-title">{title}</span>
          {subtitle && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 12,
                color: "var(--txt-tertiary)",
                fontWeight: 400
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 6
          }}
        >
          {showKindFilter && (
            <div
              className="basis-toggle"
              role="group"
              aria-label="Filter plugins or skills"
            >
              <button
                type="button"
                className={`basis-btn ${filter === "All" ? "active" : ""}`}
                onClick={() => setFilter("All")}
              >
                All ({counts.all})
              </button>
              <button
                type="button"
                className={`basis-btn ${filter === "Plugin" ? "active" : ""}`}
                onClick={() => setFilter("Plugin")}
              >
                Plugins ({counts.plugins})
              </button>
              <button
                type="button"
                className={`basis-btn ${filter === "Skill" ? "active" : ""}`}
                onClick={() => setFilter("Skill")}
              >
                Skills ({counts.skills})
              </button>
            </div>
          )}

          <select
            className="input-field input-field-sm"
            aria-label="Sort plugins and skills"
            value={basis}
            onChange={(e) => setBasis(e.target.value as ImpactBasis)}
          >
            <option value="spend">Sort: Spend &amp; Time</option>
            <option value="context">Sort: Context Tokens</option>
          </select>

          {onViewAll && (hasMore || metrics.length > (defaultLimit ?? Infinity)) ? (
            <button
              type="button"
              className="btn btn-sm"
              onClick={onViewAll}
            >
              {viewAllLabel ?? `View all (${metrics.length}) →`}
            </button>
          ) : (
            hasMore &&
            defaultLimit && (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll
                  ? `Show top ${defaultLimit}`
                  : `Show all (${sortedAndFiltered.length})`}
              </button>
            )
          )}
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Plugin / Skill</th>
              <th scope="col">
                {basis === "spend" ? "Impact" : "Context Share"}
              </th>
              <th scope="col" className="text-right">Active Time</th>
              <th scope="col" className="text-right">Context</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{ color: "var(--txt-tertiary)", padding: 14 }}
                >
                  No plugin or skill invocations recorded in this scope.
                </td>
              </tr>
            ) : (
              visible.map((m) => {
                const isExpanded = expandedIds.has(m.id);
                const shareRatio =
                  basis === "context"
                    ? m.tokenShare
                    : m.costShare !== null
                      ? m.costShare
                      : m.timeShare;
                const barPct =
                  shareRatio > 0
                    ? Math.max(3, Math.min(100, Math.round(shareRatio * 100)))
                    : 0;
                const barColor =
                  m.kind === "Plugin"
                    ? "var(--chart-model)"
                    : "var(--chart-skill)";
                const scopeStat = showProjectsColumn
                  ? `${m.projectCount ?? 1} proj`
                  : `${m.chatCount} chat${m.chatCount === 1 ? "" : "s"}`;

                return (
                  <React.Fragment key={m.id}>
                    <tr
                      className="clickable"
                      onClick={() => toggleExpand(m.id)}
                      aria-expanded={isExpanded}
                    >
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexWrap: "wrap"
                          }}
                        >
                          <span
                            style={{
                              color: "var(--txt-tertiary)",
                              fontSize: 11,
                              width: 10
                            }}
                            aria-hidden="true"
                          >
                            {isExpanded ? "▾" : "▸"}
                          </span>
                          <strong>{m.name}</strong>
                          {m.warningCount > 0 && (
                            <span
                              className="badge badge-warning"
                              title={`${m.warnings
                                .map((w) => {
                                  const info = describePluginWarning(w);
                                  return `${w}: ${info.meaning} (${info.remediation})`;
                                })
                                .join(" | ")} — Click row for breakdown and optimization steps`}
                            >
                              {m.warnings[0]}
                              {m.warningCount > 1
                                ? ` +${m.warningCount - 1}`
                                : ""}
                            </span>
                          )}
                          {m.errors > 0 && (() => {
                            const parentErrGuidance = describeErrorBadge(
                              m.kind,
                              m.errors,
                              m.name,
                              m.errorSamples
                            );
                            return (
                              <button
                                type="button"
                                className="badge badge-danger badge-btn"
                                aria-expanded={isExpanded}
                                aria-label={`${m.errors} err on ${m.name} — inspect errors and remediation`}
                                title={parentErrGuidance.summary}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpand(m.id);
                                }}
                              >
                                {m.errors} err{" "}
                                <span aria-hidden="true">
                                  {isExpanded ? "▾" : "▸"}
                                </span>
                              </button>
                            );
                          })()}
                        </div>
                        <div className="cell-sub" style={{ paddingLeft: 16 }}>
                          {m.kind}
                          {m.children.length > 1 ? ` · ${m.children.length} items` : ""}
                          {` · ${m.calls} calls · ${scopeStat}`}
                        </div>
                      </td>
                      <td style={{ minWidth: 185 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 999,
                              background: "var(--bg-tertiary)",
                              overflow: "hidden"
                            }}
                          >
                            <div
                              style={{
                                width: `${barPct}%`,
                                height: "100%",
                                background: barColor,
                                borderRadius: 999
                              }}
                            />
                          </div>
                          {basis === "context" ? (
                            <>
                              <span
                                className="tabular"
                                style={{
                                  fontWeight: 600,
                                  minWidth: 38,
                                  textAlign: "right"
                                }}
                              >
                                {fmtPct(m.tokenShare)}
                              </span>
                              <span
                                className="tabular"
                                style={{
                                  color: "var(--txt-secondary)",
                                  minWidth: 52,
                                  textAlign: "right"
                                }}
                              >
                                +{fmtK(m.totalTokens)}
                              </span>
                            </>
                          ) : m.costShare !== null && m.drivenCostUsd !== null ? (
                            <>
                              <span
                                className="tabular"
                                style={{
                                  fontWeight: 600,
                                  minWidth: 36,
                                  textAlign: "right"
                                }}
                              >
                                {fmtPct(m.costShare)}
                              </span>
                              <span
                                className="tabular"
                                style={{
                                  color: "var(--txt-secondary)",
                                  minWidth: 58,
                                  textAlign: "right"
                                }}
                              >
                                {fmtUsdCompact(m.drivenCostUsd)}
                              </span>
                            </>
                          ) : (
                            <span
                              className="tabular"
                              style={{
                                color: "var(--txt-tertiary)",
                                minWidth: 96,
                                textAlign: "right"
                              }}
                              title="Configure model rates in Pricing to see spend share; bar reflects active time share"
                            >
                              Unpriced ({fmtPct(m.timeShare)} time)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right tabular">
                        <strong>{fmtDuration(m.drivenActiveMs)}</strong>{" "}
                        <span style={{ color: "var(--txt-tertiary)" }}>
                          ({fmtPct(m.timeShare)})
                        </span>
                      </td>
                      <td className="text-right tabular">
                        +{fmtK(m.totalTokens)}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={4} style={{ padding: 0 }}>
                          <div className="drilldown-drawer">
                            <div className="drilldown-header">
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "var(--txt-secondary)"
                                }}
                              >
                                Breakdown under {m.name} ({m.calls} calls · raw tool wall:{" "}
                                {fmtDuration(m.totalDurationMs)} · +{fmtK(m.instructionTokens)}{" "}
                                instr / +{fmtK(m.executionTokens)} exec)
                              </span>
                              {onOptimizeSkill && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOptimizeSkill(
                                      m,
                                      buildSkillOptimizationPrompt(m, scopeLabel)
                                    );
                                  }}
                                >
                                  {canSendMessage
                                    ? "Optimize With Agent"
                                    : "Copy Optimization Prompt"}
                                </button>
                              )}
                            </div>

                            {m.errors > 0 && (
                              <ErrorGuidanceBlock
                                title={`Errors under ${m.name}`}
                                kind={m.kind}
                                itemName={m.name}
                                errorCount={m.errors}
                                samples={m.errorSamples}
                                collapsibleSamples={m.children.length > 1}
                                hint={
                                  m.children.some((c) => c.errors > 0)
                                    ? "Click any red err badge below for per-item details"
                                    : undefined
                                }
                                currentConversationId={currentConversationId}
                                canSendMessage={canSendMessage}
                                style={{
                                  marginBottom: m.children.length > 0 ? 8 : 0
                                }}
                                onSelectChat={onSelectChat}
                                onJumpToStep={onJumpToStep}
                                onTroubleshoot={
                                  onOptimizeSkill
                                    ? () =>
                                        onOptimizeSkill(
                                          m,
                                          buildErrorTroubleshootingPrompt({
                                            name: m.name,
                                            kind: m.kind,
                                            errorCount: m.errors,
                                            scopeLabel,
                                            targetPaths: m.targetPaths,
                                            samples: m.errorSamples
                                          })
                                        )
                                    : undefined
                                }
                              />
                            )}

                            {m.children.length > 0 && (
                              <table
                                className="data-table"
                                style={{
                                  background: "var(--bg-primary)",
                                  borderRadius: 6,
                                  overflow: "hidden"
                                }}
                              >
                                <thead>
                                  <tr>
                                    <th scope="col">Sub-Skill / Tool</th>
                                    <th scope="col" className="text-right">Spend</th>
                                    <th scope="col" className="text-right">Active Time</th>
                                    <th scope="col" className="text-right">Context</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {m.children.map((ch) => {
                                    const errKey = `${m.id}::${ch.key}`;
                                    const isChildErrOpen =
                                      expandedErrorChildKeys.has(errKey);
                                    return (
                                      <React.Fragment key={ch.key}>
                                        <tr>
                                          <td>
                                            <div>
                                              <strong>{ch.name}</strong>
                                              {ch.isUnusedLoad && (() => {
                                                const info = describePluginWarning("Unused load");
                                                return (
                                                  <span
                                                    className="badge badge-warning"
                                                    style={{ marginLeft: 6 }}
                                                    title={`${info.meaning} (${info.remediation})`}
                                                  >
                                                    Unused load
                                                  </span>
                                                );
                                              })()}
                                              {ch.duplicateReads > 0 && (() => {
                                                const info = describePluginWarning("Duplicate read");
                                                return (
                                                  <span
                                                    className="badge badge-warning"
                                                    style={{ marginLeft: 6 }}
                                                    title={`${info.meaning} (${info.remediation})`}
                                                  >
                                                    {ch.duplicateReads + 1}× read
                                                  </span>
                                                );
                                              })()}
                                              {ch.errors > 0 && (() => {
                                                const chErrGuidance = describeErrorBadge(
                                                  ch.kind,
                                                  ch.errors,
                                                  ch.name,
                                                  ch.errorSamples
                                                );
                                                return (
                                                  <button
                                                    type="button"
                                                    className="badge badge-danger badge-btn"
                                                    style={{ marginLeft: 6 }}
                                                    aria-expanded={isChildErrOpen}
                                                    aria-label={`${ch.errors} err on ${ch.name} — inspect errors and remediation`}
                                                    title={chErrGuidance.summary}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleChildError(errKey);
                                                    }}
                                                  >
                                                    {ch.errors} err{" "}
                                                    <span aria-hidden="true">
                                                      {isChildErrOpen ? "▾" : "▸"}
                                                    </span>
                                                  </button>
                                                );
                                              })()}
                                            </div>
                                            <div className="cell-sub">
                                              {ch.kind} · {ch.calls} calls
                                            </div>
                                          </td>
                                          <td className="text-right tabular">
                                            <CostCell estimatedCostUsd={ch.drivenCostUsd} />
                                          </td>
                                          <td className="text-right tabular">
                                            {fmtDuration(ch.drivenActiveMs)}
                                          </td>
                                          <td
                                            className="text-right tabular"
                                            title={`+${fmtK(ch.instructionTokens)} instruction / +${fmtK(ch.executionTokens)} execution`}
                                          >
                                            +{fmtK(ch.totalTokens)}
                                          </td>
                                        </tr>
                                        {isChildErrOpen && ch.errors > 0 && (
                                          <tr className="err-detail-row">
                                            <td colSpan={4}>
                                              <ErrorGuidanceBlock
                                                title={`${ch.kind}: ${ch.name}`}
                                                kind={ch.kind}
                                                itemName={ch.name}
                                                errorCount={ch.errors}
                                                samples={ch.errorSamples}
                                                collapsibleSamples={false}
                                                currentConversationId={
                                                  currentConversationId
                                                }
                                                canSendMessage={canSendMessage}
                                                onSelectChat={onSelectChat}
                                                onJumpToStep={onJumpToStep}
                                                onTroubleshoot={
                                                  onOptimizeSkill
                                                    ? () =>
                                                        onOptimizeSkill(
                                                          m,
                                                          buildErrorTroubleshootingPrompt({
                                                            name: ch.name,
                                                            kind: ch.kind,
                                                            parentName: m.name,
                                                            errorCount: ch.errors,
                                                            scopeLabel,
                                                            targetPaths:
                                                              ch.targetPaths,
                                                            samples:
                                                              ch.errorSamples
                                                          })
                                                        )
                                                    : undefined
                                                }
                                              />
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}

                            {(m.warnings.length > 0 || m.prescription) && (
                              <div
                                className="diag-guidance diag-guidance-warning"
                                style={{ marginTop: 8 }}
                              >
                                {m.warnings.map((w) => {
                                  const info = describePluginWarning(w);
                                  return (
                                    <div key={w} className="diag-guidance-row">
                                      <strong>{w} — What it means:</strong>{" "}
                                      {info.meaning}
                                      {!m.prescription && (
                                        <>
                                          {" "}
                                          <strong>Possible remediation:</strong>{" "}
                                          {info.remediation}
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                                {m.prescription && (
                                  <div className="diag-guidance-row">
                                    <strong>Possible remediation:</strong>{" "}
                                    {m.prescription}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
