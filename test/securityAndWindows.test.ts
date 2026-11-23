import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  isAbsoluteLocalPath,
  isWindowsPath,
  pathBaseName,
  pathDirName,
  toFileUri,
  unwrapFileUri
} from "../src/shared/paths.js";
import { findProjectRootForPath } from "../src/server/scanner.js";
import {
  clearInstalledPluginsCache,
  discoverInstalledPlugins,
  resolveToolPluginAndChild
} from "../src/server/skillEfficiency.js";
import { parseTranscriptFile } from "../src/server/transcriptParser.js";
import { KPI_HELP_COPY } from "../src/ui/format.js";

test("paths.ts handles Windows drive/UNC paths, percent-encoded file:// URIs with spaces, and RFC 8089 toFileUri", () => {
  assert.equal(
    unwrapFileUri("file:///C:/Users/Jane%20Doe/My%20App/src/100%.ts"),
    "C:/Users/Jane Doe/My App/src/100%.ts"
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
