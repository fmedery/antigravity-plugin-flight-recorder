import crypto from "node:crypto";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ZodError, type ZodTypeAny } from "zod";
import {
  AppServiceError,
  AssignProjectSchema,
  ChatDetailQuerySchema,
  createTrackerAppService,
  DashboardQuerySchema,
  ProjectDetailQuerySchema,
  readUiHtml,
  RescanQuerySchema,
  UpdatePricingSchema,
  type TrackerServerContext
} from "./appService.js";
import { resolveDataDir } from "./dataDir.js";
import { TrackerDatabase } from "./db.js";
import { resolveHostTheme } from "./hostTheme.js";
import { readInstalledVersion } from "./updateCheck.js";

const MAX_JSON_BODY_BYTES = 1024 * 1024;
const LS_WATCH_INTERVAL_MS = 5_000;
const LS_WATCH_MAX_FAILURES = 3;

export type InitialThemeMode = "dark" | "light" | "system";

export interface SidecarResponseInit {
  contentType?: string;
  status?: number;
  headers?: Record<string, string>;
}

export class SidecarResponse {
  public readonly body: string | Buffer;
  public readonly contentType: string;
  public readonly status: number;
  public readonly headers?: Record<string, string>;

  constructor(body: string | Buffer, init: SidecarResponseInit = {}) {
    this.body = body;
    this.contentType = init.contentType ?? "text/plain; charset=utf-8";
    this.status = init.status ?? 200;
    this.headers = init.headers;
  }
}

type ResponseCtor = new (
  body: string | Buffer,
  init?: SidecarResponseInit
) => unknown;

interface SidecarAppLike {
  page(
    routePath: string,
    handler: (data?: Record<string, unknown>) => unknown
  ): unknown;
  api(
    routePath: string,
    handler: (data?: Record<string, unknown>) => unknown,
    method?: string
  ): unknown;
  run(): Promise<unknown>;
  close?(): Promise<void> | void;
}

const FALLBACK_PRELOAD_JS = `(function () {
  var params = new URLSearchParams(window.location.search);
  var token = params.get("token") || "";
  var conversationId = params.get("conversationId") || "";
  var postToHost = function (msg) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, "*");
    }
  };
  var sidecarFetch = function (url, options) {
    var opts = options || {};
    var headers = new Headers(opts.headers || {});
    if (!headers.has("Content-Type") && opts.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("X-Sidecar-Token", token);
    }
    return fetch(url, Object.assign({}, opts, { headers: headers }));
  };
  window.sidecar = {
    conversationId: conversationId || null,
    fetch: sidecarFetch,
    getWorkspaceUris: function () {
      return Promise.resolve([]);
    },
    onWorkspaceChange: function () {
      return function () {};
    },
    agent: {
      sendMessage: function (message, convId) {
        return sidecarFetch("/_sidecar/send-message", {
          method: "POST",
          body: JSON.stringify({
            conversationId: convId || conversationId,
            message: message
          })
        }).then(function (r) {
          if (!r.ok) throw new Error("Failed to send message (HTTP " + r.status + ")");
          return r.json();
        });
      }
    },
    ui: {
      toggleAuxPane: function (request) {
        postToHost({ type: "toggle-aux-pane", payload: request });
      },
      toggleConversation: function (convId, options) {
        var payload =
          options && typeof options === "object"
            ? Object.assign({ conversationId: convId }, options)
            : { conversationId: convId };
        postToHost({ type: "toggle-conversation", payload: payload });
      }
    }
  };
})();
`;

export function isAllowedLoopbackOrigin(origin?: string | null): boolean {
  if (!origin || origin === "null") return true;
  if (/^plugin:\/\/[a-z0-9._-]+$/i.test(origin)) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    return host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "[::1]";
  } catch {
    return false;
  }
}

export function verifySidecarToken(provided: string, expected: string): boolean {
  if (!expected) return true;
  if (!provided) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function resolveInitialHostTheme(
  configJsonPath = path.join(os.homedir(), ".gemini", "config", "config.json"),
  appStoragePath?: string
): InitialThemeMode {
  return resolveHostTheme({ configJsonPath, appStoragePath }).mode;
}

function serializeCssVars(vars?: Record<string, string>): string {
  return Object.entries(vars ?? {})
    .filter(
      ([k, v]) =>
        /^--[a-z0-9-]+$/i.test(k) &&
        typeof v === "string" &&
        v.trim().length > 0 &&
        !/[;<>{}]/.test(v)
    )
    .map(([k, v]) => `${k}:${v.trim()};`)
    .join("");
}

export function injectSidecarBootstrap(
  html: string,
  options: {
    uiToken?: string;
    initialTheme?: InitialThemeMode;
    themeVariables?: Record<string, string>;
    darkVariables?: Record<string, string>;
    lightVariables?: Record<string, string>;
  } = {}
): string {
  const tokenParam = options.uiToken
    ? `?token=${encodeURIComponent(options.uiToken)}`
    : "";
  const themeMode = options.initialTheme ?? "system";
  const themeBootstrap =
    themeMode === "dark" || themeMode === "light"
      ? `document.documentElement.setAttribute("data-theme",${JSON.stringify(themeMode)});`
      : `document.documentElement.setAttribute("data-theme",window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");`;

  const cssRules: string[] = [];
  const rootCss = serializeCssVars(options.themeVariables);
  const darkCss = serializeCssVars(options.darkVariables);
  const lightCss = serializeCssVars(options.lightVariables);
  if (rootCss) cssRules.push(`:root{${rootCss}}`);
  if (darkCss) cssRules.push(`:root[data-theme="dark"]{${darkCss}}`);
  if (lightCss) cssRules.push(`:root[data-theme="light"]{${lightCss}}`);

  const themeStyleTag =
    cssRules.length > 0
      ? `    <style id="fr-host-theme">${cssRules.join("")}</style>`
      : "";

  const snippet = [
    `    <meta name="flight-recorder-transport" content="sidecar" />`,
    ...(themeStyleTag ? [themeStyleTag] : []),
    `    <script>${themeBootstrap}</script>`,
    `    <script src="/preload.js${tokenParam}"></script>`
  ].join("\n");

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${snippet}\n  </head>`);
  }
  return `${snippet}\n${html}`;
}

function isSafeParamKey(key: string): boolean {
  return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}

function readBoundedJsonBody(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  limitBytes: number
): Promise<
  | { ok: true; body: Record<string, unknown> | null }
  | { ok: false; status: number; error: string }
  | { aborted: true }
> {
  return new Promise((resolvePromise) => {
    const chunks: Buffer[] = [];
    let byteLength = 0;
    let settled = false;

    req.on("data", (chunk: Buffer) => {
      if (settled) {
        if (byteLength + chunk.length > limitBytes + 65_536) {
          req.destroy();
        }
        return;
      }
      byteLength += chunk.length;
      if (byteLength > limitBytes) {
        settled = true;
        chunks.length = 0;
        if (!res.headersSent) {
          res.writeHead(413, {
            "Content-Type": "application/json; charset=utf-8",
            Connection: "close"
          });
          res.end(JSON.stringify({ error: "Payload Too Large" }), () => req.destroy());
        }
        resolvePromise({ aborted: true });
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (settled) return;
      settled = true;
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolvePromise({ ok: true, body: null });
        return;
      }
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          resolvePromise({
            ok: false,
            status: 400,
            error: "JSON body must be an object"
          });
          return;
        }
        resolvePromise({ ok: true, body: parsed as Record<string, unknown> });
      } catch {
        resolvePromise({ ok: false, status: 400, error: "Invalid JSON" });
      }
    });

    req.on("error", (err) => {
      if (settled) return;
      settled = true;
      resolvePromise({
        ok: false,
        status: 400,
        error: err?.message || "Request stream error"
      });
    });
  });
}

function isResponseLike(
  val: unknown
): val is {
  body: string | Buffer;
  contentType: string;
  status?: number;
  headers?: Record<string, string>;
} {
  return (
    typeof val === "object" &&
    val !== null &&
    "body" in val &&
    "contentType" in val &&
    typeof (val as { contentType?: unknown }).contentType === "string"
  );
}

export interface StandaloneSidecarOptions {
  port?: number;
  host?: string;
  uiToken?: string;
  bodyLimitBytes?: number;
}

export class StandaloneLoopbackSidecar implements SidecarAppLike {
  private readonly pages = new Map<
    string,
    (data?: Record<string, unknown>) => unknown
  >();
  private readonly apis = new Map<
    string,
    Map<string, (data?: Record<string, unknown>) => unknown>
  >();
  private server: http.Server | null = null;
  public port: number;
  public readonly host: string;
  public readonly uiToken: string;
  private readonly bodyLimitBytes: number;

  constructor(options: StandaloneSidecarOptions = {}) {
    const rawPort =
      options.port !== undefined
        ? Number(options.port)
        : Number(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT || 0);
    this.port = Number.isInteger(rawPort) && rawPort >= 0 ? rawPort : 0;
    this.host = options.host || "127.0.0.1";
    this.uiToken =
      options.uiToken !== undefined
        ? options.uiToken
        : process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN || "";
    this.bodyLimitBytes = options.bodyLimitBytes ?? MAX_JSON_BODY_BYTES;
  }

  page(
    routePath: string,
    handler: (data?: Record<string, unknown>) => unknown
  ): this {
    this.pages.set(routePath, handler);
    return this;
  }

  api(
    routePath: string,
    handler: (data?: Record<string, unknown>) => unknown,
    method = "POST"
  ): this {
    let methodMap = this.apis.get(routePath);
    if (!methodMap) {
      methodMap = new Map();
      this.apis.set(routePath, methodMap);
    }
    methodMap.set(method.toUpperCase(), handler);
    return this;
  }

  getHttpServer(): http.Server | null {
    return this.server;
  }

  run(): Promise<http.Server> {
    if (this.server) return Promise.resolve(this.server);

    if (!this.pages.has("/preload.js")) {
      this.pages.set(
        "/preload.js",
        () =>
          new SidecarResponse(FALLBACK_PRELOAD_JS, {
            contentType: "text/javascript; charset=utf-8",
            headers: { "Cache-Control": "no-store" }
          })
      );
    }

    const server = http.createServer(async (req, res) => {
      const method = String(req.method || "GET").toUpperCase();
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(req.url || "/", "http://127.0.0.1");
      } catch {
        parsedUrl = new URL("/", "http://127.0.0.1");
      }
      const pathname = parsedUrl.pathname;

      const originHeader = Array.isArray(req.headers.origin)
        ? req.headers.origin[0]
        : req.headers.origin;
      if (!isAllowedLoopbackOrigin(originHeader)) {
        res.writeHead(403, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          method === "HEAD" ? undefined : JSON.stringify({ error: "Forbidden origin" })
        );
        return;
      }

      if (originHeader && originHeader !== "null") {
        res.setHeader("Access-Control-Allow-Origin", originHeader);
        res.setHeader("Vary", "Origin");
      }

      if (method === "OPTIONS") {
        res.writeHead(204, {
          "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-Sidecar-Token"
        });
        res.end();
        return;
      }

      if ((method === "GET" || method === "HEAD") && pathname === "/_sidecar/health") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(
          method === "HEAD"
            ? undefined
            : JSON.stringify({ ok: true, status: "ok", pid: process.pid })
        );
        return;
      }

      const rawHeaderTok = req.headers["x-sidecar-token"];
      const headerTok = Array.isArray(rawHeaderTok) ? rawHeaderTok[0] : rawHeaderTok;
      const urlTok = parsedUrl.searchParams.get("token") || "";
      const providedTok = String(headerTok || urlTok || "");

      const cleanQueryEntries: Array<[string, string]> = [];
      for (const [k, v] of parsedUrl.searchParams.entries()) {
        if (!isSafeParamKey(k) || k.toLowerCase() === "token") continue;
        cleanQueryEntries.push([k, v]);
      }

      if ((method === "GET" || method === "HEAD") && this.pages.has(pathname)) {
        if (this.uiToken && !verifySidecarToken(providedTok, this.uiToken)) {
          res.writeHead(401, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(method === "HEAD" ? undefined : "Unauthorized");
          return;
        }
        try {
          const handler = this.pages.get(pathname)!;
          const out = await handler(Object.fromEntries(cleanQueryEntries));
          if (res.headersSent || res.writableEnded) return;
          if (isResponseLike(out)) {
            res.writeHead(out.status ?? 200, {
              "Content-Type": out.contentType,
              ...out.headers
            });
            res.end(method === "HEAD" ? undefined : out.body);
            return;
          }
          res.writeHead(200, {
            "Content-Type": pathname.endsWith(".js")
              ? "text/javascript; charset=utf-8"
              : "text/html; charset=utf-8"
          });
          res.end(method === "HEAD" ? undefined : String(out ?? ""));
        } catch (err) {
          process.stderr.write(
            `[flight-recorder-sidecar] page error on ${pathname}: ${err instanceof Error ? err.message : String(err)}\n`
          );
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end(method === "HEAD" ? undefined : "Internal Server Error");
          }
        }
        return;
      }

      if (this.apis.has(pathname)) {
        if (this.uiToken && !verifySidecarToken(providedTok, this.uiToken)) {
          res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
          res.end(
            method === "HEAD" ? undefined : JSON.stringify({ error: "Unauthorized" })
          );
          return;
        }

        const methodMap = this.apis.get(pathname)!;
        const handler =
          methodMap.get(method) || (method === "HEAD" ? methodMap.get("GET") : undefined);
        if (!handler) {
          res.writeHead(405, {
            "Content-Type": "application/json; charset=utf-8",
            Allow: Array.from(methodMap.keys()).join(", ")
          });
          res.end(
            method === "HEAD"
              ? undefined
              : JSON.stringify({ error: "Method Not Allowed" })
          );
          return;
        }

        let bodyObj: Record<string, unknown> | null = null;
        if (method !== "GET" && method !== "HEAD") {
          const parsedBody = await readBoundedJsonBody(req, res, this.bodyLimitBytes);
          if ("aborted" in parsedBody) return;
          if (!parsedBody.ok) {
            res.writeHead(parsedBody.status, {
              "Content-Type": "application/json; charset=utf-8"
            });
            res.end(JSON.stringify({ error: parsedBody.error }));
            return;
          }
          bodyObj = parsedBody.body;
        }

        const bodyEntries = bodyObj
          ? Object.entries(bodyObj).filter(([k]) => isSafeParamKey(k))
          : [];
        const data = Object.fromEntries([...cleanQueryEntries, ...bodyEntries]);

        try {
          const out = await handler(data);
          if (res.headersSent || res.writableEnded) return;
          if (isResponseLike(out)) {
            res.writeHead(out.status ?? 200, {
              "Content-Type": out.contentType,
              ...out.headers
            });
            res.end(method === "HEAD" ? undefined : out.body);
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
          res.end(method === "HEAD" ? undefined : JSON.stringify(out ?? null));
        } catch (err) {
          process.stderr.write(
            `[flight-recorder-sidecar] api error on ${pathname}: ${err instanceof Error ? err.message : String(err)}\n`
          );
          if (!res.headersSent) {
            res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
            res.end(
              method === "HEAD"
                ? undefined
                : JSON.stringify({ error: "Internal Server Error" })
            );
          }
        }
        return;
      }

      if (this.pages.has(pathname)) {
        res.writeHead(405, {
          "Content-Type": "application/json; charset=utf-8",
          Allow: "GET, HEAD"
        });
        res.end(JSON.stringify({ error: "Method Not Allowed" }));
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end(method === "HEAD" ? undefined : "Not Found");
    });

    return new Promise<http.Server>((resolvePromise, rejectPromise) => {
      server.once("error", rejectPromise);
      server.listen(this.port, this.host, () => {
        server.removeListener("error", rejectPromise);
        this.server = server;
        const addr = server.address();
        if (addr && typeof addr === "object") {
          this.port = addr.port;
        }
        resolvePromise(server);
      });
    });
  }

  close(): Promise<void> {
    if (!this.server) return Promise.resolve();
    const srv = this.server;
    this.server = null;
    return new Promise((resolvePromise) => {
      srv.close(() => resolvePromise());
      srv.closeAllConnections?.();
    });
  }
}

async function tryLoadSidecarSdk(): Promise<{
  SidecarApp: new () => SidecarAppLike;
  Response: ResponseCtor;
} | null> {
  try {
    const sdkModuleName = "sidecar_sdk";
    const sdk = (await import(sdkModuleName)) as Record<string, unknown>;
    if (
      typeof sdk?.SidecarApp === "function" &&
      typeof sdk?.Response === "function"
    ) {
      return {
        SidecarApp: sdk.SidecarApp as new () => SidecarAppLike,
        Response: sdk.Response as ResponseCtor
      };
    }
  } catch {
    // Antigravity provides sidecar_sdk at runtime; fallback HTTP server covers tests/local dev.
  }
  return null;
}

function createApiHandler<T extends ZodTypeAny>(
  schema: T | null,
  fn: (parsed: ReturnType<T["parse"]>) => Promise<unknown>,
  ResponseClass: ResponseCtor
): (data?: Record<string, unknown>) => Promise<unknown> {
  return async (rawData = {}) => {
    try {
      const parsed = schema ? schema.parse(rawData ?? {}) : ({} as ReturnType<T["parse"]>);
      const payload = await fn(parsed);
      return new ResponseClass(JSON.stringify(payload ?? null), {
        contentType: "application/json; charset=utf-8",
        status: 200,
        headers: { "Cache-Control": "no-store" }
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const msg = err.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
        return new ResponseClass(JSON.stringify({ error: `Invalid request: ${msg}` }), {
          contentType: "application/json; charset=utf-8",
          status: 400
        });
      }
      if (err instanceof AppServiceError) {
        return new ResponseClass(JSON.stringify({ error: err.message }), {
          contentType: "application/json; charset=utf-8",
          status: err.statusCode
        });
      }
      process.stderr.write(
        `[flight-recorder-sidecar] handler failure: ${err instanceof Error ? err.message : String(err)}\n`
      );
      return new ResponseClass(JSON.stringify({ error: "Internal Server Error" }), {
        contentType: "application/json; charset=utf-8",
        status: 500
      });
    }
  };
}

export interface CreateSidecarServerOptions extends TrackerServerContext {
  uiHtmlPath: string;
  port?: number;
  host?: string;
  uiToken?: string;
  configJsonPath?: string;
  appStoragePath?: string;
  /** Force standalone loopback HTTP server (skip sidecar_sdk lookup, useful for tests). */
  forceStandalone?: boolean;
}

export interface RunningSidecarHandle {
  app: SidecarAppLike;
  mode: "sidecar_sdk" | "standalone";
  port: number | null;
  url: string | null;
  close: () => Promise<void>;
}

export async function createTrackerSidecarServer(
  options: CreateSidecarServerOptions
): Promise<{
  app: SidecarAppLike;
  mode: "sidecar_sdk" | "standalone";
  start: () => Promise<RunningSidecarHandle>;
}> {
  const sdk = options.forceStandalone ? null : await tryLoadSidecarSdk();
  const mode: "sidecar_sdk" | "standalone" = sdk ? "sidecar_sdk" : "standalone";
  const ResponseClass: ResponseCtor = sdk ? sdk.Response : SidecarResponse;
  const app: SidecarAppLike = sdk
    ? new sdk.SidecarApp()
    : new StandaloneLoopbackSidecar({
        port: options.port,
        host: options.host,
        uiToken: options.uiToken
      });

  const appService = createTrackerAppService(options);
  const version = readInstalledVersion(options.pluginRoot);

  const serveDashboardHtml = () => {
    const rawHtml = readUiHtml(options.uiHtmlPath);
    const uiToken =
      options.uiToken !== undefined
        ? options.uiToken
        : process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN || "";
    const resolvedTheme = resolveHostTheme({
      configJsonPath: options.configJsonPath,
      appStoragePath: options.appStoragePath
    });
    const html = injectSidecarBootstrap(rawHtml, {
      uiToken,
      initialTheme: resolvedTheme.mode,
      themeVariables: resolvedTheme.cssVariables,
      darkVariables: resolvedTheme.darkVariables,
      lightVariables: resolvedTheme.lightVariables
    });
    return new ResponseClass(html, {
      contentType: "text/html; charset=utf-8",
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  };

  app.page("/", serveDashboardHtml);
  app.page("/index.html", serveDashboardHtml);

  app.api(
    "/api/health",
    () =>
      new ResponseClass(
        JSON.stringify({
          ok: true,
          status: "ok",
          version,
          mode,
          pid: process.pid
        }),
        {
          contentType: "application/json; charset=utf-8",
          status: 200,
          headers: { "Cache-Control": "no-store" }
        }
      ),
    "GET"
  );

  app.api(
    "/api/dashboard",
    createApiHandler(
      DashboardQuerySchema,
      (input) => appService.getDashboardData(input),
      ResponseClass
    ),
    "POST"
  );

  app.api(
    "/api/project",
    createApiHandler(
      ProjectDetailQuerySchema,
      (input) => appService.getProjectDetail(input),
      ResponseClass
    ),
    "POST"
  );

  app.api(
    "/api/chat",
    createApiHandler(
      ChatDetailQuerySchema,
      (input) => appService.getChatDetail(input),
      ResponseClass
    ),
    "POST"
  );

  app.api(
    "/api/rescan",
    createApiHandler(
      RescanQuerySchema,
      (input) => appService.rescanAll(input),
      ResponseClass
    ),
    "POST"
  );

  app.api(
    "/api/pricing",
    createApiHandler(
      UpdatePricingSchema,
      (input) => appService.updatePricing(input),
      ResponseClass
    ),
    "POST"
  );

  app.api(
    "/api/assign-project",
    createApiHandler(
      AssignProjectSchema,
      (input) => appService.assignProject(input),
      ResponseClass
    ),
    "POST"
  );

  app.api(
    "/api/check-update",
    createApiHandler(null, () => appService.checkUpdate(), ResponseClass),
    "POST"
  );

  return {
    app,
    mode,
    async start(): Promise<RunningSidecarHandle> {
      const serverOrVoid = await app.run();
      let boundPort: number | null = null;
      if (app instanceof StandaloneLoopbackSidecar) {
        boundPort = app.port;
      } else if (
        serverOrVoid &&
        typeof (serverOrVoid as http.Server).address === "function"
      ) {
        const addr = (serverOrVoid as http.Server).address();
        if (addr && typeof addr === "object") {
          boundPort = addr.port;
        }
      } else if (process.env.ANTIGRAVITY_SIDECAR_WEB_PORT) {
        const envPort = Number(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT);
        if (Number.isInteger(envPort) && envPort > 0) boundPort = envPort;
      }

      const close = async () => {
        if (typeof app.close === "function") {
          await app.close();
        } else if (
          serverOrVoid &&
          typeof (serverOrVoid as http.Server).close === "function"
        ) {
          await new Promise<void>((resolvePromise) => {
            (serverOrVoid as http.Server).close(() => resolvePromise());
          });
        }
      };

      return {
        app,
        mode,
        port: boundPort,
        url: boundPort ? `http://127.0.0.1:${boundPort}` : null,
        close
      };
    }
  };
}

function parseHostPort(address: string): { host: string; port: number } | null {
  const trimmed = address.trim();
  if (!trimmed) return null;
  const bracketMatch = /^\[([^\]]+)\]:(\d+)$/.exec(trimmed);
  if (bracketMatch) {
    const port = Number(bracketMatch[2]);
    return Number.isInteger(port) && port > 0 && port <= 65535
      ? { host: bracketMatch[1], port }
      : null;
  }
  const idx = trimmed.lastIndexOf(":");
  if (idx <= 0) return null;
  const host = trimmed.slice(0, idx);
  const port = Number(trimmed.slice(idx + 1));
  if (!host || !Number.isInteger(port) || port <= 0 || port > 65535) {
    return null;
  }
  return { host, port };
}

/**
 * Watches ANTIGRAVITY_LS_ADDRESS over TCP so orphaned sidecars exit cleanly on Windows
 * when Antigravity quits without sending SIGTERM. No-op when ANTIGRAVITY_LS_ADDRESS is unset.
 */
export function watchLanguageServerLifecycle(
  onLost: () => void,
  options: {
    lsAddress?: string;
    intervalMs?: number;
    maxFailures?: number;
  } = {}
): { active: boolean; stop: () => void } {
  const addr = options.lsAddress ?? process.env.ANTIGRAVITY_LS_ADDRESS ?? "";
  const target = parseHostPort(addr);
  if (!target) {
    return { active: false, stop: () => {} };
  }

  const intervalMs = options.intervalMs ?? LS_WATCH_INTERVAL_MS;
  const maxFailures = options.maxFailures ?? LS_WATCH_MAX_FAILURES;
  let consecutiveFailures = 0;
  let stopped = false;

  const probe = () => {
    if (stopped) return;
    const sock = net.createConnection({ host: target.host, port: target.port });
    let handled = false;
    const finish = (ok: boolean) => {
      if (handled) return;
      handled = true;
      sock.destroy();
      if (stopped) return;
      if (ok) {
        consecutiveFailures = 0;
      } else {
        consecutiveFailures += 1;
        if (consecutiveFailures >= maxFailures) {
          stop();
          onLost();
        }
      }
    };
    sock.setTimeout(1_500);
    sock.once("connect", () => finish(true));
    sock.once("timeout", () => finish(false));
    sock.once("error", () => finish(false));
  };

  const timer = setInterval(probe, intervalMs);
  timer.unref();

  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearInterval(timer);
  };

  return { active: true, stop };
}

export async function startSidecarMain(
  argv: string[] = process.argv.slice(2)
): Promise<RunningSidecarHandle> {
  // dist/server/sidecar.js -> dist/ui/index.html and plugin root
  const uiHtmlPath = path.resolve(import.meta.dirname, "..", "ui", "index.html");
  const pluginRoot = path.resolve(import.meta.dirname, "..", "..");
  const dataDir = resolveDataDir({
    argv,
    pluginRoot,
    preferSharedPluginData: true
  });
  const db = new TrackerDatabase(dataDir);

  const created = await createTrackerSidecarServer({
    db,
    dataDir,
    uiHtmlPath,
    pluginRoot
  });
  const handle = await created.start();

  // Kick off initial scan asynchronously after HTTP server starts listening.
  const service = createTrackerAppService({ db, dataDir, uiHtmlPath, pluginRoot });
  void service.scanNow().catch((err) => {
    process.stderr.write(
      `[flight-recorder-sidecar] initial scan warning: ${err instanceof Error ? err.message : String(err)}\n`
    );
  });

  let shuttingDown = false;
  let lsWatcher: { active: boolean; stop: () => void } = {
    active: false,
    stop: () => {}
  };

  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    lsWatcher.stop();
    const forceTimer = setTimeout(() => process.exit(0), 1_500);
    forceTimer.unref();
    Promise.resolve(handle.close())
      .catch(() => {})
      .finally(() => {
        try {
          db.close();
        } catch {
          // Ignore close errors on exit
        }
        process.exit(0);
      });
  };

  lsWatcher = watchLanguageServerLifecycle(shutdown);
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return handle;
}

const isDirectEntry =
  Boolean(process.argv[1]) &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isDirectEntry && process.env.NODE_ENV !== "test") {
  startSidecarMain().catch((err) => {
    process.stderr.write(
      `[flight-recorder-sidecar] fatal error: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`
    );
    process.exit(1);
  });
}
