# Public Release Readiness (Windows AGY, Security & Hub Docs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a zero-build, Windows-compatible, security-hardened public release (`v0.2.0`) of Flight Recorder for `https://github.com/fmedery/antigravity-plugin-flight-recorder` with clear Antigravity 2.x (Hub) installation and privacy documentation.

**Architecture:** Introduce pure cross-platform path and secret-redaction modules in `src/shared/` shared across the server and Vite UI, replace the Python hook spooler with a zero-dependency Node script (`hooks/record-event.mjs`), harden SQLite/JSONL file permissions and input bounds, and bundle the MCP server via `esbuild` into a single `dist/server/index.js` tracked alongside `dist/ui/index.html` so cloning or installing into Antigravity 2.x Hub requires zero `npm install` or Python.

**Tech Stack:** TypeScript 5.7 (Node >= 22.15 ESM, `node:sqlite`, `node:test`), `esbuild` (via Vite 6), `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, React 19 + `vite-plugin-singlefile`.

**Spec:** `docs/superpowers/specs/2026-11-23-public-release-windows-security-design.md`

## Global Constraints

- Runtime floor: Node.js `>= 22.15.0`; zero runtime `node_modules` required for end users and zero Python dependency.
- Reuse existing `esbuild` from `vite` in `devDependencies`—add zero new npm dependencies and zero `preinstall`/`install`/`postinstall` scripts.
- `src/shared/paths.ts` and `src/shared/redact.ts` must have zero `node:*` imports so both Node server code and Vite browser UI code can import them cleanly.
- Never introduce outbound network requests, telemetry, or external CDN assets (`default-src 'none'` CSP intact).
- Hooks must remain strictly passive (`SessionStart`, `PreInvocation`, `PostToolUse`, `PostInvocation`, `Stop`—never `PreToolUse`) and fail open (`exit 0` printing `{}`).
- `plugin.json` must contain only supported Antigravity manifest keys (`name`, `displayName`, `version`, `description`, `logo`, `suggestedPrompts`, `author`, `homepage`, `repository`, `disabled`).

## Review Focus

1. **Windows paths with spaces and percent-encoded `file://` URIs (`file:///C:/Users/Jane%20Doe/My%20App/src/a.ts` and `C:\Users\Jane Doe\My App\src\a.ts`):** `unwrapFileUri` decodes `%20` without throwing on literal `%` signs (e.g., `100%.md`), `findProjectRootForPath` resolves `C:\Users\Jane Doe\My App`, and `toFileUri` produces `file:///C:/Users/Jane%20Doe/My%20App/src/a.ts` (never `file://C:\...` or double-encoded `%2520`). *(Tested in Task 1.)*
2. **Windows case-insensitive drive letters & `%LOCALAPPDATA%\Temp` / `C:\Windows` system path filtering:** `c:\windows\system32\cmd.exe` and `C:\Users\Jane\AppData\Local\Temp\scratch.ts` return `null` from `findProjectRootForPath`, whereas `d:\work\service\src\index.ts` resolves `d:\work\service` even when tested on macOS/Linux. *(Tested in Task 1.)*
3. **Malformed hook stdin & credential redaction vs. harmless numeric token counts:** `hooks/record-event.mjs` exits `0` printing `{}` on empty or invalid JSON stdin, redacts `GITHUB_TOKEN=...`, `Bearer ...`, `AIza...`, JWTs, `https://user:pass@host`, and ANSI/OSC-52 escape sequences, while leaving harmless numeric text like `outputTokens=500` untouched. *(Tested in Task 2.)*
4. **Chunk boundary mid-JSONL line in `ingestHookEvents`:** When a read window cuts mid-JSONL line, `ingestHookEvents` ingests only complete `\n`-terminated lines, advances `lastOffset` to the byte after the last `\n`, and ingests the split line intact on the next pass without dropping or corrupting data. *(Tested in Task 2.)*
5. **Zero-`node_modules` execution of bundled `dist/server/index.js`:** Copying `dist/server/index.js` and `dist/ui/index.html` into an isolated temp directory outside the repo (with no `node_modules/` in any ancestor folder) and connecting an MCP `Client` over `StdioClientTransport` succeeds cleanly with zero `ExperimentalWarning` output on `stderr`. *(Tested in Task 3.)*

---

### Task 1: Cross-Platform Windows Path Engine, CLI/Builtin Discovery & URI Formatting

**Files:**
- Create: `src/shared/paths.ts`
- Modify: `src/server/transcriptParser.ts:255-315`
- Modify: `src/server/scanner.ts:37-145, 210-225`
- Modify: `src/server/skillEfficiency.ts:95-155, 340-470, 1340-1700`
- Modify: `src/server/analytics.ts:570-675, 1095-1115`
- Modify: `src/server/tools.ts:138-150`
- Modify: `src/ui/App.tsx:280-297, 349-355`
- Modify: `src/ui/components/TimelineWaterfall.tsx:205-215`
- Modify: `scripts/install-plugin.mjs`
- Modify: `test/transcriptParser.test.ts:39, 129` and `test/analytics.test.ts:364` (scrub author local paths)
- Create: `test/securityAndWindows.test.ts`

**Interfaces:**
- Consumes: none
- Produces (`src/shared/paths.ts`):
  - `unwrapFileUri(raw: string): string`
  - `isWindowsPath(p: string): boolean`
  - `isAbsoluteLocalPath(p: string): boolean`
  - `pathBaseName(p: string): string`
  - `pathDirName(p: string): string`
  - `pathExtName(p: string): string`
  - `pathTailSegments(p: string, count: number): string`
  - `toFileUri(filePath: string): string`
- Produces (`src/server/scanner.ts`):
  - `findProjectRootForPath(candidatePath: string, options?: { existsFn?: (p: string) => boolean; isFileFn?: (p: string) => boolean; homeDir?: string }): string | null`
- Produces (`src/server/skillEfficiency.ts`):
  - `discoverInstalledPlugins(pluginsDirs?: string | string[]): InstalledPluginRegistry`

- [ ] **Step 1: Write failing cross-platform path, Windows project inference, `.exe`/`.cmd` CLI, builtin plugin, and `toFileUri` tests in `test/securityAndWindows.test.ts`**

```ts
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

test("Windows AGY project inference, transcript path extraction, and .exe/.cmd plugin CLIs work across OSes", async () => {
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
```

- [ ] **Step 2: Run `npm test` to verify Task 1 tests fail**

Run: `npm test`
Expected: FAIL with `Cannot find module '../src/shared/paths.js'`

- [ ] **Step 3: Implement `src/shared/paths.ts` and update cross-platform path/CLI/install call sites**

1. Create `src/shared/paths.ts` (pure TypeScript, zero `node:*` imports) implementing `unwrapFileUri` (per-sequence `%XX` decode fallback so invalid `%` sequences like `100%bad` never throw), `isWindowsPath`, `isAbsoluteLocalPath`, `pathBaseName`, `pathDirName`, `pathExtName`, `pathTailSegments`, and `toFileUri` (`C:\a b\c.ts` -> `file:///C:/a%20b/c.ts`, `\\srv\share\a.ts` -> `file://srv/share/a.ts`, `/Users/a b/c.ts` -> `file:///Users/a%20b/c.ts`).
2. Update `src/server/transcriptParser.ts`: unwrap `file://` URIs and accept `isAbsoluteLocalPath` in `extractPathFromArgs`; match Windows drive paths (`/[a-zA-Z]:[\\/][a-zA-Z0-9_.\-\\/]+/g`) alongside POSIX paths in `extractCommandPathHints`; match `/\/(?:builtin\/)?plugins\/([^/]+)\//` in `extractSkillMetadata`.
3. Update `src/server/scanner.ts`: make `isIgnoredSystemPath` filter Windows system/temp paths case-insensitively (`c:/windows/`, `c:/program files`, `c:/programdata/`, `/appdata/local/temp/`, `os.tmpdir()`); update `findProjectRootForPath` to use `pathDirName`/`pathExtName` and accept optional `{ existsFn, isFileFn, homeDir }` while preserving default `fs.existsSync` behavior; match `/[\\/]transcript\.jsonl$/i` in `discoverTranscripts`.
4. Update `src/server/skillEfficiency.ts`: accept `string | string[]` in `discoverInstalledPlugins` (defaulting to `[~/.gemini/config/plugins, ~/.gemini/antigravity/builtin/plugins]` with user plugins taking precedence over builtin IDs); strip `.exe`/`.cmd`/`.bat` in `collectPluginCliBinaries` and `resolveToolPluginAndChild`; normalize `\` -> `/` before matching plugin script paths; use `pathBaseName` on target paths.
5. Update `src/server/analytics.ts`, `src/server/tools.ts`, `src/ui/App.tsx` (`toFileUri` + `pathBaseName`), `src/ui/components/TimelineWaterfall.tsx` (`pathTailSegments`), `scripts/install-plugin.mjs` (`"junction"` on `win32` with copy fallback), and scrub `/Users/frederic` / `fmedery/musiclab` in `test/transcriptParser.test.ts` and `test/analytics.test.ts`.

- [ ] **Step 4: Run `npm test` and `npx tsc --noEmit` to verify Task 1 passes**

Run: `npx tsc --noEmit && npm test`
Expected: PASS (`26/26` tests passing)

- [ ] **Step 5: Commit Task 1**

```bash
git add src/ scripts/install-plugin.mjs test/
git commit -m "feat: add full Windows AGY path, URI, junction, and CLI compatibility"
```

---

### Task 2: Security & Privacy Hardening + Zero-Dependency Node Hook Spooler

**Files:**
- Create: `src/shared/redact.ts`
- Create: `hooks/record-event.mjs`
- Delete: `hooks/record_event.py`
- Modify: `hooks.json`
- Modify: `src/server/transcriptParser.ts:155-180, 408-455, 530-555`
- Modify: `src/server/hookIngestor.ts`
- Modify: `src/server/db.ts:1-102`
- Modify: `src/shared/pricing.ts:51-60`
- Modify: `src/server/tools.ts:882-950`
- Modify: `test/hookIngestor.test.ts`
- Modify: `test/securityAndWindows.test.ts`

**Interfaces:**
- Consumes: `src/shared/paths.ts`
- Produces (`src/shared/redact.ts`):
  - `stripControlAndAnsi(input: string): string`
  - `redactSecrets(input: string): string`
  - `sanitizePreviewText(input: string, maxChars?: number): string`
- Produces (`src/server/hookIngestor.ts`):
  - `ingestHookEvents(db: TrackerDatabase, eventsPath: string, options?: { maxChunkBytes?: number }): HookIngestResult`

- [ ] **Step 1: Write failing security, redaction, Node hook spooler, permission, ReDoS, and chunked ingestion tests in `test/securityAndWindows.test.ts` (and update `test/hookIngestor.test.ts` to invoke `hooks/record-event.mjs`)**

Add tests in `test/securityAndWindows.test.ts` asserting:
1. `sanitizePreviewText` strips ANSI CSI + OSC 52 clipboard escape sequences, redacts `GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuv`, `Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl`, `AIzaSyA123456789012345678901234567890`, and `https://admin:s3cr3t@example.com/repo.git` to `[REDACTED]`, while keeping `"outputTokens=500 model=gemini-4-hydrogen"` intact.
2. Spawning `node hooks/record-event.mjs` on malformed stdin (`"{bad json"`) exits `0` with `stdout === "{}\n"`; spawning on a `PostToolUse` payload containing `OPENAI_API_KEY=sk-proj-1234567890abcdefghijklmnop` writes redacted `[REDACTED]` to `events.jsonl` and sets `0o700` dir / `0o600` file permissions on POSIX (`process.platform !== "win32"`).
3. `TrackerDatabase` sets `0o700` on `dataDir` and `0o600` on `tracker.sqlite` on POSIX.
4. `matchPricingRule` completes in `< 25ms` on pathological input `"a".repeat(80) + "!"` against pattern `"a*a*a*a*a*a*a*a*a*b"`.
5. `ingestHookEvents(db, eventsPath, { maxChunkBytes: 180 })` reads a multi-line `events.jsonl` across 3 chunk passes where byte `180` falls mid-JSON line, ingesting 100% of events without loss or corruption.

- [ ] **Step 2: Run `npm test` to verify Task 2 tests fail**

Run: `npm test`
Expected: FAIL with `Cannot find module '../src/shared/redact.js'`

- [ ] **Step 3: Implement `src/shared/redact.ts`, `hooks/record-event.mjs`, permission hardening, ReDoS guard, and chunked hook ingestion**

1. Create `src/shared/redact.ts` implementing `stripControlAndAnsi`, `redactSecrets`, and `sanitizePreviewText`.
2. Create `hooks/record-event.mjs` (zero dependencies, Node built-ins only), update all 5 handlers in `hooks.json` to `"node ./hooks/record-event.mjs"`, delete `hooks/record_event.py`, and update `test/hookIngestor.test.ts` to run `node hooks/record-event.mjs`.
3. Apply `sanitizePreviewText` to `makePreview` / `promptPreview` / `argsPreview` / `errorPreview` in `src/server/transcriptParser.ts` and `lastUserInput` / `error` in `src/server/hookIngestor.ts`.
4. Update `src/server/hookIngestor.ts` to bound `bytesToRead = Math.min(stat.size - startOffset, options?.maxChunkBytes ?? 16 * 1024 * 1024)` and enforce `0o600` on `events.jsonl` if needed.
5. Update `src/server/db.ts` to load `node:sqlite` via `createRequire(import.meta.url)` inside a `process.emitWarning` guard suppressing only `ExperimentalWarning` mentioning `SQLite`, and apply best-effort `0o700` on `dataDir` + `0o600` on `tracker.sqlite*` when `process.platform !== "win32"`.
6. Update `src/shared/pricing.ts` (`slice(0, 128)` + `replace(/\*+/g, ".*")`) and add Zod length/count bounds on `app_update_pricing` and `app_assign_project` in `src/server/tools.ts`.

- [ ] **Step 4: Run `npx tsc --noEmit && npm test` to verify Task 2 passes**

Run: `npx tsc --noEmit && npm test`
Expected: PASS (all unit + security tests pass)

- [ ] **Step 5: Commit Task 2**

```bash
git add -A src/ hooks/ hooks.json test/
git commit -m "security: add secret redaction, Node hook spooler, 0600 permissions, and input bounds"
```

---

### Task 3: Self-Contained `dist/` Bundler, Public Docs (`README.md`, `SECURITY.md`, `LICENSE`, `.gitattributes`) & Contract Tests

**Files:**
- Create: `scripts/build-server.mjs`
- Create: `LICENSE`
- Create: `SECURITY.md`
- Create: `.gitattributes`
- Modify: `package.json`
- Modify: `plugin.json`
- Modify: `.gitignore`
- Modify: `README.md`
- Track: `dist/server/index.js`, `dist/ui/index.html`
- Modify: `test/securityAndWindows.test.ts`

**Interfaces:**
- Consumes: `src/server/index.ts`, `src/ui/`
- Produces:
  - Self-contained ESM bundle `dist/server/index.js` (only `node:*` built-ins external)
  - Single-file UI bundle `dist/ui/index.html`
  - Public documentation (`README.md`, `SECURITY.md`, `LICENSE`, `.gitattributes`, `plugin.json` v`0.2.0`)

- [ ] **Step 1: Write failing zero-`node_modules` stdio bundle test and manifest/skill contract tests in `test/securityAndWindows.test.ts`**

Add tests in `test/securityAndWindows.test.ts` asserting:
1. `dist/server/index.js` exists, contains zero bare non-`node:` ESM imports, and when copied alongside `dist/ui/index.html` into a fresh `os.tmpdir()` folder (outside the repo, with zero `node_modules/`), connects cleanly to `@modelcontextprotocol/sdk`'s `StdioClientTransport`, serves `open_flight_recorder` and `get_skill_optimization`, and emits zero `ExperimentalWarning` text on `stderr`.
2. `plugin.json` contains only allowed Antigravity manifest keys (`name`, `displayName`, `version`, `description`, `logo`, `suggestedPrompts`, `author`, `homepage`, `repository`, `disabled`), `logo` file exists, `suggestedPrompts.length <= 3`, and `repository` equals `"https://github.com/fmedery/antigravity-plugin-flight-recorder"`.
3. `hooks.json` declares no `PreToolUse` handler and every handler command references `./hooks/record-event.mjs` (which exists on disk), while `hooks/record_event.py` does not exist.
4. `LICENSE`, `SECURITY.md`, `.gitattributes`, and `README.md` exist, and `README.md` documents Antigravity 2.x (Hub) installation for macOS/Linux, Windows PowerShell, Windows Command Prompt, ZIP install, and `agy plugin install`.

- [ ] **Step 2: Run `npm test` to verify Task 3 tests fail**

Run: `npm test`
Expected: FAIL (`dist/server/index.js` still imports `@modelcontextprotocol/sdk` and `LICENSE`/`SECURITY.md` do not exist yet)

- [ ] **Step 3: Implement `scripts/build-server.mjs`, update `.gitignore` / `package.json` / `plugin.json`, and author `README.md`, `SECURITY.md`, `LICENSE`, and `.gitattributes`**

1. Create `scripts/build-server.mjs` using `esbuild.build` (`bundle: true`, `platform: "node"`, `format: "esm"`, `target: "node22"`, `outfile: "dist/server/index.js"`, `external: ["node:*", ...builtinModules]`, `createRequire` banner), cleaning `dist/server` and `dist/shared` before bundling so only `dist/server/index.js` and `dist/ui/index.html` remain under `dist/`.
2. Update `package.json` (`version: "0.2.0"`, `license: "MIT"`, `engines: { "node": ">=22.15.0" }`, `"build:server": "tsc -p tsconfig.server.json --noEmit && node scripts/build-server.mjs"`), `.gitignore` (remove `dist/` so prebuilt bundles are tracked), and `plugin.json` (`version: "0.2.0"`, `author: "Frederic Medery"`, `homepage`, `repository`).
3. Create `LICENSE` (MIT, `Copyright (c) 2026 Frederic Medery`), `.gitattributes` (`eol=lf`, `.cmd`/`.bat` `eol=crlf`), `SECURITY.md` (local-only, zero network, passive hooks, `0700`/`0600` permissions, secret redaction, CSP), and `README.md` (with the step-by-step Antigravity 2.x Hub, Windows PowerShell/CMD/ZIP, IDE, and `agy` CLI installation guide at the top).

- [ ] **Step 4: Run full build and test suite to verify Task 3 passes**

Run: `npm run build && npx tsc --noEmit && npm test`
Expected: PASS (all unit, integration, Windows, security, and zero-`node_modules` bundle tests pass)

- [ ] **Step 5: Commit Task 3**

```bash
git add .gitignore .gitattributes LICENSE SECURITY.md README.md package.json plugin.json scripts/build-server.mjs dist/ test/
git commit -m "release: bundle zero-install dist/ and add Hub/Windows README, SECURITY, and MIT license (v0.2.0)"
```
