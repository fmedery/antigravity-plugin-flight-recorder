import React from "react";
import { KPI_HELP_COPY, type KpiHelpKey } from "../format";
import { KpiPopover, PctScaleLegend } from "./KpiPopover";

interface Props {
  helpKey: KpiHelpKey;
}

export const KpiHelpTip: React.FC<Props> = ({ helpKey }) => {
  const info = KPI_HELP_COPY[helpKey];

  return (
    <KpiPopover
      idPrefix={`kpi-tip-${helpKey}`}
      triggerClassName="kpi-help-btn"
      triggerAriaLabel={`More about ${info.title}`}
      triggerContent={
        <span className="kpi-help-glyph" aria-hidden="true">
          ?
        </span>
      }
    >
      <div className="kpi-help-title">{info.title}</div>
      <div className="kpi-help-row">
        <strong>What it means:</strong> {info.meaning}
      </div>
      <div className="kpi-help-row kpi-help-impact">
        <strong>Impact for you:</strong> {info.impact}
      </div>
      {info.legend && (
        <PctScaleLegend
          title={info.legend.title}
          bands={info.legend.bands}
        />
      )}
    </KpiPopover>
  );
};
