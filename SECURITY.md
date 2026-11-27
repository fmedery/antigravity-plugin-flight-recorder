# Security & Privacy Policy

This document describes exactly what **Flight Recorder** (`flight-recorder`) reads, writes, and executes on your machine so you can verify every claim directly against the source code.

---

## 1. Zero Background Network & Zero Telemetry

- **Zero background network & zero telemetry:** Neither the MCP server (`dist/server/index.js`), the local dashboard server (`dist/server/sidecar.js` via `sidecars/dashboard/run.mjs`), the passive lifecycle hook (`scripts/record-event.mjs`), nor the interactive UI (`dist/ui/index.html`) sends telemetry, analytics, crash reports, or automatic/startup network requests.
- **Explicit, user-triggered update check only:** The only outbound request Flight Recorder can make is when you explicitly click **Updates** in the dashboard, which issues a server-side `GET https://api.github.com/repos/fmedery/antigravity-plugin-flight-recorder/releases/latest` (falling back to `GET https://raw.githubusercontent.com/fmedery/antigravity-plugin-flight-recorder/main/plugin.json` if no GitHub Release exists yet or the API is rate-limited), using a generic `User-Agent: flight-recorder` header and no OS, machine, or usage identifiers, strictly to compare your installed `version`.
- **Loopback-only, token-authenticated dashboard:** The bundled UI (`dist/ui/index.html`) loads zero external scripts, stylesheets, fonts, or analytics beacons. The local dashboard server binds strictly to `127.0.0.1`, verifies Antigravity's per-session `X-Sidecar-Token` using constant-time comparison, restricts `Origin` headers to loopback/`plugin://`, and caps JSON API bodies at 1 MiB.
- **No install-time lifecycle scripts:** `package.json` defines zero `preinstall`, `install`, or `postinstall` hooks, and end users installing the plugin do not need to run `npm install`.

---

## 2. Processes Executed on Your Machine

| Process | When It Runs | Purpose & Safety Guarantees |
| :--- | :--- | :--- |
| `node ${PLUGIN_ROOT}/dist/server/index.js --data-dir=${PLUGIN_DATA}` | Started by Antigravity over `stdio` while the `flight-recorder` plugin is enabled | Serves the 6 read-only analytics MCP tools for chat and CLI, indexing local transcripts incrementally into `${PLUGIN_DATA}/tracker.sqlite`. |
| `node sidecars/dashboard/run.mjs` (`dist/server/sidecar.js`) | Started by Antigravity on localhost (`127.0.0.1`) while the `flight-recorder` plugin is enabled | Serves the self-contained single-file dashboard UI (`dist/ui/index.html`) and token-authenticated local `/api/*` endpoints sharing the same WAL-mode `${PLUGIN_DATA}/tracker.sqlite` index. |
| `node ./scripts/record-event.mjs` | Triggered passively on `SessionStart`, `PreInvocation`, `PostToolUse`, `PostInvocation`, and `Stop` (`timeout: 5s`) | Appends compact lifecycle timing/workspace metadata to `${PLUGIN_DATA}/events.jsonl` and exits `0` printing `{}`. **Never registers `PreToolUse`**, so tool permission prompts and execution policies are never intercepted or modified. |

---

## 3. Files Read (Read-Only)

Flight Recorder reads only local Antigravity metadata on your machine:

1. **Conversation transcripts (`read-only`):**
   - `~/.gemini/antigravity/brain/<conversation-id>/.system_generated/logs/transcript_full.jsonl` (and `transcript.jsonl`)
   - `~/.gemini/antigravity-cli/brain/...` and `~/.gemini/antigravity-ide/brain/...`
   - Any transcript path explicitly provided by Antigravity's passive lifecycle hook payload
2. **Installed plugin metadata (`read-only`):**
   - `~/.gemini/config/plugins/*` and `~/.gemini/antigravity/builtin/plugins/*` (`plugin.json`, `mcp_config.json`, `skills/*/SKILL.md`, and `bin/`/`scripts/` filenames) to roll up sub-skills, MCP tools, and CLIs under their parent plugin name.
3. **Project display name manifests (`read-only`):**
   - Top-level `plugin.json`, `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, or `.git/config` `[remote "origin"]` (parsed directly as text—`git` is never spawned) to display human-friendly project names.
4. **Antigravity theme preferences (`read-only`):**
   - `~/.gemini/config/config.json` and Antigravity's OS-standard `app_storage.json` (read-only) solely to match your active light/dark mode and theme palette on first paint.

---

## 4. Files Written & File Permissions

Flight Recorder writes **only** inside its dedicated plugin data directory (`${PLUGIN_DATA}`, or `~/.gemini/flight-recorder-data` when run standalone):

| File | Contents | Permissions |
| :--- | :--- | :--- |
| `tracker.sqlite` (`-wal`, `-shm`) | Indexed conversation summaries, step token/timing metrics, redacted previews, and custom model pricing rules | `0700` directory / `0600` files on macOS & Linux; private `%USERPROFILE%` ACLs on Windows |
| `events.jsonl` | Compact passive hook events (`tsMs`, `conversationId`, `workspacePaths`, step timing, redacted arg summaries) | `0600` on macOS & Linux; private `%USERPROFILE%` ACLs on Windows |

Flight Recorder never modifies your workspace source code, Antigravity `config.json`, or conversation transcripts.

---

## 5. Secret Redaction & Input Hardening

- **Credential redaction before storage:** Both `scripts/record-event.mjs` and `src/server/transcriptParser.ts` (`src/shared/redact.ts`) scrub sensitive values from prompt, command, and error previews before writing to `events.jsonl` or `tracker.sqlite`, including:
  - `Authorization: Bearer ...` and `Basic ...` headers
  - URL userinfo credentials (`https://user:pass@host` -> `https://[REDACTED]@host`)
  - API key, secret, password, cookie, and token assignments (`API_KEY=...`, `GITHUB_TOKEN=...`, `CLIENT_SECRET=...`, etc.) and sensitive JSON argument keys
  - Common token formats (`AIza...`, `ya29...`, `sk-...`, `ghp_...`, `github_pat_...`, `xoxb-...`, and 3-part JWTs)
- **Control & escape stripping:** ANSI CSI and OSC sequences (including OSC 52 clipboard-write escapes) and C0/C1 control characters are stripped from untrusted transcript and hook strings.
- **Resource & ReDoS bounds:** Model pricing wildcard patterns use a non-backtracking $O(N \cdot M)$ matcher with strict Zod schema bounds, and `events.jsonl` ingestion reads in bounded chunks (`16 MiB` default) to prevent unbounded memory allocation.

---

## 6. Reporting a Vulnerability

Please report security or privacy issues privately via [GitHub Security Advisories](https://github.com/fmedery/antigravity-plugin-flight-recorder/security/advisories/new) rather than opening a public issue. Include reproduction steps and affected OS / Antigravity version.
