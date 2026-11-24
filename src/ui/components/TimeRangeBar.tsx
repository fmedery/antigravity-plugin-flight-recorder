import React, { useEffect, useRef } from "react";
import { TIME_RANGE_PRESETS } from "../../shared/timeRange.js";
import type { TimeRangePreset, TimeRangeWindow } from "../../shared/types.js";
import { formatTimeRangeSummary } from "../format.js";

interface TimeRangeBarProps {
  value: TimeRangePreset;
  timeRange: TimeRangeWindow;
  hasActivity: boolean;
  loading?: boolean;
  onChange: (preset: TimeRangePreset) => void;
}

export const TimeRangeBar: React.FC<TimeRangeBarProps> = ({
  value,
  timeRange,
  hasActivity,
  loading = false,
  onChange
}) => {
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const summary = formatTimeRangeSummary(timeRange, hasActivity);

  useEffect(() => {
    const bar = toolbarRef.current;
    if (
      !bar ||
      typeof HTMLElement === "undefined" ||
      "focusGroup" in HTMLElement.prototype
    ) {
      return;
    }

    const buttons = Array.from(
      bar.querySelectorAll<HTMLButtonElement>("button")
    );
    if (buttons.length === 0) return;

    const activeEl = document.activeElement;
    const focusedIdx = buttons.findIndex((b) => b === activeEl);
    const pressedIdx = buttons.findIndex(
      (b) => b.getAttribute("aria-pressed") === "true"
    );
    const initialIdx =
      focusedIdx >= 0 ? focusedIdx : pressedIdx >= 0 ? pressedIdx : 0;

    buttons.forEach((b, i) => {
      b.tabIndex = i === initialIdx ? 0 : -1;
    });

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target;
      if (!(target instanceof HTMLButtonElement)) return;
      if (!buttons.includes(target)) return;
      buttons.forEach((b) => {
        b.tabIndex = b === target ? 0 : -1;
      });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const current = e.target;
      if (!(current instanceof HTMLButtonElement)) return;
      const idx = buttons.indexOf(current);
      if (idx === -1) return;

      const rtl = getComputedStyle(bar).direction === "rtl";
      let nextIdx: number | null = null;
      if (e.key === "ArrowRight") {
        const delta = rtl ? -1 : 1;
        nextIdx = (idx + delta + buttons.length) % buttons.length;
      } else if (e.key === "ArrowLeft") {
        const delta = rtl ? 1 : -1;
        nextIdx = (idx + delta + buttons.length) % buttons.length;
      } else if (e.key === "Home") {
        nextIdx = 0;
      } else if (e.key === "End") {
        nextIdx = buttons.length - 1;
      }

      if (nextIdx === null) return;
      e.preventDefault();
      const targetBtn = buttons[nextIdx];
      buttons.forEach((b, i) => {
        b.tabIndex = i === nextIdx ? 0 : -1;
      });
      targetBtn.focus();
    };

    bar.addEventListener("focusin", onFocusIn);
    bar.addEventListener("keydown", onKeyDown);
    return () => {
      bar.removeEventListener("focusin", onFocusIn);
      bar.removeEventListener("keydown", onKeyDown);
    };
  }, [value]);

  return (
    <div className="time-range-bar">
      <div className="time-range-meta">
        <span className="time-range-label">{summary.label}</span>
        <span className="time-range-sep" aria-hidden="true">
          ·
        </span>
        <span className="time-range-span tabular">
          {summary.span ?? "No recorded activity"}
        </span>
        <span className="time-range-loading" role="status">
          {loading ? "Updating…" : ""}
        </span>
      </div>

      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Time range"
        className="time-range-toolbar"
        {...({ focusgroup: "toolbar wrap" } as Record<string, string>)}
      >
        <div
          role="group"
          aria-label="Time range presets"
          className="time-range-group"
        >
          {TIME_RANGE_PRESETS.map((opt) => {
            const active = opt.key === value;
            return (
              <button
                key={opt.key}
                type="button"
                className="time-range-btn"
                aria-pressed={active}
                aria-disabled={loading ? "true" : undefined}
                onClick={() => {
                  if (loading || active) return;
                  onChange(opt.key);
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
