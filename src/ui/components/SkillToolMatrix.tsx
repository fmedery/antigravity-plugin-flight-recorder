import React, { useMemo, useState } from "react";
import type { SkillToolMetric } from "../../shared/types";
import { fmtDuration, fmtK, fmtUsd } from "../format";

interface Props {
  metrics: SkillToolMetric[];
}

type CategoryFilter = "All" | "Skill" | "Tool" | "MCP" | "Subagent";
type SortField = "compoundedCacheTokens" | "directTokens" | "totalDurationMs" | "calls";

export const SkillToolMatrix: React.FC<Props> = ({ metrics }) => {
  const [filter, setFilter] = useState<CategoryFilter>("All");
  const [sortBy, setSortBy] = useState<SortField>("compoundedCacheTokens");
  const [sortDesc, setSortDesc] = useState(true);

  const filtered = useMemo(() => {
    const base =
      filter === "All"
        ? metrics
        : metrics.filter((m) => m.category === filter);
    return [...base].sort((a, b) => {
      const diff = a[sortBy] - b[sortBy];
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

  const badgeClass = (cat: SkillToolMetric["category"]): string => {
    switch (cat) {
      case "Skill":
        return "badge badge-warning";
      case "MCP":
        return "badge badge-info";
      case "Subagent":
        return "badge badge-success";
      default:
        return "badge badge-neutral";
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
          {(["All", "Skill", "Tool", "MCP", "Subagent"] as CategoryFilter[]).map(
            (cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`tab-pill ${filter === cat ? "active" : ""}`}
              >
                {cat === "All" ? `All (${metrics.length})` : `${cat}s`}
              </button>
            )
          )}
        </div>
        <span style={{ fontSize: 12, color: "var(--txt-tertiary)" }}>
          Click column headers to sort
        </span>
      </div>

      <div className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th
                  className="text-right"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("calls")}
                >
                  Calls {sortBy === "calls" ? (sortDesc ? "↓" : "↑") : ""}
                </th>
                <th
                  className="text-right"
                  style={{ cursor: "pointer" }}
                  title="Merged wall-clock time (includes tool argument streaming and execution)"
                  onClick={() => toggleSort("totalDurationMs")}
                >
                  Wall Time {sortBy === "totalDurationMs" ? (sortDesc ? "↓" : "↑") : ""}
                </th>
                <th
                  className="text-right"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("directTokens")}
                >
                  Direct {sortBy === "directTokens" ? (sortDesc ? "↓" : "↑") : ""}
                </th>
                <th
                  className="text-right"
                  style={{ cursor: "pointer" }}
                  onClick={() => toggleSort("compoundedCacheTokens")}
                >
                  Compounded Carry{" "}
                  {sortBy === "compoundedCacheTokens" ? (sortDesc ? "↓" : "↑") : ""}
                </th>
                <th className="text-right">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ color: "var(--txt-tertiary)", padding: 14 }}>
                    No items in this category.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const pct = Math.max(
                    4,
                    Math.round(
                      ((m.compoundedCacheTokens + m.directTokens) / maxImpact) * 100
                    )
                  );
                  return (
                    <tr key={m.key}>
                      <td>
                        <strong>{m.name}</strong>
                        {m.pluginOrServer && (
                          <span
                            style={{
                              marginLeft: 6,
                              color: "var(--txt-tertiary)",
                              fontSize: 12
                            }}
                          >
                            ({m.pluginOrServer})
                          </span>
                        )}
                        {m.errors > 0 && (
                          <span
                            className="badge badge-danger"
                            style={{ marginLeft: 6 }}
                          >
                            {m.errors} err
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={badgeClass(m.category)}>{m.category}</span>
                      </td>
                      <td className="text-right tabular">{m.calls}</td>
                      <td className="text-right tabular">
                        {fmtDuration(m.totalDurationMs)}
                      </td>
                      <td className="text-right tabular">
                        +{fmtK(m.directTokens)}
                      </td>
                      <td className="text-right">
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
                          <span className="tabular" style={{ minWidth: 46, fontWeight: 600 }}>
                            +{fmtK(m.compoundedCacheTokens)}
                          </span>
                        </div>
                      </td>
                      <td className="text-right tabular">
                        {fmtUsd(m.estimatedCostUsd)}
                      </td>
                    </tr>
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
