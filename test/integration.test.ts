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

test("end-to-end Swarm coordinator + plan.json + multi-worker linkage + isolated workspace + swarm_wait + MCP output", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-swarm-int-"));
  const brainDir = path.join(tmpDir, "brain");
  const dataDir = path.join(tmpDir, "data");
  const eventsPath = path.join(dataDir, "events.jsonl");

  const coordId = "cccccccc-1111-2222-3333-444444444440";
  const worker1Id = "cccccccc-1111-2222-3333-444444444441";
  const worker2Id = "cccccccc-1111-2222-3333-444444444442";

  const coordLogDir = path.join(brainDir, coordId, ".system_generated", "logs");
  const coordSwarmDir = path.join(brainDir, coordId, ".system_generated", "swarm");
  const w1LogDir = path.join(brainDir, worker1Id, ".system_generated", "logs");
  const w2LogDir = path.join(brainDir, worker2Id, ".system_generated", "logs");
  fs.mkdirSync(coordLogDir, { recursive: true });
  fs.mkdirSync(coordSwarmDir, { recursive: true });
  fs.mkdirSync(w1LogDir, { recursive: true });
  fs.mkdirSync(w2LogDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    path.join(coordSwarmDir, "plan.json"),
    JSON.stringify({
      goal: { title: "Refactor auth module", line: "Split and test auth." },
      tasks: {
        "worker-1": "Refactor auth handlers",
        "worker-2": "Add integration tests"
      },
      threads: [
        {
          id: "t-auth",
          title: "Auth refactor",
          goal: "Clean modular auth",
          tasks: ["worker-1", "worker-2"]
        }
      ]
    }),
    "utf8"
  );

  const coordLines = [
    {
      step_index: 0,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-25T15:00:00Z",
      content: "<USER_REQUEST>\n/swarm Refactor auth module\n</USER_REQUEST>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-25T15:00:00Z",
      model: "gemini-4-neon-high",
      input_tokens: 10_000,
      cache_read_tokens: 0,
      output_tokens: 400,
      tool_calls: [
        {
          id: "sw-title",
          name: "swarm",
          args: { action: "title", title: "Refactor auth" }
        },
        {
          id: "sw-add",
          name: "swarm",
          args: {
            action: "add",
            name: "worker",
            tasks: ["auth", "tests"],
            workspace: "share"
          }
        }
      ]
    },
    {
      step_index: 2,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-25T15:00:01Z",
      content: "Created At: 2026-11-25T15:00:01Z\nCompleted At: 2026-11-25T15:00:02Z\nTitle set."
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-25T15:00:02Z",
      content: `Created At: 2026-11-25T15:00:02Z\nCompleted At: 2026-11-25T15:00:04Z\nworker-1 conversationId: ${worker1Id}\nworker-2 conversationId: ${worker2Id}`
    }
  ];

  const w1Lines = [
    {
      step_index: 0,
      source: "SYSTEM",
      type: "SYSTEM_MESSAGE",
      status: "DONE",
      created_at: "2026-11-25T15:00:03Z",
      content: "<swarm_worker>\nHandle auth refactor.\n</swarm_worker>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-25T15:00:04Z",
      model: "gemini-4-neon-high",
      input_tokens: 4_000,
      cache_read_tokens: 0,
      output_tokens: 200,
      tool_calls: [
        { id: "w1-read", name: "read_file", args: { Path: "/Users/dev/swarm-repo/src/auth.ts" } }
      ]
    },
    {
      step_index: 2,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-25T15:00:05Z",
      content: "Created At: 2026-11-25T15:00:05Z\nCompleted At: 2026-11-25T15:00:07Z\nexport const auth = true;"
    }
  ];

  const w2Lines = [
    {
      step_index: 0,
      source: "SYSTEM",
      type: "SYSTEM_MESSAGE",
      status: "DONE",
      created_at: "2026-11-25T15:00:03Z",
      content: "<swarm_worker>\nHandle tests.\n</swarm_worker>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-25T15:00:04Z",
      model: "gemini-2.5-flash",
      input_tokens: 3_000,
      cache_read_tokens: 0,
      output_tokens: 150,
      tool_calls: [
        { id: "w2-board", name: "read_board", args: { since: 0 } },
        { id: "w2-wait", name: "swarm_wait", args: { since: 1 } }
      ]
    },
    {
      step_index: 2,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-25T15:00:05Z",
      content: "Created At: 2026-11-25T15:00:05Z\nCompleted At: 2026-11-25T15:00:06Z\n[]"
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-25T15:00:06Z",
      content: "Created At: 2026-11-25T15:00:06Z\nCompleted At: 2026-11-25T15:05:06Z\nMessage posted"
    }
  ];

  fs.writeFileSync(
    path.join(coordLogDir, "transcript_full.jsonl"),
    coordLines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(w1LogDir, "transcript_full.jsonl"),
    w1Lines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );
  fs.writeFileSync(
    path.join(w2LogDir, "transcript_full.jsonl"),
    w2Lines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );

  // Worker 1 reports an isolated share worktree path in hooks — should still fold under coordinator's project!
  fs.writeFileSync(
    eventsPath,
    [
      JSON.stringify({
        tsMs: Date.parse("2026-11-25T15:00:00Z"),
        hookEventName: "SessionStart",
        conversationId: coordId,
        workspacePaths: ["/Users/dev/swarm-repo"]
      }),
      JSON.stringify({
        tsMs: Date.parse("2026-11-25T15:00:03Z"),
        hookEventName: "SessionStart",
        conversationId: worker1Id,
        workspacePaths: ["/Users/dev/swarm-repo-share-wt1"]
      })
    ].join("\n") + "\n",
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
    assert.equal(stats.transcriptsDiscovered, 3);
    assert.equal(stats.transcriptsIndexed, 3);

    const dash = buildDashboardData(db);
    assert.equal(dash.totals.projectCount, 1);
    assert.equal(dash.totals.chatCount, 1);
    assert.equal(dash.totals.subagentCount, 2);
    assert.equal(dash.totals.swarmCount, 1);
    assert.equal(dash.projects[0].projectPath, "/Users/dev/swarm-repo");
    assert.equal(dash.projects[0].swarmCount, 1);

    const coordDetail = buildConversationDetail(db, coordId);
    assert.ok(coordDetail);
    assert.equal(coordDetail.summary.swarmRole, "coordinator");
    assert.equal(coordDetail.summary.swarmTitle, "Refactor auth");
    assert.deepEqual(coordDetail.swarmTasks, {
      "worker-1": "Refactor auth handlers",
      "worker-2": "Add integration tests"
    });
    assert.equal(coordDetail.subagents.length, 2);
    assert.ok(coordDetail.subagents.every((s) => s.swarmRole === "worker"));
    assert.ok(coordDetail.subagents.every((s) => s.projectPath === "/Users/dev/swarm-repo"));
    assert.deepEqual(
      coordDetail.subagents.map((s) => s.subagentRole).sort(),
      ["worker-1", "worker-2"]
    );
    assert.ok(coordDetail.combinedTokens);
    const combinedTokTotal =
      coordDetail.combinedTokens.inputTokens +
      coordDetail.combinedTokens.cacheReadTokens +
      coordDetail.combinedTokens.outputTokens;
    assert.equal(combinedTokTotal, 10_400 + 4_200 + 3_150);

    // Worker 2's 5-minute (300,000ms) swarm_wait must NOT inflate activeMs or userIdleMs
    const w2Detail = buildConversationDetail(db, worker2Id);
    assert.ok(w2Detail);
    assert.equal(w2Detail.summary.swarmRole, "worker");
    assert.equal(w2Detail.summary.time.userIdleMs, 0);
    assert.ok(
      w2Detail.summary.time.activeMs < 10_000,
      `Expected worker2 activeMs (${w2Detail.summary.time.activeMs}) < 10s with 5m swarm_wait excluded`
    );

    const mcpServer = createTrackerMcpServer({
      db,
      dataDir,
      uiHtmlPath,
      brainRoots: [{ surface: "antigravity", dir: brainDir }],
      eventsPath
    });
    const client = new Client({ name: "swarm-test-client", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([
      mcpServer.connect(serverTransport),
      client.connect(clientTransport)
    ]);

    try {
      const listRes = await client.callTool({ name: "list_projects", arguments: {} });
      const listText = ((listRes.content as Array<{ text?: string }>)?.[0]?.text ?? "");
      assert.match(listText, /1 swarm/);

      const projRes = await client.callTool({
        name: "get_project_summary",
        arguments: { projectPath: "/Users/dev/swarm-repo" }
      });
      const projText = ((projRes.content as Array<{ text?: string }>)?.[0]?.text ?? "");
      assert.match(projText, /\*\*Swarm Runs\*\*: 1/);
      assert.match(projText, /\[Swarm\]/);

      const chatRes = await client.callTool({
        name: "get_chat_analysis",
        arguments: { conversationId: coordId }
      });
      const chatText = ((chatRes.content as Array<{ text?: string }>)?.[0]?.text ?? "");
      assert.match(chatText, /\*\*Mode\*\*: Swarm coordinator \("Refactor auth"\)/);
      assert.match(chatText, /\*\*Combined Swarm Totals/);
      assert.match(chatText, /\*\*Swarm Workers \(2\)\*\*/);
      assert.match(chatText, /`\[swarm\]`/);
    } finally {
      await client.close();
      await mcpServer.close();
    }
  } finally {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
