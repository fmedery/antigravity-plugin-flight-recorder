import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { KPI_HELP_COPY, type KpiHelpKey } from "../format";

interface Props {
  helpKey: KpiHelpKey;
}

let hintFallbackRegistered = false;

function ensurePopoverHintFallback(): void {
  if (hintFallbackRegistered || typeof document === "undefined") return;
  hintFallbackRegistered = true;
  try {
    const probe = document.createElement("div") as HTMLDivElement & { popover?: string };
    probe.setAttribute("popover", "hint");
    if (probe.popover !== "hint") {
      document.addEventListener(
        "beforetoggle",
        (ev) => {
          const e = ev as Event & { newState?: string };
          const target = e.target as (HTMLElement & { popover?: string }) | null;
          if (
            target &&
            target.getAttribute?.("popover") === "hint" &&
            e.newState === "open"
          ) {
            target.popover = "auto";
          }
        },
        true
      );
    }
  } catch {
    // Ignore in environments without Popover API
  }
}

export const KpiHelpTip: React.FC<Props> = ({ helpKey }) => {
  const reactId = useId();
  const tipId = `kpi-tip-${helpKey}-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const anchorName = `--${tipId}`;
  const info = KPI_HELP_COPY[helpKey];
  const [open, setOpen] = useState(false);
  const [fallbackPos, setFallbackPos] = useState<{ top: number; left: number } | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<
    (HTMLDivElement & { showPopover?: (opts?: { source?: HTMLElement | null }) => void; hidePopover?: () => void }) | null
  >(null);

  const supportsNativeInterest =
    typeof HTMLButtonElement !== "undefined" &&
    "interestForElement" in HTMLButtonElement.prototype;

  const supportsCssAnchor =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("position-area: block-end");

  useEffect(() => {
    ensurePopoverHintFallback();
  }, []);

  const updateFallbackPosition = useCallback(() => {
    if (supportsCssAnchor || !btnRef.current || typeof window === "undefined") return;
    const rect = btnRef.current.getBoundingClientRect();
    const tooltipWidth = 272;
    const left = Math.max(
      8,
      Math.min(rect.left - 8, window.innerWidth - tooltipWidth - 8)
    );
    const top = rect.bottom + 6;
    setFallbackPos({ top, left });
  }, [supportsCssAnchor]);

  useEffect(() => {
    const el = popRef.current;
    if (!el) return;
    const onToggle = (ev: Event) => {
      const e = ev as Event & { newState?: string };
      if (typeof e.newState === "string") {
        const isOpen = e.newState === "open";
        setOpen(isOpen);
        if (isOpen) updateFallbackPosition();
      }
    };
    el.addEventListener("toggle", onToggle);
    return () => el.removeEventListener("toggle", onToggle);
  }, [updateFallbackPosition]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        try {
          popRef.current?.hidePopover?.();
        } catch {
          // Ignore if already closed
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const cancelScheduledClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelScheduledClose();
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      if (!supportsNativeInterest) {
        try {
          popRef.current?.hidePopover?.();
        } catch {
          // Ignore
        }
      }
    }, 130);
  };

  const handleOpen = () => {
    cancelScheduledClose();
    updateFallbackPosition();
    if (!supportsNativeInterest) {
      setOpen(true);
      try {
        popRef.current?.showPopover?.({ source: btnRef.current });
      } catch {
        try {
          popRef.current?.showPopover?.();
        } catch {
          // Ignore if already open or Popover API absent
        }
      }
    }
  };

  return (
    <span
      className="kpi-help-wrap"
      onMouseEnter={handleOpen}
      onMouseLeave={scheduleClose}
      onFocus={handleOpen}
      onBlur={scheduleClose}
    >
      <button
        ref={btnRef}
        type="button"
        className="kpi-help-btn"
        aria-label={`About ${info.title}`}
        aria-expanded={open}
        aria-describedby={tipId}
        style={
          supportsCssAnchor
            ? ({ anchorName } as React.CSSProperties)
            : undefined
        }
        onClick={(e) => {
          e.stopPropagation();
          handleOpen();
        }}
        {...({
          interestfor: tipId,
          popovertarget: tipId,
          popovertargetaction: "show"
        } as Record<string, string>)}
      >
        <span className="kpi-help-glyph" aria-hidden="true">
          ?
        </span>
      </button>
      <div
        ref={popRef}
        id={tipId}
        role="tooltip"
        className={`kpi-help-popover ${open ? "is-fallback-open" : ""}`}
        style={
          supportsCssAnchor
            ? ({ positionAnchor: anchorName } as React.CSSProperties)
            : fallbackPos
              ? { top: `${fallbackPos.top}px`, left: `${fallbackPos.left}px` }
              : undefined
        }
        onMouseEnter={handleOpen}
        onMouseLeave={scheduleClose}
        {...({ popover: "hint" } as Record<string, string>)}
      >
        <div className="kpi-help-title">{info.title}</div>
        <div className="kpi-help-row">
          <strong>What it means:</strong> {info.meaning}
        </div>
        <div className="kpi-help-row kpi-help-impact">
          <strong>Impact:</strong> {info.impact}
        </div>
      </div>
    </span>
  );
};
