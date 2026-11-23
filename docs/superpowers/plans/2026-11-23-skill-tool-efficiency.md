# Parent-First Skill & Tool Efficiency Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attribute project and chat active time, USD spend, and context footprint to parent plugins and top-level skills first (with inline child sub-skill/tool drill-down, false-positive-free waste diagnostics, `200k`/`256k` compaction cliff visualization, and a `get_skill_optimization` MCP tool).

**Architecture:** Extract an enriched plugin/skill registry, parent-child resolver, step-level workflow time/spend attribution engine, and live diagnostic rules into a focused server module (`src/server/skillEfficiency.ts`) wired into `src/server/analytics.ts` at query time so 100% of existing `tracker.sqlite` data upgrades immediately without a DB wipe. Expose drill-down and prescriptions in both MCP (`src/server/tools.ts`) and the single-file React UI (`PluginSkillLeaderboard.tsx`, `TokenBreakdownChart.tsx`, `ProjectOverview.tsx`, `ChatDetail.tsx`).

**Tech Stack:** TypeScript 5.7 (Node >= 22.15 ESM, `node:sqlite`, `node:test`), `@modelcontextprotocol/sdk`, `@modelcontextprotocol/ext-apps`, React 19 + Vite (`vite-plugin-singlefile`).

**Spec:** `docs/superpowers/specs/2026-11-23-skill-tool-efficiency-design.md`

## Global Constraints

- Node >= 22.15, TypeScript ESM server + single-file React 19 Vite bundle (`dist/ui/index.html`); zero new runtime npm dependencies.
- Workspace has no `.git` directory—verify each task with `npm run build && npm test` rather than `git commit`.
- Never false-positive markdown/process skills (`Superpowers` skills, `workers-best-practices`, etc., including skills that ship optional `.sh`/`.py` helper scripts) as `unused_skill`.
- `timeShare`, `costShare`, and `tokenShare` must use scope-wide denominators (including unassisted chats/steps) and never exceed `1.0` (`100%`).
- Strict pricing transparency: never invent USD figures for unpriced models (`drivenCostUsd: null`, `costShare: null` when no priced steps exist; preserve `unpricedModels`).
- Existing `tracker.sqlite` databases must work without wiping `indexed_files`, `project_overrides`, or `model_pricing`.
- `Optimize With Agent` uses `app.sendMessage` when `canSendMessage` is `true`, and copies the prompt to clipboard with a status notice when `canSendMessage` is `false`.

## Review Focus

- **Unpriced models (e.g. `Gemini 4 Carbon (High)`) driving a plugin workflow:** `drivenCostUsd` and `costShare` stay `null` (never `NaN` or `$0.00`), and both server sorting and `PluginSkillLeaderboard` automatically fall back to `drivenActiveMs` / `timeShare` so a 90%-time plugin still ranks #1 with a visible bar.
- **Idle-TTL or model-switch cache miss vs. context compaction reset:** `guidingParent` only clears on `"Context compaction or prefix reset"` without re-read; an `"Idle gap expired prompt cache TTL"` or `"Model changed ..."` cache miss preserves `guidingParent` because the `SKILL.md` text remains in the prompt prefix.
- **Multi-hop or dangling `parentConversationId` links (`chat -> subagent A -> subagent B`, or missing parent):** Subagent workflow inheritance walks ancestor links with a visited-set cycle guard and gracefully handles unindexed parent IDs without throwing.
- **Legacy transcripts without token telemetry (`hasTokenTelemetry === false`, all token counts `0`):** `tokenShare` is `0` (never `NaN`), `compaction_cliff` and `high_skill_overhead` do not fire, and `drivenActiveMs` / `timeShare` still compute from step/tool durations.
- **Uninstalled or external plugin paths not in `InstalledPluginRegistry`:** Any tool call carrying `tc.skillPlugin` (not `"builtin"`) still rolls up to a parent `Plugin` (`plugin:<id>`) with `tc.skillName` as its `SubSkill` child rather than leaking sub-skill rows to top level.

---

### Task 1: Enriched Plugin Registry & Parent-Child Resolver

**Files:**
- Modify: `src/shared/types.ts`
- Create: `src/server/skillEfficiency.ts`
- Modify: `src/server/analytics.ts`
- Create: `test/skillEfficiency.test.ts`

**Interfaces:**
- Produces in `src/shared/types.ts`:
  - Extended `DiagnosticCategory`: `"token_driver" | "cache_miss" | "slow_step" | "repeated_read" | "error_retry" | "model_split" | "unused_skill" | "high_skill_overhead" | "tool_thrash" | "subagent_candidate" | "compaction_cliff"`
  - `PluginSkillChildKind = "SubSkill" | "MCP" | "CLI" | "Reference"`
  - `PluginSkillChildMetric`: `{ key: string; name: string; kind: PluginSkillChildKind; calls: number; errors: number; drivenActiveMs: number; drivenCostUsd: number | null; instructionTokens: number; executionTokens: number; totalTokens: number; duplicateReads: number; isUnusedLoad: boolean; targetPaths: string[] }`
  - Extended `PluginSkillMetric` (preserving all existing fields + adding): `drivenActiveMs: number; timeShare: number; drivenCostUsd: number | null; costShare: number | null; instructionTokens: number; executionTokens: number; warningCount: number; warnings: string[]; prescription: string | null; targetPaths: string[]; children: PluginSkillChildMetric[]`
  - Extended `ConversationSummary`: `topPluginsSkills: string[]`
- Produces in `src/server/skillEfficiency.ts` (re-exported by `src/server/analytics.ts`):
  - `InstalledSkillMeta`: `{ name: string; dirName: string; mentionsMcpOrCli: boolean }`
  - Extended `InstalledPluginInfo`: `{ id: string; dirName: string; displayName: string; cliNames: string[]; mcpServerNames: string[]; skills: Map<string, InstalledSkillMeta>; hasExecutableSurface: boolean }`
  - `ResolvedPluginSkillHit`: `{ parentId: string; parentName: string; parentKind: "Plugin" | "Skill"; childKey: string; childName: string; childKind: PluginSkillChildKind; footprint: "instruction" | "execution"; requiresExecution: boolean; targetPath: string | null }`
  - `discoverInstalledPlugins(pluginsDir?: string): InstalledPluginRegistry`
  - `clearInstalledPluginsCache(): void`
  - `resolveToolPluginAndChild(tc: Pick<ToolCallRecord, "category" | "toolName" | "mcpServer" | "skillName" | "skillPlugin" | "targetPath" | "argsPreview">, registry: InstalledPluginRegistry): ResolvedPluginSkillHit | null`

- [ ] **Step 1: Write failing registry and parent-child resolution tests in `test/skillEfficiency.test.ts`**

```ts
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  clearInstalledPluginsCache,
  discoverInstalledPlugins,
  resolveToolPluginAndChild
} from "../src/server/skillEfficiency.js";

test("discoverInstalledPlugins distinguishes optional .sh helpers in Superpowers from CLI/MCP-dependent skills and resolves parent + child", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fr-eff-reg-"));
  try {
    // 1. Superpowers: multi-skill guidance plugin with .sh helper in brainstorming/scripts
    const spBrain = path.join(tmp, "superpowers", "skills", "brainstorming");
    fs.mkdirSync(path.join(spBrain, "scripts"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "superpowers", "plugin.json"),
      JSON.stringify({ name: "superpowers", displayName: "Superpowers" })
    );
    fs.writeFileSync(
      path.join(spBrain, "SKILL.md"),
      "---\nname: brainstorming\n---\n# Brainstorming\nAsk questions before coding."
    );
    fs.writeFileSync(path.join(spBrain, "scripts", "start-server.sh"), "#!/bin/sh\n");

    // 2. Gmail: single-skill CLI wrapper with extensionless binary in scripts/gmail
    const gmScripts = path.join(tmp, "gmail", "skills", "gmail", "scripts");
    fs.mkdirSync(gmScripts, { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "gmail", "plugin.json"),
      JSON.stringify({ name: "gmail", displayName: "Gmail" })
    );
    fs.writeFileSync(
      path.join(tmp, "gmail", "skills", "gmail", "SKILL.md"),
      "---\nname: gmail\n---\nRun gmail search."
    );
    fs.writeFileSync(path.join(gmScripts, "gmail"), "binary");

    // 3. Cloudflare: MCP plugin with one MCP-referencing skill and one pure guidance skill
    const cfDir = path.join(tmp, "cloudflare");
    fs.mkdirSync(path.join(cfDir, "skills", "workers-best-practices"), { recursive: true });
    fs.mkdirSync(path.join(cfDir, "skills", "cf-docs"), { recursive: true });
    fs.writeFileSync(
      path.join(cfDir, "plugin.json"),
      JSON.stringify({ name: "cloudflare", displayName: "Cloudflare" })
    );
    fs.writeFileSync(
      path.join(cfDir, "mcp_config.json"),
      JSON.stringify({ mcpServers: { cloudflare: { command: "node" } } })
    );
    fs.writeFileSync(
      path.join(cfDir, "skills", "workers-best-practices", "SKILL.md"),
      "---\nname: workers-best-practices\n---\nPure Workers architecture rules."
    );
    fs.writeFileSync(
      path.join(cfDir, "skills", "cf-docs", "SKILL.md"),
      "---\nname: cf-docs\n---\nUse cloudflare_cloudflare MCP docs tool."
    );

    clearInstalledPluginsCache();
    const reg = discoverInstalledPlugins(tmp);

    const spHit = resolveToolPluginAndChild(
      {
        category: "skill",
        toolName: "read_file",
        mcpServer: null,
        skillName: "brainstorming",
        skillPlugin: "superpowers",
        targetPath: path.join(spBrain, "SKILL.md"),
        argsPreview: ""
      },
      reg
    );
    assert.equal(spHit?.parentId, "plugin:superpowers");
    assert.equal(spHit?.parentName, "Superpowers");
    assert.equal(spHit?.childKind, "SubSkill");
    assert.equal(spHit?.childName, "brainstorming");
    assert.equal(spHit?.footprint, "instruction");
    assert.equal(spHit?.requiresExecution, false);

    const gmHit = resolveToolPluginAndChild(
      {
        category: "skill",
        toolName: "read_file",
        mcpServer: null,
        skillName: "gmail",
        skillPlugin: "gmail",
        targetPath: path.join(tmp, "gmail", "skills", "gmail", "SKILL.md"),
        argsPreview: ""
      },
      reg
    );
    assert.equal(gmHit?.parentName, "Gmail");
    assert.equal(gmHit?.requiresExecution, true);

    const cfGuide = resolveToolPluginAndChild(
      {
        category: "skill",
        toolName: "read_file",
        mcpServer: null,
        skillName: "workers-best-practices",
        skillPlugin: "cloudflare",
        targetPath: path.join(cfDir, "skills", "workers-best-practices", "SKILL.md"),
        argsPreview: ""
      },
      reg
    );
    assert.equal(cfGuide?.parentName, "Cloudflare");
    assert.equal(cfGuide?.requiresExecution, false);

    const cfMcpSkill = resolveToolPluginAndChild(
      {
        category: "skill",
        toolName: "read_file",
        mcpServer: null,
        skillName: "cf-docs",
        skillPlugin: "cloudflare",
        targetPath: path.join(cfDir, "skills", "cf-docs", "SKILL.md"),
        argsPreview: ""
      },
      reg
    );
    assert.equal(cfMcpSkill?.requiresExecution, true);

    // Uninstalled historical plugin still rolls up to Parent Plugin with SubSkill child
    const uninstalledHit = resolveToolPluginAndChild(
      {
        category: "skill",
        toolName: "read_file",
        mcpServer: null,
        skillName: "legacy-sub",
        skillPlugin: "old-plugin-pack",
        targetPath: "/archived/plugins/old-plugin-pack/skills/legacy-sub/SKILL.md",
        argsPreview: ""
      },
      reg
    );
    assert.equal(uninstalledHit?.parentId, "plugin:old-plugin-pack");
    assert.equal(uninstalledHit?.parentKind, "Plugin");
    assert.equal(uninstalledHit?.childName, "legacy-sub");
    assert.equal(uninstalledHit?.requiresExecution, false);
  } finally {
    clearInstalledPluginsCache();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run `npm test` to verify it fails**

Run: `npm test`
Expected: FAIL with `Cannot find module '../src/server/skillEfficiency.js'`

- [ ] **Step 3: Add Phase 1 types in `src/shared/types.ts` and implement `discoverInstalledPlugins` + `resolveToolPluginAndChild` in `src/server/skillEfficiency.ts`**

Update `src/shared/types.ts` with the interfaces listed above. In `src/server/skillEfficiency.ts`, move and enrich `discoverInstalledPlugins`, `clearInstalledPluginsCache`, `resolveToolPluginAndChild`, and thin backward-compatible `resolveToolPluginOrSkill` (re-exporting them from `src/server/analytics.ts`):
- Parse `mcp_config.json` `mcpServers` keys into `mcpServerNames` and index both `<serverKey>` and `<id>_<serverKey>` / `<dirName>_<serverKey>` in `registry.mcpToPlugin`.
- Scan `skills/<dir>/SKILL.md` to populate `skills` map (`name` from YAML frontmatter `name:` or `<dir>`) and check whether `SKILL.md` text contains any of the plugin's `mcpServerNames` or `cliNames` (`mentionsMcpOrCli`).
- Set `requiresExecution = (plugin.cliNames.length > 0 && (plugin.skills.size <= 1 || skillMeta?.mentionsMcpOrCli)) || (plugin.mcpServerNames.length > 0 && (plugin.skills.size <= 1 || skillMeta?.mentionsMcpOrCli))`.
- For non-plugin standalone skills (`skillPlugin === null || skillPlugin === "builtin"` and not in `registry.byId`), return `parentId: "skill:<skillName>"`, `parentKind: "Skill"`, `childKind: "Reference"`, `childName: path.basename(tc.targetPath || "SKILL.md")`, `footprint: "instruction"`, `requiresExecution: false`.
- Temporarily initialize the new `PluginSkillMetric` fields (`drivenActiveMs: 0`, `timeShare: 0`, `drivenCostUsd: null`, `costShare: null`, `instructionTokens: 0`, `executionTokens: 0`, `warningCount: 0`, `warnings: []`, `prescription: null`, `targetPaths: []`, `children: []`) and `ConversationSummary.topPluginsSkills: []` in `analytics.ts` so existing callers compile cleanly.

- [ ] **Step 4: Run build and tests to verify Task 1 passes**

Run: `npm run build && npm test`
Expected: PASS (all existing suites + new `test/skillEfficiency.test.ts` test pass)

---

### Task 2: Driven Time/Spend Attribution Engine & Live Waste Diagnostics

**Files:**
- Modify: `src/server/skillEfficiency.ts`
- Modify: `src/server/analytics.ts`
- Modify: `test/skillEfficiency.test.ts`
- Modify: `test/analytics.test.ts`

**Interfaces:**
- Consumes: `discoverInstalledPlugins`, `resolveToolPluginAndChild`, `estimateStepCost`, `StoredConversationRow`, `PlannerStepRecord`, `ToolCallRecord`
- Produces in `src/server/skillEfficiency.ts` (and re-exported by `src/server/analytics.ts`):
  - `ConversationEfficiencyInput`: `{ conversationId: string; parentConversationId: string | null; activeMs: number; hasTokenTelemetry: boolean; plannerSteps: Array<Omit<PlannerStepRecord, "estimatedCostUsd">>; toolCalls: ToolCallRecord[]; filesTouched: FileTouchRecord[] }`
  - `ScopeEfficiencyResult`: `{ pluginSkillMetrics: PluginSkillMetric[]; diagnosticsByConv: Map<string, DiagnosticFinding[]>; topPluginsByConv: Map<string, string[]>; scopeActiveMs: number; scopeCostUsd: number | null; scopeContextTokens: number }`
  - `computeScopeSkillEfficiency(conversations: ConversationEfficiencyInput[], pricingRules: ModelPricingRule[], options?: { scopeActiveMsOverride?: number; registry?: InstalledPluginRegistry }): ScopeEfficiencyResult`
  - `mergePluginSkillMetrics(projectLists: Array<{ projectPath: string; metrics: PluginSkillMetric[] }>, globalTotals?: { activeMs: number; estimatedCostUsd: number | null; contextTokens: number }): PluginSkillMetric[]`

- [ ] **Step 1: Write failing tests in `test/skillEfficiency.test.ts` covering parent ~90% time/spend attribution, subagent inheritance, unpriced fallback, compaction vs. TTL cache miss, unused skill vs. guidance skill, thrash, subagent candidate, and 200k/256k compaction cliff**

Add tests in `test/skillEfficiency.test.ts` asserting:
1. **Parent-first ~90% workflow time & spend + subagent inheritance:** Project with Chat A (`Superpowers › brainstorming` -> `Superpowers › subagent-driven-development` spawning Subagent A1 running `40s` in parallel/sequence, total `90s` & `$0.90`) + Chat B (unassisted 2-step edit, `10s` & `$0.10`, zero plugins). Assert `metrics[0].name === "Superpowers"`, `Math.round(metrics[0].costShare! * 100) === 90`, `Math.round(metrics[0].timeShare * 100) === 90`, `metrics.every(m => m.timeShare <= 1 && (m.costShare === null || m.costShare <= 1))`, `metrics[0].instructionTokens > 0`, `metrics[0].executionTokens === 0`, and `metrics[0].children.map(c => c.name)` ranks `subagent-driven-development` and `brainstorming` with zero top-level sub-skill leakage.
2. **Unused tool-skill load (`Gmail`) vs. guidance skill (`Superpowers`):** Reading `gmail/SKILL.md` in step 1 with 0 `gmail` CLI calls marks `Gmail` child `isUnusedLoad === true`, emits `unused_skill` diagnostic (`"Unused skill load: Gmail"`), and does **not** attribute steps 3..8 of TypeScript editing to `Gmail`; meanwhile `Superpowers` emits **zero** `unused_skill` findings unless the exact same `SKILL.md` path is read `>= 2` times (which emits `unused_skill` for duplicate read).
3. **Cache miss persistence rule (Review Focus #2):** `"Idle gap expired prompt cache TTL"` keeps `guidingParent` active on following steps, whereas `"Context compaction or prefix reset"` without re-reading clears `guidingParent`.
4. **Unpriced models (`Gemini 4 Carbon (High)`), legacy 0-token chats, & multi-hop/dangling subagent cycles (Review Focus #1, #3, #4):** With unpriced model steps, `drivenCostUsd === null`, `costShare === null`, and `Superpowers` still sorts #1 via `drivenActiveMs` (`timeShare > 0.8`). Cyclic `parentConversationId` (`c1 -> c2 -> c1`) or missing parent `missing-uuid` completes without throwing. Legacy `hasTokenTelemetry: false` produces `tokenShare === 0` (not `NaN`).
5. **Phase 1 diagnostics (`high_skill_overhead`, `tool_thrash`, `subagent_candidate`, `compaction_cliff`):**
   - `>= 25_000` `instructionTokens` with `>= 75%` instruction ratio emits `high_skill_overhead` with prescription.
   - 2 consecutive failed `edit_file` calls emit `tool_thrash`.
   - 6 read/search calls in one turn with `30_000` `compoundedCacheTokens` and 0 writes/subagents emit `subagent_candidate`.
   - Step with `totalContextTokens = 210_000` emits `compaction_cliff` (`severity: "warning"`), and `260_000` emits `compaction_cliff` (`severity: "critical"`).

- [ ] **Step 2: Run `npm test` to verify the new tests fail**

Run: `npm test`
Expected: FAIL (`computeScopeSkillEfficiency is not a function`)

- [ ] **Step 3: Implement `computeScopeSkillEfficiency`, live diagnostics, and `analytics.ts` wiring**

In `src/server/skillEfficiency.ts`:
- Resolve subagent spawn inheritance first: build a map `spawnInheritedGuide` from `tc.childConversationId -> { parentHit, depth }` at the step where `invoke_subagent` ran, guarding ancestor walks with a `visited = new Set<string>()` (max depth 16).
- Identify `isUnusedLoad` per conversation `C` (checking execution calls across `C` and its descendant subagents in scope).
- Walk `C.plannerSteps` in order:
  - Skip parent `tc.category === "subagent"` tool wait intervals when `tc.childConversationId` is present in the `conversations` scope set.
  - Direct drivers on `S_i`: hits on `S_i`'s own tool calls plus `S_{i-1}`'s tool calls (except `isUnusedLoad` hits apply only on the immediate ingestion step after their read).
  - Update `guidingHit` whenever a non-unused `category === "skill"` hit occurs; clear `guidingHit` on `S_i` if `S_i.isCacheMiss && S_i.cacheMissCause === "Context compaction or prefix reset"` (do *not* clear on TTL or model-switch cache misses).
  - Attribute `S_i`'s active interval (or fallback `stepActiveMs`), `stepCostUsd`, and `stepTokens` across direct drivers if non-empty, else to `guidingHit`, else unattributed.
- Merge intervals per parent and child with `mergeIntervalsWallMs`; if `sum(parent.drivenActiveMs) > scopeActiveMs`, scale down proportionally so `sum(timeShare) <= 1.0`.
- Compute `tokenShare = scopeContextTokens > 0 ? Math.min(1, totalTokens / scopeContextTokens) : 0` where `scopeContextTokens = sum(S.inputTokens + S.cacheReadTokens)` across all steps in scope (`0` when `hasTokenTelemetry` is `false`).
- Sort parents by `(b.drivenCostUsd ?? -1) - (a.drivenCostUsd ?? -1) || b.drivenActiveMs - a.drivenActiveMs || b.totalTokens - a.totalTokens || a.name.localeCompare(b.name)`.
- Generate `prescription` string and `warnings` badges on each `PluginSkillMetric` summarizing duplicate reads, unused loads, or `>= 75%` instruction markdown carry (`>= 25k` tok), and emit the 5 new `DiagnosticCategory` findings plus Parent-First `token_driver` labels (`Superpowers › brainstorming`).

In `src/server/analytics.ts`:
- Wire `computeScopeSkillEfficiency` into `buildConversationDetail` (passing `[parentConv, ...subagentConvs]` so single-chat plugin metrics & diagnostics include spawned subagents cleanly!), `buildProjectDetail` (passing all `projectRows` with `scopeActiveMsOverride: activeMs`), and `buildDashboardData` (passing global totals into `mergePluginSkillMetrics`).
- Populate `ConversationSummary.topPluginsSkills` on each conversation summary.
- Update `aggregatePluginSkillMetrics` (kept as a convenience wrapper over `computeScopeSkillEfficiency` for direct callers) and update `test/analytics.test.ts` line 1345 so `tokenShare` asserts exact scope-wide context share (`totalTokens / sum(step.inputTokens + step.cacheReadTokens)`).

- [ ] **Step 4: Run build and tests to verify Task 2 passes**

Run: `npm run build && npm test`
Expected: PASS

---

### Task 3: `get_skill_optimization` MCP Tool & Skill Documentation

**Files:**
- Modify: `src/server/tools.ts`
- Modify: `skills/flight-recorder/SKILL.md`
- Modify: `test/integration.test.ts`

**Interfaces:**
- Consumes: `PluginSkillMetric`, `PluginSkillChildMetric`, `DiagnosticFinding`, `buildDashboardData`, `buildProjectDetail`, `buildConversationDetail`
- Produces in `src/server/tools.ts`:
  - Model-callable MCP tool `get_skill_optimization` with input `{ pluginOrSkill?: string; projectPath?: string; conversationId?: string }` returning Markdown summary + `structuredContent: { scope: string; totalActiveMs: number; totalEstimatedCostUsd: number | null; items: PluginSkillMetric[]; relatedDiagnostics: DiagnosticFinding[] }`.
  - Updated `fmtPluginSkillLines` showing driven spend share %, driven active time share %, and `instructionTokens` / `executionTokens` split.
  - Updated `explain_bottlenecks` category filter so `focus: "tokens"` includes `unused_skill`, `high_skill_overhead`, `tool_thrash`, `subagent_candidate`, `compaction_cliff`, and `focus: "time"` includes `slow_step`, `error_retry`, `tool_thrash`.

- [ ] **Step 1: Add failing MCP integration test in `test/integration.test.ts` for `get_skill_optimization` and updated `list_projects` / `explain_bottlenecks` outputs**

In `test/integration.test.ts`, assert:
- `toolsList.tools.some((t) => t.name === "get_skill_optimization")` is `true`.
- Calling `get_skill_optimization` with `{ projectPath: "/Users/dev/sample-project" }` returns `writing-plans` with `drivenActiveMs > 0`, `timeShare > 0`, `instructionTokens > 0`, and `children.length >= 1` (including subagent time inherited by `writing-plans`!).
- Calling `get_skill_optimization` with `{ pluginOrSkill: "writing-plans", conversationId: parentId }` filters `structuredContent.items` to `writing-plans`.

- [ ] **Step 2: Run `npm test` to verify the integration test fails**

Run: `npm test`
Expected: FAIL (`AssertionError` — `get_skill_optimization` not registered)

- [ ] **Step 3: Implement `get_skill_optimization`, update `fmtPluginSkillLines` & `explain_bottlenecks` in `src/server/tools.ts`, and update `skills/flight-recorder/SKILL.md`**

In `src/server/tools.ts`:
- Register `get_skill_optimization`: resolve scope (`conversationId` -> `buildConversationDetail`, else `projectPath` -> `buildProjectDetail`, else global `buildDashboardData`), optionally case-insensitively filter `pluginSkillMetrics` by `pluginOrSkill` (matching parent `name`, `id`, or child `name`), and format each matched parent with its `% of spend`, `% of active time`, `instruction` vs `execution` tokens, child breakdown lines, `targetPaths`, and `prescription`.
- Update `fmtPluginSkillLines` to format: `- [Plugin] **Superpowers**: 89% spend ($1.12 est.) · 86% active time (7m 42s) · +164k context (+164k instr / +0 exec) · 5 sub-skills/tools`.
- Update `skills/flight-recorder/SKILL.md` to document `get_skill_optimization`, parent-first time & spend reporting, and waste diagnostics.

- [ ] **Step 4: Run build and tests to verify Task 3 passes**

Run: `npm run build && npm test`
Expected: PASS

---

### Task 4: Parent-First Leaderboard Drill-Down, Optimize Action & Compaction Cliff UI

**Files:**
- Modify: `src/ui/components/PluginSkillLeaderboard.tsx`
- Modify: `src/ui/components/TokenBreakdownChart.tsx`
- Modify: `src/ui/components/ProjectOverview.tsx`
- Modify: `src/ui/components/ChatDetail.tsx`
- Modify: `src/ui/App.tsx`
- Modify: `src/ui/styles.css`
- Modify: `test/integration.test.ts`

**Interfaces:**
- Consumes: `PluginSkillMetric`, `PluginSkillChildMetric`, `ConversationSummary.topPluginsSkills`
- Produces:
  - `buildSkillOptimizationPrompt(metric: PluginSkillMetric, scopeLabel: string): string` exported from `src/ui/format.ts` (pure helper testable in Node tests!)
  - Updated `PluginSkillLeaderboard` props: `{ title?: string; subtitle?: string; metrics: PluginSkillMetric[]; showProjectsColumn?: boolean; defaultLimit?: number; scopeLabel?: string; canSendMessage?: boolean; onOptimizeSkill?: (metric: PluginSkillMetric, prompt: string) => void }`

- [ ] **Step 1: Write failing test in `test/integration.test.ts` for `buildSkillOptimizationPrompt` (including unpriced-model fallback formatting)**

Import `buildSkillOptimizationPrompt` from `../src/ui/format.js` in `test/integration.test.ts` and assert that given a `Superpowers` `PluginSkillMetric` (both with priced `$1.12` / `89%` and with `drivenCostUsd: null` / `costShare: null`), it includes the parent name, active time %, child sub-skill breakdown (`brainstorming`, `using-superpowers`), `targetPaths`, `prescription`, and produces no `"null"` or `"NaN"` substrings.

- [ ] **Step 2: Run `npm test` to verify it fails**

Run: `npm test`
Expected: FAIL (`buildSkillOptimizationPrompt` not exported from `src/ui/format.js`)

- [ ] **Step 3: Implement UI updates across `format.ts`, `PluginSkillLeaderboard.tsx`, `TokenBreakdownChart.tsx`, `ProjectOverview.tsx`, `ChatDetail.tsx`, `App.tsx`, and `styles.css`**

1. **`src/ui/format.ts`**: Export `buildSkillOptimizationPrompt(metric: PluginSkillMetric, scopeLabel: string): string` formatting a concise optimization request naming `metric.name`, `scopeLabel`, spend share (if priced), active time share, instruction vs. execution tokens, top child sub-skills/tools, `metric.targetPaths`, and `metric.prescription`.
2. **`src/ui/components/PluginSkillLeaderboard.tsx`**:
   - Add basis toggle `[Impact: Spend & Time | Context Carry]` alongside `[All | Plugins | Skills]`, plus optional `subtitle` (used by `ChatDetailView` to show `"Includes N subagent(s)"` when `detail.subagents.length > 0`).
   - Columns: `#`, `Plugin / Skill` (chevron `▸`/`▾`, `Plugin`/`Skill` badge, child count badge e.g. `5 items` when `children.length > 1`, warning badge when `warningCount > 0`), `Share of Spend` (bar + `costShare` % + `drivenCostUsd`, gracefully falling back to `timeShare` bar + `"Unpriced"` label when `costShare === null`!), `Active Time` (`drivenActiveMs` + `timeShare` %), `Context (Instr / Exec)` (`+totalTokens` + `% instr` / `% exec` breakdown), `Calls`, `Chats`/`Projects`.
   - Clicking a row toggles inline expansion (`<tr>` drawer) displaying a compact child sub-skill/tool breakdown table (`child.name`, `child.kind`, spend/time, `+instr` / `+exec`, calls, `[dup]`/`[unused]` badges), `metric.prescription` callout (if non-null), and an **`Optimize With Agent`** button (or **`Copy Optimization Prompt`** when `!canSendMessage`).
3. **`src/ui/App.tsx`, `ProjectOverview.tsx`, `ChatDetail.tsx`**:
   - Add `handleOptimizeSkill(metric, prompt)` in `App.tsx`: calls `app.sendMessage({ role: "user", content: [{ type: "text", text: prompt }] })` when `canSendMessage` is `true`, otherwise `navigator.clipboard?.writeText(prompt)` + `setStatusNotice("Copied optimization prompt to clipboard.")`. Thread through `AllProjectsView`, `ProjectDetailView`, and `ChatDetailView`.
   - In `ProjectOverview.tsx` (`ProjectDetailView` `Chats & Tasks` table), replace `c.skillsUsed` badges with `c.topPluginsSkills` (showing parent names first, with `title={c.skillsUsed.join(", ")}` tooltip).
4. **`src/ui/components/TokenBreakdownChart.tsx`**:
   - Add a compact header badge showing peak context vs. the `200k` cliff (`Peak: ${fmtK(peakContext)} (${Math.round((peakContext / 200_000) * 100)}% of 200k cliff)`).
   - When `maxVal >= 160_000`, render dashed horizontal `<line>` + `<text>` overlays at `200_000` (`var(--txt-warning)`, `"200k cliff"`) and, when `maxVal >= 220_000`, at `256_000` (`var(--txt-danger)`, `"256k compaction"`).

- [ ] **Step 4: Build server + single-file UI and run full test suite**

Run: `npm run build && npm test`
Expected: PASS (TypeScript server build, Vite UI single-file bundle build, CSP/size checks, and all unit + integration tests pass)
