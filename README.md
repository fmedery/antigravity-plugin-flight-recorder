# Flight Recorder (`flight-recorder`)

**Understand and optimize how your plugins, skills, MCP servers, and tools spend tokens, cache carry, USD, and active agent time when building apps in Google Antigravity.**

Flight Recorder is a local-only **MCP App & Antigravity plugin** for **Antigravity 2.x (Hub)**, **Antigravity IDE**, and **Antigravity CLI (`agy`)** on **Windows, macOS, and Linux**.

---

## Prerequisites

- **Antigravity 2.x (Hub)**, Antigravity IDE, or Antigravity CLI (`agy`)
- **Node.js `>= 22.15`** on your `PATH` (check with `node -v` in Terminal or PowerShell)

> **Zero build steps required:** Prebuilt, self-contained server and UI bundles (`dist/`) are included in the repository—**no `npm install`, TypeScript build, or Python installation is needed.**

---

## Installation

All Antigravity surfaces (Antigravity 2.x Hub, IDE, and `agy` CLI) auto-discover plugins placed in your global plugins folder:

- **macOS / Linux:** `~/.gemini/config/plugins/flight-recorder`
- **Windows:** `%USERPROFILE%\.gemini\config\plugins\flight-recorder`

Choose whichever install method fits your setup:

### Option 1: Antigravity 2.x (Hub) & IDE — via Git (Recommended)

Run **one** command for your operating system:

**macOS / Linux (Terminal):**
```bash
git clone https://github.com/fmedery/antigravity-plugin-flight-recorder ~/.gemini/config/plugins/flight-recorder
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/fmedery/antigravity-plugin-flight-recorder "$HOME\.gemini\config\plugins\flight-recorder"
```

**Windows (Command Prompt / `cmd.exe`):**
```cmd
git clone https://github.com/fmedery/antigravity-plugin-flight-recorder "%USERPROFILE%\.gemini\config\plugins\flight-recorder"
```

### Option 2: Install without Git (Download ZIP — Windows / macOS / Linux)

1. On GitHub, click **Code → Download ZIP** and extract the archive.
2. Rename the extracted folder to `flight-recorder` and move it into your plugins directory so `plugin.json` sits directly at:
   - **Windows:** `%USERPROFILE%\.gemini\config\plugins\flight-recorder\plugin.json`
   - **macOS / Linux:** `~/.gemini/config/plugins/flight-recorder/plugin.json`
   > **Important:** Make sure `plugin.json` is directly inside `flight-recorder\`—not nested an extra level deep such as `flight-recorder\antigravity-plugin-flight-recorder-main\plugin.json`.

### Option 3: Ask Antigravity 2.x (Hub) in Chat

Paste this prompt into any Antigravity 2.x Hub conversation:

> Install `https://github.com/fmedery/antigravity-plugin-flight-recorder` into my global Antigravity plugins folder as `flight-recorder`.

### Option 4: Antigravity CLI (`agy`)

If you use the `agy` CLI, install into the same shared global plugins folder with:

```bash
agy plugin install https://github.com/fmedery/antigravity-plugin-flight-recorder
```

---

## Verify & Open in Antigravity 2.x (Hub)

Antigravity 2.x Hub picks up newly added plugins **live—no application restart required**:

1. **Check plugin status:** Open **Left Sidebar → Skills & Customizations → Installed** and verify **Flight Recorder** is toggled **On**.
2. **Open the dashboard:**
   - **Full-page view (all projects):** Click **Flight Recorder** in the **Left Sidebar**.
   - **Side-pane view (inside any chat):** Click the **`+` button** in the chat auxiliary pane and select **Flight Recorder**.
   - **From chat:** Ask *"Open Flight Recorder to inspect this project"* or *"Which plugins and skills drove spend and active time in this project?"*

---

## What Flight Recorder Shows You

- **Parent-First Plugin & Skill Efficiency Leaderboard:**
  - See immediately which **parent plugin or top-level skill** (e.g., `Superpowers`, `Cloudflare`, `Gmail`) drives **90% of your spend and active build time**—including downstream model reasoning and multi-hop subagent runs—*before* drilling into individual sub-skills (`brainstorming`, `writing-plans`), MCP tools, or CLIs.
  - Toggle between **`Spend & Time`** and **`Context Carry`** (`Instruction Markdown` vs. `Tool Execution` tokens).
  - Click any parent row to expand child sub-skills/tools, inspect `[dup]` / `[unused]` badges, and click **`Optimize With Agent`** to generate concrete `SKILL.md` / workflow improvements.
- **Actionable Waste Diagnostics (`Why` Panel):**
  - Flags **Unused Tool-Skill Loads**, **Duplicate `SKILL.md` Reads**, **High Instruction Markdown Carry**, **Tool Retry Thrash** (consecutive and interleaved single-turn loops), **Subagent Delegation Candidates**, **Prompt Cache Misses** (TTL expiry, model switches, compaction), and **`200k` / `256k` Context Compaction Cliffs**—without false-positiving pure guidance/process skills.
- **Step-by-Step Context & Timing Waterfalls:**
  - Visualizes `200k cliff` and `256k compaction` thresholds on per-step context bars, separates **Active Agent Time** (`Model` + parallel-merged `Tools` + `Subagents`) from **User Wait / Idle**, and includes `?` hover/focus explanations on every top KPI card explaining what each metric means and its impact.
- **Model Mix, Switch Detection & Custom Pricing:**
  - Tracks token/time share across every model and subagent, highlights orchestrator model switches, and lets you configure per-1M input / cache-read / output USD rates (**unknown models stay honestly labeled `Unpriced`** until you add a rate).

---

## Updating & Uninstalling

### Update (Git installs)

- **macOS / Linux:**
  ```bash
  git -C ~/.gemini/config/plugins/flight-recorder pull
  ```
- **Windows (PowerShell):**
  ```powershell
  git -C "$HOME\.gemini\config\plugins\flight-recorder" pull
  ```
  *(After pulling an update, toggle the `flight-recorder_recorder` server off/on in **Settings → MCP Servers** so the running Node process reloads the new bundle.)*

### Uninstall

- **In Antigravity 2.x Hub:** Open **Left Sidebar → Skills & Customizations → Installed → Flight Recorder** to disable or uninstall it.
- **Optional — remove local SQLite index & hook log:** Delete `~/.gemini/flight-recorder-data` (`%USERPROFILE%\.gemini\flight-recorder-data` on Windows) or your plugin's `${PLUGIN_DATA}` directory.

---

## Privacy & Security

- **100% local, zero network:** No telemetry, analytics, or external requests (`default-src 'none'` iframe CSP).
- **Passive-only hooks:** Uses only `SessionStart`, `PreInvocation`, `PostToolUse`, `PostInvocation`, and `Stop`—never `PreToolUse`—and fails open (`{}`) on any error.
- **Redacted & owner-private storage:** API keys, Bearer tokens, JWTs, URL credentials, and ANSI/OSC escape sequences are scrubbed from previews before indexing, and data files use `0700`/`0600` owner-only permissions on macOS/Linux (and private `%USERPROFILE%` ACLs on Windows).

See [SECURITY.md](./SECURITY.md) for the full audit table.

---

## Troubleshooting

- **Flight Recorder doesn't appear in Hub's sidebar:**
  1. Confirm `plugin.json` is directly inside `.../plugins/flight-recorder/plugin.json` (not nested inside an extra subfolder from a ZIP extract).
  2. Run `node -v` in Terminal / PowerShell and verify **Node.js `>= 22.15.0`** (required for built-in `node:sqlite`).
  3. Check **Settings → MCP Servers** in Antigravity Hub to confirm `flight-recorder_recorder` is running, or click **Refresh / Restart**.
- **Models show `Unpriced`:** Click **`Pricing`** in the top-right bar of Flight Recorder (or any `Unpriced` badge) to add or customize per-1M USD rates for new model families.

---

## Contributor & Local Development

If you are modifying Flight Recorder's TypeScript or React source code:

```bash
npm install
npm run build          # Type-checks & bundles dist/server/index.js + dist/ui/index.html
npm test               # Runs unit, Windows path, security, and zero-node_modules stdio tests
npm run install-plugin # Links this checkout into ~/.gemini/config/plugins/flight-recorder (uses junction on Windows)
```

## License

[MIT](./LICENSE) © Frederic Medery
