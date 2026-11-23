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
  fmtUsd
} from "../format";
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

  const sortedAndFiltered = useMemo(() => {
    const base =
      filter === "All" ? metrics : metrics.filter((m) => m.kind === filter);
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
  }, [metrics, filter, basis]);

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
          <div
            className="basis-toggle"
            role="group"
            aria-label="Ranking impact basis"
          >
            <button
              type="button"
              className={`basis-btn ${basis === "spend" ? "active" : ""}`}
              onClick={() => setBasis("spend")}
            >
              Spend &amp; Time
            </button>
            <button
              type="button"
              className={`basis-btn ${basis === "context" ? "active" : ""}`}
              onClick={() => setBasis("context")}
            >
              Context Carry
            </button>
          </div>

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
              <th scope="col">#</th>
              <th scope="col">Plugin / Skill</th>
              <th scope="col">
                {basis === "spend" ? "Share of Spend" : "Share of Context"}
              </th>
              <th scope="col" className="text-right">Active Time</th>
              <th scope="col" className="text-right">Context (Instr / Exec)</th>
              <th scope="col" className="text-right">Calls</th>
              <th scope="col" className="text-right">
                {showProjectsColumn ? "Projects" : "Chats"}
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ color: "var(--txt-tertiary)", padding: 14 }}
                >
                  No plugin or skill invocations recorded in this scope.
                </td>
              </tr>
            ) : (
              visible.map((m, idx) => {
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
                const instrPct =
                  m.totalTokens > 0
                    ? Math.round((m.instructionTokens / m.totalTokens) * 100)
                    : 0;

                return (
                  <React.Fragment key={m.id}>
                    <tr
                      className="clickable"
                      onClick={() => toggleExpand(m.id)}
                      aria-expanded={isExpanded}
                    >
                      <td
                        className="tabular"
                        style={{ color: "var(--txt-tertiary)", width: 28 }}
                      >
                        {idx + 1}
                      </td>
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
                          <span
                            className={`badge ${
                              m.kind === "Plugin"
                                ? "badge-info"
                                : "badge-warning"
                            }`}
                          >
                            {m.kind}
                          </span>
                          {m.children.length > 1 && (
                            <span className="badge badge-neutral">
                              {m.children.length} items
                            </span>
                          )}
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
                      </td>
                      <td style={{ minWidth: 195 }}>
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
                                  minWidth: 40,
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
                                  minWidth: 38,
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
                                {fmtUsd(m.drivenCostUsd)}
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
                        <span>+{fmtK(m.totalTokens)}</span>{" "}
                        {m.totalTokens > 0 && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--txt-tertiary)"
                            }}
                          >
                            ({instrPct}% instr)
                          </span>
                        )}
                      </td>
                      <td className="text-right tabular">{m.calls}</td>
                      <td className="text-right tabular">
                        {showProjectsColumn
                          ? (m.projectCount ?? 1)
                          : m.chatCount}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div className="drilldown-drawer">
                            <div className="drilldown-header">
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "var(--txt-secondary)"
                                }}
                              >
                                Breakdown under {m.name} (raw tool wall:{" "}
                                {fmtDuration(m.totalDurationMs)} · +{fmtK(m.instructionTokens)}{" "}
                                instruction / +{fmtK(m.executionTokens)} execution)
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
                                    <th scope="col">Type</th>
                                    <th scope="col" className="text-right">Driven Spend</th>
                                    <th scope="col" className="text-right">Active Time</th>
                                    <th scope="col" className="text-right">Instr / Exec</th>
                                    <th scope="col" className="text-right">Calls</th>
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
                                          </td>
                                          <td>
                                            <span className="badge badge-neutral">
                                              {ch.kind}
                                            </span>
                                          </td>
                                          <td className="text-right tabular">
                                            {fmtUsd(ch.drivenCostUsd)}
                                          </td>
                                          <td className="text-right tabular">
                                            {fmtDuration(ch.drivenActiveMs)}
                                          </td>
                                          <td className="text-right tabular">
                                            +{fmtK(ch.instructionTokens)} / +
                                            {fmtK(ch.executionTokens)}
                                          </td>
                                          <td className="text-right tabular">
                                            {ch.calls}
                                          </td>
                                        </tr>
                                        {isChildErrOpen && ch.errors > 0 && (
                                          <tr className="err-detail-row">
                                            <td colSpan={6}>
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
