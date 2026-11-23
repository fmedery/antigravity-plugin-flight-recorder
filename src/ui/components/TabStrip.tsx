import React, { useRef } from "react";

export interface TabItem<T extends string> {
  key: T;
  label: string;
}

interface Props<T extends string> {
  tabs: Array<TabItem<T>>;
  activeKey: T;
  ariaLabel: string;
  idPrefix: string;
  onSelect: (key: T) => void;
}

export function TabStrip<T extends string>({
  tabs,
  activeKey,
  ariaLabel,
  idPrefix,
  onSelect
}: Props<T>): React.ReactElement {
  const tabRefs = useRef<Partial<Record<T, HTMLButtonElement | null>>>({});

  const supportsFocusGroup =
    typeof HTMLElement !== "undefined" &&
    Object.hasOwn(HTMLElement.prototype, "focusGroup");

  const selectTab = (next: T, focusButton = false) => {
    onSelect(next);
    const el = tabRefs.current[next];
    if (el) {
      if (focusButton) el.focus();
      try {
        el.scrollIntoView({
          block: "nearest",
          inline: "nearest",
          container: "nearest"
        } as ScrollIntoViewOptions & { container?: string });
      } catch {
        el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
      }
    }
  };

  return (
    <div
      className="tab-strip"
      role="tablist"
      aria-label={ariaLabel}
      {...({ focusgroup: "tablist nomemory" } as Record<string, string>)}
    >
      {tabs.map((t, idx) => {
        const isActive = activeKey === t.key;
        return (
          <button
            key={t.key}
            ref={(el) => {
              tabRefs.current[t.key] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-${t.key}`}
            aria-selected={isActive}
            className={`tab-pill ${isActive ? "active" : ""}`}
            tabIndex={supportsFocusGroup ? undefined : isActive ? 0 : -1}
            {...(isActive
              ? ({ focusgroupstart: "" } as Record<string, string>)
              : {})}
            onClick={() => selectTab(t.key)}
            onFocus={() => {
              if (activeKey !== t.key) selectTab(t.key);
            }}
            onKeyDown={(e) => {
              if (supportsFocusGroup) return;
              let targetIdx: number | null = null;
              if (e.key === "ArrowRight") {
                targetIdx = (idx + 1) % tabs.length;
              } else if (e.key === "ArrowLeft") {
                targetIdx = (idx - 1 + tabs.length) % tabs.length;
              } else if (e.key === "Home") {
                targetIdx = 0;
              } else if (e.key === "End") {
                targetIdx = tabs.length - 1;
              }
              if (targetIdx !== null) {
                e.preventDefault();
                selectTab(tabs[targetIdx].key, true);
              }
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
