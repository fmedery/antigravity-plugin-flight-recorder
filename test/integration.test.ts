import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  buildConversationDetail,
  buildDashboardData
} from "../src/server/analytics.js";
import { TrackerDatabase } from "../src/server/db.js";
import { runScan } from "../src/server/scanner.js";
import { APP_URI, createTrackerMcpServer } from "../src/server/tools.js";
import { buildSkillOptimizationPrompt } from "../src/ui/format.js";

test("full scanner + parent/subagent linkage + MCP server tools/resources + CSP check", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-int-test-"));
  const brainDir = path.join(tmpDir, "brain");
  const dataDir = path.join(tmpDir, "data");
  const eventsPath = path.join(dataDir, "events.jsonl");

  const parentId = "aaaaaaaa-1111-2222-3333-444444444444";
  const childId = "bbbbbbbb-1111-2222-3333-444444444444";

  const parentLogDir = path.join(brainDir, parentId, ".system_generated", "logs");
  const childLogDir = path.join(brainDir, childId, ".system_generated", "logs");
  fs.mkdirSync(parentLogDir, { recursive: true });
  fs.mkdirSync(childLogDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  const parentLines = [
    {
      step_index: 0,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-21T20:00:00Z",
      content: "<USER_REQUEST>\nBuild feature X\n</USER_REQUEST>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-21T20:00:00Z",
      model: "gemini-2.5-pro",
      input_tokens: 15_000,
      cache_read_tokens: 0,
      output_tokens: 600,
      tool_calls: [
        {
          id: "sub-call",
          name: "invoke_subagent",
          args: { TypeName: "research", Role: "Code Reviewer" }
        },
        {
          id: "skill-call",
          name: "read_file",
          args: { Path: "/builtin/skills/writing-plans/SKILL.md" }
        }
      ]
    },
    {
      step_index: 2,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-21T20:00:02Z",
      content: `Created At: 2026-11-21T20:00:02Z\nCompleted At: 2026-11-21T20:00:08Z\nLaunched ${childId}`
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-21T20:00:02Z",
      content: "Created At: 2026-11-21T20:00:02Z\nCompleted At: 2026-11-21T20:00:03Z\n---\nname: writing-plans\n---\n# Writing Plans"
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-21T20:00:08Z",
      model: "gemini-2.5-pro",
      input_tokens: 2_000,
      cache_read_tokens: 15_000,
      output_tokens: 400,
      content: "All done!"
    }
  ];

  const childLines = [
    {
      step_index: 0,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-21T20:00:02Z",
      content: "<USER_REQUEST>\nInspect codebase\n</USER_REQUEST>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-21T20:00:02Z",
      model: "gemini-2.5-flash",
      input_tokens: 8_000,
      cache_read_tokens: 0,
      output_tokens: 300,
      tool_calls: [
        {
          id: "child-read",
          name: "read_file",
          args: { Path: "/Users/dev/sample-project/README.md" }
        }
      ],
      content: "Inspected."
    },
    {
      step_index: 2,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-21T20:00:03Z",
      content: "Created At: 2026-11-21T20:00:03Z\nCompleted At: 2026-11-21T20:00:07Z\n# Sample"
    }
  ];

  fs.writeFileSync(
    path.join(parentLogDir, "transcript_full.jsonl"),
    parentLines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(childLogDir, "transcript_full.jsonl"),
    childLines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );

  fs.writeFileSync(
    eventsPath,
    JSON.stringify({
      tsMs: Date.parse("2026-11-21T20:00:00Z"),
      hookEventName: "SessionStart",
      conversationId: parentId,
      workspacePaths: ["/Users/dev/sample-project"]
    }) + "\n",
    "utf8"
  );

  const db = new TrackerDatabase(dataDir);
  const uiHtmlPath = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "dist",
    "ui",
    "index.html"
  );

  try {
    const stats = await runScan({
      db,
      dataDir,
      brainRoots: [{ surface: "antigravity", dir: brainDir }],
      eventsPath
    });
    assert.equal(stats.transcriptsDiscovered, 2);
    assert.equal(stats.transcriptsIndexed, 2);

    const dash = buildDashboardData(db);
    assert.equal(dash.totals.projectCount, 1);
    assert.equal(dash.totals.chatCount, 1);
    assert.equal(dash.totals.subagentCount, 1);
    assert.equal(dash.projects[0].projectPath, "/Users/dev/sample-project");
    assert.ok(Array.isArray(dash.pluginSkillMetrics));
    assert.ok(Array.isArray(dash.projects[0].topPluginsSkills));
    assert.equal(dash.totals.modelBreakdown.length, 2);
    assert.equal(dash.projects[0].modelBreakdown.length, 2);
    assert.equal(dash.projects[0].modelBreakdown[0].model, "gemini-2.5-pro");
    assert.equal(dash.projects[0].modelBreakdown[0].totalTokens, 33_000);
    assert.equal(dash.projects[0].modelBreakdown[1].model, "gemini-2.5-flash");
    assert.equal(dash.projects[0].modelBreakdown[1].totalTokens, 8_300);
    const totalShareSum = dash.projects[0].modelBreakdown.reduce(
      (s, m) => s + m.tokenShare,
      0
    );
    assert.ok(Math.abs(totalShareSum - 1) < 1e-9);

    const parentDetail = buildConversationDetail(db, parentId);
    assert.ok(parentDetail);
    assert.equal(parentDetail.subagents.length, 1);
    assert.equal(parentDetail.subagents[0].conversationId, childId);
    assert.equal(parentDetail.subagents[0].projectPath, "/Users/dev/sample-project");

    // Verify single-file UI bundle CSP compliance (no external CDN scripts/stylesheets)
    assert.ok(fs.existsSync(uiHtmlPath), `Expected built UI at ${uiHtmlPath}`);
    const uiHtml = fs.readFileSync(uiHtmlPath, "utf8");
    assert.ok(Buffer.byteLength(uiHtml, "utf8") < 10 * 1024 * 1024);
    assert.equal(/<(?:script|link)\b[^>]*(?:src|href)=["']https?:\/\//i.test(uiHtml), false);

    // Connect MCP server + client via InMemoryTransport to verify tools/resources & _meta
    const mcpServer = createTrackerMcpServer({
      db,
      dataDir,
      uiHtmlPath,
      brainRoots: [{ surface: "antigravity", dir: brainDir }],
      eventsPath
    });
    const client = new Client({ name: "test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([
      mcpServer.connect(serverTransport),
      client.connect(clientTransport)
    ]);

    const toolsList = await client.listTools();
    const openTool = toolsList.tools.find((t) => t.name === "open_flight_recorder");
    assert.ok(openTool);
    const openMeta = openTool._meta as Record<string, unknown>;
    assert.equal((openMeta?.ui as Record<string, unknown>)?.resourceUri, APP_URI);
    const agyUi = openMeta?.["com.google.antigravity/ui"] as {
      entrypoints?: Array<{ type: string; title: string }>;
    };
    assert.ok(agyUi?.entrypoints?.some((e) => e.type === "aux_pane"));
    assert.ok(agyUi?.entrypoints?.some((e) => e.type === "global"));

    const appOnlyTool = toolsList.tools.find((t) => t.name === "app_get_dashboard_data");
    assert.ok(appOnlyTool);
    assert.deepEqual(
      ((appOnlyTool._meta as Record<string, unknown>)?.ui as Record<string, unknown>)
        ?.visibility,
      ["app"]
    );

    const resList = await client.listResources();
    const appRes = resList.resources.find((r) => r.uri === APP_URI);
    assert.ok(appRes);
    assert.equal(appRes.mimeType, "text/html;profile=mcp-app");

    const resRead = await client.readResource({ uri: APP_URI });
    assert.equal(resRead.contents.length, 1);
    assert.equal(resRead.contents[0].mimeType, "text/html;profile=mcp-app");

    const openResult = await client.callTool({
      name: "open_flight_recorder",
      arguments: {}
    });
    const payloadBytes = Buffer.byteLength(
      JSON.stringify(openResult.structuredContent ?? {}),
      "utf8"
    );
    assert.ok(payloadBytes < 1024 * 1024);

    const listProjectsRes = await client.callTool({
      name: "list_projects",
      arguments: {}
    });
    const listContent = Array.isArray(listProjectsRes.content)
      ? (listProjectsRes.content as Array<{ type?: string; text?: string }>)
      : [];
    const listProjectsText =
      listContent[0]?.type === "text" ? (listContent[0].text ?? "") : "";
    assert.match(listProjectsText, /gemini-2\.5-pro 80%/);
    assert.match(listProjectsText, /gemini-2\.5-flash 20%/);
    assert.match(listProjectsText, /Most Token-Hungry Plugins & Skills \(All Projects\)/);
    assert.match(listProjectsText, /writing-plans/);

    const projSummaryRes = await client.callTool({
      name: "get_project_summary",
      arguments: { projectPath: "/Users/dev/sample-project" }
    });
    const summaryContent = Array.isArray(projSummaryRes.content)
      ? (projSummaryRes.content as Array<{ type?: string; text?: string }>)
      : [];
    const projSummaryText =
      summaryContent[0]?.type === "text" ? (summaryContent[0].text ?? "") : "";
    assert.match(projSummaryText, /Model Breakdown/);
    assert.match(projSummaryText, /gemini-2\.5-pro.*80% tokens/);
    assert.match(projSummaryText, /gemini-2\.5-flash.*20% tokens/);
    assert.match(projSummaryText, /active time/i);

    assert.equal(
      toolsList.tools.some((t) => t.name === "get_skill_optimization"),
      true,
      "Expected get_skill_optimization MCP tool to be registered"
    );

    const optProjRes = await client.callTool({
      name: "get_skill_optimization",
      arguments: { projectPath: "/Users/dev/sample-project" }
    });
    const optProjSc = (optProjRes.structuredContent ?? {}) as {
      scope?: string;
      totalActiveMs?: number;
      items?: Array<{
        name: string;
        drivenActiveMs: number;
        timeShare: number;
        instructionTokens: number;
        children: unknown[];
      }>;
    };
    assert.ok(Array.isArray(optProjSc.items) && optProjSc.items.length >= 1);
    const wpItem = optProjSc.items.find((i) => i.name === "writing-plans");
    assert.ok(wpItem, "Expected writing-plans item in get_skill_optimization");
    assert.ok(wpItem.drivenActiveMs > 0);
    assert.ok(wpItem.timeShare > 0);
    assert.ok(wpItem.instructionTokens > 0);
    assert.ok(wpItem.children.length >= 1);

    const optChatRes = await client.callTool({
      name: "get_skill_optimization",
      arguments: {
        pluginOrSkill: "writing-plans",
        conversationId: parentId
      }
    });
    const optChatSc = (optChatRes.structuredContent ?? {}) as {
      totalActiveMs?: number;
      items?: Array<{ name: string; drivenActiveMs: number; timeShare: number; chatCount: number }>;
    };
    assert.equal(optChatSc.items?.length, 1);
    assert.equal(optChatSc.items?.[0]?.name, "writing-plans");
    assert.equal(optChatSc.items?.[0]?.chatCount, 1);
    // Single-chat totalActiveMs must equal merged wall-clock scopeActiveMs (matching 100% timeShare item)
    // and strictly avoid double-counting synchronous subagent wait + child activeMs (13,154ms vs 19,154ms).
    assert.equal(optChatSc.totalActiveMs, optChatSc.items?.[0]?.drivenActiveMs);
    assert.ok(
      typeof optChatSc.totalActiveMs === "number" &&
        optChatSc.totalActiveMs <
          parentDetail.summary.time.activeMs + parentDetail.summary.time.subagentMs,
      `Expected merged single-chat totalActiveMs (${optChatSc.totalActiveMs}) < raw sum (${parentDetail.summary.time.activeMs + parentDetail.summary.time.subagentMs})`
    );

    // Verify time-range filtering across app-only dashboard and project detail endpoints
    const convEndedMs = parentDetail.summary.endedAtMs;
    const matchDashRes = await client.callTool({
      name: "app_get_dashboard_data",
      arguments: {
        timeRange: "today",
        sinceMs: convEndedMs - 60_000,
        skipScan: true
      }
    });
    const matchDashSc = (matchDashRes.structuredContent ?? {}) as {
      timeRange?: { preset?: string; sinceMs?: number | null };
      totals?: { projectCount?: number; chatCount?: number };
    };
    assert.equal(matchDashSc.timeRange?.preset, "today");
    assert.equal(matchDashSc.timeRange?.sinceMs, convEndedMs - 60_000);
    assert.equal(matchDashSc.totals?.projectCount, 1);
    assert.equal(matchDashSc.totals?.chatCount, 1);

    const futureSinceMs = convEndedMs + 60_000;
    const emptyDashRes = await client.callTool({
      name: "app_get_dashboard_data",
      arguments: {
        timeRange: "today",
        sinceMs: futureSinceMs,
        skipScan: true
      }
    });
    const emptyDashSc = (emptyDashRes.structuredContent ?? {}) as {
      totals?: { projectCount?: number; chatCount?: number };
      projects?: unknown[];
    };
    assert.equal(emptyDashSc.totals?.projectCount, 0);
    assert.equal(emptyDashSc.totals?.chatCount, 0);
    assert.deepEqual(emptyDashSc.projects, []);

    const emptyProjRes = await client.callTool({
      name: "app_get_project_detail",
      arguments: {
        projectPath: "/Users/dev/sample-project",
        timeRange: "today",
        sinceMs: futureSinceMs
      }
    });
    assert.notEqual(emptyProjRes.isError, true);
    const emptyProjSc = (emptyProjRes.structuredContent ?? {}) as {
      summary?: { chatCount?: number };
      chats?: unknown[];
      timeRange?: { preset?: string };
    };
    assert.equal(emptyProjSc.summary?.chatCount, 0);
    assert.deepEqual(emptyProjSc.chats, []);
    assert.equal(emptyProjSc.timeRange?.preset, "today");

    await client.close();
    await mcpServer.close();
  } finally {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("buildSkillOptimizationPrompt formats parent-first spend/time, child breakdown, targetPaths, and unpriced fallback cleanly", () => {
  const pricedPrompt = buildSkillOptimizationPrompt(
    {
      id: "plugin:superpowers",
      name: "Superpowers",
      kind: "Plugin",
      calls: 6,
      errors: 0,
      totalDurationMs: 5_000,
      drivenActiveMs: 462_000,
      timeShare: 0.86,
      drivenCostUsd: 1.12,
      costShare: 0.89,
      instructionTokens: 164_000,
      executionTokens: 0,
      directTokens: 18_000,
      compoundedCacheTokens: 146_000,
      totalTokens: 164_000,
      tokenShare: 0.42,
      estimatedCostUsd: 0.12,
      warningCount: 2,
      warnings: ["Duplicate read", "High markdown carry"],
      prescription:
        "100% (+164.0k tok) of Superpowers's context footprint is instruction markdown carried across steps.",
      targetPaths: [
        "/Users/dev/.gemini/config/plugins/superpowers/skills/brainstorming/SKILL.md",
        "/Users/dev/.gemini/config/plugins/superpowers/skills/using-superpowers/SKILL.md"
      ],
      children: [
        {
          key: "SubSkill:brainstorming",
          name: "brainstorming",
          kind: "SubSkill",
          calls: 1,
          errors: 0,
          drivenActiveMs: 300_000,
          drivenCostUsd: 0.72,
          instructionTokens: 110_000,
          executionTokens: 0,
          totalTokens: 110_000,
          duplicateReads: 0,
          isUnusedLoad: false,
          targetPaths: []
        },
        {
          key: "SubSkill:using-superpowers",
          name: "using-superpowers",
          kind: "SubSkill",
          calls: 3,
          errors: 0,
          drivenActiveMs: 162_000,
          drivenCostUsd: 0.4,
          instructionTokens: 54_000,
          executionTokens: 0,
          totalTokens: 54_000,
          duplicateReads: 2,
          isUnusedLoad: false,
          targetPaths: []
        }
      ],
      chatCount: 3
    },
    "Project flight-recorder"
  );

  assert.match(pricedPrompt, /Superpowers/);
  assert.match(pricedPrompt, /89%/);
  assert.match(pricedPrompt, /86%/);
  assert.match(pricedPrompt, /brainstorming/);
  assert.match(pricedPrompt, /using-superpowers/);
  assert.match(pricedPrompt, /SKILL\.md/);
  assert.equal(pricedPrompt.includes("null"), false);
  assert.equal(pricedPrompt.includes("NaN"), false);

  const unpricedPrompt = buildSkillOptimizationPrompt(
    {
      id: "plugin:superpowers",
      name: "Superpowers",
      kind: "Plugin",
      calls: 2,
      errors: 0,
      totalDurationMs: 2_000,
      drivenActiveMs: 180_000,
      timeShare: 0.91,
      drivenCostUsd: null,
      costShare: null,
      instructionTokens: 30_000,
      executionTokens: 0,
      directTokens: 5_000,
      compoundedCacheTokens: 25_000,
      totalTokens: 30_000,
      tokenShare: 0.35,
      estimatedCostUsd: null,
      warningCount: 0,
      warnings: [],
      prescription: null,
      targetPaths: [],
      children: [],
      chatCount: 1
    },
    "Chat abc"
  );
  assert.match(unpricedPrompt, /Superpowers/);
  assert.match(unpricedPrompt, /91%/);
  assert.equal(unpricedPrompt.includes("null"), false);
  assert.equal(unpricedPrompt.includes("NaN"), false);
});
