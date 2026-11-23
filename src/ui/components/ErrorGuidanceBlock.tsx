import React from "react";
import type { ToolErrorSample } from "../../shared/types";
import { describeErrorBadge, type ErrorBadgeKind } from "../format";

interface Props {
  title: string;
  kind: ErrorBadgeKind;
  itemName: string;
  errorCount: number;
  samples?: ToolErrorSample[];
  hint?: string;
  collapsibleSamples?: boolean;
  currentConversationId?: string;
  canSendMessage?: boolean;
  style?: React.CSSProperties;
  onSelectChat?: (conversationId: string, stepIndex?: number) => void;
  onJumpToStep?: (stepIndex: number) => void;
  onTroubleshoot?: () => void;
}

function formatChatButtonLabel(sample: ToolErrorSample): string {
  const stepPart =
    sample.stepIndex !== undefined ? ` (Step ${sample.stepIndex})` : "";
  if (sample.conversationTitle) {
    const clean = sample.conversationTitle.trim();
    const shortTitle = clean.length > 26 ? `${clean.slice(0, 26)}…` : clean;
    return `Inspect "${shortTitle}"${stepPart} →`;
  }
  return `Inspect Chat${stepPart} →`;
}

export const ErrorGuidanceBlock: React.FC<Props> = ({
  title,
  kind,
  itemName,
  errorCount,
  samples,
  hint,
  collapsibleSamples = false,
  currentConversationId,
  canSendMessage = false,
  style,
  onSelectChat,
  onJumpToStep,
  onTroubleshoot
}) => {
  const guidance = describeErrorBadge(kind, errorCount, itemName, samples);
  const sampleList = samples ?? [];

  const renderSamplesList = () => (
    <ul role="list" className="err-sample-list">
      {sampleList.map((s, idx) => {
        const showChildBadge =
          Boolean(s.childName) && (kind === "Plugin" || kind === "Skill");
        const canJumpCurrent = Boolean(
          s.conversationId &&
            currentConversationId &&
            s.conversationId === currentConversationId &&
            s.stepIndex !== undefined &&
            onJumpToStep
        );
        const canOpenChat = Boolean(!canJumpCurrent && s.conversationId && onSelectChat);

        return (
          <li
            key={`${s.toolName}-${s.stepIndex ?? idx}-${idx}`}
            className="err-sample-item"
          >
            <div className="err-sample-meta">
              {showChildBadge && (
                <span className="badge badge-neutral">
                  {s.childKind ? `${s.childKind}: ` : ""}
                  {s.childName}
                </span>
              )}
              <span className="badge badge-info">{s.toolName}</span>
              {s.target && (
                <span className="err-sample-target" title={s.target}>
                  {s.target}
                </span>
              )}
              {s.count > 1 && (
                <span className="badge badge-danger">{s.count}×</span>
              )}
              {canJumpCurrent && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ marginLeft: "auto" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onJumpToStep!(s.stepIndex!);
                  }}
                >
                  Inspect Step {s.stepIndex}
                </button>
              )}
              {canOpenChat && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ marginLeft: "auto" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectChat!(s.conversationId!, s.stepIndex);
                  }}
                >
                  {formatChatButtonLabel(s)}
                </button>
              )}
              {!canJumpCurrent &&
                !canOpenChat &&
                (s.conversationTitle || s.stepIndex !== undefined) && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: "var(--txt-tertiary)"
                    }}
                  >
                    {s.conversationTitle ? `${s.conversationTitle} ` : ""}
                    {s.stepIndex !== undefined ? `Step ${s.stepIndex}` : ""}
                  </span>
                )}
            </div>
            <div className="err-sample-msg">{s.message}</div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className="diag-guidance diag-guidance-critical"
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="err-guidance-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            minWidth: 0
          }}
        >
          <span className="badge badge-danger">{errorCount} err</span>
          <strong style={{ color: "var(--txt-primary)" }}>{title}</strong>
          {hint && (
            <span style={{ fontSize: 11, color: "var(--txt-tertiary)" }}>
              {hint}
            </span>
          )}
        </div>
        {onTroubleshoot && (
          <button
            type="button"
            className="btn btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onTroubleshoot();
            }}
          >
            {canSendMessage ? "Troubleshoot With Agent" : "Copy Error Prompt"}
          </button>
        )}
      </div>

      <div className="diag-guidance-row">
        <strong>What it means:</strong> {guidance.meaning}
      </div>
      <div className="diag-guidance-row">
        <strong>What to do:</strong> {guidance.remediation}
      </div>

      {sampleList.length > 0 ? (
        collapsibleSamples ? (
          <details className="err-samples-details">
            <summary>
              Show recorded error previews ({sampleList.length})
            </summary>
            {renderSamplesList()}
          </details>
        ) : (
          renderSamplesList()
        )
      ) : (
        <div
          className="diag-guidance-row"
          style={{ color: "var(--txt-tertiary)", fontSize: 11 }}
        >
          No individual error preview was attached to this summary yet — click
          Rescan (or open a chat&apos;s Waterfall or Why &amp; Bottlenecks tab) to
          inspect the exact failing step.
        </div>
      )}
    </div>
  );
};
