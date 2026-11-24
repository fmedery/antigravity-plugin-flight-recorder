import React, { useMemo, useState } from "react";
import type { SkillToolMetric } from "../../shared/types";
import {
  buildErrorTroubleshootingPrompt,
  describeErrorBadge,
  fmtDuration,
  fmtK
} from "../format";
import { CostCell } from "./CostCell";
import { ErrorGuidanceBlock } from "./ErrorGuidanceBlock";

interface Props {
  metrics: SkillToolMetric[];
  scopeLabel?: string;
  currentConversationId?: string;
  canSendMessage?: boolean;
  onSelectChat?: (conversationId: string, stepIndex?: number) => void;
  onJumpToStep?: (stepIndex: number) => void;
  onTroubleshootPrompt?: (prompt: string) => void;
}

type CategoryFilter = "All" | "Skill" | "Tool" | "MCP" | "Subagent";
type SortField = "context" | "totalDurationMs";

export const SkillToolMatrix: React.FC<Props> = ({
  metrics,
  scopeLabel = "current scope",
  currentConversationId,
  canSendMessage = false,
  onSelectChat,
  onJumpToStep,
  onTroubleshootPrompt
}) => {
  const [filter, setFilter] = useState<CategoryFilter>("All");
  const [sortBy, setSortBy] = useState<SortField>("context");
  const [sortDesc, setSortDesc] = useState(true);
  const [expandedErrorKeys, setExpandedErrorKeys] = useState<Set<string>>(
    () => new Set()
  );

  const hasAnyErrors = useMemo(
    () => metrics.some((m) => m.errors > 0),
    [metrics]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<Exclude<CategoryFilter, "All">, number> = {
      Skill: 0,
      Tool: 0,
      MCP: 0,
      Subagent: 0
    };
    for (const m of metrics) {
      counts[m.category] += 1;
    }
    return counts;
  }, [metrics]);

  const visibleCategories = useMemo(() => {
    const list: CategoryFilter[] = ["All"];
    for (const cat of ["Skill", "Tool", "MCP", "Subagent"] as const) {
      if (categoryCounts[cat] > 0) list.push(cat);
    }
    return list;
  }, [categoryCounts]);

  const filtered = useMemo(() => {
    const base =
      filter === "All"
        ? metrics
        : metrics.filter((m) => m.category === filter);
    return [...base].sort((a, b) => {
      const aVal =
        sortBy === "context"
          ? a.compoundedCacheTokens + a.directTokens
          : a.totalDurationMs;
      const bVal =
        sortBy === "context"
          ? b.compoundedCacheTokens + b.directTokens
          : b.totalDurationMs;
      const diff = aVal - bVal;
      return sortDesc ? -diff : diff;
    });
  }, [metrics, filter, sortBy, sortDesc]);

  const maxImpact = useMemo(
    () =>
      Math.max(
        1,
        ...metrics.map((m) => m.compoundedCacheTokens + m.directTokens)
      ),
    [metrics]
  );

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDesc((prev) => !prev);
    } else {
      setSortBy(field);
      setSortDesc(true);
    }
  };

  const toggleErrorRow = (key: string) => {
    setExpandedErrorKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const categoryColor = (cat: SkillToolMetric["category"]): string => {
    switch (cat) {
      case "Skill":
        return "var(--chart-skill)";
      case "MCP":
        return "var(--chart-output)";
      case "Subagent":
        return "var(--chart-subagent)";
      default:
        return "var(--chart-cache)";
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginTop: 10
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {visibleCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`tab-pill ${filter === cat ? "active" : ""}`}
            >
              {cat === "All" ? `All (${metrics.length})` : `${cat}s`}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "var(--txt-tertiary)" }}>
          {hasAnyErrors
            ? "Click column headers to sort · click red err badges for details"
            : "Click column headers to sort"}
        </span>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Tool / Skill</th>
                <th
                  scope="col"
                  className="text-right"
                  style={{ cursor: "pointer" }}
                  title="Merged wall-clock time (includes tool argument streaming and execution)"
                  onClick={() => toggleSort("totalDurationMs")}
                >
                  Wall Time {sortBy === "totalDurationMs" ? (sortDesc ? "↓" : "↑") : ""}
                </th>
                <th
                  scope="col"
                  className="text-right"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("context")}
                >
                  Context Impact{" "}
                  {sortBy === "context" ? (sortDesc ? "↓" : "↑") : ""}
                </th>
                <th scope="col" className="text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "var(--txt-tertiary)", padding: 14 }}>
                    No items in this category.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const totalContextTok =
                    m.compoundedCacheTokens + m.directTokens;
                  const pct = Math.max(
                    4,
                    Math.round((totalContextTok / maxImpact) * 100)
                  );
                  const isErrOpen = expandedErrorKeys.has(m.key);
                  return (
                    <React.Fragment key={m.key}>
                      <tr>
                        <td>
                          <div>
                            <strong>{m.name}</strong>
                            {m.errors > 0 && (() => {
                              const errGuidance = describeErrorBadge(
                                m.category,
                                m.errors,
                                m.name,
                                m.errorSamples
                              );
                              return (
                                <button
                                  type="button"
                                  className="badge badge-danger badge-btn"
                                  style={{ marginLeft: 6 }}
                                  aria-expanded={isErrOpen}
                                  aria-label={`${m.errors} err on ${m.name} — inspect errors and remediation`}
                                  title={errGuidance.summary}
                                  onClick={() => toggleErrorRow(m.key)}
                                >
                                  {m.errors} err{" "}
                                  <span aria-hidden="true">
                                    {isErrOpen ? "▾" : "▸"}
                                  </span>
                                </button>
                              );
                            })()}
                          </div>
                          <div className="cell-sub">
                            {m.category}
                            {m.pluginOrServer ? ` · ${m.pluginOrServer}` : ""}
                            {` · ${m.calls} calls`}
                          </div>
                        </td>
                        <td className="text-right tabular">
                          {fmtDuration(m.totalDurationMs)}
                        </td>
                        <td
                          className="text-right"
                          title={`+${fmtK(m.directTokens)} direct / +${fmtK(m.compoundedCacheTokens)} cache carry`}
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              justifyContent: "flex-end"
                            }}
                          >
                            <div
                              style={{
                                width: 72,
                                height: 7,
                                borderRadius: 99,
                                background: "var(--bg-tertiary)",
                                overflow: "hidden"
                              }}
                            >
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: "100%",
                                  background: categoryColor(m.category)
                                }}
                              />
                            </div>
                            <span className="tabular" style={{ minWidth: 52, fontWeight: 600 }}>
                              +{fmtK(totalContextTok)}
                            </span>
                          </div>
                        </td>
                        <td className="text-right tabular">
                          <CostCell estimatedCostUsd={m.estimatedCostUsd} />
                        </td>
                      </tr>
                      {isErrOpen && m.errors > 0 && (
                        <tr className="err-detail-row">
                          <td colSpan={4}>
                            <ErrorGuidanceBlock
                              title={`${m.category}: ${m.name}`}
                              kind={m.category}
                              itemName={m.name}
                              errorCount={m.errors}
                              samples={m.errorSamples}
                              collapsibleSamples={false}
                              currentConversationId={currentConversationId}
                              canSendMessage={canSendMessage}
                              onSelectChat={onSelectChat}
                              onJumpToStep={onJumpToStep}
                              onTroubleshoot={
                                onTroubleshootPrompt
                                  ? () =>
                                      onTroubleshootPrompt(
                                        buildErrorTroubleshootingPrompt({
                                          name: m.name,
                                          kind: m.category,
                                          parentName: m.pluginOrServer ?? undefined,
                                          errorCount: m.errors,
                                          scopeLabel,
                                          samples: m.errorSamples
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
