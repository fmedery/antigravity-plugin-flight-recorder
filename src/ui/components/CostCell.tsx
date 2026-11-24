import React from "react";
import { fmtUsdCompact } from "../format";

interface CostCellProps {
  estimatedCostUsd: number | null;
  unpricedModels?: string[];
}

export const CostCell: React.FC<CostCellProps> = ({
  estimatedCostUsd,
  unpricedModels = []
}) => {
  const unpricedCount = unpricedModels.length;
  const unpricedTitle =
    unpricedCount > 0
      ? `Unpriced model${unpricedCount === 1 ? "" : "s"}: ${unpricedModels.join(", ")}`
      : "No pricing rule configured for these model(s)";

  if (estimatedCostUsd === null) {
    return (
      <span className="cost-unpriced" title={unpricedTitle}>
        Unpriced
      </span>
    );
  }

  return (
    <div className="cost-cell">
      <div className="cost-amount">{fmtUsdCompact(estimatedCostUsd)}</div>
      {unpricedCount > 0 && (
        <div className="cell-sub cost-partial" title={unpricedTitle}>
          +{unpricedCount} unpriced
        </div>
      )}
    </div>
  );
};
