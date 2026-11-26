import React from "react";
import {
  PCT_SCALE_BANDS,
  classifyPctStatus,
  type PctScaleKind
} from "../format";
import { KpiPopover, PctScaleLegend } from "./KpiPopover";

export interface KpiStatusPillProps {
  kind: PctScaleKind;
  ratio: number;
  pillLabel: string;
  title: string;
  detail: string;
}

export const KpiStatusPill: React.FC<KpiStatusPillProps> = ({
  kind,
  ratio,
  pillLabel,
  title,
  detail
}) => {
  const status = classifyPctStatus(kind, ratio);
  const bands = PCT_SCALE_BANDS[kind];

  return (
    <KpiPopover
      idPrefix={`kpi-status-${kind}`}
      triggerClassName={`badge badge-${status.tone} kpi-status-pill`}
      triggerAriaLabel={`${pillLabel} — ${status.label} (${status.colorLabel}). Show color scale`}
      triggerContent={
        <>
          <span className="kpi-status-glyph" aria-hidden="true">
            {status.glyph}
          </span>
          <span>{pillLabel}</span>
        </>
      }
    >
      <div className="kpi-help-title kpi-status-pop-head">
        <span>{title}</span>
        <span className={`badge badge-${status.tone} kpi-status-pop-badge`}>
          <span className="kpi-status-glyph" aria-hidden="true">
            {status.glyph}
          </span>
          <span>
            {status.label} ({status.pct}%)
          </span>
        </span>
      </div>
      <div className="kpi-help-row">{detail}</div>
      <PctScaleLegend
        title="Color scale"
        bands={bands}
        activeTone={status.tone}
      />
    </KpiPopover>
  );
};
