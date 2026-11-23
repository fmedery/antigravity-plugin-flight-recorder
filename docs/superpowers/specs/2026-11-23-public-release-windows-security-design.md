# Design Spec: Public Release Readiness — Security, Best Practices, Windows AGY & Documentation

**Date:** 2026-11-23  
**Project:** Flight Recorder (`flight-recorder`)  
**Status:** Approved

---

## 1. Intent & Why

Flight Recorder is ready functionally after Phase 1 (Parent-First Skill & Tool Efficiency Intelligence), and is now being prepared for **public release** so any Antigravity user—across **Antigravity 2.x (Hub)**, **Antigravity IDE**, and **Antigravity CLI (`agy`)**, on **Windows, macOS, and Linux**—can install it with zero build friction, verify its security and local-only privacy guarantees, and follow clear documentation.

Today, four gaps block a high-trust public release:
1. **Non-self-contained install:** `mcp_config.json` executes `${PLUGIN_ROOT}/dist/server/index.js`, which currently imports `@modelcontextprotocol/sdk` and `zod` from `node_modules/`, while `dist/` is gitignored. Antigravity 2.x Hub Marketplace installs, `git clone` into `~/.gemini/config/plugins/flight-recorder`, and `agy plugin install` do **not** run `npm install` or `npm run build`.
2. **Windows AGY incompatibilities:** `hooks.json` invokes `python3 ./hooks/record_event.py` (which fails on Windows `cmd /c` when `python3` is absent or mapped to the Microsoft Store stub); path parsers reject Windows drive/UNC paths (`C:\...`, `file:///C:/...`) and `.exe`/`.cmd` CLI wrappers; `App.tsx` constructs invalid `file://C:\...` URIs; and `scripts/install-plugin.mjs` uses `"dir"` symlinks instead of unprivileged Windows `"junction"` links.
3. **Security & privacy hardening:** Data files (`tracker.sqlite`, `events.jsonl`) use default OS umask instead of owner-only permissions on POSIX (`0o700` dir / `0o600` files); hook and transcript previews store unredacted secret/token strings (`API_KEY=...`, `Bearer ...`, OAuth/API tokens); `pricing.ts` does not bound pattern lengths or collapse repeated `*` wildcards; `hookIngestor.ts` allocates an unbounded buffer on `events.jsonl`; and Node 22 prints an `ExperimentalWarning: SQLite` banner to `stderr`.
4. **Missing public repository standards & documentation:** No `LICENSE`, `SECURITY.md`, or `.gitattributes`, and `README.md` lacks Windows PowerShell / Antigravity 2.x Hub installation, usage, privacy, and troubleshooting instructions.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Zero-step cross-platform install (Option A):** Track a self-contained single-file server bundle (`dist/server/index.js` with `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, and `zod` bundled; only `node:*` built-ins external) alongside the single-file UI (`dist/ui/index.html`) so cloning or installing into `~/.gemini/config/plugins/flight-recorder` (`%USERPROFILE%\.gemini\config\plugins\flight-recorder` on Windows) works immediately on Node >= 22.15 without `npm` or Python.
- **First-class Windows AGY compatibility:** Replace Python hook spooling with zero-dependency Node (`hooks/record-event.mjs`), handle Windows drive/UNC paths and `file:///C:/...` URIs across transcript parsing, project root inference, plugin CLI discovery, and side-pane `fileView` links, and use `"junction"` links in `scripts/install-plugin.mjs` on Windows.
- **Defense-in-depth local security & privacy:** Zero outbound network calls, passive-only hooks (never `PreToolUse`), owner-only file permissions (`0o700`/`0o600` on POSIX), automatic secret/token and terminal-escape redaction on all stored previews, bounded hook ingestion, ReDoS-safe pricing globs, and strict manifest/tool contract tests.
- **Clear Hub-first documentation & OSS hygiene:** Ship `README.md` (covering Antigravity 2.x Hub on Windows/macOS/Linux, IDE, CLI, optimization workflows, and troubleshooting), `SECURITY.md`, `LICENSE` (MIT), `.gitattributes`, and validated `plugin.json` / `package.json` metadata.

### Non-Goals
- Adding Phase 2+ analytics features (`agy` CLI `.db` protobuf ingestion, rolling `5h`/`7d` time windows, or `doctor`/`report` CLI subcommands), which remain on the roadmap after this public-readiness pass.
- Publishing to the npm registry (Flight Recorder is distributed as an Antigravity plugin repository, not an npm CLI package).

### Anti-Goals (Must Never Happen)
- **Never introduce outbound network calls, telemetry, or external CDN assets** in the server, hooks, or UI (`default-src 'none'` CSP must remain intact).
- **Never block or slow down user agent turns:** Hooks must stay passive (`SessionStart`, `PreInvocation`, `PostToolUse`, `PostInvocation`, `Stop`—never `PreToolUse`) and fail open (`exit 0` printing `{}`) on any error.
- **Never add unknown keys to `plugin.json`:** Per Antigravity's plugin loader rules, only supported manifest fields (`name`, `displayName`, `version`, `description`, `logo`, `suggestedPrompts`, `author`, `homepage`, `repository`, `disabled`) may appear in `plugin.json`.

---

## 3. Constraints

- **Runtime:** Node.js `>= 22.15.0` (built-in `node:sqlite`, available across Antigravity 2.x Hub environments). Zero runtime `node_modules` required for end users; zero Python dependency.
- **Build toolchain:** Reuse `esbuild` (already installed via `vite` in `devDependencies`) for bundling `dist/server/index.js`—zero new npm dependencies required.
- **Cross-OS determinism:** Windows path normalization, project inference, URI formatting, and CLI detection must be unit-testable on macOS/Linux CI as well as native Windows by dispatching to `path.win32` when inspecting Windows drive/UNC strings.

---

## 4. Approaches Considered

1. **Option A (Selected) — Self-contained `dist/` committed to Git:**
   - Bundle `src/server/index.ts` -> `dist/server/index.js` (ESM, `node:*` external) and `src/ui/` -> `dist/ui/index.html`, and track those two built artifacts in Git.
   - *Pros:* Instant zero-build installation for Antigravity 2.x Hub (Marketplace, PowerShell/Terminal `git clone`, Hub agent prompt, and `agy plugin install`) on Windows, macOS, and Linux.
   - *Trade-offs:* ~750 KB of compiled output lives in Git diffs when source changes.
2. **Option B (Rejected) — Source-only Git tree + GitHub Release `.zip`/`.tar.gz` archives:**
   - Keep `dist/` gitignored and attach prebuilt archives only on tagged GitHub Releases.
   - *Why rejected:* Breaks direct `git clone` and `agy plugin install <github-url>` workflows for Hub users unless they manually download and extract release archives.

---

## 5. Architecture & Detailed Design

### 5.1 Self-Contained Server & UI Bundling (`scripts/build-server.mjs`, `package.json`, `.gitignore`)
- **`scripts/build-server.mjs` (Builder call):**
  - Invokes `esbuild.build` (imported from `esbuild`, already present via Vite) with:
    - `entryPoints: ["src/server/index.ts"]`
    - `outfile: "dist/server/index.js"`
    - `bundle: true`, `platform: "node"`, `format: "esm"`, `target: "node22"`
    - `external`: `"node:*"` plus `builtinModules` from `node:module`
    - `banner`: injects `import { createRequire as __frCreateRequire } from "node:module"; const require = __frCreateRequire(import.meta.url);` so any CJS helper inside bundled SDK packages works cleanly in ESM.
  - Cleans stale multi-file `dist/server/*.d.ts` / `dist/shared/` artifacts before writing so `dist/` contains **only** `dist/server/index.js` and `dist/ui/index.html`.
- **`package.json` scripts:**
  - `"build:server": "tsc -p tsconfig.server.json --noEmit && node scripts/build-server.mjs"`
  - `"build:ui": "vite build"`
  - `"build": "npm run build:server && npm run build:ui"`
  - Add `"license": "MIT"` and `"engines": { "node": ">=22.15.0" }`. No `preinstall`/`install`/`postinstall` scripts.
- **`.gitignore`:**
  - Remove `dist/` from `.gitignore` so `dist/server/index.js` and `dist/ui/index.html` are tracked in Git; keep `node_modules/`, `dist-test/`, `.superpowers/`, `.worktrees/`, `worktrees/`, `*.sqlite*`, `.DS_Store`, `*.log`, and `.env*` ignored.

### 5.2 Windows AGY Compatibility (`hooks/`, `src/shared/paths.ts`, `src/server/`, `src/ui/`, `scripts/`)
1. **Node Lifecycle Hook Spooler (`hooks/record-event.mjs` + `hooks.json`):**
   - Replace `hooks/record_event.py` (delete file) with `hooks/record-event.mjs` using only Node built-ins (`node:fs`, `node:os`, `node:path`).
   - Update all 5 passive handlers in `hooks.json` (`SessionStart`, `PreInvocation`, `PostToolUse`, `PostInvocation`, `Stop`) from `"python3 ./hooks/record_event.py"` to `"node ./hooks/record-event.mjs"`. Antigravity executes hook commands with CWD set to the directory containing `hooks.json` (`sh -c` on Unix, `cmd /c` on Windows), and `node` resolves `./hooks/record-event.mjs` identically on Windows `cmd.exe` and Unix `sh`.
   - `record-event.mjs` reads stdin UTF-8 JSON, compacts args (`MAX_USER_INPUT_CHARS = 500`, `MAX_ARG_STR_CHARS = 300`, `MAX_ARG_KEYS = 20`), applies secret/control-character redaction, ensures `dataDir` (`process.env.PLUGIN_DATA || path.join(os.homedir(), ".gemini", "flight-recorder-data")`) exists with `mode: 0o700`, appends to `events.jsonl` with `mode: 0o600`, fails open on any exception, and always writes `{}\n` to `stdout`.
2. **Cross-Platform Path Utilities (`src/shared/paths.ts`):**
   - `unwrapFileUri(raw: string): string`: converts `file:///C:/Users/...` -> `C:/Users/...`, `file://localhost/C:/...` -> `C:/...`, and `file:///Users/...` -> `/Users/...` (decoding `%20` etc. safely via `decodeURIComponent` fallback).
   - `isWindowsPath(p: string): boolean`: matches drive paths (`/^[a-zA-Z]:[\\/]/`) and UNC paths (`/^\\\\[^\\]+\\[^\\]+/`).
   - `isAbsoluteLocalPath(p: string): boolean`: returns `true` for POSIX `/...` paths and `isWindowsPath(p)`.
   - `pathOps(p: string)`: returns `path.win32` when `isWindowsPath(p)` else `path.posix`, allowing deterministic parent-directory walking, `basename`, `extname`, and `relative` for Windows paths even when running tests on macOS/Linux.
   - `toFileUri(filePath: string): string`: converts both Windows (`C:\Users\Alice\my app\a.ts` -> `file:///C:/Users/Alice/my%20app/a.ts`) and POSIX (`/Users/alice/my app/a.ts` -> `file:///Users/alice/my%20app/a.ts`) paths into valid RFC 8089 `file://` URIs for `com.google.antigravity/toggle-aux-pane`.
   - `pathBaseName(p: string): string`: extracts final segment across `/` and `\` after trimming trailing slashes.
3. **Server & UI Path Call Sites:**
   - `src/server/transcriptParser.ts`:
     - `extractPathFromArgs`: unwrap `file://` URIs first and accept `isAbsoluteLocalPath(...)`.
     - `extractCommandPathHints`: extract both POSIX `/a/b` paths and Windows `C:\a\b` / `C:/a/b` paths.
     - `extractSkillMetadata`: recognize `/builtin/plugins/([^/]+)/` in addition to `/plugins/([^/]+)/` and `/builtin/skills/`.
   - `src/server/scanner.ts`:
     - `isIgnoredSystemPath`: normalize slashes and ignore Windows system/temp roots case-insensitively (`c:/windows/`, `c:/program files`, `c:/programdata/`, `/appdata/local/temp/`, `os.tmpdir()`, `os.homedir()`, and `~/.gemini`).
     - `findProjectRootForPath`: accept `isAbsoluteLocalPath`, walk parents via `pathOps(candidatePath)` stopping at filesystem root (`parsed.root === dir`) or `home` (case-insensitive on Windows paths), and accept an optional `existsFn?: (p: string) => boolean` parameter (defaulting to `fs.existsSync`) so Windows project-root inference can be unit-tested deterministically on any OS.
     - `discoverTranscripts`: match `/[\\/]transcript\.jsonl$/i` when checking for sibling `transcript_full.jsonl`.
   - `src/server/skillEfficiency.ts`:
     - `discoverInstalledPlugins`: when called with default arguments, scan both `~/.gemini/config/plugins` and `~/.gemini/antigravity/builtin/plugins` (merging into one registry, user config taking precedence on ID collision).
     - `collectPluginCliBinaries`: recognize Windows executable extensions (`.exe`, `.cmd`, `.bat`) by stripping those extensions before matching plugin CLI names, while continuing to ignore `.sh`, `.py`, `.js`, `.mjs`, `.ts`, `.md`, `.json` helper files.
     - `resolveToolPluginAndChild` (`command` branch): normalize `\` -> `/` before matching `.gemini/(?:config|antigravity/builtin)/plugins/<id>/(?:skills|scripts|bin)/...`, and strip `.exe`/`.cmd`/`.bat` when looking up `registry.cliToPlugin`.
   - `src/server/analytics.ts` & `src/ui/` (`App.tsx`, `ProjectOverview.tsx`, `ChatDetail.tsx`, `WhyPanel.tsx`):
     - Replace `path.basename(...)` / `.split("/")` display helpers on cross-OS paths with `pathBaseName(...)` and use `toFileUri(filePath)` in `App.tsx`'s `handleOpenFileInAuxPane`.
   - `scripts/install-plugin.mjs`:
     - On `process.platform === "win32"`, create directory links using `"junction"` (which succeeds without Administrator or Developer Mode privileges on Windows), falling back to recursive copy with a clear console note if linking is blocked by filesystem policy.

### 5.3 Security, Privacy & Reliability Hardening
1. **Redaction Engine (`src/shared/redact.ts` + mirrored helper in `hooks/record-event.mjs`):**
   - `sanitizePreviewText(input: string, maxChars?: number): string`:
     - Strips ANSI CSI/OSC/control escape sequences (preserving `\n` and `\t` where appropriate) so untrusted command output cannot inject terminal or UI control codes.
     - Redacts credentials before persistence:
       - URL userinfo: `(https?:\/\/)([^/\s:@]+:[^/\s@]+)@` -> `$1[REDACTED]@`
       - Bearer headers: `\b(Bearer\s+)[A-Za-z0-9._~+/=-]{12,}` -> `$1[REDACTED]`
       - Sensitive key/env assignments: `\b([A-Za-z0-9_]*(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE[_-]?KEY|ACCESS[_-]?KEY|AUTH[_-]?TOKEN|CLIENT[_-]?SECRET|SESSION[_-]?ID)[A-Za-z0-9_]*)\s*([=:])\s*("[^"]*"|'[^']*'|[^\s"',;]+)` (case-insensitive) -> `$1$2[REDACTED]`
       - Well-known token formats: `AIza[0-9A-Za-z_-]{20,}`, `ya29\.[0-9A-Za-z_-]{20,}`, `sk-[A-Za-z0-9_-]{20,}`, `gh[pousr]_[A-Za-z0-9]{20,}`, `github_pat_[A-Za-z0-9_]{20,}`, `xox[baprs]-[A-Za-z0-9-]{10,}`, and 3-part JWTs (`eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}`) -> `[REDACTED]`.
   - Applied to `turns.promptPreview`, `toolCalls.argsPreview`, `toolCalls.errorPreview` in `transcriptParser.ts`, and `lastUserInput`, `error`, and `toolCall.args` in `hooks/record-event.mjs` / `hookIngestor.ts`.
2. **Owner-Only Data Permissions (`src/server/db.ts`, `hooks/record-event.mjs`):**
   - Create `dataDir` with `{ recursive: true, mode: 0o700 }`. On POSIX (`process.platform !== "win32"`), best-effort `fs.chmodSync(dataDir, 0o700)` and `fs.chmodSync` `0o600` on `tracker.sqlite`, `tracker.sqlite-wal`, `tracker.sqlite-shm`, and `events.jsonl` when present.
3. **Clean `node:sqlite` Import (`src/server/db.ts`):**
   - Load `node:sqlite` via `createRequire(import.meta.url)` inside a narrow `process.emitWarning` filter that suppresses only `ExperimentalWarning` messages mentioning `SQLite`, immediately restoring `process.emitWarning` afterwards so genuine Node warnings still print.
4. **Bounded Inputs & ReDoS Prevention (`src/shared/pricing.ts`, `src/server/tools.ts`, `src/server/hookIngestor.ts`):**
   - `pricing.ts`: cap pattern evaluation length (`slice(0, 128)`) and collapse repeated `*` (`replace(/\*+/g, ".*")`) in `globToRegex`.
   - `tools.ts` (`app_update_pricing` & `app_assign_project`): bound `rules` array (`max(100)`), string fields (`max(160)`), pricing rates (`min(0).max(100_000)`), and `projectPath` (`max(1024)`).
   - `hookIngestor.ts`: cap `bytesToRead` per pass to `16 * 1024 * 1024` (16 MiB), advancing `lastOffset` cleanly through the last newline within that window so oversized `events.jsonl` files stream incrementally in bounded chunks without OOM.

### 5.4 Public Metadata & Documentation (`plugin.json`, `README.md`, `SECURITY.md`, `LICENSE`, `.gitattributes`)
- **`plugin.json`:**
  - Keep strictly valid Antigravity manifest keys (`name`: `"flight-recorder"`, `displayName`: `"Flight Recorder"`, `version`: `"0.2.0"`, `author`: `"Frederic Medery"`, `homepage`: `"https://github.com/fmedery/antigravity-plugin-flight-recorder#readme"`, `repository`: `"https://github.com/fmedery/antigravity-plugin-flight-recorder"`, `description`: updated to highlight parent-first plugin/skill spend & active-time optimization + cache/compaction waterfalls, `logo`: `"assets/logo.svg"`, `suggestedPrompts`: 3 actionable starter prompts).
- **`README.md`:**
  - Clear, structured documentation using `https://github.com/fmedery/antigravity-plugin-flight-recorder` with **Installation near the very top**, covering:
    1. **Overview & Key Capabilities:** Parent-first Plugin & Skill Spend/Time Attribution, Sub-skill/MCP/CLI Drill-down & Waste Prescriptions, `200k`/`256k` Compaction Cliff Overlays, Step Timing Waterfall, Model Mix & Custom Pricing.
    2. **Prerequisites (1-line check):** Antigravity 2.x (Hub), IDE, or CLI + **Node.js `>= 22.15`** (`node -v`). Explicitly note: **no `npm install`, build step, or Python required** because prebuilt single-file bundles are included.
    3. **Step-by-Step Installation (All Surfaces & OSes):**
       - **Option 1 — Antigravity 2.x (Hub) & IDE via Git (Recommended):**
         - **macOS / Linux (Terminal):** `git clone <repo-url> ~/.gemini/config/plugins/flight-recorder`
         - **Windows (PowerShell):** `git clone <repo-url> "$HOME\.gemini\config\plugins\flight-recorder"`
         - **Windows (`cmd.exe`):** `git clone <repo-url> "%USERPROFILE%\.gemini\config\plugins\flight-recorder"`
       - **Option 2 — Install without Git (Download ZIP on Windows / macOS / Linux):**
         - Download ZIP from GitHub, extract, and place the folder so `plugin.json` is directly at `%USERPROFILE%\.gemini\config\plugins\flight-recorder\plugin.json` (Windows) or `~/.gemini/config/plugins/flight-recorder/plugin.json` (macOS/Linux)—explicitly warning against nested `...-main\...-main\plugin.json` folders.
       - **Option 3 — Ask Antigravity 2.x (Hub) in Chat:** Copy-paste prompt to have the agent clone it into the global plugins folder.
       - **Option 4 — Antigravity CLI (`agy`):** `agy plugin install <repo-url>` (installs into the same shared folder so Hub and CLI both pick it up).
    4. **Verify & Open in Antigravity 2.x (Hub):**
       - Auto-discovered live (no app restart): check **Left Sidebar → Skills & Customizations → Installed → Flight Recorder** (`On`).
       - Open full-screen from **Left Sidebar → Flight Recorder**, per-chat from **`+` Side Pane → Flight Recorder**, or ask in chat (*"Which plugins and skills drove spend and time in this project?"*).
    5. **Updating (`git pull`) & Uninstalling:** Copy-paste commands for macOS/Linux and Windows PowerShell, plus Hub UI uninstall.
    6. **Data Storage & Privacy Summary** (linking to `SECURITY.md`), **Troubleshooting** (Node `< 22.15`, refreshing the MCP server in Hub settings, Windows path checks), and **Contributor / Local Development** (`npm install`, `npm run build`, `npm test`, `npm run install-plugin`).
- **`SECURITY.md`:**
  - Documents zero network / zero telemetry guarantees, exact processes run (`node` MCP server + passive `node ./hooks/record-event.mjs`), exact files read (read-only transcripts & plugin metadata) and written (`${PLUGIN_DATA}/tracker.sqlite` & `events.jsonl`, `0700`/`0600` permissions on POSIX, private `%USERPROFILE%` on Windows), secret/escape-sequence redaction rules, MCP App iframe CSP (`default-src 'none'`), and vulnerability reporting.
- **`LICENSE`:** MIT License (`Copyright (c) 2026 Frederic Medery`).
- **`.gitattributes`:** `* text=auto eol=lf`, `*.cmd text eol=crlf`, `*.bat text eol=crlf`, binary image attributes.

---

## 6. What Is Left to the Builder

- Exact file organization between `src/shared/paths.ts` and `src/shared/redact.ts` (and keeping the small self-contained redaction regex list in sync inside `hooks/record-event.mjs`).
- Exact wording and section headings in `README.md` and `SECURITY.md`.
- Unit and integration tests in `test/securityAndWindows.test.ts` verifying:
  1. Windows drive/UNC/`file://` path parsing, project root inference, `.exe`/`.cmd` CLI matching, and `toFileUri` formatting.
  2. `node ./hooks/record-event.mjs` end-to-end execution, secret redaction, ANSI stripping, and POSIX `0o600`/`0o700` permissions.
  3. ReDoS-safe `globToRegex` and chunked `ingestHookEvents` reading.
  4. Zero-`node_modules` execution of bundled `dist/server/index.js` copied into a clean temporary directory over MCP `StdioClientTransport` / in-process verification, plus manifest/skill contract checks (`plugin.json`, `hooks.json`, `mcp_config.json`, `skills/flight-recorder/SKILL.md`).
