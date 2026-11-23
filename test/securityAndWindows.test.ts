import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { analyzeConversation } from "../src/server/analytics.js";
import { createTrackerMcpServer } from "../src/server/tools.js";
import { TrackerDatabase } from "../src/server/db.js";
import { ingestHookEvents } from "../src/server/hookIngestor.js";
import {
  isAbsoluteLocalPath,
  isWindowsPath,
  pathBaseName,
  pathDirName,
  toFileUri,
  unwrapFileUri
} from "../src/shared/paths.js";
import { matchPricingRule } from "../src/shared/pricing.js";
import { sanitizePreviewText } from "../src/shared/redact.js";
import { findProjectRootForPath } from "../src/server/scanner.js";
import {
  clearInstalledPluginsCache,
  computeScopeSkillEfficiency,
  discoverInstalledPlugins,
  resolveToolPluginAndChild
} from "../src/server/skillEfficiency.js";
import { parseTranscriptFile } from "../src/server/transcriptParser.js";
import type {
  ConversationSummary,
  DiagnosticCategory,
  DiagnosticFinding
} from "../src/shared/types.js";
import {
  KPI_HELP_COPY,
  buildErrorTroubleshootingPrompt,
  describeDiagnostic,
  describeErrorBadge,
  describePluginWarning,
  groupProjectChats,
  selectTopDiagnostics,
  type ErrorBadgeKind
} from "../src/ui/format.js";

test("paths.ts handles Windows drive/UNC paths, percent-encoded file:// URIs with spaces, UTF-8, %3A drive colons, and RFC 8089 toFileUri", () => {
  assert.equal(
    unwrapFileUri("file:///C:/Users/Jane%20Doe/My%20App/src/100%.ts"),
    "C:/Users/Jane Doe/My App/src/100%.ts"
  );
  assert.equal(
    unwrapFileUri("file:///c%3A/Users/Jane%20Doe/caf%C3%A9/100%bad.ts"),
    "c:/Users/Jane Doe/café/100%bad.ts"
  );
  assert.equal(
    isWindowsPath(unwrapFileUri("file:///c%3A/Users/Jane%20Doe/app/a.ts")),
    true
  );
  assert.equal(
    toFileUri(unwrapFileUri("file:///c%3A/Users/Jane%20Doe/caf%C3%A9/a.ts")),
    "file:///c:/Users/Jane%20Doe/caf%C3%A9/a.ts"
  );
  assert.equal(
    unwrapFileUri("file:///Users/jane/My%20App/100%bad.md"),
    "/Users/jane/My App/100%bad.md"
  );
  assert.equal(isWindowsPath("C:\\Users\\Jane\\app"), true);
  assert.equal(isWindowsPath("\\\\server\\share\\repo\\a.ts"), true);
  assert.equal(isAbsoluteLocalPath("D:/work/service/index.ts"), true);
  assert.equal(isAbsoluteLocalPath("relative/file.ts"), false);
  assert.equal(pathBaseName("C:\\Users\\Jane\\My App\\"), "My App");
  assert.equal(pathDirName("C:\\Users\\Jane\\My App\\a.ts"), "C:\\Users\\Jane\\My App");
  assert.equal(
    toFileUri("C:\\Users\\Jane Doe\\My App\\src\\a.ts"),
    "file:///C:/Users/Jane%20Doe/My%20App/src/a.ts"
  );
  assert.equal(
    toFileUri("/Users/jane/My App/src/a.ts"),
    "file:///Users/jane/My%20App/src/a.ts"
  );
});

test("Windows AGY project inference, transcript path extraction, .exe/.cmd plugin CLIs, and KPI help copy work cleanly", async () => {
  const existing = new Set([
    "D:\\work\\service\\package.json",
    "C:\\Users\\Jane Doe\\My App\\.git"
  ]);
  const existsFn = (p: string) =>
    existing.has(p) || existing.has(p.replace(/\//g, "\\"));

  assert.equal(
    findProjectRootForPath("d:\\work\\service\\src\\index.ts", {
      existsFn: (p) => p.toLowerCase().replace(/\//g, "\\") === "d:\\work\\service\\package.json",
      isFileFn: () => false,
      homeDir: "C:\\Users\\Jane Doe"
    }),
    "d:\\work\\service"
  );
  assert.equal(
    findProjectRootForPath("C:\\Users\\Jane Doe\\My App\\src\\a.ts", {
      existsFn,
      isFileFn: () => false,
      homeDir: "C:\\Users\\Jane Doe"
    }),
    "C:\\Users\\Jane Doe\\My App"
  );
  assert.equal(
    findProjectRootForPath("c:\\windows\\system32\\cmd.exe", {
      existsFn: () => true,
      isFileFn: () => true,
      homeDir: "C:\\Users\\Jane Doe"
    }),
    null
  );
  assert.equal(
    findProjectRootForPath("C:\\Users\\Jane Doe\\AppData\\Local\\Temp\\scratch.ts", {
      existsFn: () => true,
      isFileFn: () => true,
      homeDir: "C:\\Users\\Jane Doe"
    }),
    null
  );

  // Verify every top KPI card help tooltip has both meaning and impact text
  for (const key of [
    "projects",
    "chatsSubagents",
    "totalTokens",
    "cacheHitRatio",
    "tokensAndCache",
    "activeAgentTime",
    "userWaitIdle",
    "estCost"
  ] as const) {
    assert.ok(KPI_HELP_COPY[key].meaning.length > 20, `Missing meaning for ${key}`);
    assert.ok(KPI_HELP_COPY[key].impact.length > 20, `Missing impact for ${key}`);
  }
  assert.match(KPI_HELP_COPY.totalTokens.meaning, /non-overlapping/i);
  assert.match(KPI_HELP_COPY.totalTokens.meaning, /cache/i);
  assert.match(KPI_HELP_COPY.totalTokens.meaning, /output/i);
  assert.match(KPI_HELP_COPY.cacheHitRatio.meaning, /output.*excluded/i);
  assert.match(KPI_HELP_COPY.cacheHitRatio.impact, /75[–-]90%/);
  assert.match(KPI_HELP_COPY.cacheHitRatio.impact, /TTL|compaction/i);

  // Windows plugin CLI (.exe / .cmd) + multi-dir builtin discovery + Windows transcript paths
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fr-win-test-"));
  try {
    const userPlug = path.join(tmp, "user-plugins", "gcloud-tools");
    const builtinPlug = path.join(tmp, "builtin-plugins", "agy-builtin");
    fs.mkdirSync(path.join(userPlug, "bin"), { recursive: true });
    fs.mkdirSync(path.join(builtinPlug, "skills", "agy-helper"), { recursive: true });
    fs.writeFileSync(
      path.join(userPlug, "plugin.json"),
      JSON.stringify({ name: "gcloud-tools", displayName: "GCloud Tools" })
    );
    fs.writeFileSync(path.join(userPlug, "bin", "gcloud-tools.cmd"), "@echo off\r\n");
    fs.writeFileSync(
      path.join(builtinPlug, "plugin.json"),
      JSON.stringify({ name: "agy-builtin", displayName: "AGY Builtin" })
    );
    fs.writeFileSync(
      path.join(builtinPlug, "skills", "agy-helper", "SKILL.md"),
      "---\nname: agy-helper\n---\nHelper."
    );

    clearInstalledPluginsCache();
    const reg = discoverInstalledPlugins([
      path.join(tmp, "user-plugins"),
      path.join(tmp, "builtin-plugins")
    ]);

    const cmdHit = resolveToolPluginAndChild(
      {
        category: "command",
        toolName: "run_command",
        mcpServer: null,
        skillName: null,
        skillPlugin: null,
        targetPath: null,
        argsPreview: "gcloud-tools.cmd projects list"
      },
      reg
    );
    assert.equal(cmdHit?.parentName, "GCloud Tools");
    assert.equal(cmdHit?.childKind, "CLI");

    const winScriptHit = resolveToolPluginAndChild(
      {
        category: "command",
        toolName: "run_command",
        mcpServer: null,
        skillName: null,
        skillPlugin: null,
        targetPath: null,
        argsPreview:
          'node "C:\\Users\\Jane\\.gemini\\config\\plugins\\gcloud-tools\\scripts\\deploy.mjs"'
      },
      reg
    );
    assert.equal(winScriptHit?.parentName, "GCloud Tools");

    const builtinHit = resolveToolPluginAndChild(
      {
        category: "skill",
        toolName: "read_file",
        mcpServer: null,
        skillName: "agy-helper",
        skillPlugin: "agy-builtin",
        targetPath:
          "C:\\Users\\Jane\\.gemini\\antigravity\\builtin\\plugins\\agy-builtin\\skills\\agy-helper\\SKILL.md",
        argsPreview: ""
      },
      reg
    );
    assert.equal(builtinHit?.parentName, "AGY Builtin");

    const tFile = path.join(tmp, "win-transcript.jsonl");
    fs.writeFileSync(
      tFile,
      [
        JSON.stringify({
          step_index: 0,
          type: "USER_INPUT",
          created_at: "2026-11-23T12:00:00Z",
          content: "<USER_REQUEST>Check Windows file</USER_REQUEST>"
        }),
        JSON.stringify({
          step_index: 1,
          type: "PLANNER_RESPONSE",
          created_at: "2026-11-23T12:00:01Z",
          model: "gemini-2.5-pro",
          input_tokens: 100,
          cache_read_tokens: 0,
          output_tokens: 20,
          tool_calls: [
            {
              id: "w1",
              name: "read_file",
              args: { Path: "file:///C:/Users/Jane%20Doe/My%20App/src/main.ts" }
            }
          ]
        }),
        JSON.stringify({
          step_index: 2,
          type: "GENERIC",
          created_at: "2026-11-23T12:00:02Z",
          content: "console.log('hi');"
        })
      ].join("\n") + "\n"
    );
    const parsed = await parseTranscriptFile(tFile, "win-conv");
    assert.equal(parsed.toolCalls[0].targetPath, "C:/Users/Jane Doe/My App/src/main.ts");
    assert.ok(parsed.candidatePaths.includes("C:/Users/Jane Doe/My App/src/main.ts"));
  } finally {
    clearInstalledPluginsCache();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("sanitizePreviewText, hooks/record-event.mjs, POSIX 0600 permissions, ReDoS guard, and chunked hook ingestion protect local data", () => {
  const dirty =
    "\u001b[31mError\u001b[0m \u001b]52;c;c2VjcmV0\u0007 GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuv " +
    "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl " +
    "key=AIzaSyA123456789012345678901234567890 url=https://admin:s3cr3t@example.com/repo.git " +
    "outputTokens=500 model=gemini-4-hydrogen";
  const cleaned = sanitizePreviewText(dirty, 500);

  assert.equal(cleaned.includes("\u001b"), false);
  assert.equal(cleaned.includes("ghp_1234"), false);
  assert.equal(cleaned.includes("eyJhbGci"), false);
  assert.equal(cleaned.includes("AIzaSyA"), false);
  assert.equal(cleaned.includes("s3cr3t"), false);
  assert.ok(cleaned.includes("[REDACTED]"));
  assert.ok(cleaned.includes("outputTokens=500 model=gemini-4-hydrogen"));

  // ReDoS guard: pathological glob pattern must evaluate in < 25ms
  const tStart = performance.now();
  const matched = matchPricingRule("a".repeat(80) + "!", [
    {
      id: "evil",
      pattern: "a*a*a*a*a*a*a*a*a*b",
      label: "Evil",
      inputPer1M: 1,
      cacheReadPer1M: 0.1,
      outputPer1M: 2,
      enabled: true
    }
  ]);
  assert.equal(matched, null);
  assert.ok(performance.now() - tStart < 25, "Expected ReDoS-safe glob evaluation < 25ms");

  // Node hook spooler fail-open, secret redaction, POSIX 0700/0600 permissions, and chunked mid-line ingestion
  const tmpDir = path.join(os.tmpdir(), `fr-sec-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const hookScript = path.resolve(import.meta.dirname, "..", "..", "hooks", "record-event.mjs");
  try {
    // 1. Malformed JSON stdin fails open with {} and exit 0
    const badRes = spawnSync(process.execPath, [hookScript], {
      input: "{not valid json",
      env: { ...process.env, PLUGIN_DATA: tmpDir },
      encoding: "utf8"
    });
    assert.equal(badRes.status, 0);
    assert.equal(badRes.stdout.trim(), "{}");

    // 2. Secret-bearing hook payloads get redacted and written with private modes
    for (let i = 0; i < 4; i++) {
      const okRes = spawnSync(process.execPath, [hookScript], {
        input: JSON.stringify({
          hookEventName: "PostToolUse",
          conversationId: `conv-sec-${i}`,
          lastUserInput: "Deploy with OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnop",
          toolCall: {
            id: `tc-${i}`,
            name: "run_command",
            args: {
              CommandLine: "OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnop npm run deploy"
            }
          }
        }),
        env: { ...process.env, PLUGIN_DATA: tmpDir },
        encoding: "utf8"
      });
      assert.equal(okRes.status, 0);
      assert.equal(okRes.stdout.trim(), "{}");
    }

    const eventsPath = path.join(tmpDir, "events.jsonl");
    const eventsRaw = fs.readFileSync(eventsPath, "utf8");
    assert.equal(eventsRaw.includes("sk-proj-1234"), false);
    assert.ok(eventsRaw.includes("[REDACTED]"));

    const db = new TrackerDatabase(tmpDir);
    try {
      if (process.platform !== "win32") {
        const dirMode = fs.statSync(tmpDir).mode & 0o777;
        const eventsMode = fs.statSync(eventsPath).mode & 0o777;
        const dbMode = fs.statSync(db.dbPath).mode & 0o777;
        assert.equal(dirMode, 0o700);
        assert.equal(eventsMode, 0o600);
        assert.equal(dbMode, 0o600);
      }

      // 3. Chunked mid-line ingestion (maxChunkBytes = 210 cuts across JSONL lines)
      let totalIngested = 0;
      const touchedAll = new Set<string>();
      for (let pass = 0; pass < 10; pass++) {
        const r = ingestHookEvents(db, eventsPath, { maxChunkBytes: 210 });
        if (r.ingestedCount === 0) break;
        totalIngested += r.ingestedCount;
        for (const id of r.touchedConversationIds) touchedAll.add(id);
      }
      assert.equal(totalIngested, 4);
      assert.equal(touchedAll.size, 4);
    } finally {
      db.close();
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("zero-install dist/server/index.js runs outside repo with zero node_modules and passes public manifest/docs contracts", async () => {
  const repoRoot = path.resolve(import.meta.dirname, "..", "..");
  const serverBundlePath = path.join(repoRoot, "dist", "server", "index.js");
  const uiBundlePath = path.join(repoRoot, "dist", "ui", "index.html");

  assert.ok(fs.existsSync(serverBundlePath), "Expected dist/server/index.js");
  assert.ok(fs.existsSync(uiBundlePath), "Expected dist/ui/index.html");

  // 1. Verify dist/server/index.js has zero bare third-party ESM imports (only node:* built-ins)
  const serverCode = fs.readFileSync(serverBundlePath, "utf8");
  assert.equal(
    /^\s*import\s+.*["']@modelcontextprotocol\//m.test(serverCode),
    false,
    "Expected @modelcontextprotocol/sdk to be bundled into dist/server/index.js"
  );

  // 2. Copy dist/ into an isolated temp folder with ZERO node_modules and talk over MCP stdio
  const isolatedRoot = fs.mkdtempSync(path.join(os.tmpdir(), "fr-zero-deps-"));
  const isolatedDistServer = path.join(isolatedRoot, "dist", "server");
  const isolatedDistUi = path.join(isolatedRoot, "dist", "ui");
  const isolatedData = path.join(isolatedRoot, "data");
  fs.mkdirSync(isolatedDistServer, { recursive: true });
  fs.mkdirSync(isolatedDistUi, { recursive: true });
  fs.mkdirSync(isolatedData, { recursive: true });
  fs.copyFileSync(serverBundlePath, path.join(isolatedDistServer, "index.js"));
  fs.copyFileSync(uiBundlePath, path.join(isolatedDistUi, "index.html"));

  const stderrChunks: string[] = [];
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      path.join(isolatedDistServer, "index.js"),
      `--data-dir=${isolatedData}`
    ],
    cwd: isolatedRoot,
    stderr: "pipe"
  });
  transport.stderr?.on("data", (chunk: Buffer | string) => {
    stderrChunks.push(String(chunk));
  });

  const client = new Client({ name: "zero-deps-test", version: "1.0.0" });
  try {
    await client.connect(transport);
    const toolsList = await client.listTools();
    const toolNames = new Set(toolsList.tools.map((t) => t.name));

    for (const expectedTool of [
      "open_flight_recorder",
      "list_projects",
      "get_project_summary",
      "get_chat_analysis",
      "explain_bottlenecks",
      "get_skill_optimization"
    ]) {
      assert.ok(toolNames.has(expectedTool), `Missing MCP tool ${expectedTool}`);
    }

    const optRes = await client.callTool({
      name: "get_skill_optimization",
      arguments: {}
    });
    assert.equal(Boolean(optRes.isError), false);

    const stderrText = stderrChunks.join("");
    assert.equal(
      stderrText.includes("ExperimentalWarning"),
      false,
      `Expected clean stderr without ExperimentalWarning, got: ${stderrText}`
    );

    // 3. Manifest, hooks, skill, and public documentation contracts
    const allowedPluginKeys = new Set([
      "name",
      "displayName",
      "version",
      "description",
      "logo",
      "suggestedPrompts",
      "author",
      "homepage",
      "repository",
      "disabled"
    ]);
    const pluginJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "plugin.json"), "utf8")
    ) as Record<string, unknown>;
    for (const key of Object.keys(pluginJson)) {
      assert.ok(allowedPluginKeys.has(key), `Unsupported plugin.json key: ${key}`);
    }
    assert.equal(
      pluginJson.repository,
      "https://github.com/fmedery/antigravity-plugin-flight-recorder"
    );
    assert.ok(
      typeof pluginJson.logo === "string" &&
        fs.existsSync(path.join(repoRoot, pluginJson.logo))
    );
    assert.ok(
      Array.isArray(pluginJson.suggestedPrompts) &&
        pluginJson.suggestedPrompts.length <= 3
    );

    const hooksJson = JSON.parse(
      fs.readFileSync(path.join(repoRoot, "hooks.json"), "utf8")
    ) as Record<string, Record<string, unknown>>;
    const hookSuite = hooksJson["flight-recorder-telemetry"];
    assert.ok(hookSuite);
    assert.equal("PreToolUse" in hookSuite, false, "Hooks must remain strictly passive");
    assert.equal(
      fs.existsSync(path.join(repoRoot, "hooks", "record_event.py")),
      false,
      "Legacy Python hook must be removed"
    );
    assert.equal(
      fs.existsSync(path.join(repoRoot, "hooks", "record-event.mjs")),
      true
    );

    for (const requiredDoc of ["LICENSE", "SECURITY.md", ".gitattributes", "README.md"]) {
      assert.ok(
        fs.existsSync(path.join(repoRoot, requiredDoc)),
        `Missing required public repo file: ${requiredDoc}`
      );
    }

    const readme = fs.readFileSync(path.join(repoRoot, "README.md"), "utf8");
    assert.match(readme, /fmedery\/antigravity-plugin-flight-recorder/);
    assert.match(readme, /PowerShell/i);
    assert.match(readme, /USERPROFILE/);
    assert.match(readme, /Download ZIP/i);
    assert.match(readme, /agy plugin install/);

    // 4. Server version & plain .mjs script syntax checks (no TypeScript syntax in .mjs!)
    assert.equal(client.getServerVersion()?.version, "0.2.0");
    for (const mjsRel of [
      "scripts/install-plugin.mjs",
      "scripts/build-server.mjs",
      "hooks/record-event.mjs"
    ]) {
      const chk = spawnSync(process.execPath, ["--check", path.join(repoRoot, mjsRel)], {
        encoding: "utf8"
      });
      assert.equal(
        chk.status,
        0,
        `Expected valid JS syntax in ${mjsRel}, got: ${chk.stderr}`
      );
    }

    // 5. KpiHelpTip explicit CSS anchor + toggletip ARIA/popover check + Overview tab markers in UI bundle
    const uiHtml = fs.readFileSync(uiBundlePath, "utf8");
    assert.match(uiHtml, /positionAnchor/);
    assert.match(uiHtml, /aria-expanded/);
    assert.match(uiHtml, /popovertargetaction/);
    assert.match(uiHtml, /Impact for you:/);
    assert.equal(uiHtml.includes("aria-describedby"), false);
    assert.match(uiHtml, /Top Issues/);
    assert.match(uiHtml, /Conversation Timeline/);
    assert.match(uiHtml, /Tokens & Models/);
    assert.match(uiHtml, /Plugins & Tools/);
    assert.match(uiHtml, /wf-turn-row/);
    assert.match(uiHtml, /diag-summary-btn/);
    assert.match(uiHtml, /tablist/);
    assert.match(uiHtml, /Possible remediation:/);
    assert.match(uiHtml, /diag-guidance/);
    assert.match(uiHtml, /badge-btn/);
    assert.match(uiHtml, /err-sample-list/);
    assert.match(uiHtml, /What to do:/);
    assert.match(uiHtml, /Troubleshoot/);
  } finally {
    await client.close().catch(() => {});
    fs.rmSync(isolatedRoot, { recursive: true, force: true });
  }
});

test("Windows backslash SKILL.md paths, JSON/custom *_TOKEN redaction, SQLite v6 upgrade, and Windows MCP projectPath lookup work end-to-end", async () => {
  // 1. JSON keys + arbitrary *_TOKEN / *_SECRET_* redaction without touching numeric outputTokens
  const jsonDirty = JSON.stringify({
    apiKey: "custom_secret_abc123",
    password: "hunter2password",
    env: "CLOUDFLARE_TOKEN=cf_tok_987654321 JWT_SECRET_V2=s3cr3t_val",
    outputTokens: 500,
    hasTokenTelemetry: true
  });
  const redactedJson = sanitizePreviewText(jsonDirty, 500);
  assert.equal(redactedJson.includes("custom_secret_abc123"), false);
  assert.equal(redactedJson.includes("hunter2password"), false);
  assert.equal(redactedJson.includes("cf_tok_987654321"), false);
  assert.equal(redactedJson.includes("s3cr3t_val"), false);
  assert.ok(redactedJson.includes('"outputTokens":500'));
  assert.ok(redactedJson.includes('"hasTokenTelemetry":true'));

  // 2. Native Windows backslash SKILL.md path parsed by parseTranscriptFile + duplicate read detection
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fr-win-skill-"));
  try {
    const tPath = path.join(tmp, "win-skill.jsonl");
    const winSkillPath =
      "C:\\Users\\Jane\\.gemini\\config\\plugins\\superpowers\\skills\\brainstorming\\SKILL.md";
    fs.writeFileSync(
      tPath,
      [
        JSON.stringify({
          step_index: 0,
          type: "USER_INPUT",
          created_at: "2026-11-23T12:00:00Z",
          content: "<USER_REQUEST>Design feature</USER_REQUEST>"
        }),
        JSON.stringify({
          step_index: 1,
          type: "PLANNER_RESPONSE",
          created_at: "2026-11-23T12:00:01Z",
          model: "gemini-2.5-pro",
          input_tokens: 1000,
          cache_read_tokens: 0,
          output_tokens: 100,
          tool_calls: [
            { id: "sk1", name: "read_file", args: { Path: winSkillPath } },
            {
              id: "sk2",
              name: "read_file",
              args: { Path: winSkillPath.replace(/\\/g, "/").toLowerCase() }
            }
          ]
        }),
        JSON.stringify({
          step_index: 2,
          type: "GENERIC",
          created_at: "2026-11-23T12:00:02Z",
          content: "---\nname: brainstorming\n---\n# Brainstorming"
        }),
        JSON.stringify({
          step_index: 3,
          type: "GENERIC",
          created_at: "2026-11-23T12:00:03Z",
          content: "---\nname: brainstorming\n---\n# Brainstorming"
        })
      ].join("\n") + "\n"
    );

    const parsed = await parseTranscriptFile(tPath, "win-skill-conv");
    assert.equal(parsed.toolCalls[0].category, "skill");
    assert.equal(parsed.toolCalls[0].skillName, "brainstorming");
    assert.equal(parsed.toolCalls[0].skillPlugin, "superpowers");

    const eff = computeScopeSkillEfficiency(
      [
        {
          conversationId: "win-skill-conv",
          parentConversationId: null,
          activeMs: 5_000,
          hasTokenTelemetry: true,
          filesTouched: [],
          plannerSteps: parsed.plannerSteps.map((s) => ({
            ...s,
            completedAtMs: s.createdAtMs + 2_000,
            modelDurationMs: 2_000,
            cacheHitRatio: 0,
            isCacheMiss: false,
            cacheMissCause: null,
            attributedSummary: ""
          })),
          toolCalls: parsed.toolCalls.map((tc, idx) => ({
            ...tc,
            id: idx + 1,
            attributedInputTokens: 500,
            compoundedCacheTokens: 500
          }))
        }
      ],
      []
    );
    assert.equal(eff.pluginSkillMetrics[0]?.children[0]?.duplicateReads, 1);

    // 3. SQLite PRAGMA user_version === 6 + Windows case/slash/URI MCP projectPath lookup
    const db = new TrackerDatabase(path.join(tmp, "db"));
    try {
      const ver = db.db.prepare("PRAGMA user_version").get() as {
        user_version: number;
      };
      assert.equal(ver.user_version, 6);

      db.upsertConversation(
        analyzeConversation(
          {
            conversationId: "win-proj-conv",
            transcriptPath: "D:\\brain\\win-proj-conv.jsonl",
            title: "Win App Chat",
            hasTokenTelemetry: true,
            startedAtMs: 1000,
            endedAtMs: 5000,
            models: ["gemini-2.5-pro"],
            slashCommands: [],
            candidatePaths: [],
            turns: [
              {
                turnIndex: 0,
                stepIndex: 0,
                createdAtMs: 1000,
                promptText: "Hi",
                promptPreview: "Hi",
                promptBytes: 2,
                slashCommand: null
              }
            ],
            plannerSteps: [],
            toolCalls: []
          },
          [],
          {
            surface: "antigravity",
            projectPath: "D:\\work\\service",
            projectSource: "hook",
            parentConversationId: null,
            subagentRole: null,
            subagentType: null
          }
        )
      );

      const mcpSrv = createTrackerMcpServer({
        db,
        dataDir: path.join(tmp, "db"),
        uiHtmlPath: path.join(tmp, "missing.html"),
        brainRoots: []
      });
      const mcpCli = new Client({ name: "win-lookup", version: "1.0.0" });
      const [cTrans, sTrans] = InMemoryTransport.createLinkedPair();
      await Promise.all([mcpSrv.connect(sTrans), mcpCli.connect(cTrans)]);
      try {
        const sumRes = await mcpCli.callTool({
          name: "get_project_summary",
          arguments: { projectPath: "file:///d:/work/service" }
        });
        const sumTxt =
          Array.isArray(sumRes.content) && sumRes.content[0]?.type === "text"
            ? (sumRes.content[0].text ?? "")
            : "";
        assert.match(sumTxt, /D:\\work\\service/);

        const chatRes = await mcpCli.callTool({
          name: "get_chat_analysis",
          arguments: { projectPath: "d:/work/service" }
        });
        const chatTxt =
          Array.isArray(chatRes.content) && chatRes.content[0]?.type === "text"
            ? (chatRes.content[0].text ?? "")
            : "";
        assert.match(chatTxt, /Win App Chat/);
      } finally {
        await mcpCli.close();
        await mcpSrv.close();
      }
    } finally {
      db.close();
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("groupProjectChats nests multi-hop subagents safely and selectTopDiagnostics prioritizes severity and impact", () => {
  const makeChat = (
    id: string,
    endedAtMs: number,
    parentConversationId: string | null = null
  ): ConversationSummary => ({
    conversationId: id,
    title: `Chat ${id}`,
    surface: "antigravity",
    projectPath: "/repo/app",
    projectName: "app",
    projectSource: "hook",
    parentConversationId,
    subagentRole: parentConversationId ? "Worker" : null,
    subagentType: parentConversationId ? "self" : null,
    startedAtMs: Math.max(0, endedAtMs - 1000),
    endedAtMs,
    terminationReason: null,
    models: ["gemini-2.5-pro"],
    modelBreakdown: [],
    slashCommands: [],
    turnCount: 1,
    stepCount: 1,
    toolCallCount: 0,
    errorCount: 0,
    skillsUsed: [],
    topPluginsSkills: [],
    tokens: {
      inputTokens: 100,
      cacheReadTokens: 0,
      outputTokens: 20,
      peakContextTokens: 100,
      cacheHitRatio: 0,
      hasTokenTelemetry: true,
      estimatedCostUsd: 0.01,
      cacheSavingsUsd: 0,
      unpricedModels: []
    },
    time: {
      activeMs: 1000,
      modelMs: 800,
      toolWallMs: 200,
      toolSumMs: 200,
      parallelismFactor: 1,
      subagentMs: 0,
      userIdleMs: 0,
      wallClockMs: 1000
    },
    hasLiveHooks: false
  });

  const chats: ConversationSummary[] = [
    makeChat("root-a", 1000, null),
    makeChat("sub-a1", 2000, "root-a"),
    makeChat("sub-a2-grandchild", 5000, "sub-a1"),
    makeChat("root-b", 3000, null),
    makeChat("orphan-sub", 4000, "outside-project-parent"),
    makeChat("cyc-1", 1500, "cyc-2"),
    makeChat("cyc-2", 1200, "cyc-1")
  ];

  const grouped = groupProjectChats(chats);
  assert.deepEqual(
    grouped.map((g) => g.root.conversationId),
    ["root-a", "orphan-sub", "root-b", "cyc-1", "cyc-2"]
  );
  assert.equal(grouped[0].lastActivityMs, 5000);
  assert.deepEqual(
    grouped[0].subagents.map((s) => s.conversationId),
    ["sub-a2-grandchild", "sub-a1"]
  );
  assert.equal(grouped[1].subagents.length, 0);

  const findings: DiagnosticFinding[] = [
    {
      id: "info-big",
      severity: "info",
      category: "token_driver",
      title: "Info high tokens",
      detail: "d",
      stepIndex: 1,
      turnIndex: 0,
      impactTokens: 90000,
      impactMs: 1000,
      citation: "S1"
    },
    {
      id: "warn-small",
      severity: "warning",
      category: "cache_miss",
      title: "Warn small",
      detail: "d",
      stepIndex: 2,
      turnIndex: 0,
      impactTokens: 500,
      impactMs: 500,
      citation: "S2"
    },
    {
      id: "crit-1",
      severity: "critical",
      category: "compaction_cliff",
      title: "Critical cliff",
      detail: "d",
      stepIndex: 3,
      turnIndex: 0,
      impactTokens: 10000,
      impactMs: 2000,
      citation: "S3"
    },
    {
      id: "warn-big",
      severity: "warning",
      category: "slow_step",
      title: "Warn big",
      detail: "d",
      stepIndex: 4,
      turnIndex: 0,
      impactTokens: 500,
      impactMs: 12000,
      citation: "S4"
    }
  ];

  const top3 = selectTopDiagnostics(findings, 3);
  assert.deepEqual(
    top3.map((f) => f.id),
    ["crit-1", "warn-big", "warn-small"]
  );
  assert.deepEqual(
    selectTopDiagnostics(findings, 1).map((f) => f.id),
    ["crit-1"]
  );
  assert.deepEqual(selectTopDiagnostics(findings, 0), []);
});

test("describeDiagnostic and describePluginWarning cover all diagnostic categories, sub-cases, and plugin warnings", () => {
  const categories: DiagnosticCategory[] = [
    "token_driver",
    "cache_miss",
    "slow_step",
    "repeated_read",
    "error_retry",
    "model_split",
    "unused_skill",
    "high_skill_overhead",
    "tool_thrash",
    "subagent_candidate",
    "compaction_cliff"
  ];

  for (const cat of categories) {
    const g = describeDiagnostic({
      id: `id-${cat}`,
      severity: "warning",
      category: cat,
      title: `Title ${cat}`,
      detail: `Detail ${cat}`,
      stepIndex: 1,
      turnIndex: 0,
      impactTokens: 1000,
      impactMs: 1000,
      citation: "Step 1"
    });
    assert.ok(g.categoryLabel.length > 3, `Missing categoryLabel for ${cat}`);
    assert.ok(g.meaning.length > 20, `Missing meaning for ${cat}`);
    assert.ok(g.remediation.length > 20, `Missing remediation for ${cat}`);
    assert.equal(g.meaning.includes("`"), false);
    assert.equal(g.remediation.includes("`"), false);
  }

  // Sub-cases
  assert.equal(
    describeDiagnostic({
      id: "c256",
      severity: "critical",
      category: "compaction_cliff",
      title: "Exceeded 256k soft compaction ceiling at Step 5",
      detail: "Context reached 260k",
      stepIndex: 5,
      turnIndex: 1,
      impactTokens: 260000,
      impactMs: 1000,
      citation: "Planner Step 5"
    }).categoryLabel,
    "Context Ceiling"
  );
  assert.equal(
    describeDiagnostic({
      id: "c200",
      severity: "warning",
      category: "compaction_cliff",
      title: "Crossed 200k context cliff at Step 4",
      detail: "Context crossed 200k",
      stepIndex: 4,
      turnIndex: 1,
      impactTokens: 205000,
      impactMs: 1000,
      citation: "Planner Step 4"
    }).categoryLabel,
    "Context Cliff"
  );

  assert.equal(
    describeDiagnostic({
      id: "miss-idle",
      severity: "warning",
      category: "cache_miss",
      title: "Cache miss at Step 3",
      detail: "Idle gap expired prompt cache TTL",
      stepIndex: 3,
      turnIndex: 1,
      impactTokens: 5000,
      impactMs: 500,
      citation: "Step 3"
    }).categoryLabel,
    "Cache Expired (Idle)"
  );
  assert.equal(
    describeDiagnostic({
      id: "miss-model",
      severity: "warning",
      category: "cache_miss",
      title: "Cache miss at Step 4",
      detail: "Model changed (a -> b)",
      stepIndex: 4,
      turnIndex: 1,
      impactTokens: 5000,
      impactMs: 500,
      citation: "Step 4"
    }).categoryLabel,
    "Cache Miss (Model Switch)"
  );
  assert.equal(
    describeDiagnostic({
      id: "miss-reset",
      severity: "warning",
      category: "cache_miss",
      title: "Cache miss at Step 5",
      detail: "Context compaction or prefix reset",
      stepIndex: 5,
      turnIndex: 1,
      impactTokens: 5000,
      impactMs: 500,
      citation: "Step 5"
    }).categoryLabel,
    "Cache Reset"
  );

  assert.equal(
    describeDiagnostic({
      id: "dup-skill",
      severity: "warning",
      category: "unused_skill",
      title: "Duplicate skill read: brainstorming (2×)",
      detail: "Read twice",
      stepIndex: 2,
      turnIndex: 0,
      impactTokens: 2000,
      impactMs: null,
      citation: "Step 2"
    }).categoryLabel,
    "Duplicate Skill Read"
  );
  assert.equal(
    describeDiagnostic({
      id: "slow-model",
      severity: "warning",
      category: "slow_step",
      title: "Long model step: gemini-2.5-pro (Step 2)",
      detail: "Took 15s",
      stepIndex: 2,
      turnIndex: 0,
      impactTokens: null,
      impactMs: 15000,
      citation: "Step 2"
    }).categoryLabel,
    "Slow Model Step"
  );
  assert.equal(
    describeDiagnostic({
      id: "split-ok",
      severity: "info",
      category: "model_split",
      title: "Orchestrator switched models 1× across 2 models",
      detail: "All switches preserved prompt cache.",
      stepIndex: 3,
      turnIndex: 0,
      impactTokens: null,
      impactMs: null,
      citation: "Step 3"
    }).categoryLabel,
    "Model Switch"
  );

  for (const warn of [
    "Unused load",
    "Duplicate read",
    "High markdown carry",
    "Custom warning"
  ]) {
    const pw = describePluginWarning(warn);
    assert.ok(pw.meaning.length > 20, `Missing plugin warning meaning for ${warn}`);
    assert.ok(
      pw.remediation.length > 20,
      `Missing plugin warning remediation for ${warn}`
    );
    assert.equal(pw.meaning.includes("`"), false);
    assert.equal(pw.remediation.includes("`"), false);
  }
});

test("describeErrorBadge and buildErrorTroubleshootingPrompt cover all kinds, root-cause remediation hints, and prompt formatting", () => {
  const kinds: ErrorBadgeKind[] = [
    "Plugin",
    "Skill",
    "SubSkill",
    "CLI",
    "MCP",
    "Reference",
    "Tool",
    "Subagent"
  ];

  for (const kind of kinds) {
    const g = describeErrorBadge(kind, 2, `item-${kind}`);
    assert.ok(g.summary.length > 10, `Missing summary for ${kind}`);
    assert.ok(g.meaning.length > 20, `Missing meaning for ${kind}`);
    assert.ok(g.remediation.length > 20, `Missing remediation for ${kind}`);
    assert.equal(g.summary.includes("`"), false);
    assert.equal(g.meaning.includes("`"), false);
    assert.equal(g.remediation.includes("`"), false);
  }

  const missingSkillRef = describeErrorBadge("SubSkill", 1, "test-driven-development", [
    {
      message: "ENOENT: no such file or directory, open '.../writing-good-tests.md'",
      toolName: "read_file",
      target: "test-driven-development/writing-good-tests.md",
      count: 1
    }
  ]);
  assert.match(missingSkillRef.meaning, /SKILL\.md or reference files/i);
  assert.match(missingSkillRef.remediation, /missing or renamed file path/i);

  const authMcp = describeErrorBadge("MCP", 1, "gmail_search", [
    {
      message: "HTTP 401 Unauthorized: token expired",
      toolName: "gmail_search",
      target: "gmail/gmail_search",
      count: 1
    }
  ]);
  assert.match(authMcp.remediation, /Plugins Manager|credentials|Authentication/i);

  const missingCmdCli = describeErrorBadge("CLI", 1, "task-start", [
    {
      message: "bash: task-start: command not found",
      toolName: "run_command",
      target: "task-start plan.md",
      count: 1
    }
  ]);
  assert.match(missingCmdCli.remediation, /missing from PATH|CLI binary/i);

  const timeoutTool = describeErrorBadge("Tool", 1, "run_command", [
    {
      message: "Error: connect ECONNREFUSED 127.0.0.1:3000",
      toolName: "run_command",
      target: "curl http://localhost:3000",
      count: 1
    }
  ]);
  assert.match(timeoutTool.remediation, /timed out|refused the connection/i);

  const prompt = buildErrorTroubleshootingPrompt({
    name: "task-start",
    kind: "CLI",
    parentName: "Superpowers",
    errorCount: 2,
    scopeLabel: 'project "musiclab"',
    targetPaths: ["/plugins/superpowers/skills/executing-plans/scripts/task-start"],
    samples: [
      {
        message: "Command exited with code 1. Plan file locked",
        toolName: "run_command",
        target: "bash .../task-start plan.md 1",
        count: 2,
        conversationId: "c1",
        conversationTitle: "Build synth",
        stepIndex: 14
      }
    ]
  });
  assert.match(prompt, /CLI "task-start" under Superpowers/);
  assert.match(prompt, /2 recorded errors/);
  assert.match(prompt, /Command exited with code 1\. Plan file locked/);
  assert.match(prompt, /Build synth/);
  assert.match(prompt, /step 14/);
  assert.match(prompt, /task-start/);
});
