import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
  type McpUiHostContext
} from "@modelcontextprotocol/ext-apps";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { pathBaseName, toFileUri } from "../shared/paths";
import { buildClientTimeRangeArgs } from "../shared/timeRange.js";
import type {
  ConversationDetail,
  DashboardData,
  ModelPricingRule,
  ProjectDetail,
  TimeRangePreset,
  UpdateCheckResult
} from "../shared/types";
import { ChatDetailView } from "./components/ChatDetail";
import {
  AllProjectsView,
  ProjectDetailView
} from "./components/ProjectOverview";
import { SettingsModal } from "./components/SettingsModal";
import { fmtRelativeAge } from "./format";

declare const __FLIGHT_RECORDER_VERSION__: string | undefined;

const APP_VERSION =
  typeof __FLIGHT_RECORDER_VERSION__ !== "undefined"
    ? __FLIGHT_RECORDER_VERSION__
    : "0.0.0-dev";

const AUTO_REFRESH_INTERVAL_MS = 30_000;
const RELATIVE_TIME_TICK_MS = 10_000;

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
  const [timeRange, setTimeRange] = useState<TimeRangePreset>("all");
  const timeRangeRef = useRef<TimeRangePreset>("all");
  const [updatingRange, setUpdatingRange] = useState(false);
  const rangeReqIdRef = useRef(0);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [lastScanAtMs, setLastScanAtMs] = useState<number | null>(null);
  const [nowTickMs, setNowTickMs] = useState<number>(() => Date.now());
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  const scanInFlightRef = useRef(false);
  const viewRef = useRef<ViewMode>(view);
  const selectedProjectPathRef = useRef<string | null>(selectedProjectPath);
  const selectedConversationIdRef = useRef<string | null>(selectedConversationId);
  const showSettingsRef = useRef(showSettings);
  const savingPricingRef = useRef(savingPricing);
  const updatingRangeRef = useRef(updatingRange);
  const lastScanAtMsRef = useRef<number | null>(lastScanAtMs);

  viewRef.current = view;
  selectedProjectPathRef.current = selectedProjectPath;
  selectedConversationIdRef.current = selectedConversationId;
  showSettingsRef.current = showSettings;
  savingPricingRef.current = savingPricing;
  updatingRangeRef.current = updatingRange;
  lastScanAtMsRef.current = lastScanAtMs;

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
      const data = await callAppTool<DashboardData>(
        "app_get_dashboard_data",
        buildClientTimeRangeArgs(timeRangeRef.current)
      );
      const ts = data?.generatedAtMs || Date.now();
      setDashboard(data);
      setLastScanAtMs(ts);
      setNowTickMs(Date.now());
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
          {
            projectPath,
            ...buildClientTimeRangeArgs(timeRangeRef.current)
          }
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
    const app = new App({ name: "Flight Recorder", version: APP_VERSION }, {});
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
        if (sc.dashboard.timeRange?.preset) {
          timeRangeRef.current = sc.dashboard.timeRange.preset;
          setTimeRange(sc.dashboard.timeRange.preset);
        }
        const ts = sc.dashboard.generatedAtMs || Date.now();
        setDashboard(sc.dashboard);
        setLastScanAtMs(ts);
        setNowTickMs(Date.now());
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

  const runAutoRefresh = useCallback(async () => {
    if (!connected || scanInFlightRef.current) return;
    if (
      showSettingsRef.current ||
      savingPricingRef.current ||
      updatingRangeRef.current
    ) {
      return;
    }
    if (
      typeof document !== "undefined" &&
      document.visibilityState !== "visible"
    ) {
      return;
    }

    const rangeArgs = buildClientTimeRangeArgs(timeRangeRef.current);
    scanInFlightRef.current = true;
    setAutoRefreshing(true);
    try {
      const res = await callAppTool<{
        stats: { transcriptsIndexed: number; hookEventsIngested: number };
        changed?: boolean;
        scannedAtMs?: number;
        dashboard?: DashboardData;
      }>("app_rescan_all", { ...rangeArgs, onlyIfChanged: true });

      const scanTs = res.scannedAtMs ?? res.dashboard?.generatedAtMs ?? Date.now();
      setLastScanAtMs(scanTs);
      setNowTickMs(Date.now());

      if (res.changed && res.dashboard) {
        setDashboard(res.dashboard);
        if (viewRef.current === "project" && selectedProjectPathRef.current) {
          const pDetail = await callAppTool<ProjectDetail>(
            "app_get_project_detail",
            { projectPath: selectedProjectPathRef.current, ...rangeArgs }
          );
          setProjectDetail(pDetail);
        } else if (
          viewRef.current === "chat" &&
          selectedConversationIdRef.current
        ) {
          const cDetail = await callAppTool<ConversationDetail>(
            "app_get_chat_detail",
            { conversationId: selectedConversationIdRef.current }
          );
          setChatDetail(cDetail);
        }
      }
    } catch {
      // Periodic background refresh ignores transient errors; manual Rescan surfaces errors.
    } finally {
      scanInFlightRef.current = false;
      setAutoRefreshing(false);
    }
  }, [callAppTool, connected]);

  const hasDashboard = dashboard !== null;
  useEffect(() => {
    if (!connected || !hasDashboard) return;

    const refreshTimer = window.setInterval(() => {
      if (
        typeof document === "undefined" ||
        document.visibilityState === "visible"
      ) {
        void runAutoRefresh();
      }
    }, AUTO_REFRESH_INTERVAL_MS);

    const tickTimer = window.setInterval(() => {
      if (
        typeof document === "undefined" ||
        document.visibilityState === "visible"
      ) {
        setNowTickMs(Date.now());
      }
    }, RELATIVE_TIME_TICK_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      setNowTickMs(now);
      if (now - (lastScanAtMsRef.current ?? 0) >= AUTO_REFRESH_INTERVAL_MS) {
        void runAutoRefresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(tickTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [connected, hasDashboard, runAutoRefresh]);

  const handleRescan = async () => {
    if (scanInFlightRef.current) return;
    const rangeArgs = buildClientTimeRangeArgs(timeRangeRef.current);
    scanInFlightRef.current = true;
    try {
      setRescanning(true);
      setErrorMsg(null);
      const res = await callAppTool<{
        stats: { transcriptsIndexed: number; hookEventsIngested: number };
        scannedAtMs?: number;
        dashboard: DashboardData;
      }>("app_rescan_all", rangeArgs);
      if (res.dashboard) setDashboard(res.dashboard);
      const scanTs = res.scannedAtMs ?? res.dashboard?.generatedAtMs ?? Date.now();
      setLastScanAtMs(scanTs);
      setNowTickMs(Date.now());
      if (view === "project" && selectedProjectPath) {
        const pDetail = await callAppTool<ProjectDetail>(
          "app_get_project_detail",
          { projectPath: selectedProjectPath, ...rangeArgs }
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
      scanInFlightRef.current = false;
      setRescanning(false);
    }
  };

  const handleSavePricing = async (rules: ModelPricingRule[]) => {
    const rangeArgs = buildClientTimeRangeArgs(timeRangeRef.current);
    try {
      setSavingPricing(true);
      const res = await callAppTool<{ dashboard: DashboardData }>(
        "app_update_pricing",
        { rules, ...rangeArgs }
      );
      if (res.dashboard) setDashboard(res.dashboard);
      if (view === "project" && selectedProjectPath) {
        const pDetail = await callAppTool<ProjectDetail>(
          "app_get_project_detail",
          { projectPath: selectedProjectPath, ...rangeArgs }
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
      const rangeArgs = buildClientTimeRangeArgs(timeRangeRef.current);
      const res = await callAppTool<{
        dashboard: DashboardData;
        chatDetail: ConversationDetail;
      }>("app_assign_project", { conversationId, projectPath, ...rangeArgs });
      if (res.dashboard) setDashboard(res.dashboard);
      if (res.chatDetail) {
        setChatDetail(res.chatDetail);
        setSelectedProjectPath(res.chatDetail.summary.projectPath);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleTimeRangeChange = async (nextRange: TimeRangePreset) => {
    timeRangeRef.current = nextRange;
    setTimeRange(nextRange);
    setUpdatingRange(true);
    setErrorMsg(null);
    const reqId = ++rangeReqIdRef.current;
    const rangeArgs = buildClientTimeRangeArgs(nextRange);
    try {
      if (view === "project" && selectedProjectPath) {
        const [pDetail, dash] = await Promise.all([
          callAppTool<ProjectDetail>("app_get_project_detail", {
            projectPath: selectedProjectPath,
            ...rangeArgs
          }),
          callAppTool<DashboardData>("app_get_dashboard_data", {
            ...rangeArgs,
            skipScan: true
          })
        ]);
        if (reqId === rangeReqIdRef.current) {
          setProjectDetail(pDetail);
          setDashboard(dash);
        }
      } else {
        const dash = await callAppTool<DashboardData>("app_get_dashboard_data", {
          ...rangeArgs,
          skipScan: true
        });
        if (reqId === rangeReqIdRef.current) {
          setDashboard(dash);
        }
      }
    } catch (err) {
      if (reqId === rangeReqIdRef.current) {
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (reqId === rangeReqIdRef.current) {
        setUpdatingRange(false);
      }
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

  const sendOrCopyPrompt = async (
    prompt: string,
    sentNotice = "Sent troubleshooting request to agent.",
    copiedNotice = "Copied troubleshooting prompt to clipboard."
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

  const handleTroubleshootPrompt = (prompt: string) => {
    void sendOrCopyPrompt(prompt);
  };

  const handleCopyText = async (text: string, notice: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setStatusNotice(notice);
        setTimeout(() => setStatusNotice(null), 3500);
        return;
      }
    } catch {
      // Fall through to status notice
    }
    setStatusNotice("Unable to copy automatically.");
    setTimeout(() => setStatusNotice(null), 3500);
  };

  const handleOpenRepoLink = async (url: string) => {
    const app = appRef.current;
    if (app) {
      try {
        const res = await app.openLink({ url });
        if (!res?.isError) return;
      } catch {
        // Fall back to clipboard copy below
      }
    }
    await handleCopyText(url, "Copied GitHub link to clipboard.");
  };

  const handleCheckUpdate = async () => {
    try {
      setCheckingUpdate(true);
      const res = await callAppTool<UpdateCheckResult>("app_check_update", {});
      if (res.status === "update_available") {
        setUpdateResult(res);
      } else if (res.status === "up_to_date") {
        setUpdateResult(null);
        setStatusNotice(`Flight Recorder v${res.currentVersion} is up to date.`);
        setTimeout(() => setStatusNotice(null), 4000);
      } else {
        setUpdateResult(null);
        setStatusNotice(
          `Update check failed: ${res.message ?? "Could not reach GitHub."}`
        );
        setTimeout(() => setStatusNotice(null), 5000);
      }
    } catch (err) {
      setUpdateResult(null);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (/app_check_update.*not found|not found.*app_check_update/i.test(errMsg)) {
        setStatusNotice(
          "Flight Recorder's MCP server needs a reload — toggle Flight Recorder off/on in Customizations (or restart Antigravity) and try again."
        );
      } else {
        setStatusNotice(`Update check failed: ${errMsg}`);
      }
      setTimeout(() => setStatusNotice(null), 5000);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const projectLabel =
    projectDetail?.summary.projectName ??
    (selectedProjectPath
      ? pathBaseName(selectedProjectPath) || selectedProjectPath
      : null);

  return (
    <div className="app-shell" data-app-version={APP_VERSION}>
      <header className="topbar">
        <div className="topbar-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="4" width="10" height="4" rx="1.5" fill="var(--chart-model)" />
            <rect x="7" y="10" width="14" height="4" rx="1.5" fill="var(--chart-cache)" />
            <rect x="4" y="16" width="9" height="4" rx="1.5" fill="var(--chart-skill)" />
          </svg>
          <strong style={{ fontSize: 14 }}>Flight Recorder</strong>
          <span className="app-version" title={`Flight Recorder v${APP_VERSION}`}>
            v{APP_VERSION}
          </span>

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
          {(rescanning || autoRefreshing || lastScanAtMs !== null) && (
            <span
              className="last-scan-meta tabular"
              title={
                lastScanAtMs
                  ? `Last scan: ${new Date(lastScanAtMs).toLocaleTimeString()} · Auto-refreshes every 30s while visible`
                  : "Scanning transcripts & hooks…"
              }
            >
              {rescanning || autoRefreshing
                ? "Scanning…"
                : `Last scan: ${fmtRelativeAge(lastScanAtMs, nowTickMs)}`}
            </span>
          )}
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
          <button
            type="button"
            className="btn"
            title="Check GitHub for a newer Flight Recorder version"
            onClick={() => void handleCheckUpdate()}
            disabled={!connected || checkingUpdate}
          >
            {checkingUpdate ? "Checking..." : "Updates"}
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

      {updateResult?.status === "update_available" && (
        <div className="update-banner" role="status">
          <div className="update-banner-head">
            <strong>
              Update available: v{updateResult.currentVersion} → v
              {updateResult.latestVersion}
            </strong>
            <div className="update-banner-actions">
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  void handleOpenRepoLink(
                    updateResult.releaseUrl ?? updateResult.repoUrl
                  )
                }
              >
                {updateResult.releaseUrl &&
                updateResult.releaseUrl !== updateResult.repoUrl
                  ? "View Release"
                  : "View on GitHub"}
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setUpdateResult(null)}
              >
                Dismiss
              </button>
            </div>
          </div>
          <div className="update-banner-body">
            {updateResult.installMethod === "marketplace" ? (
              <div>
                Managed by the Antigravity Marketplace — update from{" "}
                <strong>Customizations → Installed</strong> in Antigravity (or
                run{" "}
                <code>
                  agy plugin install flight-recorder@antigravity-plugins-partners
                </code>
                ).
              </div>
            ) : updateResult.installMethod === "git" &&
              updateResult.updateCommand ? (
              <>
                <div className="update-banner-cmd-row">
                  <code className="update-banner-cmd">
                    {updateResult.updateCommand}
                  </code>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() =>
                      void handleCopyText(
                        updateResult.updateCommand!,
                        "Copied git update command to clipboard."
                      )
                    }
                  >
                    Copy command
                  </button>
                </div>
                <div>
                  After pulling, toggle <code>flight-recorder_recorder</code>{" "}
                  off/on in Settings → MCP Servers.
                </div>
              </>
            ) : (
              <div>
                If installed via Antigravity Marketplace or CLI, update from{" "}
                <strong>Customizations → Installed</strong> (or re-run{" "}
                <code>agy plugin install</code>). For manual ZIP installs,
                download the latest release from GitHub and replace your{" "}
                <code>flight-recorder</code> plugins folder, then restart
                Antigravity.
              </div>
            )}
          </div>
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
              timeRange={timeRange}
              updatingRange={updatingRange}
              onTimeRangeChange={(next) => void handleTimeRangeChange(next)}
              onSelectProject={(p) => void openProject(p)}
              onSelectChat={(id, stepIdx) => void openChat(id, stepIdx)}
              onOpenSettings={() => setShowSettings(true)}
              onTroubleshootPrompt={handleTroubleshootPrompt}
            />
          )}

          {view === "project" && projectDetail && (
            <ProjectDetailView
              key={projectDetail.summary.projectPath}
              detail={projectDetail}
              pricingRules={dashboard.pricingRules}
              modelSignals={dashboard.modelSignals}
              latestGlobalActivityMs={dashboard.latestGlobalActivityMs}
              canSendMessage={canMessage}
              timeRange={timeRange}
              updatingRange={updatingRange}
              onTimeRangeChange={(next) => void handleTimeRangeChange(next)}
              onSelectChat={(id, stepIdx) => void openChat(id, stepIdx)}
              onOpenFile={handleOpenFileInAuxPane}
              onOpenSettings={() => setShowSettings(true)}
              onTroubleshootPrompt={handleTroubleshootPrompt}
            />
          )}

          {view === "chat" && chatDetail && (
            <ChatDetailView
              key={chatDetail.summary.conversationId}
              detail={chatDetail}
              pricingRules={dashboard.pricingRules}
              modelSignals={dashboard.modelSignals}
              latestGlobalActivityMs={dashboard.latestGlobalActivityMs}
              knownProjects={dashboard.projects.map((p) => p.projectPath)}
              canSendMessage={canMessage}
              initialHighlightStep={initialChatStep}
              onAssignProject={handleAssignProject}
              onSelectChat={(id, stepIdx) => void openChat(id, stepIdx)}
              onOpenSettings={() => setShowSettings(true)}
              onTroubleshootPrompt={handleTroubleshootPrompt}
            />
          )}
        </>
      ) : null}

      {showSettings && dashboard && (
        <SettingsModal
          rules={dashboard.pricingRules}
          unpricedModels={dashboard.unpricedModels}
          modelSignals={dashboard.modelSignals}
          latestGlobalActivityMs={dashboard.latestGlobalActivityMs}
          saving={savingPricing}
          onClose={() => setShowSettings(false)}
          onSave={handleSavePricing}
        />
      )}
    </div>
  );
};
