import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
  type McpUiHostContext
} from "@modelcontextprotocol/ext-apps";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { pathBaseName, toFileUri } from "../shared/paths";
import type {
  ConversationDetail,
  DashboardData,
  DiagnosticFinding,
  ModelPricingRule,
  PluginSkillMetric,
  ProjectDetail
} from "../shared/types";
import { ChatDetailView } from "./components/ChatDetail";
import {
  AllProjectsView,
  ProjectDetailView
} from "./components/ProjectOverview";
import { SettingsModal } from "./components/SettingsModal";

type ViewMode = "projects" | "project" | "chat";

const ToggleAuxPaneResultSchema = z
  .object({ isError: z.boolean().optional() })
  .passthrough();

interface InitialToolPayload {
  initialView?: ViewMode;
  selectedProjectPath?: string | null;
  selectedConversationId?: string | null;
  dashboard?: DashboardData;
}

export const AppRoot: React.FC = () => {
  const appRef = useRef<App | null>(null);
  const receivedToolResultRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>("projects");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedProjectPath, setSelectedProjectPath] = useState<string | null>(
    null
  );
  const [projectDetail, setProjectDetail] = useState<ProjectDetail | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [initialChatStep, setInitialChatStep] = useState<number | null>(null);
  const [chatDetail, setChatDetail] = useState<ConversationDetail | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const callAppTool = useCallback(
    async <T,>(name: string, args: Record<string, unknown> = {}): Promise<T> => {
      const app = appRef.current;
      if (!app) {
        throw new Error("MCP App not connected");
      }
      const res = await app.callServerTool({ name, arguments: args });
      if (res.isError) {
        const msg =
          res.content
            ?.map((c) => (c.type === "text" ? c.text : ""))
            .filter(Boolean)
            .join(" ") || `Tool ${name} failed`;
        throw new Error(msg);
      }
      return (res.structuredContent ?? {}) as T;
    },
    []
  );

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await callAppTool<DashboardData>("app_get_dashboard_data");
      setDashboard(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [callAppTool]);

  const openProject = useCallback(
    async (projectPath: string) => {
      try {
        setErrorMsg(null);
        setSelectedProjectPath(projectPath);
        setSelectedConversationId(null);
        setInitialChatStep(null);
        setChatDetail(null);
        setView("project");
        const detail = await callAppTool<ProjectDetail>(
          "app_get_project_detail",
          { projectPath }
        );
        setProjectDetail(detail);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    },
    [callAppTool]
  );

  const openChat = useCallback(
    async (conversationId: string, highlightStep?: number | null) => {
      try {
        setErrorMsg(null);
        setSelectedConversationId(conversationId);
        setInitialChatStep(highlightStep ?? null);
        setView("chat");
        const detail = await callAppTool<ConversationDetail>(
          "app_get_chat_detail",
          { conversationId }
        );
        setChatDetail(detail);
        if (detail?.summary?.projectPath) {
          setSelectedProjectPath(detail.summary.projectPath);
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    },
    [callAppTool]
  );

  useEffect(() => {
    const app = new App({ name: "Flight Recorder", version: "0.1.0" }, {});
    appRef.current = app;

    const applyTheme = (ctx?: McpUiHostContext) => {
      if (!ctx) return;
      if (ctx.theme) applyDocumentTheme(ctx.theme);
      if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
    };

    // Register handlers BEFORE connect() so no notification is missed.
    app.ontoolinput = () => {
      setLoading(true);
    };

    app.ontoolresult = (result) => {
      receivedToolResultRef.current = true;
      const sc = (result?.structuredContent ?? {}) as InitialToolPayload;
      if (sc.dashboard) {
        setDashboard(sc.dashboard);
        setLoading(false);
      }
      if (sc.selectedConversationId) {
        void openChat(sc.selectedConversationId);
      } else if (sc.selectedProjectPath) {
        void openProject(sc.selectedProjectPath);
      } else if (sc.initialView) {
        setView(sc.initialView);
      }
    };

    app.onhostcontextchanged = (ctx) => {
      applyTheme(ctx);
    };

    let cancelled = false;
    (async () => {
      try {
        await app.connect();
        if (cancelled) return;
        setConnected(true);
        applyTheme(app.getHostContext());
        const caps = app.getHostCapabilities();
        setCanMessage(Boolean(caps?.message));

        // If launched directly from sidebar/aux_pane or without immediate toolresult,
        // fetch full dashboard data via app-only tool.
        setTimeout(() => {
          if (!cancelled && !receivedToolResultRef.current) {
            void loadDashboard();
          }
        }, 120);
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadDashboard, openChat, openProject]);

  const handleRescan = async () => {
    try {
      setRescanning(true);
      setErrorMsg(null);
      const res = await callAppTool<{
        stats: { transcriptsIndexed: number; hookEventsIngested: number };
        dashboard: DashboardData;
      }>("app_rescan_all");
      if (res.dashboard) setDashboard(res.dashboard);
      if (view === "project" && selectedProjectPath) {
        const pDetail = await callAppTool<ProjectDetail>(
          "app_get_project_detail",
          { projectPath: selectedProjectPath }
        );
        setProjectDetail(pDetail);
      } else if (view === "chat" && selectedConversationId) {
        const cDetail = await callAppTool<ConversationDetail>(
          "app_get_chat_detail",
          { conversationId: selectedConversationId }
        );
        setChatDetail(cDetail);
      }
      setStatusNotice(
        `Scanned: ${res.stats?.transcriptsIndexed ?? 0} updated chat(s), ${res.stats?.hookEventsIngested ?? 0} hook event(s).`
      );
      setTimeout(() => setStatusNotice(null), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setRescanning(false);
    }
  };

  const handleSavePricing = async (rules: ModelPricingRule[]) => {
    try {
      setSavingPricing(true);
      const res = await callAppTool<{ dashboard: DashboardData }>(
        "app_update_pricing",
        { rules }
      );
      if (res.dashboard) setDashboard(res.dashboard);
      if (view === "project" && selectedProjectPath) {
        const pDetail = await callAppTool<ProjectDetail>(
          "app_get_project_detail",
          { projectPath: selectedProjectPath }
        );
        setProjectDetail(pDetail);
      } else if (view === "chat" && selectedConversationId) {
        const cDetail = await callAppTool<ConversationDetail>(
          "app_get_chat_detail",
          { conversationId: selectedConversationId }
        );
        setChatDetail(cDetail);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingPricing(false);
    }
  };

  const handleAssignProject = async (
    conversationId: string,
    projectPath: string
  ) => {
    try {
      const res = await callAppTool<{
        dashboard: DashboardData;
        chatDetail: ConversationDetail;
      }>("app_assign_project", { conversationId, projectPath });
      if (res.dashboard) setDashboard(res.dashboard);
      if (res.chatDetail) {
        setChatDetail(res.chatDetail);
        setSelectedProjectPath(res.chatDetail.summary.projectPath);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleOpenFileInAuxPane = async (filePath: string) => {
    const app = appRef.current;
    if (!app) return;
    try {
      const req = {
        method: "com.google.antigravity/toggle-aux-pane",
        params: { tabType: "fileView", uri: toFileUri(filePath) }
      } as unknown as Parameters<App["request"]>[0];
      const res = await app.request(req, ToggleAuxPaneResultSchema);
      if (res?.isError) {
        setStatusNotice("File viewer side pane is unavailable in this view.");
        setTimeout(() => setStatusNotice(null), 3000);
      }
    } catch {
      setStatusNotice("File viewer side pane is unavailable in this host.");
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  const handleAskAgent = async (finding: DiagnosticFinding) => {
    const app = appRef.current;
    if (!app || !canMessage) return;
    try {
      await app.sendMessage({
        role: "user",
        content: [
          {
            type: "text",
            text: `In conversation ${selectedConversationId ?? "current"}, please explain and help optimize "${finding.title}" (${finding.citation}): ${finding.detail}`
          }
        ]
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const sendOrCopyPrompt = async (
    prompt: string,
    sentNotice = "Sent optimization request to agent.",
    copiedNotice = "Copied optimization prompt to clipboard."
  ) => {
    const app = appRef.current;
    if (app && canMessage) {
      try {
        await app.sendMessage({
          role: "user",
          content: [{ type: "text", text: prompt }]
        });
        setStatusNotice(sentNotice);
        setTimeout(() => setStatusNotice(null), 3500);
        return;
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
        return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
        setStatusNotice(copiedNotice);
        setTimeout(() => setStatusNotice(null), 3500);
      }
    } catch {
      setStatusNotice("Unable to copy prompt automatically.");
      setTimeout(() => setStatusNotice(null), 3500);
    }
  };

  const handleOptimizeSkill = async (
    _metric: PluginSkillMetric,
    prompt: string
  ) => {
    await sendOrCopyPrompt(
      prompt,
      "Sent optimization request to agent.",
      "Copied optimization prompt to clipboard."
    );
  };

  const projectLabel =
    projectDetail?.summary.projectName ??
    (selectedProjectPath
      ? pathBaseName(selectedProjectPath) || selectedProjectPath
      : null);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="10" height="4" rx="1.5" fill="var(--chart-model)" />
            <rect x="7" y="10" width="14" height="4" rx="1.5" fill="var(--chart-cache)" />
            <rect x="4" y="16" width="9" height="4" rx="1.5" fill="var(--chart-skill)" />
          </svg>
          <strong style={{ fontSize: 14 }}>Flight Recorder</strong>

          <span style={{ color: "var(--txt-tertiary)" }}>/</span>
          <button
            type="button"
            className={`breadcrumb-btn ${view === "projects" ? "active" : ""}`}
            onClick={() => setView("projects")}
          >
            All Projects
          </button>

          {selectedProjectPath && view !== "projects" && (
            <>
              <span style={{ color: "var(--txt-tertiary)" }}>/</span>
              <button
                type="button"
                className={`breadcrumb-btn ${view === "project" ? "active" : ""}`}
                onClick={() => void openProject(selectedProjectPath)}
              >
                {projectLabel}
              </button>
            </>
          )}

          {selectedConversationId && view === "chat" && (
            <>
              <span style={{ color: "var(--txt-tertiary)" }}>/</span>
              <button
                type="button"
                className="breadcrumb-btn active truncate"
                style={{ maxWidth: 200 }}
              >
                {chatDetail?.summary.title ?? selectedConversationId.slice(0, 8)}
              </button>
            </>
          )}
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="btn"
            onClick={() => void handleRescan()}
            disabled={!connected || rescanning}
          >
            {rescanning ? "Scanning..." : "Rescan"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => setShowSettings(true)}
            disabled={!dashboard}
          >
            Pricing
          </button>
        </div>
      </header>

      {statusNotice && (
        <div
          style={{
            marginTop: 8,
            padding: "6px 10px",
            borderRadius: 6,
            background: "var(--bg-info)",
            color: "var(--txt-info)",
            fontSize: 12
          }}
        >
          {statusNotice}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 10px",
            borderRadius: 6,
            background: "var(--bg-danger)",
            color: "var(--txt-danger)",
            fontSize: 12
          }}
        >
          {errorMsg}
        </div>
      )}

      {loading && !dashboard ? (
        <div style={{ padding: "28px 12px", color: "var(--txt-secondary)" }}>
          Scanning Antigravity transcripts and lifecycle hooks...
        </div>
      ) : dashboard ? (
        <>
          {view === "projects" && (
            <AllProjectsView
              dashboard={dashboard}
              canSendMessage={canMessage}
              onSelectProject={(p) => void openProject(p)}
              onSelectChat={(id, stepIdx) => void openChat(id, stepIdx)}
              onOpenSettings={() => setShowSettings(true)}
              onOptimizeSkill={(m, p) => void handleOptimizeSkill(m, p)}
            />
          )}

          {view === "project" && projectDetail && (
            <ProjectDetailView
              key={projectDetail.summary.projectPath}
              detail={projectDetail}
              canSendMessage={canMessage}
              onSelectChat={(id, stepIdx) => void openChat(id, stepIdx)}
              onOpenFile={handleOpenFileInAuxPane}
              onOpenSettings={() => setShowSettings(true)}
              onAskAgent={handleAskAgent}
              onOptimizeSkill={(m, p) => void handleOptimizeSkill(m, p)}
              onTroubleshootPrompt={(p) =>
                void sendOrCopyPrompt(
                  p,
                  "Sent troubleshooting request to agent.",
                  "Copied troubleshooting prompt to clipboard."
                )
              }
            />
          )}

          {view === "chat" && chatDetail && (
            <ChatDetailView
              key={chatDetail.summary.conversationId}
              detail={chatDetail}
              knownProjects={dashboard.projects.map((p) => p.projectPath)}
              canSendMessage={canMessage}
              initialHighlightStep={initialChatStep}
              onAssignProject={handleAssignProject}
              onSelectChat={(id, stepIdx) => void openChat(id, stepIdx)}
              onOpenSettings={() => setShowSettings(true)}
              onAskAgent={handleAskAgent}
              onOptimizeSkill={(m, p) => void handleOptimizeSkill(m, p)}
              onTroubleshootPrompt={(p) =>
                void sendOrCopyPrompt(
                  p,
                  "Sent troubleshooting request to agent.",
                  "Copied troubleshooting prompt to clipboard."
                )
              }
            />
          )}
        </>
      ) : null}

      {showSettings && dashboard && (
        <SettingsModal
          rules={dashboard.pricingRules}
          unpricedModels={dashboard.unpricedModels}
          saving={savingPricing}
          onClose={() => setShowSettings(false)}
          onSave={handleSavePricing}
        />
      )}
    </div>
  );
};
