import React, { useState } from "react";
import {
  DEFAULT_PRICING_RULES,
  describePricingRuleSource,
  getModelAvailability,
  isDefaultRetiredModelPattern,
  isUnpriceablePlaceholderModel,
  matchesModelPattern
} from "../../shared/pricing";
import type {
  ModelAvailabilitySignal,
  ModelAvailabilityStatus,
  ModelPricingRule
} from "../../shared/types";

interface Props {
  rules: ModelPricingRule[];
  unpricedModels: string[];
  modelSignals?: Record<string, ModelAvailabilitySignal>;
  latestGlobalActivityMs?: number;
  saving: boolean;
  onClose: () => void;
  onSave: (rules: ModelPricingRule[]) => Promise<void>;
}

function resolveRuleAutoStatus(
  pattern: string,
  modelSignals?: Record<string, ModelAvailabilitySignal>,
  latestGlobalActivityMs = 0
): ModelAvailabilityStatus {
  if (isDefaultRetiredModelPattern(pattern)) {
    return {
      status: "retired",
      badge: "Retired",
      reason: "Legacy model family — no longer available"
    };
  }
  if (modelSignals) {
    let bestInactive: ModelAvailabilityStatus | null = null;
    for (const modelName of Object.keys(modelSignals)) {
      if (!matchesModelPattern(modelName, pattern)) continue;
      const st = getModelAvailability(
        modelName,
        [],
        modelSignals,
        latestGlobalActivityMs
      );
      if (st.status === "unavailable") return st;
      if (st.status === "inactive" && !bestInactive) bestInactive = st;
    }
    if (bestInactive) return bestInactive;
  }
  return { status: "active", badge: null, reason: null };
}

export const SettingsModal: React.FC<Props> = ({
  rules,
  unpricedModels,
  modelSignals,
  latestGlobalActivityMs = 0,
  saving,
  onClose,
  onSave
}) => {
  const [draft, setDraft] = useState<ModelPricingRule[]>(() =>
    rules.map((r) => ({ ...r }))
  );

  const updateRule = (
    idx: number,
    patch: Partial<ModelPricingRule>
  ) => {
    setDraft((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const addEmptyRule = (modelName?: string) => {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setDraft((prev) => [
      ...prev,
      {
        id,
        pattern: modelName || "gemini-*",
        label: modelName || "Custom Model",
        inputPer1M: 0,
        cacheReadPer1M: 0,
        outputPer1M: 0,
        enabled: true
      }
    ]);
  };

  const removeRule = (idx: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetDefaults = () => {
    setDraft(DEFAULT_PRICING_RULES.map((r) => ({ ...r })));
  };

  const actionableUnpriced = unpricedModels.filter(
    (m) => !isUnpriceablePlaceholderModel(m)
  );

  const handleSave = async () => {
    const cleaned = draft
      .filter((r) => r.pattern.trim().length > 0)
      .map((r) => ({
        ...r,
        pattern: r.pattern.trim(),
        label: r.label.trim() || r.pattern.trim(),
        inputPer1M: Number.isFinite(r.inputPer1M) ? Math.max(0, r.inputPer1M) : 0,
        cacheReadPer1M: Number.isFinite(r.cacheReadPer1M)
          ? Math.max(0, r.cacheReadPer1M)
          : 0,
        outputPer1M: Number.isFinite(r.outputPer1M)
          ? Math.max(0, r.outputPer1M)
          : 0,
        ...(typeof r.retired === "boolean" ? { retired: r.retired } : {})
      }));
    await onSave(cleaned);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="USD Pricing Settings">
      <div className="modal-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 10,
            borderBottom: "1px solid var(--bdr-secondary)"
          }}
        >
          <div>
            <strong style={{ fontSize: 15 }}>Model USD Pricing (per 1M tokens)</strong>
            <div style={{ fontSize: 12, color: "var(--txt-secondary)", marginTop: 2 }}>
              Local API-equivalent estimates only — never live-fetched and not Antigravity plan or AI-credit billing. Unavailable/retired models are auto-detected (use <strong>Retired</strong> to override).
            </div>
          </div>
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="pricing-source-note">
          <strong>Price sources:</strong> Built-in defaults (<code>Gemini API</code>,{" "}
          <code>Anthropic API</code>) are static public API standard-tier (≤200k)
          reference rates bundled with Flight Recorder. Unlisted models remain{" "}
          <code>Unpriced</code>, and newly added rules start at <code>$0</code> so
          you explicitly enter your own rates.
        </div>

        {actionableUnpriced.length > 0 && (
          <div
            style={{
              marginTop: 10,
              padding: "8px 10px",
              borderRadius: 6,
              background: "var(--bg-warning)",
              color: "var(--txt-warning)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 6
            }}
          >
            <span style={{ fontWeight: 600 }}>Unpriced models detected:</span>
            {actionableUnpriced.map((m) => {
              const avail = getModelAvailability(
                m,
                draft,
                modelSignals,
                latestGlobalActivityMs
              );
              return (
                <button
                  key={m}
                  type="button"
                  className="btn btn-sm"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
                  title={avail.reason || `Add a pricing rule for ${m}`}
                  onClick={() => addEmptyRule(m)}
                >
                  <span>+ Add rate for {m}</span>
                  {avail.badge && (
                    <span className="model-retired-tag">{avail.badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>On</th>
                <th title="Optional manual override (auto-detected otherwise)">Retired</th>
                <th>Model Pattern</th>
                <th>Label</th>
                <th title="Whether this rate is a built-in static API reference or user-defined">Source</th>
                <th className="text-right">Input $/1M</th>
                <th className="text-right">Cache $/1M</th>
                <th className="text-right">Output $/1M</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {draft.map((rule, idx) => {
                const sourceMeta = describePricingRuleSource(rule);
                const autoStatus = resolveRuleAutoStatus(
                  rule.pattern,
                  modelSignals,
                  latestGlobalActivityMs
                );
                const isFlagged =
                  rule.retired === true ||
                  (rule.retired === undefined && Boolean(autoStatus.badge));
                const badgeLabel =
                  rule.retired === true
                    ? "Retired"
                    : rule.retired === undefined
                      ? autoStatus.badge
                      : null;
                const badgeTitle =
                  rule.retired === true
                    ? "Marked as retired / no longer available"
                    : autoStatus.reason ?? "Mark model as no longer available";
                return (
                  <tr
                    key={rule.id}
                    className={isFlagged ? "pricing-row-retired" : undefined}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={(e) =>
                          updateRule(idx, { enabled: e.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={isFlagged}
                        aria-label={`Mark ${rule.label || rule.pattern} as retired`}
                        title={
                          rule.retired === undefined && autoStatus.badge
                            ? `Auto-detected (${autoStatus.badge}) — uncheck to mark active`
                            : "Manual override: mark model as no longer available"
                        }
                        onChange={(e) =>
                          updateRule(idx, { retired: e.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="input-field"
                        style={{ width: 145 }}
                        value={rule.pattern}
                        onChange={(e) =>
                          updateRule(idx, { pattern: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <input
                          type="text"
                          className="input-field"
                          style={{ width: 120 }}
                          value={rule.label}
                          onChange={(e) =>
                            updateRule(idx, { label: e.target.value })
                          }
                        />
                        {badgeLabel && (
                          <span
                            className="badge badge-retired"
                            title={badgeTitle}
                          >
                            {badgeLabel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          sourceMeta.kind === "builtin"
                            ? "badge-source-builtin"
                            : "badge-source-custom"
                        }`}
                        title={sourceMeta.detail}
                      >
                        {sourceMeta.label}
                      </span>
                    </td>
                  <td className="text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field text-right tabular"
                      style={{ width: 72 }}
                      value={rule.inputPer1M}
                      onChange={(e) =>
                        updateRule(idx, { inputPer1M: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </td>
                  <td className="text-right">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      className="input-field text-right tabular"
                      style={{ width: 72 }}
                      value={rule.cacheReadPer1M}
                      onChange={(e) =>
                        updateRule(idx, {
                          cacheReadPer1M: parseFloat(e.target.value) || 0
                        })
                      }
                    />
                  </td>
                  <td className="text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field text-right tabular"
                      style={{ width: 72 }}
                      value={rule.outputPer1M}
                      onChange={(e) =>
                        updateRule(idx, {
                          outputPer1M: parseFloat(e.target.value) || 0
                        })
                      }
                    />
                  </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => removeRule(idx)}
                        title="Remove rule"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn" onClick={() => addEmptyRule()}>
              + Add Model Rule
            </button>
            <button type="button" className="btn" onClick={resetDefaults}>
              Reset Defaults
            </button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save Pricing"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
