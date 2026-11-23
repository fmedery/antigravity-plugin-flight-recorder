import React, { useState } from "react";
import { DEFAULT_PRICING_RULES } from "../../shared/pricing";
import type { ModelPricingRule } from "../../shared/types";

interface Props {
  rules: ModelPricingRule[];
  unpricedModels: string[];
  saving: boolean;
  onClose: () => void;
  onSave: (rules: ModelPricingRule[]) => Promise<void>;
}

export const SettingsModal: React.FC<Props> = ({
  rules,
  unpricedModels,
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
        inputPer1M: 1.25,
        cacheReadPer1M: 0.3125,
        outputPer1M: 10.0,
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
          : 0
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
              Costs are local estimates only. Models without a matching rule display as{" "}
              <strong>Unpriced</strong>.
            </div>
          </div>
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {unpricedModels.length > 0 && (
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
            {unpricedModels.map((m) => (
              <button
                key={m}
                type="button"
                className="btn btn-sm"
                onClick={() => addEmptyRule(m)}
              >
                + Add rate for {m}
              </button>
            ))}
          </div>
        )}

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>On</th>
                <th>Model Pattern</th>
                <th>Label</th>
                <th className="text-right">Input $/1M</th>
                <th className="text-right">Cache $/1M</th>
                <th className="text-right">Output $/1M</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {draft.map((rule, idx) => (
                <tr key={rule.id}>
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
                    <input
                      type="text"
                      className="input-field"
                      style={{ width: 120 }}
                      value={rule.label}
                      onChange={(e) =>
                        updateRule(idx, { label: e.target.value })
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
              ))}
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
