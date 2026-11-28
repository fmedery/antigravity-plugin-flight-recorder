import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildSidecarDeepLink } from "../src/server/appService.js";
import { isValidExpandedPath, resolveDataDir } from "../src/server/dataDir.js";
import { TrackerDatabase } from "../src/server/db.js";
import { resolveHostTheme } from "../src/server/hostTheme.js";
import {
  createTrackerSidecarServer,
  injectSidecarBootstrap,
  isAllowedLoopbackOrigin,
  resolveInitialHostTheme,
  verifySidecarToken
} from "../src/server/sidecar.js";
import { createTrackerMcpServer } from "../src/server/tools.js";

function reserveFreePort(): Promise<number> {
  return new Promise((resolvePromise, rejectPromise) => {
    const srv = net.createServer();
    srv.once("error", rejectPromise);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = addr && typeof addr === "object" ? addr.port : 0;
      srv.close(() => resolvePromise(port));
    });
  });
}

async function waitForHealth(baseUrl: string, timeoutMs = 8_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/_sidecar/health`);
      if (res.ok) return;
    } catch {
      // Server still booting
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error(`Sidecar failed to become healthy at ${baseUrl} within ${timeoutMs}ms`);
}

test("resolveDataDir guards unexpanded templates and discovers shared plugin_data across MCP and sidecar", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fr-datadir-test-"));
  try {
    assert.equal(isValidExpandedPath("${PLUGIN_DATA}"), false);
    assert.equal(isValidExpandedPath("/tmp/${PLUGIN_DATA}/db"), false);
    assert.equal(isValidExpandedPath("/tmp/valid-dir"), true);

    const homeDir = path.join(tmp, "home");
    const appDataDir = path.join(homeDir, ".gemini", "antigravity");
    const pluginDataDir = path.join(appDataDir, "plugin_data", "flight-recorder");
    const sidecarExecDir = path.join(
      appDataDir,
      "sidecar_data",
      "flight-recorder",
      "dashboard",
      "data"
    );
    fs.mkdirSync(pluginDataDir, { recursive: true });
    fs.mkdirSync(sidecarExecDir, { recursive: true });

    // 1. Unexpanded --data-dir=${PLUGIN_DATA} is skipped, discovering existing plugin_data dir
    const resolvedShared = resolveDataDir({
      argv: ["--data-dir=${PLUGIN_DATA}"],
      env: { ANTIGRAVITY_EXECUTABLE_DATA_DIR: sidecarExecDir },
      pluginRoot: path.join(homeDir, ".gemini", "config", "plugins", "flight-recorder"),
      homeDir,
      preferSharedPluginData: true
    });
    assert.equal(resolvedShared, pluginDataDir);

    // 2. Explicit expanded --data-dir always wins
    const explicitDir = path.join(tmp, "explicit");
    assert.equal(
      resolveDataDir({
        argv: [`--data-dir=${explicitDir}`],
        env: { PLUGIN_DATA: pluginDataDir },
        homeDir,
        preferSharedPluginData: true
      }),
      explicitDir
    );

    // 3. When no plugin_data dir exists, preferSharedPluginData falls back to ANTIGRAVITY_EXECUTABLE_DATA_DIR
    const cleanHome = path.join(tmp, "clean-home");
    const onlySidecarDir = path.join(
      cleanHome,
      ".gemini",
      "antigravity",
      "sidecar_data",
      "flight-recorder",
      "dashboard",
      "data"
    );
    fs.mkdirSync(onlySidecarDir, { recursive: true });
    assert.equal(
      resolveDataDir({
        argv: ["--data-dir=${PLUGIN_DATA}"],
        env: { ANTIGRAVITY_EXECUTABLE_DATA_DIR: onlySidecarDir },
        homeDir: cleanHome,
        preferSharedPluginData: true
      }),
      onlySidecarDir
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("sidecar origin guard, token check, HTML bootstrap injection, theme detection, and deep links", () => {
  assert.equal(isAllowedLoopbackOrigin(undefined), true);
  assert.equal(isAllowedLoopbackOrigin("null"), true);
  assert.equal(isAllowedLoopbackOrigin("plugin://flight-recorder-12345"), true);
  assert.equal(isAllowedLoopbackOrigin("http://127.0.0.1:4321"), true);
  assert.equal(isAllowedLoopbackOrigin("http://localhost:5173"), true);
  assert.equal(isAllowedLoopbackOrigin("http://[::1]:8080"), true);
  assert.equal(isAllowedLoopbackOrigin("https://evil.example"), false);
  assert.equal(isAllowedLoopbackOrigin("http://127.0.0.1.evil.example"), false);
  assert.equal(isAllowedLoopbackOrigin("javascript:alert(1)"), false);

  assert.equal(verifySidecarToken("secret-123", "secret-123"), true);
  assert.equal(verifySidecarToken("secret-124", "secret-123"), false);
  assert.equal(verifySidecarToken("", "secret-123"), false);
  assert.equal(verifySidecarToken("anything", ""), true);

  const injected = injectSidecarBootstrap(
    "<!doctype html><html><head><title>FR</title></head><body></body></html>",
    {
      uiToken: "a+b=c",
      initialTheme: "dark",
      darkVariables: { "--color-background-primary": "#24273A" }
    }
  );
  assert.match(injected, /<meta name="flight-recorder-transport" content="sidecar" \/>/);
  assert.match(injected, /id="fr-host-theme"/);
  assert.match(injected, /#24273A/);
  assert.match(injected, /setAttribute\("data-theme","dark"\)/);
  assert.match(injected, /<script src="\/preload\.js\?token=a%2Bb%3Dc"><\/script>/);

  assert.equal(buildSidecarDeepLink({}), "sidecar://flight-recorder/dashboard/");
  assert.equal(
    buildSidecarDeepLink({
      view: "project",
      projectPath: "/Users/dev/my app",
      timeRange: "7d"
    }),
    "sidecar://flight-recorder/dashboard/?view=project&targetProjectPath=%2FUsers%2Fdev%2Fmy+app&timeRange=7d"
  );

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fr-theme-test-"));
  try {
    const cfgPath = path.join(tmp, "config.json");
    const storagePath = path.join(tmp, "app_storage.json");
    fs.writeFileSync(
      cfgPath,
      `\uFEFF${JSON.stringify({ userSettings: { themeMode: "THEME_MODE_LIGHT" } })}`,
      "utf8"
    );
    assert.equal(resolveInitialHostTheme(cfgPath, storagePath), "light");

    fs.writeFileSync(
      cfgPath,
      JSON.stringify({ userSettings: { themeMode: "dark" } }),
      "utf8"
    );
    fs.writeFileSync(
      storagePath,
      JSON.stringify({ "theme-preset-dark": "Nord", "theme-preset-light": "One Light" }),
      "utf8"
    );
    assert.equal(resolveInitialHostTheme(cfgPath, storagePath), "dark");
    const nordTheme = resolveHostTheme({ configJsonPath: cfgPath, appStoragePath: storagePath });
    assert.equal(nordTheme.mode, "dark");
    assert.equal(nordTheme.presetName, "Nord");
    assert.equal(nordTheme.cssVariables["--color-background-primary"], "#2E3440");
    assert.equal(nordTheme.cssVariables["--color-ring-primary"], "#88C0D0");
    assert.equal(nordTheme.cssVariables["--color-on-primary"], "#111317");

    // System mode still emits both darkVariables (Catppuccin) and lightVariables (Catppuccin Latte)
    fs.writeFileSync(cfgPath, JSON.stringify({ userSettings: {} }), "utf8");
    fs.writeFileSync(
      storagePath,
      JSON.stringify({ "theme-preset-dark": "Catppuccin", "theme-preset-light": "Catppuccin Latte" }),
      "utf8"
    );
    const sysTheme = resolveHostTheme({ configJsonPath: cfgPath, appStoragePath: storagePath });
    assert.equal(sysTheme.mode, "system");
    assert.equal(sysTheme.darkVariables["--color-background-primary"], "#24273A");
    assert.equal(sysTheme.darkVariables["--color-on-primary"], "#111317");
    assert.equal(sysTheme.lightVariables["--color-background-primary"], "#EFF1F5");
    assert.equal(sysTheme.lightVariables["--color-on-primary"], "#ffffff");

    assert.equal(
      resolveInitialHostTheme(path.join(tmp, "missing.json"), path.join(tmp, "missing-storage.json")),
      "system"
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("UI sidecar HTTP API enforces token/origin security and shares SQLite WAL state live with MCP server", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fr-sidecar-int-"));
  const brainDir = path.join(tmpDir, "brain");
  const dataDir = path.join(tmpDir, "data");
  const eventsPath = path.join(dataDir, "events.jsonl");
  const convId = "dddddddd-1111-2222-3333-444444444444";
  const convLogDir = path.join(brainDir, convId, ".system_generated", "logs");
  fs.mkdirSync(convLogDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    path.join(convLogDir, "transcript_full.jsonl"),
    [
      {
        step_index: 0,
        source: "USER_EXPLICIT",
        type: "USER_INPUT",
        status: "DONE",
        created_at: "2026-11-26T10:00:00Z",
        content: "<USER_REQUEST>\nVerify enterprise sidecar\n</USER_REQUEST>"
      },
      {
        step_index: 1,
        source: "MODEL",
        type: "PLANNER_RESPONSE",
        status: "DONE",
        created_at: "2026-11-26T10:00:01Z",
        model: "gemini-4-neon",
        input_tokens: 12_000,
        cache_read_tokens: 4_000,
        output_tokens: 500,
        content: "Done."
      }
    ]
      .map((l) => JSON.stringify(l))
      .join("\n") + "\n",
    "utf8"
  );

  fs.writeFileSync(
    eventsPath,
    JSON.stringify({
      tsMs: Date.parse("2026-11-26T10:00:00Z"),
      hookEventName: "SessionStart",
      conversationId: convId,
      workspacePaths: ["/Users/dev/enterprise-app"]
    }) + "\n",
    "utf8"
  );

  const uiHtmlPath = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "dist",
    "ui",
    "index.html"
  );
  const pluginRoot = path.resolve(import.meta.dirname, "..", "..");
  const token = "sidecar-test-token-xyz";

  const sidecarDb = new TrackerDatabase(dataDir);
  const mcpDb = new TrackerDatabase(dataDir);
  const created = await createTrackerSidecarServer({
    db: sidecarDb,
    dataDir,
    uiHtmlPath,
    pluginRoot,
    brainRoots: [{ surface: "antigravity", dir: brainDir }],
    eventsPath,
    port: 0,
    uiToken: token,
    forceStandalone: true
  });
  const handle = await created.start();
  assert.ok(handle.url, "Expected sidecar HTTP loopback URL");

  const mcpServer = createTrackerMcpServer({
    db: mcpDb,
    dataDir,
    uiHtmlPath,
    pluginRoot,
    brainRoots: [{ surface: "antigravity", dir: brainDir }],
    eventsPath
  });
  const mcpClient = new Client({ name: "sidecar-parity-client", version: "1.0.0" });
  const [cTrans, sTrans] = InMemoryTransport.createLinkedPair();
  await Promise.all([
    mcpServer.connect(sTrans),
    mcpClient.connect(cTrans)
  ]);

  try {
    // 1. Liveness health probe works without token
    const liveness = await fetch(`${handle.url}/_sidecar/health`);
    assert.equal(liveness.status, 200);

    // 2. HTML page requires token and injects sidecar transport + preload.js without touching dist/ui/index.html on disk
    const noTokPage = await fetch(`${handle.url}/`);
    assert.equal(noTokPage.status, 401);

    const okPage = await fetch(`${handle.url}/?token=${encodeURIComponent(token)}`);
    assert.equal(okPage.status, 200);
    const pageHtml = await okPage.text();
    assert.match(pageHtml, /flight-recorder-transport/);
    assert.match(pageHtml, /\/preload\.js\?token=sidecar-test-token-xyz/);

    const diskHtml = fs.readFileSync(uiHtmlPath, "utf8");
    assert.equal(/<meta\s+name="flight-recorder-transport"/i.test(diskHtml), false);
    assert.equal(/<script\s+src="\/preload\.js/i.test(diskHtml), false);

    // 3. API token auth & Origin checks
    const unauthApi = await fetch(`${handle.url}/api/dashboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    assert.equal(unauthApi.status, 401);

    const badOrigin = await fetch(`${handle.url}/api/dashboard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sidecar-Token": token,
        Origin: "https://evil.example"
      },
      body: "{}"
    });
    assert.equal(badOrigin.status, 403);

    const apiHeaders = {
      "Content-Type": "application/json",
      "X-Sidecar-Token": token,
      Origin: "plugin://flight-recorder-dashboard"
    };

    // 4. GET /api/health + POST /api/dashboard, /api/project, /api/chat, /api/rescan
    const apiHealth = await fetch(`${handle.url}/api/health`, {
      headers: { "X-Sidecar-Token": token }
    });
    assert.equal(apiHealth.status, 200);
    const healthJson = (await apiHealth.json()) as { ok: boolean; version: string };
    assert.equal(healthJson.ok, true);
    assert.ok(healthJson.version.length > 0);

    const dashRes = await fetch(`${handle.url}/api/dashboard`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ timeRange: "all" })
    });
    assert.equal(dashRes.status, 200);
    const dash = (await dashRes.json()) as {
      totals: { projectCount: number; chatCount: number };
      projects: Array<{ projectPath: string }>;
      pricingRules: Array<{
        id: string;
        pattern: string;
        label: string;
        inputPer1M: number;
        cacheReadPer1M: number;
        outputPer1M: number;
        enabled: boolean;
      }>;
    };
    assert.equal(dash.totals.projectCount, 1);
    assert.equal(dash.totals.chatCount, 1);
    assert.equal(dash.projects[0].projectPath, "/Users/dev/enterprise-app");

    const projRes = await fetch(`${handle.url}/api/project`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ projectPath: "/Users/dev/enterprise-app" })
    });
    assert.equal(projRes.status, 200);
    const missingProj = await fetch(`${handle.url}/api/project`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ projectPath: "/nonexistent/project" })
    });
    assert.equal(missingProj.status, 404);

    const badProjBody = await fetch(`${handle.url}/api/project`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({})
    });
    assert.equal(badProjBody.status, 400);

    const chatRes = await fetch(`${handle.url}/api/chat`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ conversationId: convId })
    });
    assert.equal(chatRes.status, 200);

    const rescanRes = await fetch(`${handle.url}/api/rescan`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ onlyIfChanged: true })
    });
    assert.equal(rescanRes.status, 200);
    const rescanJson = (await rescanRes.json()) as { changed: boolean };
    assert.equal(rescanJson.changed, false);

    // 5. Mutations via Sidecar (/api/pricing + /api/assign-project) immediately reflect in MCP server via shared SQLite WAL
    const customRules = [
      ...dash.pricingRules,
      {
        id: "custom-neon",
        pattern: "gemini-4-neon*",
        label: "Gemini 4 Neon",
        inputPer1M: 2.0,
        cacheReadPer1M: 0.2,
        outputPer1M: 12.0,
        enabled: true
      }
    ];
    const pricingRes = await fetch(`${handle.url}/api/pricing`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({ rules: customRules })
    });
    assert.equal(pricingRes.status, 200);

    const assignRes = await fetch(`${handle.url}/api/assign-project`, {
      method: "POST",
      headers: apiHeaders,
      body: JSON.stringify({
        conversationId: convId,
        projectPath: "/Users/dev/reassigned-enterprise"
      })
    });
    assert.equal(assignRes.status, 200);

    // Verify MCP server sees both the new pricing rule (priced cost!) and the reassigned project immediately!
    const mcpListRes = await mcpClient.callTool({
      name: "list_projects",
      arguments: {}
    });
    const mcpListSc = (mcpListRes.structuredContent ?? {}) as {
      projects?: Array<{
        projectPath: string;
        tokens: { estimatedCostUsd: number | null; unpricedModels: string[] };
      }>;
    };
    assert.equal(
      mcpListSc.projects?.[0]?.projectPath,
      "/Users/dev/reassigned-enterprise"
    );
    assert.ok(
      typeof mcpListSc.projects?.[0]?.tokens?.estimatedCostUsd === "number" &&
        mcpListSc.projects[0].tokens.estimatedCostUsd > 0,
      "Expected MCP server to compute priced USD using pricing saved via Sidecar API"
    );
    assert.deepEqual(mcpListSc.projects?.[0]?.tokens?.unpricedModels, []);

    // 6. Verify open_flight_recorder text response includes a sidecar:// deep link for Enterprise fallback
    const openToolRes = await mcpClient.callTool({
      name: "open_flight_recorder",
      arguments: { conversationId: convId }
    });
    const openText =
      Array.isArray(openToolRes.content) && openToolRes.content[0]?.type === "text"
        ? (openToolRes.content[0].text ?? "")
        : "";
    assert.match(openText, /sidecar:\/\/flight-recorder\/dashboard\/\?view=chat&targetConversationId=dddddddd-/);
  } finally {
    await mcpClient.close().catch(() => {});
    await mcpServer.close().catch(() => {});
    await handle.close().catch(() => {});
    sidecarDb.close();
    mcpDb.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("zero-install dist/server/sidecar.js + sidecars/dashboard/run.mjs boot with zero node_modules", async () => {
  const repoRoot = path.resolve(import.meta.dirname, "..", "..");
  const sidecarBundle = path.join(repoRoot, "dist", "server", "sidecar.js");
  const uiBundle = path.join(repoRoot, "dist", "ui", "index.html");
  const pluginJsonSrc = path.join(repoRoot, "plugin.json");
  const runMjsSrc = path.join(repoRoot, "sidecars", "dashboard", "run.mjs");
  const sidecarJsonSrc = path.join(repoRoot, "sidecars", "dashboard", "sidecar.json");

  assert.ok(fs.existsSync(sidecarBundle), "Expected dist/server/sidecar.js");

  const isolated = fs.mkdtempSync(path.join(os.tmpdir(), "fr-sidecar-zero-deps-"));
  const dataDir = path.join(isolated, "data");
  fs.mkdirSync(path.join(isolated, "dist", "server"), { recursive: true });
  fs.mkdirSync(path.join(isolated, "dist", "ui"), { recursive: true });
  fs.mkdirSync(path.join(isolated, "sidecars", "dashboard"), { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  fs.copyFileSync(sidecarBundle, path.join(isolated, "dist", "server", "sidecar.js"));
  fs.copyFileSync(uiBundle, path.join(isolated, "dist", "ui", "index.html"));
  fs.copyFileSync(pluginJsonSrc, path.join(isolated, "plugin.json"));
  fs.copyFileSync(runMjsSrc, path.join(isolated, "sidecars", "dashboard", "run.mjs"));
  fs.copyFileSync(
    sidecarJsonSrc,
    path.join(isolated, "sidecars", "dashboard", "sidecar.json")
  );

  const port = await reserveFreePort();
  const token = "zero-deps-sidecar-tok";
  const stderrChunks: string[] = [];

  const child = spawn(
    process.execPath,
    ["run.mjs", "--data-dir=${PLUGIN_DATA}"],
    {
      cwd: path.join(isolated, "sidecars", "dashboard"),
      env: {
        ...process.env,
        ANTIGRAVITY_SIDECAR_WEB_PORT: String(port),
        ANTIGRAVITY_SIDECAR_UI_TOKEN: token,
        FLIGHT_RECORDER_DATA_DIR: dataDir,
        ANTIGRAVITY_LS_ADDRESS: ""
      },
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
  child.stderr.on("data", (chunk: Buffer | string) => {
    stderrChunks.push(String(chunk));
  });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    await waitForHealth(baseUrl);

    const htmlRes = await fetch(`${baseUrl}/?token=${encodeURIComponent(token)}`);
    assert.equal(htmlRes.status, 200);
    const html = await htmlRes.text();
    assert.match(html, /flight-recorder-transport/);

    const dashRes = await fetch(`${baseUrl}/api/dashboard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sidecar-Token": token
      },
      body: JSON.stringify({ skipScan: true })
    });
    assert.equal(dashRes.status, 200);

    const stderrText = stderrChunks.join("");
    assert.equal(
      stderrText.includes("ExperimentalWarning"),
      false,
      `Expected clean sidecar stderr without ExperimentalWarning, got: ${stderrText}`
    );
  } finally {
    child.kill("SIGTERM");
    await new Promise<void>((resolvePromise) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        resolvePromise();
      }, 3_000);
      child.once("exit", () => {
        clearTimeout(timer);
        resolvePromise();
      });
    });
    fs.rmSync(isolated, { recursive: true, force: true });
  }
});
