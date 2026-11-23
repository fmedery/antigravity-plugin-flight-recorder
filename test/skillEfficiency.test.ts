import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  clearInstalledPluginsCache,
  computeScopeSkillEfficiency,
  discoverInstalledPlugins,
  mergePluginSkillMetrics,
  resolveToolPluginAndChild,
  type ConversationEfficiencyInput
} from "../src/server/skillEfficiency.js";
import {
  buildConversationDetail,
  buildDashboardData,
  buildProjectDetail,
  analyzeConversation
} from "../src/server/analytics.js";
import { TrackerDatabase } from "../src/server/db.js";
import { DEFAULT_PRICING_RULES } from "../src/shared/pricing.js";

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
      "---\nname: workers-best-practices\n---\nCloudflare Workers best practices for production apps. Consult https://developers.cloudflare.com/workers/ and Cloudflare docs."
    );
    fs.writeFileSync(
      path.join(cfDir, "skills", "cf-docs", "SKILL.md"),
      "---\nname: cf-docs\n---\nUse cloudflare_cloudflare MCP docs tool via call_mcp_tool."
    );

    // 4. Flight Recorder style MCP server name different from plugin id
    const frDir = path.join(tmp, "flight-recorder");
    fs.mkdirSync(path.join(frDir, "skills", "flight-recorder"), { recursive: true });
    fs.writeFileSync(
      path.join(frDir, "plugin.json"),
      JSON.stringify({ name: "flight-recorder", displayName: "Flight Recorder" })
    );
    fs.writeFileSync(
      path.join(frDir, "mcp_config.json"),
      JSON.stringify({ mcpServers: { recorder: { command: "node" } } })
    );
    fs.writeFileSync(
      path.join(frDir, "skills", "flight-recorder", "SKILL.md"),
      "---\nname: flight-recorder\n---\nUse flight-recorder_recorder tools."
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

    // MCP call resolved via mcp_config.json server key ("recorder" -> "Flight Recorder")
    const frMcpHit = resolveToolPluginAndChild(
      {
        category: "mcp",
        toolName: "list_projects",
        mcpServer: "recorder",
        skillName: null,
        skillPlugin: null,
        targetPath: null,
        argsPreview: "recorder/list_projects"
      },
      reg
    );
    assert.equal(frMcpHit?.parentId, "plugin:flight-recorder");
    assert.equal(frMcpHit?.parentName, "Flight Recorder");
    assert.equal(frMcpHit?.childKind, "MCP");
    assert.equal(frMcpHit?.footprint, "execution");

    // Lazy MCP call via call_mcp_tool extracts real tool name after "/"
    const lazyMcpHit = resolveToolPluginAndChild(
      {
        category: "mcp",
        toolName: "call_mcp_tool",
        mcpServer: "flight-recorder_recorder",
        skillName: null,
        skillPlugin: null,
        targetPath: null,
        argsPreview: "flight-recorder_recorder/get_chat_analysis"
      },
      reg
    );
    assert.equal(lazyMcpHit?.parentId, "plugin:flight-recorder");
    assert.equal(lazyMcpHit?.parentName, "Flight Recorder");
    assert.equal(lazyMcpHit?.childKind, "MCP");
    assert.equal(lazyMcpHit?.childName, "get_chat_analysis");

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

    // Standalone builtin skill resolves to Skill parent + Reference child
    const builtinHit = resolveToolPluginAndChild(
      {
        category: "skill",
        toolName: "read_file",
        mcpServer: null,
        skillName: "agy-customizations",
        skillPlugin: "builtin",
        targetPath: "/builtin/skills/agy-customizations/SKILL.md",
        argsPreview: ""
      },
      reg
    );
    assert.equal(builtinHit?.parentId, "skill:agy-customizations");
    assert.equal(builtinHit?.parentKind, "Skill");
    assert.equal(builtinHit?.childKind, "Reference");
    assert.equal(builtinHit?.childName, "SKILL.md");
    assert.equal(builtinHit?.footprint, "instruction");
  } finally {
    clearInstalledPluginsCache();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("computeScopeSkillEfficiency attributes ~90% parent-first workflow time & spend with subagent inheritance and child drill-down", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fr-eff-90-"));
  try {
    const spDir = path.join(tmp, "superpowers", "skills");
    fs.mkdirSync(path.join(spDir, "brainstorming"), { recursive: true });
    fs.mkdirSync(path.join(spDir, "subagent-driven-development"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "superpowers", "plugin.json"),
      JSON.stringify({ name: "superpowers", displayName: "Superpowers" })
    );
    fs.writeFileSync(
      path.join(spDir, "brainstorming", "SKILL.md"),
      "---\nname: brainstorming\n---\nBrainstorm first."
    );
    fs.writeFileSync(
      path.join(spDir, "subagent-driven-development", "SKILL.md"),
      "---\nname: subagent-driven-development\n---\nDispatch subagents."
    );

    clearInstalledPluginsCache();
    const reg = discoverInstalledPlugins(tmp);
    const t0 = Date.parse("2026-11-23T10:00:00Z");

    // Chat A: 50s parent + 40s spawned subagent (sequential, parent subagent wait overlapped/excluded) = 90s, 90% of $1.00
    // Using gemini-2.5-pro ($1.25/1M in, $10/1M out):
    // Chat A Step 1: 40k out = $0.40 (20s) -> reads brainstorming
    // Chat A Step 2: 10k out = $0.10 (30s) -> reads subagent-driven-development + invokes sub-1
    // Subagent A1 Step 1: 40k out = $0.40 (40s) -> executes implementation
    // Chat B (unassisted): 10k out = $0.10 (10s) -> plain edit_file
    const convs: ConversationEfficiencyInput[] = [
      {
        conversationId: "chat-a",
        parentConversationId: null,
        activeMs: 50_000,
        hasTokenTelemetry: true,
        filesTouched: [],
        plannerSteps: [
          {
            stepIndex: 1,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: t0,
            completedAtMs: t0 + 18_000,
            modelDurationMs: 18_000,
            inputTokens: 0,
            cacheReadTokens: 0,
            outputTokens: 40_000,
            totalContextTokens: 10_000,
            cacheHitRatio: 0,
            isCacheMiss: false,
            cacheMissCause: null,
            thinkingChars: 500,
            contentChars: 200,
            toolCallCount: 1,
            status: "DONE",
            attributedSummary: ""
          },
          {
            stepIndex: 3,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: t0 + 20_000,
            completedAtMs: t0 + 48_000,
            modelDurationMs: 28_000,
            inputTokens: 0,
            cacheReadTokens: 0,
            outputTokens: 10_000,
            totalContextTokens: 20_000,
            cacheHitRatio: 0,
            isCacheMiss: false,
            cacheMissCause: null,
            thinkingChars: 400,
            contentChars: 200,
            toolCallCount: 2,
            status: "DONE",
            attributedSummary: ""
          }
        ],
        toolCalls: [
          {
            id: 1,
            stepIndex: 2,
            plannerStepIndex: 1,
            turnIndex: 0,
            toolCallId: "tc1",
            toolName: "read_file",
            category: "skill",
            mcpServer: null,
            skillName: "brainstorming",
            skillPlugin: "superpowers",
            targetPath: path.join(spDir, "brainstorming", "SKILL.md"),
            childConversationId: null,
            startedAtMs: t0 + 18_000,
            completedAtMs: t0 + 20_000,
            durationMs: 2_000,
            argsPreview: "",
            resultBytes: 4000,
            estResultTokens: 1000,
            attributedInputTokens: 2_000,
            compoundedCacheTokens: 8_000,
            isError: false,
            errorPreview: null
          },
          {
            id: 2,
            stepIndex: 4,
            plannerStepIndex: 3,
            turnIndex: 0,
            toolCallId: "tc2",
            toolName: "read_file",
            category: "skill",
            mcpServer: null,
            skillName: "subagent-driven-development",
            skillPlugin: "superpowers",
            targetPath: path.join(spDir, "subagent-driven-development", "SKILL.md"),
            childConversationId: null,
            startedAtMs: t0 + 48_000,
            completedAtMs: t0 + 50_000,
            durationMs: 2_000,
            argsPreview: "",
            resultBytes: 4000,
            estResultTokens: 1000,
            attributedInputTokens: 3_000,
            compoundedCacheTokens: 6_000,
            isError: false,
            errorPreview: null
          },
          {
            id: 3,
            stepIndex: 5,
            plannerStepIndex: 3,
            turnIndex: 0,
            toolCallId: "tc3",
            toolName: "invoke_subagent",
            category: "subagent",
            mcpServer: null,
            skillName: null,
            skillPlugin: null,
            targetPath: null,
            childConversationId: "sub-a1",
            // Parent synchronous wait spanning sub-a1's [50s..90s] must NOT double count!
            startedAtMs: t0 + 50_000,
            completedAtMs: t0 + 90_000,
            durationMs: 40_000,
            argsPreview: "Type: self | Role: Implementer",
            resultBytes: 500,
            estResultTokens: 125,
            attributedInputTokens: 200,
            compoundedCacheTokens: 0,
            isError: false,
            errorPreview: null
          }
        ]
      },
      {
        conversationId: "sub-a1",
        parentConversationId: "chat-a",
        activeMs: 40_000,
        hasTokenTelemetry: true,
        filesTouched: [],
        plannerSteps: [
          {
            stepIndex: 1,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: t0 + 50_000,
            completedAtMs: t0 + 90_000,
            modelDurationMs: 40_000,
            inputTokens: 0,
            cacheReadTokens: 0,
            outputTokens: 40_000,
            totalContextTokens: 8_000,
            cacheHitRatio: 0,
            isCacheMiss: false,
            cacheMissCause: null,
            thinkingChars: 600,
            contentChars: 300,
            toolCallCount: 0,
            status: "DONE",
            attributedSummary: ""
          }
        ],
        toolCalls: []
      },
      {
        conversationId: "chat-b",
        parentConversationId: null,
        activeMs: 10_000,
        hasTokenTelemetry: true,
        filesTouched: [],
        plannerSteps: [
          {
            stepIndex: 1,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: t0 + 100_000,
            completedAtMs: t0 + 110_000,
            modelDurationMs: 10_000,
            inputTokens: 0,
            cacheReadTokens: 0,
            outputTokens: 10_000,
            totalContextTokens: 5_000,
            cacheHitRatio: 0,
            isCacheMiss: false,
            cacheMissCause: null,
            thinkingChars: 100,
            contentChars: 100,
            toolCallCount: 0,
            status: "DONE",
            attributedSummary: ""
          }
        ],
        toolCalls: []
      }
    ];

    const res = computeScopeSkillEfficiency(convs, DEFAULT_PRICING_RULES, {
      registry: reg
    });

    assert.equal(res.pluginSkillMetrics.length, 1);
    const sp = res.pluginSkillMetrics[0];
    assert.equal(sp.name, "Superpowers");
    assert.equal(sp.kind, "Plugin");
    assert.equal(Math.round(sp.timeShare * 100), 90);
    assert.equal(Math.round((sp.costShare ?? 0) * 100), 90);
    assert.ok(sp.timeShare <= 1);
    assert.ok((sp.costShare ?? 0) <= 1);
    assert.equal(sp.instructionTokens, 19_000);
    assert.equal(sp.executionTokens, 0);
    assert.equal(sp.children.length, 2);
    assert.deepEqual(
      sp.children.map((c) => c.name),
      ["subagent-driven-development", "brainstorming"]
    );
    assert.deepEqual(res.topPluginsByConv.get("chat-a"), ["Superpowers"]);
    assert.deepEqual(res.topPluginsByConv.get("chat-b"), []);
  } finally {
    clearInstalledPluginsCache();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("unused tool-skill load (Gmail) does not hijack downstream steps, while duplicate SKILL.md read is flagged", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fr-eff-unused-"));
  try {
    const gmScripts = path.join(tmp, "gmail", "skills", "gmail", "scripts");
    fs.mkdirSync(gmScripts, { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "gmail", "plugin.json"),
      JSON.stringify({ name: "gmail", displayName: "Gmail" })
    );
    const gmSkillMd = path.join(tmp, "gmail", "skills", "gmail", "SKILL.md");
    fs.writeFileSync(gmSkillMd, "---\nname: gmail\n---\nRun gmail.");
    fs.writeFileSync(path.join(gmScripts, "gmail"), "bin");

    const spDir = path.join(tmp, "superpowers", "skills", "using-superpowers");
    fs.mkdirSync(spDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "superpowers", "plugin.json"),
      JSON.stringify({ name: "superpowers", displayName: "Superpowers" })
    );
    const spSkillMd = path.join(spDir, "SKILL.md");
    fs.writeFileSync(spSkillMd, "---\nname: using-superpowers\n---\nCheck skills.");

    clearInstalledPluginsCache();
    const reg = discoverInstalledPlugins(tmp);
    const t0 = Date.parse("2026-11-23T11:00:00Z");

    const convs: ConversationEfficiencyInput[] = [
      {
        conversationId: "c-unused",
        parentConversationId: null,
        activeMs: 100_000,
        hasTokenTelemetry: true,
        filesTouched: [],
        plannerSteps: [
          // S1 (5s): reads Gmail SKILL.md by mistake
          {
            stepIndex: 1,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: t0,
            completedAtMs: t0 + 4_000,
            modelDurationMs: 4_000,
            inputTokens: 2_000,
            cacheReadTokens: 0,
            outputTokens: 1_000,
            totalContextTokens: 2_000,
            cacheHitRatio: 0,
            isCacheMiss: false,
            cacheMissCause: null,
            thinkingChars: 100,
            contentChars: 50,
            toolCallCount: 1,
            status: "DONE",
            attributedSummary: ""
          },
          // S3 (5s): ingests Gmail SKILL.md, decides not to use it
          {
            stepIndex: 3,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: t0 + 5_000,
            completedAtMs: t0 + 10_000,
            modelDurationMs: 5_000,
            inputTokens: 1_000,
            cacheReadTokens: 2_000,
            outputTokens: 1_000,
            totalContextTokens: 3_000,
            cacheHitRatio: 0.66,
            isCacheMiss: false,
            cacheMissCause: null,
            thinkingChars: 100,
            contentChars: 50,
            toolCallCount: 0,
            status: "DONE",
            attributedSummary: ""
          },
          // S4 (90s): long unassisted coding turn — Gmail MUST NOT claim this!
          {
            stepIndex: 4,
            turnIndex: 1,
            model: "gemini-2.5-pro",
            createdAtMs: t0 + 10_000,
            completedAtMs: t0 + 98_000,
            modelDurationMs: 88_000,
            inputTokens: 5_000,
            cacheReadTokens: 3_000,
            outputTokens: 20_000,
            totalContextTokens: 8_000,
            cacheHitRatio: 0.375,
            isCacheMiss: false,
            cacheMissCause: null,
            thinkingChars: 500,
            contentChars: 500,
            toolCallCount: 2,
            status: "DONE",
            attributedSummary: ""
          }
        ],
        toolCalls: [
          {
            id: 1,
            stepIndex: 2,
            plannerStepIndex: 1,
            turnIndex: 0,
            toolCallId: "g1",
            toolName: "read_file",
            category: "skill",
            mcpServer: null,
            skillName: "gmail",
            skillPlugin: "gmail",
            targetPath: gmSkillMd,
            childConversationId: null,
            startedAtMs: t0 + 4_000,
            completedAtMs: t0 + 5_000,
            durationMs: 1_000,
            argsPreview: "",
            resultBytes: 2000,
            estResultTokens: 500,
            attributedInputTokens: 1_000,
            compoundedCacheTokens: 2_000,
            isError: false,
            errorPreview: null
          },
          // Duplicate read of using-superpowers twice in step 4
          {
            id: 2,
            stepIndex: 5,
            plannerStepIndex: 4,
            turnIndex: 1,
            toolCallId: "s1",
            toolName: "read_file",
            category: "skill",
            mcpServer: null,
            skillName: "using-superpowers",
            skillPlugin: "superpowers",
            targetPath: spSkillMd,
            childConversationId: null,
            startedAtMs: t0 + 98_000,
            completedAtMs: t0 + 99_000,
            durationMs: 1_000,
            argsPreview: "",
            resultBytes: 1000,
            estResultTokens: 250,
            attributedInputTokens: 500,
            compoundedCacheTokens: 500,
            isError: false,
            errorPreview: null
          },
          {
            id: 3,
            stepIndex: 6,
            plannerStepIndex: 4,
            turnIndex: 1,
            toolCallId: "s2",
            toolName: "read_file",
            category: "skill",
            mcpServer: null,
            skillName: "using-superpowers",
            skillPlugin: "superpowers",
            targetPath: spSkillMd,
            childConversationId: null,
            startedAtMs: t0 + 99_000,
            completedAtMs: t0 + 100_000,
            durationMs: 1_000,
            argsPreview: "",
            resultBytes: 1000,
            estResultTokens: 250,
            attributedInputTokens: 500,
            compoundedCacheTokens: 500,
            isError: false,
            errorPreview: null
          }
        ]
      }
    ];

    const res = computeScopeSkillEfficiency(convs, DEFAULT_PRICING_RULES, {
      registry: reg
    });

    const gm = res.pluginSkillMetrics.find((m) => m.name === "Gmail");
    assert.ok(gm);
    assert.equal(gm.children[0].isUnusedLoad, true);
    // Gmail only gets S1+S3 (~10s = 10%), NOT the 90s coding step S4!
    assert.ok(gm.timeShare <= 0.12, `Expected Gmail timeShare <= 0.12, got ${gm.timeShare}`);

    const sp = res.pluginSkillMetrics.find((m) => m.name === "Superpowers");
    assert.ok(sp);
    assert.equal(sp.children[0].isUnusedLoad, false);
    assert.equal(sp.children[0].duplicateReads, 1);

    const diags = res.diagnosticsByConv.get("c-unused") ?? [];
    const unusedDiags = diags.filter((d) => d.category === "unused_skill");
    assert.equal(unusedDiags.length, 2); // 1 unused Gmail + 1 duplicate Superpowers read
    assert.ok(unusedDiags.some((d) => d.title.includes("Gmail")));
    assert.ok(unusedDiags.some((d) => d.title.includes("Superpowers")));
  } finally {
    clearInstalledPluginsCache();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("TTL cache miss preserves guiding workflow, compaction reset clears it, and unpriced/legacy/cyclic edge cases stay safe", () => {
  const t0 = Date.parse("2026-11-23T12:00:00Z");

  // 1. TTL miss vs Compaction reset
  const ttlVsCompact: ConversationEfficiencyInput[] = [
    {
      conversationId: "c-cache",
      parentConversationId: null,
      activeMs: 30_000,
      hasTokenTelemetry: true,
      filesTouched: [],
      plannerSteps: [
        {
          stepIndex: 1,
          turnIndex: 0,
          model: "Gemini 4 Carbon (High)", // Unpriced model!
          createdAtMs: t0,
          completedAtMs: t0 + 9_000,
          modelDurationMs: 9_000,
          inputTokens: 5_000,
          cacheReadTokens: 0,
          outputTokens: 1_000,
          totalContextTokens: 5_000,
          cacheHitRatio: 0,
          isCacheMiss: false,
          cacheMissCause: null,
          thinkingChars: 100,
          contentChars: 100,
          toolCallCount: 1,
          status: "DONE",
          attributedSummary: ""
        },
        // Step 3: Idle TTL cache miss — skill text is still in prefix, so Superpowers stays active!
        {
          stepIndex: 3,
          turnIndex: 1,
          model: "Gemini 4 Carbon (High)",
          createdAtMs: t0 + 400_000,
          completedAtMs: t0 + 410_000,
          modelDurationMs: 10_000,
          inputTokens: 8_000,
          cacheReadTokens: 0,
          outputTokens: 1_000,
          totalContextTokens: 8_000,
          cacheHitRatio: 0,
          isCacheMiss: true,
          cacheMissCause: "Idle gap expired prompt cache TTL",
          thinkingChars: 100,
          contentChars: 100,
          toolCallCount: 0,
          status: "DONE",
          attributedSummary: ""
        },
        // Step 4: Context compaction reset — clears guiding skill!
        {
          stepIndex: 4,
          turnIndex: 2,
          model: "Gemini 4 Carbon (High)",
          createdAtMs: t0 + 420_000,
          completedAtMs: t0 + 430_000,
          modelDurationMs: 10_000,
          inputTokens: 3_000,
          cacheReadTokens: 0,
          outputTokens: 1_000,
          totalContextTokens: 3_000,
          cacheHitRatio: 0,
          isCacheMiss: true,
          cacheMissCause: "Context compaction or prefix reset",
          thinkingChars: 100,
          contentChars: 100,
          toolCallCount: 0,
          status: "DONE",
          attributedSummary: ""
        }
      ],
      toolCalls: [
        {
          id: 1,
          stepIndex: 2,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: "sp1",
          toolName: "read_file",
          category: "skill",
          mcpServer: null,
          skillName: "brainstorming",
          skillPlugin: "superpowers",
          targetPath: "/p/plugins/superpowers/skills/brainstorming/SKILL.md",
          childConversationId: null,
          startedAtMs: t0 + 9_000,
          completedAtMs: t0 + 10_000,
          durationMs: 1_000,
          argsPreview: "",
          resultBytes: 1000,
          estResultTokens: 250,
          attributedInputTokens: 1_000,
          compoundedCacheTokens: 0,
          isError: false,
          errorPreview: null
        }
      ]
    },
    // Cyclic & legacy 0-token subagents must never throw or produce NaN
    {
      conversationId: "cyc-1",
      parentConversationId: "cyc-2",
      activeMs: 5_000,
      hasTokenTelemetry: false,
      filesTouched: [],
      plannerSteps: [],
      toolCalls: []
    },
    {
      conversationId: "cyc-2",
      parentConversationId: "cyc-1",
      activeMs: 5_000,
      hasTokenTelemetry: false,
      filesTouched: [],
      plannerSteps: [],
      toolCalls: []
    }
  ];

  const res = computeScopeSkillEfficiency(ttlVsCompact, DEFAULT_PRICING_RULES);
  assert.equal(res.pluginSkillMetrics.length, 1);
  const sp = res.pluginSkillMetrics[0];
  // Unpriced model: drivenCostUsd and costShare stay null, never NaN or 0
  assert.equal(sp.drivenCostUsd, null);
  assert.equal(sp.costShare, null);
  // Step 1+tool (10s) + Step 3 TTL miss (10s) = 20s attributed; Step 4 compaction (10s) cleared!
  assert.equal(sp.drivenActiveMs, 20_000);
  assert.ok(!Number.isNaN(sp.tokenShare));
});

test("live diagnostics emit high_skill_overhead, tool_thrash, subagent_candidate, compaction_cliff, and parent-first token_driver", () => {
  const t0 = Date.parse("2026-11-23T13:00:00Z");
  const exploreTools = Array.from({ length: 6 }, (_, i) => ({
    id: 10 + i,
    stepIndex: 10 + i,
    plannerStepIndex: 2,
    turnIndex: 0,
    toolCallId: `ex-${i}`,
    toolName: i % 2 === 0 ? "read_file" : "grep_search",
    category: (i % 2 === 0 ? "file_read" : "search") as "file_read" | "search",
    mcpServer: null,
    skillName: null,
    skillPlugin: null,
    targetPath: `/proj/src/mod${i}.ts`,
    childConversationId: null,
    startedAtMs: t0 + 10_000 + i * 1000,
    completedAtMs: t0 + 10_500 + i * 1000,
    durationMs: 500,
    argsPreview: `/proj/src/mod${i}.ts`,
    resultBytes: 8000,
    estResultTokens: 2000,
    attributedInputTokens: 2_000,
    compoundedCacheTokens: 6_000, // 6 * 6k = 36k carry >= 25k!
    isError: false,
    errorPreview: null
  }));

  const convs: ConversationEfficiencyInput[] = [
    {
      conversationId: "c-diag",
      parentConversationId: null,
      activeMs: 45_000,
      hasTokenTelemetry: true,
      filesTouched: [],
      plannerSteps: [
        {
          stepIndex: 1,
          turnIndex: 0,
          model: "gemini-2.5-pro",
          createdAtMs: t0,
          completedAtMs: t0 + 5_000,
          modelDurationMs: 5_000,
          inputTokens: 20_000,
          cacheReadTokens: 190_000,
          outputTokens: 500,
          totalContextTokens: 210_000, // > 200k warning cliff!
          cacheHitRatio: 0.9,
          isCacheMiss: false,
          cacheMissCause: null,
          thinkingChars: 100,
          contentChars: 100,
          toolCallCount: 1,
          status: "DONE",
          attributedSummary: ""
        },
        {
          stepIndex: 2,
          turnIndex: 0,
          model: "gemini-2.5-pro",
          createdAtMs: t0 + 8_000,
          completedAtMs: t0 + 10_000,
          modelDurationMs: 2_000,
          inputTokens: 50_000,
          cacheReadTokens: 210_000,
          outputTokens: 500,
          totalContextTokens: 260_000, // > 256k critical compaction ceiling!
          cacheHitRatio: 0.8,
          isCacheMiss: false,
          cacheMissCause: null,
          thinkingChars: 100,
          contentChars: 100,
          toolCallCount: 8,
          status: "DONE",
          attributedSummary: ""
        }
      ],
      toolCalls: [
        // Heavy instruction skill read (30k total >= 25k, 100% instruction)
        {
          id: 1,
          stepIndex: 2,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: "sk1",
          toolName: "read_file",
          category: "skill",
          mcpServer: null,
          skillName: "brainstorming",
          skillPlugin: "superpowers",
          targetPath: "/p/plugins/superpowers/skills/brainstorming/SKILL.md",
          childConversationId: null,
          startedAtMs: t0 + 5_000,
          completedAtMs: t0 + 6_000,
          durationMs: 1_000,
          argsPreview: "",
          resultBytes: 16000,
          estResultTokens: 4000,
          attributedInputTokens: 5_000,
          compoundedCacheTokens: 25_000,
          isError: false,
          errorPreview: null
        },
        // 2 consecutive failed edit_file calls -> tool_thrash
        {
          id: 2,
          stepIndex: 3,
          plannerStepIndex: 2,
          turnIndex: 0,
          toolCallId: "ed1",
          toolName: "edit_file",
          category: "file_write",
          mcpServer: null,
          skillName: null,
          skillPlugin: null,
          targetPath: "/proj/src/broken.ts",
          childConversationId: null,
          startedAtMs: t0 + 20_000,
          completedAtMs: t0 + 21_000,
          durationMs: 1_000,
          argsPreview: "/proj/src/broken.ts",
          resultBytes: 200,
          estResultTokens: 50,
          attributedInputTokens: 500,
          compoundedCacheTokens: 1_000,
          isError: true,
          errorPreview: "Target string not found"
        },
        {
          id: 3,
          stepIndex: 4,
          plannerStepIndex: 2,
          turnIndex: 0,
          toolCallId: "ed2",
          toolName: "edit_file",
          category: "file_write",
          mcpServer: null,
          skillName: null,
          skillPlugin: null,
          targetPath: "/proj/src/broken.ts",
          childConversationId: null,
          startedAtMs: t0 + 21_000,
          completedAtMs: t0 + 22_000,
          durationMs: 1_000,
          argsPreview: "/proj/src/broken.ts",
          resultBytes: 200,
          estResultTokens: 50,
          attributedInputTokens: 500,
          compoundedCacheTokens: 1_000,
          isError: true,
          errorPreview: "Target string not found"
        },
        ...exploreTools
      ]
    }
  ];

  // Note: turn 0 had 2 failed file_writes, so let's put exploreTools in turn 1 (0 file_writes) to test subagent_candidate cleanly!
  for (const et of exploreTools) {
    et.turnIndex = 1;
  }

  const res = computeScopeSkillEfficiency(convs, DEFAULT_PRICING_RULES);
  const diags = res.diagnosticsByConv.get("c-diag") ?? [];
  const categories = new Set(diags.map((d) => d.category));

  assert.ok(categories.has("high_skill_overhead"), "Expected high_skill_overhead");
  assert.ok(categories.has("tool_thrash"), "Expected tool_thrash");
  assert.ok(categories.has("subagent_candidate"), "Expected subagent_candidate");
  assert.ok(categories.has("compaction_cliff"), "Expected compaction_cliff");

  const cliffs = diags.filter((d) => d.category === "compaction_cliff");
  assert.ok(cliffs.some((c) => c.severity === "critical"));

  const driver = diags.find(
    (d) => d.category === "token_driver" && d.title.includes("brainstorming")
  );
  assert.ok(
    driver?.title.toLowerCase().includes("superpowers"),
    `Expected parent-first token_driver title, got: ${driver?.title}`
  );
  assert.ok(res.pluginSkillMetrics[0].prescription !== null);
});

test("interleaved tool_thrash in one turn emits warning without duplicating consecutive streaks", () => {
  const t0 = Date.parse("2026-11-23T14:00:00Z");
  const convs: ConversationEfficiencyInput[] = [
    {
      conversationId: "c-interleaved-thrash",
      parentConversationId: null,
      activeMs: 20_000,
      hasTokenTelemetry: true,
      filesTouched: [],
      plannerSteps: [
        {
          stepIndex: 1,
          turnIndex: 0,
          model: "gemini-2.5-pro",
          createdAtMs: t0,
          completedAtMs: t0 + 10_000,
          modelDurationMs: 10_000,
          inputTokens: 4_000,
          cacheReadTokens: 2_000,
          outputTokens: 500,
          totalContextTokens: 6_000,
          cacheHitRatio: 0.33,
          isCacheMiss: false,
          cacheMissCause: null,
          thinkingChars: 100,
          contentChars: 100,
          toolCallCount: 4,
          status: "DONE",
          attributedSummary: ""
        },
        {
          stepIndex: 6,
          turnIndex: 1,
          model: "gemini-2.5-pro",
          createdAtMs: t0 + 10_000,
          completedAtMs: t0 + 20_000,
          modelDurationMs: 10_000,
          inputTokens: 4_000,
          cacheReadTokens: 4_000,
          outputTokens: 500,
          totalContextTokens: 8_000,
          cacheHitRatio: 0.5,
          isCacheMiss: false,
          cacheMissCause: null,
          thinkingChars: 100,
          contentChars: 100,
          toolCallCount: 3,
          status: "DONE",
          attributedSummary: ""
        }
      ],
      toolCalls: [
        // Turn 0: edit_file error -> read_file -> edit_file error -> edit_file ok (3 edit_file calls on /proj/src/app.ts, 2 errors, non-consecutive!)
        {
          id: 1,
          stepIndex: 2,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: "e1",
          toolName: "edit_file",
          category: "file_write",
          mcpServer: null,
          skillName: null,
          skillPlugin: null,
          targetPath: "/proj/src/app.ts",
          childConversationId: null,
          startedAtMs: t0 + 1_000,
          completedAtMs: t0 + 2_000,
          durationMs: 1_000,
          argsPreview: "/proj/src/app.ts",
          resultBytes: 120,
          estResultTokens: 30,
          attributedInputTokens: 400,
          compoundedCacheTokens: 800,
          isError: true,
          errorPreview: "Target string not found"
        },
        {
          id: 2,
          stepIndex: 3,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: "r1",
          toolName: "read_file",
          category: "file_read",
          mcpServer: null,
          skillName: null,
          skillPlugin: null,
          targetPath: "/proj/src/app.ts",
          childConversationId: null,
          startedAtMs: t0 + 2_000,
          completedAtMs: t0 + 3_000,
          durationMs: 1_000,
          argsPreview: "/proj/src/app.ts",
          resultBytes: 1200,
          estResultTokens: 300,
          attributedInputTokens: 600,
          compoundedCacheTokens: 1_200,
          isError: false,
          errorPreview: null
        },
        {
          id: 3,
          stepIndex: 4,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: "e2",
          toolName: "edit_file",
          category: "file_write",
          mcpServer: null,
          skillName: null,
          skillPlugin: null,
          targetPath: "/proj/src/app.ts",
          childConversationId: null,
          startedAtMs: t0 + 3_000,
          completedAtMs: t0 + 4_000,
          durationMs: 1_000,
          argsPreview: "/proj/src/app.ts",
          resultBytes: 120,
          estResultTokens: 30,
          attributedInputTokens: 400,
          compoundedCacheTokens: 800,
          isError: true,
          errorPreview: "Whitespace mismatch"
        },
        {
          id: 4,
          stepIndex: 5,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: "e3",
          toolName: "edit_file",
          category: "file_write",
          mcpServer: null,
          skillName: null,
          skillPlugin: null,
          targetPath: "/proj/src/app.ts",
          childConversationId: null,
          startedAtMs: t0 + 4_000,
          completedAtMs: t0 + 5_000,
          durationMs: 1_000,
          argsPreview: "/proj/src/app.ts",
          resultBytes: 80,
          estResultTokens: 20,
          attributedInputTokens: 200,
          compoundedCacheTokens: 400,
          isError: false,
          errorPreview: null
        },
        // Turn 1: 3 consecutive run_command errors on same command -> must emit ONLY 1 tool_thrash finding for Turn 1
        ...[0, 1, 2].map((k) => ({
          id: 10 + k,
          stepIndex: 7 + k,
          plannerStepIndex: 6,
          turnIndex: 1,
          toolCallId: `c${k}`,
          toolName: "run_command",
          category: "command" as const,
          mcpServer: null,
          skillName: null,
          skillPlugin: null,
          targetPath: null,
          childConversationId: null,
          startedAtMs: t0 + 11_000 + k * 1000,
          completedAtMs: t0 + 12_000 + k * 1000,
          durationMs: 1_000,
          argsPreview: "npm test",
          resultBytes: 200,
          estResultTokens: 50,
          attributedInputTokens: 300,
          compoundedCacheTokens: 600,
          isError: true,
          errorPreview: "Exit code 1"
        }))
      ]
    }
  ];

  const res = computeScopeSkillEfficiency(convs, DEFAULT_PRICING_RULES);
  const thrash = (res.diagnosticsByConv.get("c-interleaved-thrash") ?? []).filter(
    (d) => d.category === "tool_thrash"
  );
  const turn0Thrash = thrash.filter((d) => d.turnIndex === 0);
  const turn1Thrash = thrash.filter((d) => d.turnIndex === 1);
  assert.equal(turn0Thrash.length, 1, "Expected interleaved Turn 0 retries to emit 1 tool_thrash");
  assert.match(turn0Thrash[0].title, /edit_file/);
  assert.equal(turn1Thrash.length, 1, "Expected consecutive Turn 1 streak not to duplicate tool_thrash");
});

test("multi-hop subagents (root -> sub1 -> sub2) include grandchild in buildConversationDetail and count as 1 root chat", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fr-eff-multihop-"));
  const db = new TrackerDatabase(tmp);
  try {
    const t0 = Date.parse("2026-11-23T15:00:00Z");

    const rootParsed = analyzeConversation(
      {
        conversationId: "root-mh",
        transcriptPath: "/tmp/root-mh.jsonl",
        title: "Build Multi-Hop Feature",
        hasTokenTelemetry: true,
        startedAtMs: t0,
        endedAtMs: t0 + 50_000,
        models: ["gemini-2.5-pro"],
        slashCommands: [],
        candidatePaths: ["/proj/mh/index.ts"],
        turns: [
          {
            turnIndex: 0,
            stepIndex: 0,
            createdAtMs: t0,
            promptText: "Build it",
            promptPreview: "Build it",
            promptBytes: 8,
            slashCommand: null
          }
        ],
        plannerSteps: [
          {
            stepIndex: 1,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: t0,
            thinkingChars: 100,
            contentChars: 100,
            inputTokens: 0,
            cacheReadTokens: 0,
            outputTokens: 10_000, // $0.10
            totalContextTokens: 0,
            toolCallCount: 2,
            status: "DONE"
          }
        ],
        toolCalls: [
          {
            stepIndex: 2,
            plannerStepIndex: 1,
            turnIndex: 0,
            toolCallId: "sk",
            toolName: "read_file",
            category: "skill",
            mcpServer: null,
            skillName: "subagent-driven-development",
            skillPlugin: "superpowers",
            targetPath: "/Users/dev/.gemini/config/plugins/superpowers/skills/subagent-driven-development/SKILL.md",
            childConversationId: null,
            startedAtMs: t0 + 9_000,
            completedAtMs: t0 + 10_000,
            durationMs: 1_000,
            argsPreview: "",
            commandPathHints: [],
            resultBytes: 2000,
            estResultTokens: 500,
            isError: false,
            errorPreview: null
          },
          {
            stepIndex: 3,
            plannerStepIndex: 1,
            turnIndex: 0,
            toolCallId: "sub1",
            toolName: "invoke_subagent",
            category: "subagent",
            mcpServer: null,
            skillName: null,
            skillPlugin: null,
            targetPath: null,
            childConversationId: "sub-1",
            startedAtMs: t0 + 10_000,
            completedAtMs: t0 + 50_000,
            durationMs: 40_000,
            argsPreview: "Type: self | Role: Implementer",
            commandPathHints: [],
            resultBytes: 200,
            estResultTokens: 50,
            isError: false,
            errorPreview: null
          }
        ]
      },
      [],
      {
        surface: "antigravity",
        projectPath: "/proj/mh",
        projectSource: "inferred",
        parentConversationId: null,
        subagentRole: null,
        subagentType: null
      }
    );

    const sub1Parsed = analyzeConversation(
      {
        conversationId: "sub-1",
        transcriptPath: "/tmp/sub-1.jsonl",
        title: "Implementer",
        hasTokenTelemetry: true,
        startedAtMs: t0 + 10_000,
        endedAtMs: t0 + 50_000,
        models: ["gemini-2.5-pro"],
        slashCommands: [],
        candidatePaths: [],
        turns: [
          {
            turnIndex: 0,
            stepIndex: 0,
            createdAtMs: t0 + 10_000,
            promptText: "Implement task",
            promptPreview: "Implement task",
            promptBytes: 14,
            slashCommand: null
          }
        ],
        plannerSteps: [
          {
            stepIndex: 1,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: t0 + 10_000,
            thinkingChars: 100,
            contentChars: 100,
            inputTokens: 0,
            cacheReadTokens: 0,
            outputTokens: 20_000, // $0.20
            totalContextTokens: 0,
            toolCallCount: 1,
            status: "DONE"
          }
        ],
        toolCalls: [
          {
            stepIndex: 2,
            plannerStepIndex: 1,
            turnIndex: 0,
            toolCallId: "sub2",
            toolName: "invoke_subagent",
            category: "subagent",
            mcpServer: null,
            skillName: null,
            skillPlugin: null,
            targetPath: null,
            childConversationId: "sub-2",
            startedAtMs: t0 + 25_000,
            completedAtMs: t0 + 50_000,
            durationMs: 25_000,
            argsPreview: "Type: research | Role: Deep Helper",
            commandPathHints: [],
            resultBytes: 200,
            estResultTokens: 50,
            isError: false,
            errorPreview: null
          }
        ]
      },
      [],
      {
        surface: "antigravity",
        projectPath: "/proj/mh",
        projectSource: "parent",
        parentConversationId: "root-mh",
        subagentRole: "Implementer",
        subagentType: "self"
      }
    );

    const sub2Parsed = analyzeConversation(
      {
        conversationId: "sub-2",
        transcriptPath: "/tmp/sub-2.jsonl",
        title: "Deep Helper",
        hasTokenTelemetry: true,
        startedAtMs: t0 + 25_000,
        endedAtMs: t0 + 50_000,
        models: ["gemini-2.5-pro"],
        slashCommands: [],
        candidatePaths: [],
        turns: [
          {
            turnIndex: 0,
            stepIndex: 0,
            createdAtMs: t0 + 25_000,
            promptText: "Help",
            promptPreview: "Help",
            promptBytes: 4,
            slashCommand: null
          }
        ],
        plannerSteps: [
          {
            stepIndex: 1,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: t0 + 25_000,
            thinkingChars: 100,
            contentChars: 100,
            inputTokens: 0,
            cacheReadTokens: 0,
            outputTokens: 30_000, // $0.30
            totalContextTokens: 0,
            toolCallCount: 0,
            status: "DONE"
          }
        ],
        toolCalls: [
          {
            stepIndex: 2,
            plannerStepIndex: 1,
            turnIndex: 0,
            toolCallId: "rd",
            toolName: "read_file",
            category: "file_read",
            mcpServer: null,
            skillName: null,
            skillPlugin: null,
            targetPath: "/proj/mh/index.ts",
            childConversationId: null,
            startedAtMs: t0 + 30_000,
            completedAtMs: t0 + 50_000,
            durationMs: 20_000,
            argsPreview: "/proj/mh/index.ts",
            commandPathHints: [],
            resultBytes: 800,
            estResultTokens: 200,
            isError: false,
            errorPreview: null
          }
        ]
      },
      [],
      {
        surface: "antigravity",
        projectPath: "/proj/mh",
        projectSource: "parent",
        parentConversationId: "sub-1",
        subagentRole: "Deep Helper",
        subagentType: "research"
      }
    );

    db.upsertConversation(rootParsed);
    db.upsertConversation(sub1Parsed);
    db.upsertConversation(sub2Parsed);

    const detail = buildConversationDetail(db, "root-mh");
    assert.ok(detail);
    assert.equal(detail.subagents.length, 2, "Expected both sub-1 and grandchild sub-2 in detail.subagents");
    assert.equal(detail.pluginSkillMetrics.length, 1);
    const sp = detail.pluginSkillMetrics[0];
    assert.equal(sp.chatCount, 1, "Subagents must roll up to 1 root chat in chatCount");
    // $0.10 (root) + $0.20 (sub-1) + $0.30 (sub-2) = $0.60 total driven spend
    assert.ok(
      sp.drivenCostUsd !== null && Math.abs(sp.drivenCostUsd - 0.6) < 0.02,
      `Expected grandchild sub-2 spend included (~$0.60), got ${sp.drivenCostUsd}`
    );
    assert.equal(sp.drivenActiveMs, 50_000);

    const projDetail = buildProjectDetail(db, "/proj/mh");
    assert.ok(projDetail);
    assert.equal(projDetail.pluginSkillMetrics[0].chatCount, 1);
  } finally {
    db.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("computeScopeSkillEfficiency and mergePluginSkillMetrics capture, deduplicate, and cap errorSamples on children and parents", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fr-eff-err-"));
  try {
    const pluginsRoot = path.join(tmp, ".gemini", "config", "plugins");
    const spSkill = path.join(pluginsRoot, "superpowers", "skills", "test-driven-development");
    const spExecScripts = path.join(pluginsRoot, "superpowers", "skills", "executing-plans", "scripts");
    fs.mkdirSync(spSkill, { recursive: true });
    fs.mkdirSync(spExecScripts, { recursive: true });
    fs.writeFileSync(
      path.join(pluginsRoot, "superpowers", "plugin.json"),
      JSON.stringify({ name: "superpowers", displayName: "Superpowers" })
    );
    fs.writeFileSync(
      path.join(spSkill, "SKILL.md"),
      "---\nname: test-driven-development\n---\nTDD."
    );
    fs.writeFileSync(path.join(spExecScripts, "task-start"), "#!/bin/sh\n");

    clearInstalledPluginsCache();
    const reg = discoverInstalledPlugins(pluginsRoot);
    const t0 = Date.parse("2026-11-23T14:00:00Z");

    const makeErrTool = (
      id: number,
      stepIndex: number,
      overrides: Partial<ConversationEfficiencyInput["toolCalls"][number]>
    ): ConversationEfficiencyInput["toolCalls"][number] => ({
      id,
      stepIndex,
      plannerStepIndex: 1,
      turnIndex: 0,
      toolCallId: `tc-${id}`,
      toolName: "run_command",
      category: "command",
      mcpServer: null,
      skillName: null,
      skillPlugin: null,
      targetPath: null,
      childConversationId: null,
      startedAtMs: t0 + id * 1000,
      completedAtMs: t0 + id * 1000 + 500,
      durationMs: 500,
      argsPreview: "",
      resultBytes: 100,
      estResultTokens: 25,
      attributedInputTokens: 100,
      compoundedCacheTokens: 200,
      isError: true,
      errorPreview: "Command exited with code 1.",
      ...overrides
    });

    const scriptPath = path.join(spExecScripts, "task-start");
    const convs: ConversationEfficiencyInput[] = [
      {
        conversationId: "conv-err-1",
        title: "Build music sequencer",
        parentConversationId: null,
        activeMs: 10_000,
        hasTokenTelemetry: true,
        filesTouched: [],
        plannerSteps: [
          {
            stepIndex: 1,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: t0,
            completedAtMs: t0 + 2000,
            modelDurationMs: 2000,
            inputTokens: 1000,
            cacheReadTokens: 0,
            outputTokens: 200,
            totalContextTokens: 1000,
            cacheHitRatio: 0,
            isCacheMiss: false,
            cacheMissCause: null,
            thinkingChars: 100,
            contentChars: 50,
            toolCallCount: 8,
            status: "DONE",
            attributedSummary: ""
          }
        ],
        toolCalls: [
          // 5 errors across 4 distinct messages on task-start (one repeated twice)
          makeErrTool(1, 2, {
            argsPreview: `bash ${scriptPath} plan.md 1`,
            errorPreview: "Command exited with code 1.\nPlan file locked"
          }),
          makeErrTool(2, 3, {
            argsPreview: `bash ${scriptPath} plan.md 2`,
            errorPreview: "Command exited with code 1.   Plan file locked"
          }),
          makeErrTool(3, 4, {
            argsPreview: `bash ${scriptPath} plan.md 3`,
            errorPreview: "Command exited with code 2.\nInvalid task id"
          }),
          makeErrTool(4, 5, {
            argsPreview: `bash ${scriptPath} plan.md 4`,
            errorPreview: "Command exited with code 3.\nMissing dependency"
          }),
          makeErrTool(5, 6, {
            argsPreview: `bash ${scriptPath} plan.md 5`,
            errorPreview: "Command exited with code 4.\nBranch dirty"
          }),
          // 3 distinct errors on test-driven-development SubSkill
          makeErrTool(6, 7, {
            toolName: "read_file",
            category: "skill",
            skillName: "test-driven-development",
            skillPlugin: "superpowers",
            targetPath: path.join(spSkill, "writing-good-tests.md"),
            errorPreview: "ENOENT: no such file writing-good-tests.md"
          }),
          makeErrTool(7, 8, {
            toolName: "read_file",
            category: "skill",
            skillName: "test-driven-development",
            skillPlugin: "superpowers",
            targetPath: path.join(spSkill, "extra-1.md"),
            errorPreview: "ENOENT: no such file extra-1.md"
          }),
          makeErrTool(8, 9, {
            toolName: "read_file",
            category: "skill",
            skillName: "test-driven-development",
            skillPlugin: "superpowers",
            targetPath: path.join(spSkill, "extra-2.md"),
            errorPreview: "Permission denied extra-2.md"
          })
        ]
      }
    ];

    const eff = computeScopeSkillEfficiency(convs, DEFAULT_PRICING_RULES, {
      registry: reg
    });
    assert.equal(eff.pluginSkillMetrics.length, 1);
    const sp = eff.pluginSkillMetrics[0];
    assert.equal(sp.errors, 8);
    assert.ok(sp.errorSamples);
    assert.equal(sp.errorSamples.length, 5, "Parent errorSamples must cap at 5");
    assert.equal(sp.errorSamples[0].count, 2, "Highest-count deduplicated sample must sort first");
    assert.equal(sp.errorSamples[0].message, "Command exited with code 1. Plan file locked");
    assert.equal(sp.errorSamples[0].conversationId, "conv-err-1");
    assert.equal(sp.errorSamples[0].conversationTitle, "Build music sequencer");
    assert.equal(sp.errorSamples[0].stepIndex, 2);

    const cliChild = sp.children.find((c) => c.name === "task-start");
    assert.ok(cliChild);
    assert.equal(cliChild.errors, 5);
    assert.ok(cliChild.errorSamples);
    assert.equal(cliChild.errorSamples.length, 3, "Child errorSamples must cap at 3");
    assert.equal(cliChild.errorSamples[0].count, 2);

    const skillChild = sp.children.find((c) => c.name === "test-driven-development");
    assert.ok(skillChild);
    assert.equal(skillChild.errors, 3);
    assert.equal(
      skillChild.errorSamples?.[0]?.target,
      "test-driven-development/writing-good-tests.md"
    );

    // Merge across two project payloads and verify sample counts aggregate
    const merged = mergePluginSkillMetrics([
      { projectPath: "/proj/a", metrics: eff.pluginSkillMetrics },
      { projectPath: "/proj/b", metrics: eff.pluginSkillMetrics }
    ]);
    assert.equal(merged[0].errors, 16);
    assert.equal(merged[0].errorSamples?.[0]?.count, 4);
    const mergedCli = merged[0].children.find((c) => c.name === "task-start");
    assert.equal(mergedCli?.errorSamples?.[0]?.count, 4);
    assert.equal(mergedCli?.errorSamples?.length, 3);
  } finally {
    clearInstalledPluginsCache();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
