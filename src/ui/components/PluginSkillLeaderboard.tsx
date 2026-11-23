import React, { useMemo, useState } from "react";
import type { PluginSkillMetric } from "../../shared/types";
import {
  buildSkillOptimizationPrompt,
  fmtDuration,
  fmtK,
  fmtPct,
  fmtUsd
} from "../format";

interface Props {
  title?: string;
  subtitle?: string;
  metrics: PluginSkillMetric[];
  showProjectsColumn?: boolean;
  defaultLimit?: number;
  scopeLabel?: string;
  canSendMessage?: boolean;
  onOptimizeSkill?: (metric: PluginSkillMetric, prompt: string) => void;
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
  canSendMessage = false,
  onOptimizeSkill
}) => {
  const [filter, setFilter] = useState<KindFilter>("All");
  const [basis, setBasis] = useState<ImpactBasis>("spend");
  const [showAll, setShowAll] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

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

          {hasMore && defaultLimit && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? `Show top ${defaultLimit}`
                : `Show all (${sortedAndFiltered.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Plugin / Skill</th>
              <th>
                {basis === "spend" ? "Share of Spend" : "Share of Context"}
              </th>
              <th className="text-right">Active Time</th>
              <th className="text-right">Context (Instr / Exec)</th>
              <th className="text-right">Calls</th>
              <th className="text-right">
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
                              title={m.warnings.join(", ")}
                            >
                              {m.warnings[0]}
                              {m.warningCount > 1
                                ? ` +${m.warningCount - 1}`
                                : ""}
                            </span>
                          )}
                          {m.errors > 0 && (
                            <span className="badge badge-danger">
                              {m.errors} err
                            </span>
                          )}
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
                                    <th>Sub-Skill / Tool</th>
                                    <th>Type</th>
                                    <th className="text-right">Driven Spend</th>
                                    <th className="text-right">Active Time</th>
                                    <th className="text-right">Instr / Exec</th>
                                    <th className="text-right">Calls</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {m.children.map((ch) => (
                                    <tr key={ch.key}>
                                      <td>
                                        <strong>{ch.name}</strong>
                                        {ch.isUnusedLoad && (
                                          <span
                                            className="badge badge-warning"
                                            style={{ marginLeft: 6 }}
                                          >
                                            Unused load
                                          </span>
                                        )}
                                        {ch.duplicateReads > 0 && (
                                          <span
                                            className="badge badge-warning"
                                            style={{ marginLeft: 6 }}
                                          >
                                            {ch.duplicateReads + 1}× read
                                          </span>
                                        )}
                                        {ch.errors > 0 && (
                                          <span
                                            className="badge badge-danger"
                                            style={{ marginLeft: 6 }}
                                          >
                                            {ch.errors} err
                                          </span>
                                        )}
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
                                  ))}
                                </tbody>
                              </table>
                            )}

                            {m.prescription && (
                              <div className="drilldown-rx">
                                <strong>Optimization tip:</strong>{" "}
                                {m.prescription}
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
