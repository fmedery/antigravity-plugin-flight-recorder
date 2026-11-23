# Security & Privacy Policy

This document describes exactly what **Flight Recorder** (`flight-recorder`) reads, writes, and executes on your machine so you can verify every claim directly against the source code.

---

## 1. Zero Network & Zero Telemetry

- **100% local execution:** Neither the MCP server (`dist/server/index.js`), the passive lifecycle hook (`hooks/record-event.mjs`), nor the interactive UI (`dist/ui/index.html`) makes any outbound HTTP, WebSocket, DNS, or crash-reporting requests.
- **Strict iframe Content Security Policy:** The MCP App UI runs inside Antigravity's isolated `text/html;profile=mcp-app` sandbox under the default `default-src 'none'` CSP—no external scripts, stylesheets, fonts, or analytics beacons are loaded.
- **No install-time lifecycle scripts:** `package.json` defines zero `preinstall`, `install`, or `postinstall` hooks, and end users installing the plugin do not need to run `npm install`.

---

## 2. Processes Executed on Your Machine

| Process | When It Runs | Purpose & Safety Guarantees |
| :--- | :--- | :--- |
| `node ${PLUGIN_ROOT}/dist/server/index.js --data-dir=${PLUGIN_DATA}` | Started by Antigravity over `stdio` while the `flight-recorder` plugin is enabled | Serves read-only analytics tools and the embedded single-file dashboard UI, indexing local transcripts incrementally into `${PLUGIN_DATA}/tracker.sqlite`. |
| `node ./hooks/record-event.mjs` | Triggered passively on `SessionStart`, `PreInvocation`, `PostToolUse`, `PostInvocation`, and `Stop` (`timeout: 5s`) | Appends compact lifecycle timing/workspace metadata to `${PLUGIN_DATA}/events.jsonl` and exits `0` printing `{}`. **Never registers `PreToolUse`**, so tool permission prompts and execution policies are never intercepted or modified. |

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

- **Credential redaction before storage:** Both `hooks/record-event.mjs` and `src/server/transcriptParser.ts` (`src/shared/redact.ts`) scrub sensitive values from prompt, command, and error previews before writing to `events.jsonl` or `tracker.sqlite`, including:
  - `Authorization: Bearer ...` and `Basic ...` headers
  - URL userinfo credentials (`https://user:pass@host` -> `https://[REDACTED]@host`)
  - API key, secret, password, cookie, and token assignments (`API_KEY=...`, `GITHUB_TOKEN=...`, `CLIENT_SECRET=...`, etc.) and sensitive JSON argument keys
  - Common token formats (`AIza...`, `ya29...`, `sk-...`, `ghp_...`, `github_pat_...`, `xoxb-...`, and 3-part JWTs)
- **Control & escape stripping:** ANSI CSI and OSC sequences (including OSC 52 clipboard-write escapes) and C0/C1 control characters are stripped from untrusted transcript and hook strings.
- **Resource & ReDoS bounds:** Model pricing wildcard patterns use a non-backtracking $O(N \cdot M)$ matcher with strict Zod schema bounds, and `events.jsonl` ingestion reads in bounded chunks (`16 MiB` default) to prevent unbounded memory allocation.

---

## 6. Reporting a Vulnerability

Please report security or privacy issues privately via [GitHub Security Advisories](https://github.com/fmedery/antigravity-plugin-flight-recorder/security/advisories/new) rather than opening a public issue. Include reproduction steps and affected OS / Antigravity version.
