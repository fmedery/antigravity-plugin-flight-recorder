import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { PctScaleBand, StatusBadgeTone } from "../format";

let hintFallbackRegistered = false;

function hasNativePopover(): boolean {
  return (
    typeof HTMLElement !== "undefined" &&
    Object.hasOwn(HTMLElement.prototype, "popover")
  );
}

function escapeAttrSelectorValue(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/([^\w-])/g, "\\$1");
}

function ensurePopoverHintFallback(): void {
  if (
    hintFallbackRegistered ||
    typeof document === "undefined" ||
    !hasNativePopover()
  ) {
    return;
  }
  hintFallbackRegistered = true;
  try {
    const probe = document.createElement("div") as HTMLDivElement & {
      popover?: string;
    };
    probe.popover = "hint";
    if (probe.popover !== "hint") {
      document.addEventListener(
        "beforetoggle",
        (ev) => {
          const e = ev as Event & { newState?: string };
          const target = e.target as (HTMLElement & { popover?: string }) | null;
          if (
            e.newState === "open" &&
            target &&
            target.getAttribute?.("popover") === "hint" &&
            target.id &&
            document.querySelector(
              `[popovertarget="${escapeAttrSelectorValue(target.id)}"]`
            )
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

export interface KpiPopoverProps {
  idPrefix: string;
  triggerClassName: string;
  triggerAriaLabel: string;
  triggerContent: React.ReactNode;
  children: React.ReactNode;
}

export const KpiPopover: React.FC<KpiPopoverProps> = ({
  idPrefix,
  triggerClassName,
  triggerAriaLabel,
  triggerContent,
  children
}) => {
  const reactId = useId();
  const safeSuffix = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
  const tipId = `${idPrefix}-${safeSuffix}`;
  const anchorName = `--${tipId}`;

  const [open, setOpen] = useState(false);
  const [fallbackPos, setFallbackPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const closeTimerRef = useRef<number | null>(null);
  const pinnedByClickRef = useRef(false);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<
    | (HTMLDivElement & {
        showPopover?: (opts?: { source?: HTMLElement | null }) => void;
        hidePopover?: () => void;
      })
    | null
  >(null);

  const supportsPopover = hasNativePopover();

  const supportsNativeInterest =
    typeof HTMLButtonElement !== "undefined" &&
    "interestForElement" in HTMLButtonElement.prototype;

  const supportsCssAnchor =
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("position-area: block-end");

  const cancelScheduledClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    ensurePopoverHintFallback();
    return () => cancelScheduledClose();
  }, [cancelScheduledClose]);

  const updateFallbackPosition = useCallback(() => {
    if (supportsCssAnchor || !btnRef.current || typeof window === "undefined") {
      return;
    }
    const rect = btnRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(304, window.innerWidth - 16);
    const left = Math.max(
      8,
      Math.min(rect.left - 8, window.innerWidth - tooltipWidth - 8)
    );
    const popHeight = popRef.current?.offsetHeight || 168;
    const fitsBelow = rect.bottom + 6 + popHeight <= window.innerHeight - 8;
    const fitsAbove = rect.top - 6 - popHeight >= 8;
    const top =
      !fitsBelow && fitsAbove ? rect.top - popHeight - 6 : rect.bottom + 6;
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
        if (isOpen) {
          updateFallbackPosition();
        } else {
          pinnedByClickRef.current = false;
        }
      }
    };
    el.addEventListener("toggle", onToggle);
    return () => el.removeEventListener("toggle", onToggle);
  }, [updateFallbackPosition]);

  useEffect(() => {
    if (!open || supportsCssAnchor || typeof window === "undefined") return;
    const onReposition = () => updateFallbackPosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, supportsCssAnchor, updateFallbackPosition]);

  useEffect(() => {
    if (!open || supportsPopover || typeof document === "undefined") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        pinnedByClickRef.current = false;
        setOpen(false);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        pinnedByClickRef.current = false;
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, supportsPopover]);

  const openPopoverFallback = useCallback(() => {
    cancelScheduledClose();
    updateFallbackPosition();
    if (supportsPopover) {
      let alreadyOpen = false;
      try {
        alreadyOpen = Boolean(popRef.current?.matches?.(":popover-open"));
      } catch {
        alreadyOpen = false;
      }
      if (!alreadyOpen) {
        try {
          popRef.current?.showPopover?.({ source: btnRef.current });
        } catch {
          try {
            popRef.current?.showPopover?.();
          } catch {
            // Ignore if already open or Popover API unavailable
          }
        }
      }
    } else {
      setOpen(true);
    }
  }, [cancelScheduledClose, supportsPopover, updateFallbackPosition]);

  const closePopoverFallback = useCallback(() => {
    cancelScheduledClose();
    pinnedByClickRef.current = false;
    if (supportsPopover) {
      try {
        popRef.current?.hidePopover?.();
      } catch {
        // Ignore if already closed
      }
    } else {
      setOpen(false);
    }
  }, [cancelScheduledClose, supportsPopover]);

  const handlePointerEnter = () => {
    if (supportsNativeInterest) return;
    openPopoverFallback();
  };

  const handleFocus = () => {
    if (supportsNativeInterest) return;
    openPopoverFallback();
  };

  const handlePointerLeave = () => {
    if (supportsNativeInterest || pinnedByClickRef.current) return;
    cancelScheduledClose();
    closeTimerRef.current = window.setTimeout(() => {
      closePopoverFallback();
    }, 160);
  };

  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    if (supportsNativeInterest) return;
    const nextTarget = e.relatedTarget as Node | null;
    if (nextTarget && e.currentTarget.contains(nextTarget)) return;
    if (nextTarget !== null) {
      closePopoverFallback();
      return;
    }
    if (!pinnedByClickRef.current) {
      cancelScheduledClose();
      closeTimerRef.current = window.setTimeout(() => {
        closePopoverFallback();
      }, 160);
    }
  };

  return (
    <span
      ref={wrapRef}
      className="kpi-help-wrap"
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <button
        ref={btnRef}
        type="button"
        className={triggerClassName}
        aria-label={triggerAriaLabel}
        aria-expanded={open}
        style={
          supportsCssAnchor
            ? ({ anchorName } as React.CSSProperties)
            : undefined
        }
        onClick={(e) => {
          e.stopPropagation();
          if (!supportsNativeInterest) {
            pinnedByClickRef.current = true;
            openPopoverFallback();
          }
        }}
        {...({
          interestfor: tipId,
          popovertarget: tipId,
          popovertargetaction: "show"
        } as Record<string, string>)}
      >
        {triggerContent}
      </button>
      <div
        ref={popRef}
        id={tipId}
        role="tooltip"
        className={`kpi-help-popover ${
          !supportsPopover && open ? "is-fallback-open" : ""
        }`}
        style={
          supportsCssAnchor
            ? ({ positionAnchor: anchorName } as React.CSSProperties)
            : fallbackPos
              ? { top: `${fallbackPos.top}px`, left: `${fallbackPos.left}px` }
              : undefined
        }
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        {...({ popover: "hint" } as Record<string, string>)}
      >
        {children}
      </div>
    </span>
  );
};

export interface PctScaleLegendProps {
  title?: string;
  bands: readonly PctScaleBand[];
  activeTone?: StatusBadgeTone;
}

export const PctScaleLegend: React.FC<PctScaleLegendProps> = ({
  title,
  bands,
  activeTone
}) => (
  <div className="kpi-scale-legend">
    {title && <div className="kpi-scale-title">{title}</div>}
    <ul className="kpi-scale-list" role="list">
      {bands.map((band) => {
        const isActive = activeTone === band.tone;
        return (
          <li
            key={band.tone}
            className={`kpi-scale-item kpi-scale-tone-${band.tone}${
              isActive ? " is-active" : ""
            }`}
          >
            <span className="kpi-scale-color">
              <span className="kpi-status-glyph" aria-hidden="true">
                {band.glyph}
              </span>
              <span>{band.colorLabel}</span>
            </span>
            <span className="kpi-scale-range tabular">{band.range}</span>
            <span className="kpi-scale-label">{band.label}</span>
          </li>
        );
      })}
    </ul>
  </div>
);
