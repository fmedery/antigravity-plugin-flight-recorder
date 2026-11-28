import { toFileUri } from "../shared/paths";
import type { DashboardData, TimeRangePreset } from "../shared/types";

export type ViewMode = "projects" | "project" | "chat";

export type DashboardAction =
  | "get_dashboard_data"
  | "get_project_detail"
  | "get_chat_detail"
  | "rescan_all"
  | "update_pricing"
  | "assign_project"
  | "check_update";

export interface InitialRoutePayload {
  initialView?: ViewMode;
  selectedProjectPath?: string | null;
  selectedConversationId?: string | null;
  timeRange?: TimeRangePreset;
  dashboard?: DashboardData;
}

export interface HostCapabilities {
  canMessage: boolean;
  canOpenFile: boolean;
}

export interface HostConnectHandlers {
  onInitialPayload?: (payload: InitialRoutePayload) => void;
}

export interface HostBridge {
  connect(handlers: HostConnectHandlers): Promise<HostCapabilities>;
  callAction<T>(action: DashboardAction, args?: Record<string, unknown>): Promise<T>;
  openFileInAuxPane(filePath: string): Promise<{ ok: boolean; reason?: string }>;
  sendMessage(prompt: string): Promise<boolean>;
  openExternalLink(url: string): Promise<boolean>;
  dispose(): void;
}

interface AntigravitySidecarGlobal {
  conversationId?: string | null;
  fetch?: (url: string, options?: RequestInit) => Promise<Response>;
  getWorkspaceUris?: () => Promise<string[]>;
  onWorkspaceChange?: (listener: (uris: string[]) => void) => () => void;
  agent?: {
    sendMessage?: (message: string, conversationId?: string) => Promise<unknown>;
  };
  ui?: {
    toggleAuxPane?: (request: Record<string, unknown>) => void;
    toggleConversation?: (
      conversationId: string,
      options?: Record<string, unknown>
    ) => void;
  };
}

declare global {
  interface Window {
    sidecar?: AntigravitySidecarGlobal;
  }
}

const ACTION_TO_API_PATH: Record<DashboardAction, string> = {
  get_dashboard_data: "/api/dashboard",
  get_project_detail: "/api/project",
  get_chat_detail: "/api/chat",
  rescan_all: "/api/rescan",
  update_pricing: "/api/pricing",
  assign_project: "/api/assign-project",
  check_update: "/api/check-update"
};

function parseValidTimeRange(raw: string | null): TimeRangePreset | undefined {
  if (raw === "today" || raw === "7d" || raw === "30d" || raw === "all") {
    return raw;
  }
  return undefined;
}

function parseValidView(raw: string | null): ViewMode | undefined {
  if (raw === "projects" || raw === "project" || raw === "chat") {
    return raw;
  }
  return undefined;
}

function isRealConversationId(raw?: string | null): raw is string {
  if (!raw || typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "_new" || trimmed === "standalone") return false;
  return true;
}

function parseCssColorLuminance(raw: string): number | null {
  const s = raw.trim();
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s);
  let r: number;
  let g: number;
  let b: number;
  if (hex) {
    const h = hex[1];
    if (h.length === 3) {
      r = parseInt(h[0] + h[0], 16);
      g = parseInt(h[1] + h[1], 16);
      b = parseInt(h[2] + h[2], 16);
    } else {
      r = parseInt(h.slice(0, 2), 16);
      g = parseInt(h.slice(2, 4), 16);
      b = parseInt(h.slice(4, 6), 16);
    }
  } else {
    const rgb =
      /^rgba?\(\s*([\d.]+)\s*(?:,\s*|\s+)([\d.]+)\s*(?:,\s*|\s+)([\d.]+)/i.exec(s);
    if (!rgb) return null;
    r = Number(rgb[1]);
    g = Number(rgb[2]);
    b = Number(rgb[3]);
  }
  if (![r, g, b].every(Number.isFinite)) return null;
  const lin = [r, g, b].map((v) => {
    const n = Math.max(0, Math.min(255, v)) / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function applySidecarThemeVariables(vars: Record<string, string>): void {
  const rootStyle = document.documentElement?.style;
  if (!rootStyle) return;

  // Remove initial static theme sheet once live host variables arrive.
  const initialStyle = document.getElementById("fr-host-theme");
  if (initialStyle) initialStyle.remove();

  for (const [key, value] of Object.entries(vars)) {
    if (key.startsWith("--") && typeof value === "string" && value.trim()) {
      rootStyle.setProperty(key, value);
    }
  }

  const mapPairs: Array<[string, string[]]> = [
    ["--color-background-primary", ["--background", "--agy-canvas"]],
    ["--color-background-secondary", ["--card", "--content", "--agy-surface"]],
    ["--color-background-tertiary", ["--secondary", "--sidebar"]],
    ["--color-text-primary", ["--foreground", "--agy-ink"]],
    ["--color-text-secondary", ["--muted-foreground"]],
    ["--color-text-tertiary", ["--placeholder", "--muted-foreground"]],
    ["--color-border-primary", ["--border", "--agy-border"]],
    ["--color-border-secondary", ["--card-border", "--border"]],
    ["--color-ring-primary", ["--primary", "--accent"]],
    ["--color-on-primary", ["--primary-foreground"]]
  ];

  for (const [targetVar, sources] of mapPairs) {
    for (const srcVar of sources) {
      const val = vars[srcVar];
      if (typeof val === "string" && val.trim()) {
        rootStyle.setProperty(targetVar, val.trim());
        break;
      }
    }
  }

  if (!vars["--primary-foreground"]) {
    const primaryCandidate = vars["--primary"] || vars["--accent"];
    if (primaryCandidate) {
      const primaryLum = parseCssColorLuminance(primaryCandidate);
      if (primaryLum !== null) {
        rootStyle.setProperty(
          "--color-on-primary",
          primaryLum > 0.17913 ? "#111317" : "#ffffff"
        );
      }
    }
  }

  const bgCandidate =
    vars["--background"] || vars["--card"] || vars["--agy-canvas"];
  if (bgCandidate) {
    const lum = parseCssColorLuminance(bgCandidate);
    if (lum !== null) {
      const mode = lum < 0.45 ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", mode);
      rootStyle.colorScheme = mode;
    }
  }
}

/**
 * Antigravity UI Sidecar host bridge.
 * Isolated behind the HostBridge interface so switching to MCP Apps later is a drop-in adapter swap.
 */
export function createHostBridge(): HostBridge {
  let receivedHostTheme = false;
  let messageListener: ((ev: MessageEvent) => void) | null = null;
  let mediaQuery: MediaQueryList | null = null;
  let mediaListener: ((ev: MediaQueryListEvent) => void) | null = null;

  const getTokenFromUrl = (): string => {
    try {
      return new URLSearchParams(window.location.search).get("token") || "";
    } catch {
      return "";
    }
  };

  const getActiveConversationId = (): string | null => {
    const fromBridge = window.sidecar?.conversationId;
    if (isRealConversationId(fromBridge)) return fromBridge.trim();
    try {
      const fromQuery = new URLSearchParams(window.location.search).get(
        "conversationId"
      );
      if (isRealConversationId(fromQuery)) return fromQuery.trim();
    } catch {
      // Ignore invalid location.search
    }
    return null;
  };

  return {
    async connect(handlers: HostConnectHandlers): Promise<HostCapabilities> {
      messageListener = (ev: MessageEvent) => {
        const data = ev?.data as
          | {
              type?: unknown;
              payload?: {
                theme?: unknown;
                cssVariables?: Record<string, string>;
              };
            }
          | undefined;
        if (!data || typeof data !== "object") return;
        if (data.type === "theme-change" && data.payload) {
          receivedHostTheme = true;
          if (
            data.payload.theme === "dark" ||
            data.payload.theme === "light"
          ) {
            document.documentElement.setAttribute(
              "data-theme",
              data.payload.theme
            );
          }
          if (
            data.payload.cssVariables &&
            typeof data.payload.cssVariables === "object"
          ) {
            applySidecarThemeVariables(data.payload.cssVariables);
          }
        }
      };
      window.addEventListener("message", messageListener);

      if (typeof window.matchMedia === "function") {
        mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        if (!document.documentElement.getAttribute("data-theme")) {
          document.documentElement.setAttribute(
            "data-theme",
            mediaQuery.matches ? "dark" : "light"
          );
        }
        mediaListener = (ev: MediaQueryListEvent) => {
          if (!receivedHostTheme) {
            document.documentElement.setAttribute(
              "data-theme",
              ev.matches ? "dark" : "light"
            );
          }
        };
        mediaQuery.addEventListener?.("change", mediaListener);
      }

      // Check explicit deep-link query parameters (from sidecar:// chat pills).
      try {
        const params = new URLSearchParams(window.location.search);
        const view = parseValidView(params.get("view"));
        const targetProjectPath =
          params.get("targetProjectPath")?.trim() ||
          params.get("projectPath")?.trim() ||
          null;
        const explicitTargetConv =
          params.get("targetConversationId")?.trim() || null;
        const targetConversationId =
          explicitTargetConv ||
          (view === "chat" && isRealConversationId(params.get("conversationId"))
            ? params.get("conversationId")!.trim()
            : null);
        const timeRange = parseValidTimeRange(params.get("timeRange"));

        if (view || targetProjectPath || targetConversationId || timeRange) {
          handlers.onInitialPayload?.({
            initialView:
              view ??
              (targetConversationId
                ? "chat"
                : targetProjectPath
                  ? "project"
                  : "projects"),
            selectedProjectPath: targetProjectPath,
            selectedConversationId: targetConversationId,
            timeRange
          });
        }
      } catch {
        // Ignore malformed query string
      }

      const convId = getActiveConversationId();
      const canMessage = Boolean(
        convId && typeof window.sidecar?.agent?.sendMessage === "function"
      );
      const canOpenFile = Boolean(
        typeof window.sidecar?.ui?.toggleAuxPane === "function"
      );
      return { canMessage, canOpenFile };
    },

    async callAction<T>(
      action: DashboardAction,
      args: Record<string, unknown> = {}
    ): Promise<T> {
      const endpoint = ACTION_TO_API_PATH[action];
      const body = JSON.stringify(args ?? {});
      let res: Response;
      if (typeof window.sidecar?.fetch === "function") {
        res = await window.sidecar.fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body
        });
      } else {
        const headers = new Headers({ "Content-Type": "application/json" });
        const token = getTokenFromUrl();
        if (token) headers.set("X-Sidecar-Token", token);
        res = await fetch(endpoint, { method: "POST", headers, body });
      }

      const rawText = await res.text();
      if (!res.ok) {
        let errMsg = `Request ${endpoint} failed (HTTP ${res.status})`;
        try {
          const parsed = JSON.parse(rawText) as { error?: unknown };
          if (typeof parsed?.error === "string" && parsed.error.trim()) {
            errMsg = parsed.error.trim();
          }
        } catch {
          if (rawText.trim()) errMsg = rawText.trim();
        }
        throw new Error(errMsg);
      }

      if (!rawText.trim()) return {} as T;
      return JSON.parse(rawText) as T;
    },

    async openFileInAuxPane(
      filePath: string
    ): Promise<{ ok: boolean; reason?: string }> {
      if (typeof window.sidecar?.ui?.toggleAuxPane !== "function") {
        return {
          ok: false,
          reason: "File viewer side pane is unavailable in this host."
        };
      }
      try {
        window.sidecar.ui.toggleAuxPane({
          tabType: "fileView",
          uri: toFileUri(filePath)
        });
        return { ok: true };
      } catch {
        return {
          ok: false,
          reason: "File viewer side pane is unavailable in this view."
        };
      }
    },

    async sendMessage(prompt: string): Promise<boolean> {
      const convId = getActiveConversationId();
      if (!convId || typeof window.sidecar?.agent?.sendMessage !== "function") {
        return false;
      }
      await window.sidecar.agent.sendMessage(prompt, convId);
      return true;
    },

    async openExternalLink(url: string): Promise<boolean> {
      try {
        const opened = window.open(url, "_blank", "noopener,noreferrer");
        return Boolean(opened);
      } catch {
        return false;
      }
    },

    dispose(): void {
      if (messageListener) {
        window.removeEventListener("message", messageListener);
        messageListener = null;
      }
      if (mediaQuery && mediaListener) {
        mediaQuery.removeEventListener?.("change", mediaListener);
        mediaQuery = null;
        mediaListener = null;
      }
    }
  };
}
