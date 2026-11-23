# Phase 1 Design: Parent-First Skill & Tool Efficiency Intelligence

**Date:** 2026-11-23  
**Project:** Flight Recorder (`flight-recorder`)  
**Status:** Approved

---

## 1. Intent & Why

When building an application with Antigravity, plugins like `Superpowers` bundle many sub-skills (`using-superpowers`, `brainstorming`, `writing-plans`, `subagent-driven-development`, `test-driven-development`, `verification-before-completion`), while other plugins combine `SKILL.md` docs, MCP servers, and CLI scripts.

Today, Flight Recorder has three blind spots that prevent effective optimization:
1. **Invisible workflow time & spend on guidance plugins:** `PluginSkillLeaderboard` only sums the `read_file` syscall duration (`~5ms`) and raw `SKILL.md` input/cache tokens—ignoring the model thinking steps, output tokens, and subagent runs driven by that plugin. A plugin responsible for **90% of a project's build time and spend** can appear to take `12ms` and `$0.03`.
2. **Fragmented sub-skill noise outside the leaderboard:** Chat badges, diagnostics (`WhyPanel`), and `SkillToolMatrix` expose raw sub-skill names (`brainstorming`, `using-superpowers`) before establishing which **parent plugin or top-level skill** dominates time and spend—and the leaderboard itself has **no drill-down** to inspect those sub-skills once you spot the parent culprit.
3. **Descriptive stats instead of waste prescriptions:** Users see token totals, but cannot see **Instruction Load vs. Tool Execution** split, **Unused Skill Loads**, **Duplicate `SKILL.md` Reads**, **Tool Retry/Thrash Loops**, **Main-Thread Exploration Bursts** (subagent candidates), or which call pushed context over Antigravity's **200k danger cliff / 256k soft compaction ceiling**.

**Goal:** Show **parent plugin / top-level skill share of total time, spend, and context footprint first** everywhere, let users **drill down** into child sub-skills/tools on demand, and surface concrete, false-positive-free waste diagnostics with one-click agent optimization.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Parent-first rollup everywhere:** Group all plugin sub-skills, plugin reference reads, plugin MCP tools, and plugin CLI invocations under their **Parent Plugin** (`Superpowers`, `Cloudflare`, `Chrome DevTools`, etc.), and group non-plugin skills (`~/.gemini/antigravity/builtin/skills/<s_name>`, `.agents/skills/<s_name>`, `~/.gemini/config/skills/<s_name>`) under their **Top-Level Skill**, including work performed inside spawned child subagents.
- **True share of project/chat Time & Spend before drill-down:** Compute each parent's **Driven Active Time (`drivenActiveMs`, `timeShare`)** and **Driven Spend (`drivenCostUsd`, `costShare`)** against the **entire scope's** active time and estimated USD cost (including unassisted chats/steps), so shares never exceed 100% and accurately reflect when e.g. `Superpowers` accounts for 90% of time and spend.
- **Instruction Overhead vs. Execution Split:** Separate context footprint (`directTokens + compoundedCacheTokens`) into `instructionTokens` (`SKILL.md` + `skills/<name>/**` docs/references) and `executionTokens` (MCP calls + CLI script runs), alongside raw `toolWallMs`.
- **Interactive Child Drill-Down + "Optimize With Agent":** Clicking any parent row in `PluginSkillLeaderboard` expands its child sub-skills, MCP tools, and CLI commands (ranked by driven spend/tokens), showing exact waste badges, optimization prescriptions, and an **Optimize With Agent** action.
- **High-precision Waste Diagnostics & Compaction Cliff:** Detect `unused_skill` (without false-positiving pure guidance skills!), `duplicate_skill_read`, `tool_thrash`, `subagent_candidate`, and `compaction_cliff` (`200k` warning / `256k` soft compaction ceiling on `TokenBreakdownChart` and `WhyPanel`).
- **Model-callable MCP Optimization Tool:** Add `get_skill_optimization` and enrich `list_projects`, `get_project_summary`, `get_chat_analysis`, and `explain_bottlenecks` with parent-first time/spend shares.

### Non-Goals (Deferred to Phases 2–4)
- Reading `agy` CLI `.db` / `-wal` protobuf databases or quota pools (Phase 2).
- Rolling time-window filters (`5h` / `Today` / `7d` / `30d`) and `agy-powerline` `exec` status pill (Phase 3).
- Replacing `hooks/record_event.py` with Node, `doctor`/`report` CLI, and `fast-check` fuzzing (Phase 4).

### Anti-Goals (What Would Make This a Failure Even If It Works)
- **False-positiving guidance skills as "unused":** Process skills (`Superpowers` skills, `workers-best-practices`, etc.) have no CLI or MCP call—reading `SKILL.md` *is* how they work. Flagging them as "unused" because no CLI ran would destroy trust.
- **Shares summing over 100% or dividing by the wrong denominator:** Showing `Superpowers: 100%` just because it was the *only* plugin used in a project where 95% of chats used no plugins at all would mislead the user. Shares of time and spend must be measured against **total scope active time and total scope spend**.
- **Forcing a destructive SQLite wipe:** Existing `tracker.sqlite` history must gain all Phase 1 metrics immediately without losing manual project overrides or pricing rules.

---

## 3. Constraints

- **Node >= 22.15, TypeScript ESM server + single-file React 19 Vite bundle (`dist/ui/index.html`)**: No new runtime npm dependencies.
- **Strict pricing transparency**: If a conversation uses unpriced models (`estimatedCostUsd === null`), `drivenCostUsd` tracks priced steps honestly and preserves `unpricedModels` indicators—never inventing USD rates.
- **Host compatibility**: `Optimize With Agent` uses `app.sendMessage` only when `canSendMessage` is `true` in the MCP App host, and falls back to a "Copy Optimization Prompt" button when `canSendMessage` is `false`.

---

## 4. Approaches Considered

1. **Approach 1: Live Query-Time Intelligence Engine + Inline Drill-Down (Selected)**
   - Compute Parent-First Driven Time/Spend, Instruction vs. Execution splits, Child Sub-Skill Drill-Downs, and Waste Diagnostics dynamically in `src/server/analytics.ts` from already-persisted `planner_steps`, `tool_calls`, `files_touched`, and an enriched 30s-cached `InstalledPluginRegistry`.
   - *Trade-off:* Adds a small O(steps + tools) in-memory pass on detail/dashboard queries (milliseconds, since `buildProjectDetail` already loads `allSteps` and `allTools`), in exchange for **instant visibility across 100% of existing indexed chats**, zero schema churn, and live awareness of currently installed plugin manifests (`plugin.json`, `mcp_config.json`, `bin/`, `skills/*/scripts/`).
2. **Approach 2: Index-Time SQLite Migration + Full Transcript Re-Scan (Rejected)**
   - Persist new skill/diagnostic tables during `analyzeConversation()` and invalidate `indexed_files`.
   - *Why rejected:* Freezes plugin/MCP/CLI metadata at scan time and forces full disk re-parsing whenever heuristics or pricing change.
3. **Approach 3: Separate "Optimization Advisor" Tab Only (Rejected)**
   - Keep existing tables unchanged and add an isolated LLM advisor tab.
   - *Why rejected:* Hides the headline "90% of time and spend" number away from the main project/chat leaderboards and step charts.

---

## 5. Detailed Design

### 5.1 Enriched Plugin & Skill Registry (`src/server/analytics.ts`)
Extend `discoverInstalledPlugins()` (cached for 30s, checking `~/.gemini/config/plugins` and `~/.gemini/antigravity/builtin/plugins` if present) so each `InstalledPluginInfo` records:
- `id`, `dirName`, `displayName` (from `plugin.json` `displayName ?? name ?? dirName`).
- `mcpServerNames: string[]`: parsed from the plugin's `mcp_config.json` `mcpServers` keys (matching both `<serverKey>` and `<pluginId>_<serverKey>` / `<dirName>_<serverKey>`).
- `cliNames: string[]`: named extensionless CLI binaries in `bin/` and `skills/*/scripts/` matching the plugin/skill ID prefix (via existing `collectPluginCliBinaries` rules, which include binaries like `gmail`, `gdrive`, `gdocs`, `gsheets`, `gcalendar` and exclude optional `.sh`/`.py` helper scripts such as `superpowers/skills/brainstorming/scripts/start-server.sh`).
- `skills: Map<string, { name: string; mentionsMcpOrCli: boolean }>`: discovered from `skills/<dir>/SKILL.md` frontmatter `name` + folder name, checking once when caching `SKILL.md` whether its body references any of the plugin's `mcpServerNames` or `cliNames`.
- `hasExecutableSurface: boolean`: `mcpServerNames.length > 0 || cliNames.length > 0`.

**Parent vs. Child Resolution (`resolveToolPluginOrSkill`):**
Every plugin/skill-related `ToolCallRecord` resolves to **both** a **Parent** (`id`, `name`, `kind: "Plugin" | "Skill"`) and a **Child** (`childKey`, `childLabel`, `childKind: "SubSkill" | "MCP" | "CLI" | "Reference"`):
- Reading `~/.gemini/config/plugins/superpowers/skills/brainstorming/SKILL.md` → Parent: `Plugin "Superpowers"` (`plugin:superpowers`), Child: `SubSkill "brainstorming"`, Footprint Type: `instruction`.
- Reading `~/.gemini/config/plugins/superpowers/skills/using-superpowers/references/antigravity-tools.md` → Parent: `Plugin "Superpowers"`, Child: `SubSkill "using-superpowers"`, Footprint Type: `instruction`.
- Calling `mcp_flight-recorder_recorder_list_projects` → Parent: `Plugin "Flight Recorder"`, Child: `MCP "recorder:list_projects"`, Footprint Type: `execution`.
- Running `~/.gemini/config/plugins/gmail/skills/gmail/scripts/gmail ...` → Parent: `Plugin "Gmail"`, Child: `CLI "gmail"`, Footprint Type: `execution`.
- Reading `~/.gemini/antigravity/builtin/skills/agy-customizations/SKILL.md` (standalone non-plugin skill) → Parent: `Skill "agy-customizations"`, Child: `Reference "SKILL.md"` (or sub-file basename), Footprint Type: `instruction`.

### 5.2 Deterministic Driven Time & Spend Attribution
To answer *"What % of total project/chat time and spend is because of Parent X?"* without ever exceeding 100%:

1. **Detect Unused Tool-Backed Skill Loads First (Per Conversation):**
   - **(Engineering call)** Optional helper scripts inside guidance plugins (e.g. `.sh` helpers in `Superpowers`) must *not* classify a guidance skill as tool-dependent. Instead, a skill `S` under parent `P` is classified as **tool-dependent** (`requiresExecution = true`) only when:
     a) `P` has named CLI binaries (`plugin.cliNames.length > 0`) AND (`plugin.skills.size <= 1` || `skillInfo.mentionsMcpOrCli`), OR
     b) `P` has MCP servers (`plugin.mcpServerNames.length > 0`) AND (`plugin.skills.size <= 1` || `skillInfo.mentionsMcpOrCli`).
   - Pure markdown/process skills (`Superpowers › brainstorming`, `Superpowers › subagent-driven-development`, `Cloudflare › workers-best-practices`) have `requiresExecution = false` and are **never** marked unused for having zero CLI/MCP calls.
   - If a skill with `requiresExecution === true` (e.g. `gmail`, `gdrive`, `flight-recorder`, `chrome-devtools`) is read in conversation `C` and `C` (plus `C`'s spawned subagents) makes **zero** execution calls (`category === "mcp"` or `"command"` resolving to `P`), mark that skill load `isUnusedLoad = true`.
2. **Walk Planner Steps `S_0 .. S_{k-1}` Per Conversation (Wall-Clock Basis, Zero Subagent Double-Count):**
   - **(Engineering call — wall-clock basis)** To ensure `drivenActiveMs` and `timeShare` never exceed `100%` even when subagents run sequentially or in parallel:
     - When child subagent conversations are in the attribution scope, exclude synchronous `category === "subagent"` wait intervals on the parent step if that `childConversationId` is present in scope (since the child's own model and tool intervals are already in scope).
     - Record attributed `[start, end]` active intervals per parent (and child sub-skill) across all conversations in scope, compute raw merged wall-clock duration via `mergeIntervalsWallMs`, and if concurrent execution across distinct parents causes `sum(parentMergedMs) > scopeTotalActiveMs`, scale proportionally so `sum(drivenActiveMs) <= scopeTotalActiveMs`. (For unplaced steps lacking timestamps, fall back to proportional `stepActiveMs` clamped to `C.activeMs`.)
     - Each step `S_i` also carries `stepTokens = S_i.inputTokens + S_i.cacheReadTokens + S_i.outputTokens` and `stepCostUsd = estimateStepCost(S_i, S_i.model, pricingRules).totalUsd ?? 0` (tracking `hasPricedStep`).
   - Determine `S_i`'s **step drivers**:
     - **Direct drivers on `S_i`**: Parents resolved from tools called by `S_i`, OR tools from `S_{i-1}` whose results were just ingested by `S_i` (for `isUnusedLoad` skill reads, include only the immediate ingestion step `S_i`, never persisting as a guiding workflow!).
     - **Guiding workflow persistence**: Whenever a non-unused skill (`tc.category === "skill"`) is read, set `guidingParent = resolved.parent` and `guidingChild = resolved.child`. This persists across subsequent steps and turns in `C` until another non-unused skill is read (updating `guidingParent`/`guidingChild`) or a prompt-cache compaction reset occurs without re-reading.
     - **Subagent inheritance & Single-Chat denominator alignment**: When conversation `C` invokes a subagent (`tc.childConversationId = childId`) during a step attributed to `(parent P, child K)`, `childId` inherits `(P, K)` as its initial `guidingParent`/`guidingChild`.
       - **(Engineering call)** In **Single-Chat View (`buildConversationDetail`)**, child subagent conversations (`detail.subagents`) are included in the chat's plugin/skill attribution pool so subagent-heavy workflows (like `Superpowers › subagent-driven-development`) reflect their full time and spend. To avoid conflicting with parent-only top KPI cards, `scopeTotalActiveMs` (merged wall-clock across chat + subagents) and `scopeTotalCostUsd` (chat + subagents) are used as the leaderboard denominator, and `ChatDetailView` labels the leaderboard subtitle `"Includes N subagent(s)"` whenever `detail.subagents.length > 0`.
       - In **Project View (`buildProjectDetail`)** and **Global View (`buildDashboardData`)**, `projectRows` already includes both top-level and subagent conversations once each, matching `project.summary.time.activeMs` and `project.summary.tokens.estimatedCostUsd`.
   - Split `S_i`'s intervals/duration, `stepCostUsd`, and `stepTokens` equally across `S_i`'s direct drivers (if any), else 100% to `guidingParent` / `guidingChild` (if active), else to `Unassisted` (no plugin/skill).
3. **Compute Scope Shares (All Scope-Wide Denominators `<= 100%`):**
   - `timeShare = scopeTotalActiveMs > 0 ? parent.drivenActiveMs / scopeTotalActiveMs : 0`
   - `costShare = scopeTotalCostUsd > 0 && parent.drivenCostUsd !== null ? parent.drivenCostUsd / scopeTotalCostUsd : null`
   - **(Engineering call)** `tokenShare = scopeTotalContextTokens > 0 ? parent.totalTokens / scopeTotalContextTokens : 0`, where `scopeTotalContextTokens = sum(inputTokens + cacheReadTokens)` across **all planner steps in scope** (including unassisted chats), clamped to `[0, 1]`. Because `directTokens + compoundedCacheTokens` represents uncached input plus subsequent cache reads prior to the next cache miss, dividing by `scopeTotalContextTokens` ensures a single small plugin call in an otherwise unassisted project shows its true ~2% context share rather than `100%` (existing unit test expectations in `test/analytics.test.ts` will be updated to assert scope-wide shares).
   - Default sort order on `PluginSkillLeaderboard`: highest `drivenCostUsd` (when priced), falling back to highest `drivenActiveMs` / `totalTokens`, with a toggle pill (`Impact: Spend & Time` | `Context Carry`) so users can rank by either workflow spend/time or raw prompt-cache footprint.

### 5.3 Phase 1 Waste Diagnostics & Compaction Cliff
Replace static scan-time-only diagnostics in `buildConversationDetail` and `buildProjectDetail` with a live `computeDiagnostics()` function over stored steps, tools, files, and plugin registry (keeping backward-compatible `DiagnosticFinding` shape, extended with new `DiagnosticCategory` values):

| Category | Trigger Rule | User-Facing Insight & Prescription |
| :--- | :--- | :--- |
| `unused_skill` | Tool-backed skill read with `0` MCP/CLI executions in chat (or subagents), OR any exact `SKILL.md` path read `>= 2` times in the same chat (`duplicate_read`). | Names **`Parent › sub-skill`**, wasted direct + cache carry tokens, and prescribes tightening `SKILL.md` `description` trigger or avoiding duplicate reads. |
| `high_skill_overhead` | A parent plugin/skill has `instructionTokens >= 25,000` (direct + carry) AND `instructionShare >= 0.75`. | Highlights markdown carry weight across N steps and prescribes splitting reference tables/examples out of `SKILL.md` into progressive-disclosure `references/` files. |
| `tool_thrash` | `>= 2` consecutive errors on the same `toolName` (or `>= 3` total calls to `edit_file`/`run_command` on the same target with `>= 2` errors in one turn). | Quantifies wasted tokens + active duration from retries (e.g. sandbox retries, stale CLI flags, `edit_file` target mismatches). |
| `subagent_candidate` | A single turn in a top-level chat executes `>= 6` `file_read`/`search`/`command` calls adding `>= 25,000` `compoundedCacheTokens` with `0` `file_write` calls and `0` `invoke_subagent` calls. | Suggests delegating broad codebase exploration to a `research` subagent so raw search dumps don't stay in the parent context cache. |
| `compaction_cliff` | Planner step crosses `200,000` `totalContextTokens` (warning: Antigravity 200k cliff) or `256,000` `totalContextTokens` (critical: soft compaction ceiling), or triggers context compaction reset. | Pinpoints the exact step and top contributing plugin/skill/tool that pushed context past the cliff. |

*(Existing `token_driver`, `cache_miss`, `slow_step`, `repeated_read`, `error_retry`, and `model_split` diagnostics remain, updated so any skill/plugin tool call formats its label **Parent-First**, e.g. `Superpowers › brainstorming` instead of raw `brainstorming`.)*

### 5.4 UI Components & Flows

#### A. Parent-First `PluginSkillLeaderboard` with Inline Drill-Down (`src/ui/components/PluginSkillLeaderboard.tsx`)
Text sketch of the updated leaderboard and expanded `Superpowers` row:

```text
┌─ Plugins & Skills Impact ────────────── [Impact: Spend & Time | Context] [All | Plugins | Skills] ─┐
│ #  Plugin / Skill                     Share of Spend     Active Time    Context (Instr / Exec)     │
│ ────────────────────────────────────────────────────────────────────────────────────────────────── │
│ ▸ 1 Superpowers [Plugin · 5 skills]   █████████░ 89%     7m 42s (86%)   +164k (100% instr)  [2 warn]│
│     $1.12 est. · 6 loads · 3 chats                                                                 │
│   ┌─ Sub-Skills & Tools under Superpowers ──────────────────────────────── [Optimize With Agent] ─┐│
│   │ • subagent-driven-development  SubSkill   46% ($0.58)   4m 10s   +52k instr   1 load          ││
│   │ • brainstorming                SubSkill   24% ($0.30)   2m 05s   +61k instr   1 load          ││
│   │ • writing-plans                SubSkill   15% ($0.19)   1m 12s   +31k instr   1 load          ││
│   │ • using-superpowers            SubSkill    4% ($0.05)      15s   +20k instr   3 loads [2× dup]││
│   │ 💡 Prescription: 100% of context carry (+164k tok) comes from SKILL.md markdown carried across││
│   │    remaining steps, plus 2 duplicate reads of using-superpowers.                              ││
│   └───────────────────────────────────────────────────────────────────────────────────────────────┘│
│ ▸ 2 Cloudflare [Plugin · 3 items]     █░░░░░░░░░  7%        34s (6%)    +48k (18% instr / 82% exec)│
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Optimize With Agent button:** When `canSendMessage` is `true`, sends a concise, evidence-backed prompt to the host agent naming the parent plugin/skill, its exact `SKILL.md` / tool paths, driven spend/time %, instruction vs. execution tokens, and detected waste findings so the agent can propose concrete edits or rules. When `canSendMessage` is `false`, copies the prompt to clipboard and shows a brief confirmation notice.

#### B. `200k` Cliff & `256k` Soft Compaction Lines (`src/ui/components/TokenBreakdownChart.tsx`)
- When `maxVal >= 160_000` (so the lines aren't squashed at the ceiling on tiny 10k-token chats; on smaller chats, show a subtle `"Peak context: 42k / 200k cliff (21%)"` pill in the chart header), render dashed horizontal threshold lines at `200k` (`--txt-warning`, `"200k cliff"`) and `256k` (`--txt-danger`, `"256k compaction"`).

#### C. Parent-First Badges Across Views (`ProjectOverview.tsx`, `ChatDetail.tsx`)
- Conversation rows in `ProjectDetailView` (`Chats & Tasks`) replace raw `c.skillsUsed` sub-skill badges with `c.topPluginsSkills` (parent names first, with full sub-skill list in `title` tooltip).

### 5.5 MCP Tools & Skill Update (`src/server/tools.ts`, `skills/flight-recorder/SKILL.md`)
- Add model-callable tool **`get_skill_optimization`** (`inputSchema: { pluginOrSkill?: string, projectPath?: string, conversationId?: string }`): returns ranked parent plugins/skills (or deep drill-down on a named plugin/skill) with driven spend %, driven active time %, instruction vs. execution breakdown, child sub-skills/tools, file paths, and waste prescriptions.
- Update `fmtPluginSkillLines` in `list_projects`, `get_project_summary`, and `get_chat_analysis` to lead with driven spend %, driven time %, and instruction/execution split.
- Update `skills/flight-recorder/SKILL.md` to document `get_skill_optimization` and parent-first reporting.

---

## 6. What Is Left to the Builder

- Exact TypeScript interface field names on `PluginSkillMetric` and `PluginSkillChildMetric` in `src/shared/types.ts` (preserving existing fields for backward compatibility).
- Exact CSS layout details for the expandable table row drawer in `src/ui/styles.css`, matching existing `--bg-*`, `--bdr-*`, and `--txt-*` tokens.
- Unit and integration test cases in `test/analytics.test.ts` and `test/integration.test.ts` covering:
  1. Multi-skill plugin rollup (`Superpowers` with `brainstorming` + `writing-plans` + spawned subagent) producing parent-first ~90% driven time/spend shares <= 100% and accurate child drill-down.
  2. Guidance skill (`Superpowers`) NOT flagged as `unused_skill`, while an unused CLI/MCP-backed skill (`gmail`) IS flagged and does not hijack downstream coding steps.
  3. Duplicate `SKILL.md` read, `tool_thrash`, `subagent_candidate`, and `compaction_cliff` (`200k`/`256k`) diagnostics.
  4. `get_skill_optimization` MCP tool response.
