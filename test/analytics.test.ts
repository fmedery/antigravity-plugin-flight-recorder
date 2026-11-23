import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  aggregateModelUsage,
  aggregatePluginSkillMetrics,
  aggregateSkillToolMetrics,
  analyzeConversation,
  buildConversationDetail,
  buildConversationSummary,
  buildDashboardData,
  buildProjectDetail,
  clearInstalledPluginsCache,
  clearProjectNameCache,
  discoverInstalledPlugins,
  extractModelSwitches,
  formatDurationShort,
  mergeModelBreakdowns,
  mergePluginSkillMetrics,
  projectDisplayName
} from "../src/server/analytics.js";
import { TrackerDatabase, type HookEventRow } from "../src/server/db.js";
import { findProjectRootForPath, inferProjectFromPaths } from "../src/server/scanner.js";
import type { ParsedTranscript } from "../src/server/transcriptParser.js";
import { aggregateCosts, DEFAULT_PRICING_RULES } from "../src/shared/pricing.js";

test("analyzeConversation attributes tokens, cache carry, cache misses, parallel time, and user idle", () => {
  const t0 = Date.parse("2026-11-21T21:00:00Z");
  const parsed: ParsedTranscript = {
    conversationId: "conv-ana-1",
    transcriptPath: "/tmp/t.jsonl",
    title: "Optimize build",
    startedAtMs: t0,
    endedAtMs: t0 + 400_000,
    models: ["gemini-2.5-pro"],
    slashCommands: [],
    candidatePaths: ["/Users/dev/proj/src/a.ts"],
    turns: [
      {
        turnIndex: 0,
        stepIndex: 0,
        createdAtMs: t0,
        promptText: "Read a and b",
        promptPreview: "Read a and b",
        promptBytes: 12,
        slashCommand: null
      },
      {
        turnIndex: 1,
        stepIndex: 5,
        createdAtMs: t0 + 312_000, // ~5m idle after turn 0
        promptText: "Continue",
        promptPreview: "Continue",
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
        thinkingChars: 200,
        contentChars: 100,
        inputTokens: 10_000,
        cacheReadTokens: 0,
        outputTokens: 500,
        totalContextTokens: 10_000,
        toolCallCount: 2,
        status: "DONE"
      },
      {
        stepIndex: 4,
        turnIndex: 0,
        model: "gemini-2.5-pro",
        createdAtMs: t0 + 9_000,
        thinkingChars: 150,
        contentChars: 300,
        inputTokens: 4_000,
        cacheReadTokens: 10_000,
        outputTokens: 325,
        totalContextTokens: 14_000,
        toolCallCount: 0,
        status: "DONE"
      },
      {
        stepIndex: 6,
        turnIndex: 1,
        model: "gemini-2.5-pro",
        createdAtMs: t0 + 312_000,
        thinkingChars: 100,
        contentChars: 200,
        inputTokens: 12_000,
        cacheReadTokens: 2_000, // Cache miss (< 80% of 14,000)
        outputTokens: 200,
        totalContextTokens: 14_000,
        toolCallCount: 0,
        status: "DONE"
      }
    ],
    toolCalls: [
      {
        stepIndex: 2,
        plannerStepIndex: 1,
        turnIndex: 0,
        toolCallId: "t1",
        toolName: "read_file",
        category: "file_read",
        mcpServer: null,
        skillName: null,
        skillPlugin: null,
        targetPath: "/Users/dev/proj/src/a.ts",
        childConversationId: null,
        startedAtMs: t0 + 3_000,
        completedAtMs: t0 + 7_000,
        durationMs: 4_000,
        argsPreview: "/Users/dev/proj/src/a.ts",
        commandPathHints: [],
        resultBytes: 12_000,
        estResultTokens: 3_000,
        isError: false,
        errorPreview: null
      },
      {
        stepIndex: 3,
        plannerStepIndex: 1,
        turnIndex: 0,
        toolCallId: "t2",
        toolName: "read_file",
        category: "file_read",
        mcpServer: null,
        skillName: null,
        skillPlugin: null,
        targetPath: "/Users/dev/proj/src/b.ts",
        childConversationId: null,
        startedAtMs: t0 + 3_000,
        completedAtMs: t0 + 5_000,
        durationMs: 2_000,
        argsPreview: "/Users/dev/proj/src/b.ts",
        commandPathHints: [],
        resultBytes: 4_000,
        estResultTokens: 1_000,
        isError: false,
        errorPreview: null
      }
    ]
  };

  const result = analyzeConversation(parsed, [], {
    surface: "antigravity",
    projectPath: "/Users/dev/proj",
    projectSource: "hook",
    parentConversationId: null,
    subagentRole: null,
    subagentType: null
  });

  // Token attribution across t1 (3000 est) and t2 (1000 est) from Step 4's 4,000 input_tokens
  assert.equal(result.toolCalls[0].attributedInputTokens, 3_000);
  assert.equal(result.toolCalls[1].attributedInputTokens, 1_000);

  // Cache miss occurs at Step 6, so remaining steps after Step 4 before reset = 0.
  assert.equal(result.plannerSteps[2].isCacheMiss, true);
  assert.match(result.plannerSteps[2].cacheMissCause ?? "", /Idle gap/);

  // Parallel tool batch: sum = 6000ms, wall = 4000ms (overlapping 3s..7s & 3s..5s)
  assert.equal(result.toolSumMs, 6_000);
  assert.equal(result.toolWallMs, 4_000);
  assert.equal(result.modelMs > 0, true);
  assert.ok(result.userIdleMs > 280_000);
});

test("pricing returns Unpriced (null) for unknown models and accurate USD for known models", () => {
  const unknownOnly = aggregateCosts(
    [
      {
        model: "gemini-4-neon-high",
        inputTokens: 20_000,
        cacheReadTokens: 50_000,
        outputTokens: 2_000
      }
    ],
    DEFAULT_PRICING_RULES
  );
  assert.equal(unknownOnly.estimatedCostUsd, null);
  assert.deepEqual(unknownOnly.unpricedModels, ["gemini-4-neon-high"]);

  const proOnly = aggregateCosts(
    [
      {
        model: "gemini-2.5-pro",
        inputTokens: 1_000_000,
        cacheReadTokens: 1_000_000,
        outputTokens: 1_000_000
      }
    ],
    DEFAULT_PRICING_RULES
  );
  // 1.25 + 0.3125 + 10.0 = 11.5625
  assert.ok(proOnly.estimatedCostUsd !== null);
  assert.ok(Math.abs(proOnly.estimatedCostUsd - 11.5625) < 1e-6);
  assert.deepEqual(proOnly.unpricedModels, []);
});

test("project inference finds .git roots and ignores ~/.gemini and /tmp paths", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agy-proj-infer-"));
  const repoDir = path.join(tmpRoot, "my-git-project");
  const nestedFile = path.join(repoDir, "src", "index.ts");
  fs.mkdirSync(path.join(repoDir, ".git"), { recursive: true });
  fs.mkdirSync(path.dirname(nestedFile), { recursive: true });
  fs.writeFileSync(nestedFile, "export {};\n", "utf8");

  try {
    // Note: /tmp is normally ignored as system temp, so test findProjectRootForPath
    // on non-/tmp paths OR test a repo inside os.homedir if needed?
    // Wait: os.tmpdir() on macOS is /var/folders/... which is in IGNORED_PATH_PREFIXES!
    // Let's verify /var/folders/... and ~/.gemini are ignored as expected:
    assert.equal(
      findProjectRootForPath(path.join(os.homedir(), ".gemini", "antigravity", "SKILL.md")),
      null
    );
    assert.equal(findProjectRootForPath("/tmp/scratch.txt"), null);
    assert.equal(inferProjectFromPaths(["/tmp/a.txt", "/var/log/b.log"]), null);
    assert.equal(
      findProjectRootForPath(
        path.resolve(import.meta.dirname, "..", "..", "src", "server", "db.ts")
      ),
      path.resolve(import.meta.dirname, "..", "..")
    );
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("TrackerDatabase persists conversations containing duplicate planner step_index values", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-dup-step-"));
  const db = new TrackerDatabase(tmpDir);
  try {
    const t0 = Date.parse("2026-11-21T21:00:00Z");
    const parsed: ParsedTranscript = {
      conversationId: "conv-dup-step",
      transcriptPath: "/tmp/dup.jsonl",
      title: "Dup step test",
      startedAtMs: t0,
      endedAtMs: t0 + 5000,
      models: ["gemini-2.5-pro"],
      slashCommands: [],
      candidatePaths: [],
      turns: [
        {
          turnIndex: 0,
          stepIndex: 0,
          createdAtMs: t0,
          promptText: "Run",
          promptPreview: "Run",
          promptBytes: 3,
          slashCommand: null
        }
      ],
      plannerSteps: [
        {
          stepIndex: 428,
          turnIndex: 0,
          model: "gemini-2.5-pro",
          createdAtMs: t0,
          thinkingChars: 10,
          contentChars: 10,
          inputTokens: 1000,
          cacheReadTokens: 0,
          outputTokens: 50,
          totalContextTokens: 1000,
          toolCallCount: 0,
          status: "DONE"
        },
        {
          stepIndex: 428,
          turnIndex: 0,
          model: "gemini-2.5-pro",
          createdAtMs: t0 + 2000,
          thinkingChars: 15,
          contentChars: 20,
          inputTokens: 500,
          cacheReadTokens: 1000,
          outputTokens: 80,
          totalContextTokens: 1500,
          toolCallCount: 0,
          status: "DONE"
        }
      ],
      toolCalls: []
    };

    const analyzed = analyzeConversation(parsed, [], {
      surface: "antigravity",
      projectPath: "Unassigned",
      projectSource: "unassigned",
      parentConversationId: null,
      subagentRole: null,
      subagentType: null
    });
    db.upsertConversation(analyzed);
    const stored = db.getPlannerStepsForConversation("conv-dup-step");
    assert.equal(stored.length, 2);
    assert.equal(stored[0].stepIndex, 428);
    assert.equal(stored[1].stepIndex, 428);
  } finally {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("projectDisplayName resolves displayName/name from manifests, git origin URLs, and falls back to basename", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agy-proj-names-"));
  clearProjectNameCache();

  try {
    // 1. plugin.json displayName
    const pPlugin = path.join(tmpRoot, "folder-plugin");
    fs.mkdirSync(pPlugin, { recursive: true });
    fs.writeFileSync(
      path.join(pPlugin, "plugin.json"),
      JSON.stringify({ name: "my-plugin", displayName: "My Awesome Plugin" }),
      "utf8"
    );
    assert.equal(projectDisplayName(pPlugin), "My Awesome Plugin");

    // 2. package.json scoped name (and skipping generic "app")
    const pPkg = path.join(tmpRoot, "folder-pkg");
    fs.mkdirSync(pPkg, { recursive: true });
    fs.writeFileSync(
      path.join(pPkg, "package.json"),
      JSON.stringify({ name: "@org/my-widget" }),
      "utf8"
    );
    assert.equal(projectDisplayName(pPkg), "my-widget");

    const pGenericPkg = path.join(tmpRoot, "real-folder-name");
    fs.mkdirSync(pGenericPkg, { recursive: true });
    fs.writeFileSync(
      path.join(pGenericPkg, "package.json"),
      JSON.stringify({ name: "app" }),
      "utf8"
    );
    assert.equal(projectDisplayName(pGenericPkg), "real-folder-name");

    // 3. pyproject.toml
    const pPy = path.join(tmpRoot, "folder-py");
    fs.mkdirSync(pPy, { recursive: true });
    fs.writeFileSync(
      path.join(pPy, "pyproject.toml"),
      '[project]\nname = "audio-engine"\nversion = "0.1.0"\n',
      "utf8"
    );
    assert.equal(projectDisplayName(pPy), "audio-engine");

    // 4. .git/config HTTPS origin
    const pGitHttps = path.join(tmpRoot, "tempoloop");
    fs.mkdirSync(path.join(pGitHttps, ".git"), { recursive: true });
    fs.writeFileSync(
      path.join(pGitHttps, ".git", "config"),
      '[core]\n\tbare = false\n[remote "origin"]\n\turl = https://github.com/acme/musiclab.git\n',
      "utf8"
    );
    assert.equal(projectDisplayName(pGitHttps), "musiclab");

    // 5. .git/config SSH origin
    const pGitSsh = path.join(tmpRoot, "old-ssh-dir");
    fs.mkdirSync(path.join(pGitSsh, ".git"), { recursive: true });
    fs.writeFileSync(
      path.join(pGitSsh, ".git", "config"),
      '[remote "origin"]\n\turl = git@github.com:org/MusicLab.git\n',
      "utf8"
    );
    assert.equal(projectDisplayName(pGitSsh), "MusicLab");

    // 6. Plain folder fallback
    const pPlain = path.join(tmpRoot, "plain-folder");
    fs.mkdirSync(pPlain, { recursive: true });
    assert.equal(projectDisplayName(pPlain), "plain-folder");
    assert.equal(projectDisplayName("Unassigned"), "Unassigned");
  } finally {
    clearProjectNameCache();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test("multiple tool-less planner steps do not share one PostInvocation hook, and >5m approval pauses stay out of activeMs", () => {
  const t0 = Date.parse("2026-11-21T15:00:00Z");
  const twoHoursMs = 2 * 60 * 60 * 1000;

  const parsed: ParsedTranscript = {
    conversationId: "conv-hooks-and-gap",
    transcriptPath: "/tmp/h.jsonl",
    title: "Long turn with pause",
    startedAtMs: t0,
    endedAtMs: t0 + twoHoursMs + 20_000,
    models: ["gemini-2.5-pro"],
    slashCommands: [],
    candidatePaths: [],
    turns: [
      {
        turnIndex: 0,
        stepIndex: 0,
        createdAtMs: t0,
        promptText: "Build",
        promptPreview: "Build",
        promptBytes: 5,
        slashCommand: null
      }
    ],
    plannerSteps: [
      // Three tool-less planner steps in Turn 0 before the single Stop hook at t0 + 18s
      {
        stepIndex: 1,
        turnIndex: 0,
        model: "gemini-2.5-pro",
        createdAtMs: t0,
        thinkingChars: 50,
        contentChars: 50,
        inputTokens: 1000,
        cacheReadTokens: 0,
        outputTokens: 65,
        totalContextTokens: 1000,
        toolCallCount: 0,
        status: "DONE"
      },
      {
        stepIndex: 2,
        turnIndex: 0,
        model: "gemini-2.5-pro",
        createdAtMs: t0 + 4_000,
        thinkingChars: 50,
        contentChars: 50,
        inputTokens: 500,
        cacheReadTokens: 1000,
        outputTokens: 65,
        totalContextTokens: 1500,
        toolCallCount: 0,
        status: "DONE"
      },
      {
        stepIndex: 3,
        turnIndex: 0,
        model: "gemini-2.5-pro",
        createdAtMs: t0 + 10_000,
        thinkingChars: 50,
        contentChars: 50,
        inputTokens: 500,
        cacheReadTokens: 1500,
        outputTokens: 130,
        totalContextTokens: 2000,
        toolCallCount: 0,
        status: "DONE"
      },
      // Step with a 2-hour approval/sleep gap before tool starts
      {
        stepIndex: 4,
        turnIndex: 0,
        model: "gemini-2.5-pro",
        createdAtMs: t0 + 20_000,
        thinkingChars: 50,
        contentChars: 50,
        inputTokens: 500,
        cacheReadTokens: 2000,
        outputTokens: 130, // ~2s fallback
        totalContextTokens: 2500,
        toolCallCount: 1,
        status: "DONE"
      }
    ],
    toolCalls: [
      {
        stepIndex: 5,
        plannerStepIndex: 4,
        turnIndex: 0,
        toolCallId: "t-sleep",
        toolName: "run_command",
        category: "command",
        mcpServer: null,
        skillName: null,
        skillPlugin: null,
        targetPath: null,
        childConversationId: null,
        startedAtMs: t0 + twoHoursMs + 20_000,
        completedAtMs: t0 + twoHoursMs + 23_000,
        durationMs: 3_000,
        argsPreview: "npm test",
        commandPathHints: [],
        resultBytes: 100,
        estResultTokens: 25,
        isError: false,
        errorPreview: null
      }
    ]
  };

  const hooks: HookEventRow[] = [
    {
      id: 1,
      tsMs: t0 + 18_000,
      hookEventName: "Stop",
      conversationId: "conv-hooks-and-gap",
      workspacePaths: [],
      transcriptPath: null,
      modelName: null,
      cwd: null,
      stepIdx: null,
      invocationNum: 0,
      terminationReason: "NO_TOOL_CALL",
      error: null,
      lastUserInput: null,
      toolCallId: null,
      toolName: null,
      argBytes: null
    }
  ];

  const analyzed = analyzeConversation(parsed, hooks, {
    surface: "antigravity",
    projectPath: "/Users/dev/proj",
    projectSource: "hook",
    parentConversationId: null,
    subagentRole: null,
    subagentType: null
  });

  // Steps 1 & 2 should NOT match the Stop hook at +18s; only Step 3 should match (+8s)!
  assert.equal(analyzed.plannerSteps[0].modelDurationMs, 1000);
  assert.equal(analyzed.plannerSteps[1].modelDurationMs, 1000);
  assert.equal(analyzed.plannerSteps[2].modelDurationMs, 8000);
  // Step 4 had a 2h gap -> falls back to ~2s model time, and ~2h goes to userIdleMs
  assert.equal(analyzed.plannerSteps[3].modelDurationMs, 2000);
  assert.ok(analyzed.activeMs < 20_000);
  assert.ok(analyzed.userIdleMs > 7_000_000);
});

test("buildProjectDetail merges overlapping parallel subagent intervals for project activeMs while preserving subagentMs", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-parallel-proj-"));
  const db = new TrackerDatabase(tmpDir);
  const t0 = Date.parse("2026-11-21T16:00:00Z");
  const tenMin = 10 * 60 * 1000;

  try {
    const makeConv = (id: string, parentId: string | null) =>
      analyzeConversation(
        {
          conversationId: id,
          transcriptPath: `/tmp/${id}.jsonl`,
          title: id,
          startedAtMs: t0,
          endedAtMs: t0 + tenMin,
          models: ["gemini-2.5-pro"],
          slashCommands: [],
          candidatePaths: [],
          turns: [
            {
              turnIndex: 0,
              stepIndex: 0,
              createdAtMs: t0,
              promptText: "Work",
              promptPreview: "Work",
              promptBytes: 4,
              slashCommand: null
            }
          ],
          plannerSteps: [
            {
              stepIndex: 1,
              turnIndex: 0,
              model: "gemini-2.5-pro",
              createdAtMs: t0,
              thinkingChars: 10,
              contentChars: 10,
              inputTokens: 1000,
              cacheReadTokens: 0,
              outputTokens: 65,
              totalContextTokens: 1000,
              toolCallCount: 1,
              status: "DONE"
            }
          ],
          toolCalls: [
            {
              stepIndex: 2,
              plannerStepIndex: 1,
              turnIndex: 0,
              toolCallId: `${id}-tool`,
              toolName: "run_command",
              category: "command",
              mcpServer: null,
              skillName: null,
              skillPlugin: null,
              targetPath: null,
              childConversationId: null,
              startedAtMs: t0 + 1000,
              completedAtMs: t0 + tenMin,
              durationMs: tenMin - 1000,
              argsPreview: "npm run build",
              commandPathHints: [],
              resultBytes: 100,
              estResultTokens: 25,
              isError: false,
              errorPreview: null
            }
          ]
        },
        [],
        {
          surface: "antigravity",
          projectPath: "/Users/dev/parallel-proj",
          projectSource: "hook",
          parentConversationId: parentId,
          subagentRole: parentId ? "Worker" : null,
          subagentType: parentId ? "self" : null
        }
      );

    db.upsertConversation(makeConv("parent-1", null));
    db.upsertConversation(makeConv("sub-1", "parent-1"));
    db.upsertConversation(makeConv("sub-2", "parent-1"));

    const detail = buildProjectDetail(db, "/Users/dev/parallel-proj");
    assert.ok(detail);
    // Wall-clock merged across parent + 2 parallel subagents running in [t0, t0 + 10m] is 10m
    assert.equal(detail.summary.time.activeMs, tenMin);
    // Summed subagent compute time across the 2 subagents is 20m
    assert.equal(detail.summary.time.subagentMs, tenMin * 2);
  } finally {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("formatDurationShort avoids 1m 60s, aggregateSkillToolMetrics merges overlapping tool batches, and subagent titles & legacy telemetry propagate", () => {
  assert.equal(formatDurationShort(119_900), "2m 0s");
  assert.equal(formatDurationShort(59_900), "1m 0s");
  assert.equal(formatDurationShort(59_400), "59.4s");

  const t0 = Date.parse("2026-11-21T16:50:45Z");
  // Three overlapping batched write_file calls spanning 16:50:45..16:51:13 (28s total wall-clock)
  const metrics = aggregateSkillToolMetrics(
    [
      {
        id: 1,
        stepIndex: 94,
        plannerStepIndex: 93,
        turnIndex: 0,
        toolCallId: null,
        toolName: "write_file",
        category: "file_write",
        mcpServer: null,
        skillName: null,
        skillPlugin: null,
        targetPath: "/a.ts",
        childConversationId: null,
        startedAtMs: t0,
        completedAtMs: t0 + 13_000,
        durationMs: 13_000,
        argsPreview: "/a.ts",
        resultBytes: 100,
        estResultTokens: 25,
        attributedInputTokens: 25,
        compoundedCacheTokens: 50,
        isError: false,
        errorPreview: null
      },
      {
        id: 2,
        stepIndex: 95,
        plannerStepIndex: 93,
        turnIndex: 0,
        toolCallId: null,
        toolName: "write_file",
        category: "file_write",
        mcpServer: null,
        skillName: null,
        skillPlugin: null,
        targetPath: "/b.ts",
        childConversationId: null,
        startedAtMs: t0 + 1_000,
        completedAtMs: t0 + 20_000,
        durationMs: 19_000,
        argsPreview: "/b.ts",
        resultBytes: 100,
        estResultTokens: 25,
        attributedInputTokens: 25,
        compoundedCacheTokens: 50,
        isError: false,
        errorPreview: null
      },
      {
        id: 3,
        stepIndex: 96,
        plannerStepIndex: 93,
        turnIndex: 0,
        toolCallId: null,
        toolName: "write_file",
        category: "file_write",
        mcpServer: null,
        skillName: null,
        skillPlugin: null,
        targetPath: "/c.ts",
        childConversationId: null,
        startedAtMs: t0 + 12_000,
        completedAtMs: t0 + 28_000,
        durationMs: 16_000,
        argsPreview: "/c.ts",
        resultBytes: 100,
        estResultTokens: 25,
        attributedInputTokens: 25,
        compoundedCacheTokens: 50,
        isError: false,
        errorPreview: null
      }
    ],
    [
      {
        stepIndex: 93,
        model: "gemini-2.5-pro",
        inputTokens: 1000,
        cacheReadTokens: 0,
        outputTokens: 200
      }
    ],
    DEFAULT_PRICING_RULES
  );
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0].calls, 3);
  // Summed = 48s, merged wall-clock = 28s
  assert.equal(metrics[0].totalDurationMs, 28_000);

  const analyzedSub = analyzeConversation(
    {
      conversationId: "5940d7d7-0d03-4474-a766-8e763b84342c",
      transcriptPath: "/tmp/sub.jsonl",
      title: "5940d7d7",
      hasExplicitUserPrompt: false,
      systemTaskPreview: "Implement media service endpoint",
      hasTokenTelemetry: false,
      startedAtMs: t0,
      endedAtMs: t0 + 5000,
      models: [],
      slashCommands: [],
      turns: [],
      plannerSteps: [],
      toolCalls: [],
      candidatePaths: []
    },
    [],
    {
      surface: "antigravity",
      projectPath: "/Users/dev/musiclab",
      projectSource: "parent",
      parentConversationId: "parent-id",
      subagentRole: "Backend Implementer",
      subagentType: "self"
    }
  );
  assert.equal(
    analyzedSub.title,
    "Backend Implementer — Implement media service endpoint"
  );
  assert.equal(analyzedSub.hasTokenTelemetry, false);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-legacy-tok-"));
  const db = new TrackerDatabase(tmpDir);
  try {
    db.upsertConversation(analyzedSub);
    const stored = db.getConversationRecord("5940d7d7-0d03-4474-a766-8e763b84342c");
    assert.ok(stored);
    const summary = buildConversationSummary(
      stored,
      [],
      [],
      0,
      DEFAULT_PRICING_RULES
    );
    assert.equal(summary.tokens.hasTokenTelemetry, false);
    assert.equal(
      summary.title,
      "Backend Implementer — Implement media service endpoint"
    );
  } finally {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("aggregateModelUsage, mergeModelBreakdowns, extractModelSwitches, and model_split diagnostics track multi-model orchestration", () => {
  const breakdown = aggregateModelUsage(
    [
      {
        model: "gemini-2.5-pro",
        inputTokens: 10_000,
        cacheReadTokens: 30_000,
        outputTokens: 10_000, // 50,000 total (50%)
        modelDurationMs: 6_000,
        conversationId: "c1"
      },
      {
        model: "gemini-2.5-flash",
        inputTokens: 10_000,
        cacheReadTokens: 19_000,
        outputTokens: 1_000, // 30,000 total (30%)
        modelDurationMs: 2_000,
        conversationId: "c1"
      },
      {
        model: "custom-unpriced-model",
        inputTokens: 5_000,
        cacheReadTokens: 14_000,
        outputTokens: 1_000, // 20,000 total (20%)
        modelDurationMs: 2_000,
        conversationId: "c2"
      },
      {
        model: "gemini-2.5-flash",
        inputTokens: 0,
        cacheReadTokens: 0,
        outputTokens: 0,
        modelDurationMs: 0,
        conversationId: "c2"
      }
    ],
    DEFAULT_PRICING_RULES
  );

  assert.equal(breakdown.length, 3);
  assert.equal(breakdown[0].model, "gemini-2.5-pro");
  assert.ok(Math.abs(breakdown[0].tokenShare - 0.5) < 1e-9);
  assert.ok(Math.abs(breakdown[0].stepShare - 0.25) < 1e-9);
  assert.ok(Math.abs(breakdown[0].timeShare - 0.6) < 1e-9);
  assert.ok(Math.abs(breakdown[0].cacheHitRatio - 0.75) < 1e-9);
  assert.equal(breakdown[0].chatCount, 1);
  assert.ok(breakdown[0].estimatedCostUsd !== null);

  assert.equal(breakdown[1].model, "gemini-2.5-flash");
  assert.ok(Math.abs(breakdown[1].tokenShare - 0.3) < 1e-9);
  assert.ok(Math.abs(breakdown[1].stepShare - 0.5) < 1e-9);
  assert.equal(breakdown[1].chatCount, 2);

  assert.equal(breakdown[2].model, "custom-unpriced-model");
  assert.ok(Math.abs(breakdown[2].tokenShare - 0.2) < 1e-9);
  assert.equal(breakdown[2].estimatedCostUsd, null);

  const merged = mergeModelBreakdowns([
    breakdown,
    aggregateModelUsage(
      [
        {
          model: "gemini-2.5-pro",
          inputTokens: 50_000,
          cacheReadTokens: 40_000,
          outputTokens: 10_000,
          modelDurationMs: 10_000,
          conversationId: "c3"
        }
      ],
      DEFAULT_PRICING_RULES
    )
  ]);
  assert.equal(merged[0].model, "gemini-2.5-pro");
  assert.equal(merged[0].totalTokens, 150_000);
  const sumTokenShares = merged.reduce((s, m) => s + m.tokenShare, 0);
  assert.ok(Math.abs(sumTokenShares - 1) < 1e-9);

  const switches = extractModelSwitches(
    [
      { stepIndex: 1, turnIndex: 0, model: "gemini-2.5-pro", createdAtMs: 1000, isCacheMiss: false, inputTokens: 1000 },
      { stepIndex: 3, turnIndex: 0, model: "gemini-2.5-flash", createdAtMs: 2000, isCacheMiss: true, inputTokens: 2500 },
      { stepIndex: 5, turnIndex: 1, model: "gemini-2.5-pro", createdAtMs: 3000, isCacheMiss: false, inputTokens: 400 },
      { stepIndex: 7, turnIndex: 1, model: "gemini-2.5-flash", createdAtMs: 4000, isCacheMiss: false, inputTokens: 300 }
    ],
    [
      { turnIndex: 0, promptPreview: "Plan" },
      { turnIndex: 1, promptPreview: "Verify final test output" }
    ],
    [
      { plannerStepIndex: 1, toolName: "exit_plan_mode" },
      { plannerStepIndex: 5, toolName: "read_file" }
    ]
  );
  assert.equal(switches.length, 3);
  assert.equal(switches[0].trigger, "Plan → Execute handoff (exit_plan_mode)");
  assert.equal(switches[0].isCacheMiss, true);
  assert.equal(switches[0].inputTokensAfter, 2500);
  assert.match(switches[1].trigger, /^New turn: "Verify final test output"/);
  assert.equal(switches[2].trigger, "Mid-turn model switch");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-model-split-"));
  const db = new TrackerDatabase(tmpDir);
  const t0 = Date.parse("2026-11-22T09:00:00Z");
  try {
    const conv = analyzeConversation(
      {
        conversationId: "conv-multi-model",
        transcriptPath: "/tmp/mm.jsonl",
        title: "Orchestrated build",
        startedAtMs: t0,
        endedAtMs: t0 + 12_000,
        models: ["gemini-2.5-pro", "gemini-2.5-flash"],
        slashCommands: [],
        candidatePaths: [],
        turns: [
          {
            turnIndex: 0,
            stepIndex: 0,
            createdAtMs: t0,
            promptText: "Build & verify",
            promptPreview: "Build & verify",
            promptBytes: 14,
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
            contentChars: 50,
            inputTokens: 10_000,
            cacheReadTokens: 0,
            outputTokens: 500,
            totalContextTokens: 10_000,
            toolCallCount: 1,
            status: "DONE"
          },
          {
            stepIndex: 3,
            turnIndex: 0,
            model: "gemini-2.5-flash",
            createdAtMs: t0 + 4_000,
            thinkingChars: 40,
            contentChars: 120,
            inputTokens: 9_000,
            cacheReadTokens: 1_500,
            outputTokens: 500,
            totalContextTokens: 10_500,
            toolCallCount: 0,
            status: "DONE"
          }
        ],
        toolCalls: [
          {
            stepIndex: 2,
            plannerStepIndex: 1,
            turnIndex: 0,
            toolCallId: "e1",
            toolName: "exit_plan_mode",
            category: "other",
            mcpServer: null,
            skillName: null,
            skillPlugin: null,
            targetPath: null,
            childConversationId: null,
            startedAtMs: t0 + 2_000,
            completedAtMs: t0 + 2_100,
            durationMs: 100,
            argsPreview: "",
            commandPathHints: [],
            resultBytes: 50,
            estResultTokens: 13,
            isError: false,
            errorPreview: null
          }
        ]
      },
      [],
      {
        surface: "antigravity",
        projectPath: "/Users/dev/multi-proj",
        projectSource: "hook",
        parentConversationId: null,
        subagentRole: null,
        subagentType: null
      }
    );

    assert.ok(conv.diagnostics.some((d) => d.category === "model_split"));
    db.upsertConversation(conv);

    const chatDetail = buildConversationDetail(db, "conv-multi-model");
    assert.ok(chatDetail);
    assert.equal(chatDetail.modelSwitches.length, 1);
    assert.equal(chatDetail.modelSwitches[0].trigger, "Plan → Execute handoff (exit_plan_mode)");
    assert.equal(chatDetail.summary.modelBreakdown.length, 2);

    const projDetail = buildProjectDetail(db, "/Users/dev/multi-proj");
    assert.ok(projDetail);
    assert.equal(projDetail.summary.modelBreakdown.length, 2);

    const dash = buildDashboardData(db);
    assert.equal(dash.totals.modelBreakdown.length, 2);
  } finally {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("aggregatePluginSkillMetrics rolls up plugin sub-skills, scripts, CLIs, and MCP servers without listing methods or sub-skills", () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "agy-plugin-rollup-"));
  clearInstalledPluginsCache();

  try {
    // Seed fake plugins directory
    const spDir = path.join(tmpRoot, "superpowers", "skills", "executing-plans", "scripts");
    fs.mkdirSync(spDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmpRoot, "superpowers", "plugin.json"),
      JSON.stringify({ name: "superpowers", displayName: "Superpowers" }),
      "utf8"
    );

    const frDir = path.join(tmpRoot, "flight-recorder");
    fs.mkdirSync(frDir, { recursive: true });
    fs.writeFileSync(
      path.join(frDir, "plugin.json"),
      JSON.stringify({ name: "flight-recorder", displayName: "Flight Recorder" }),
      "utf8"
    );

    const gmailScriptsDir = path.join(tmpRoot, "gmail", "skills", "gmail", "scripts");
    fs.mkdirSync(gmailScriptsDir, { recursive: true });
    fs.writeFileSync(
      path.join(tmpRoot, "gmail", "plugin.json"),
      JSON.stringify({ name: "gmail", displayName: "Gmail" }),
      "utf8"
    );
    fs.writeFileSync(path.join(gmailScriptsDir, "gmail"), "#!/bin/sh\n", "utf8");

    const registry = discoverInstalledPlugins(tmpRoot);
    assert.equal(registry.byId.get("superpowers")?.displayName, "Superpowers");
    assert.equal(registry.cliToPlugin.get("gmail"), "gmail");

    const t0 = Date.parse("2026-11-22T15:00:00Z");
    const steps = [
      { stepIndex: 1, model: "gemini-2.5-pro", conversationId: "c1" },
      { stepIndex: 10, model: "gemini-2.5-pro", conversationId: "c2" }
    ];

    const metrics = aggregatePluginSkillMetrics(
      [
        // Superpowers sub-skill 1
        {
          id: 1,
          stepIndex: 2,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: null,
          toolName: "read_file",
          category: "skill",
          mcpServer: null,
          skillName: "test-driven-development",
          skillPlugin: "superpowers",
          targetPath: "/x/plugins/superpowers/skills/test-driven-development/SKILL.md",
          childConversationId: null,
          startedAtMs: t0,
          completedAtMs: t0 + 2_000,
          durationMs: 2_000,
          argsPreview: "",
          resultBytes: 1000,
          estResultTokens: 250,
          attributedInputTokens: 1000,
          compoundedCacheTokens: 9000,
          isError: false,
          errorPreview: null,
          conversationId: "c1"
        },
        // Superpowers sub-skill 2 (overlapping wall time)
        {
          id: 2,
          stepIndex: 3,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: null,
          toolName: "read_file",
          category: "skill",
          mcpServer: null,
          skillName: "brainstorming",
          skillPlugin: "superpowers",
          targetPath: "/x/plugins/superpowers/skills/brainstorming/SKILL.md",
          childConversationId: null,
          startedAtMs: t0 + 1_000,
          completedAtMs: t0 + 4_000,
          durationMs: 3_000,
          argsPreview: "",
          resultBytes: 1000,
          estResultTokens: 250,
          attributedInputTokens: 1000,
          compoundedCacheTokens: 4000,
          isError: false,
          errorPreview: null,
          conversationId: "c1"
        },
        // Superpowers helper script invocation via run_command
        {
          id: 3,
          stepIndex: 4,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: null,
          toolName: "run_command",
          category: "command",
          mcpServer: null,
          skillName: null,
          skillPlugin: null,
          targetPath: null,
          childConversationId: null,
          startedAtMs: t0 + 5_000,
          completedAtMs: t0 + 6_000,
          durationMs: 1_000,
          argsPreview:
            "cd /proj && bash /Users/dev/.gemini/config/plugins/superpowers/skills/executing-plans/scripts/task-start plan.md 1",
          resultBytes: 200,
          estResultTokens: 50,
          attributedInputTokens: 500,
          compoundedCacheTokens: 4500,
          isError: false,
          errorPreview: null,
          conversationId: "c1"
        },
        // Non-plugin inspection commands should NOT count as plugin usage
        {
          id: 4,
          stepIndex: 5,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: null,
          toolName: "run_command",
          category: "command",
          mcpServer: null,
          skillName: null,
          skillPlugin: null,
          targetPath: null,
          childConversationId: null,
          startedAtMs: t0 + 7_000,
          completedAtMs: t0 + 8_000,
          durationMs: 1_000,
          argsPreview: "npm test && ls /Users/dev/.gemini/config/plugins",
          resultBytes: 200,
          estResultTokens: 50,
          attributedInputTokens: 9999,
          compoundedCacheTokens: 99999,
          isError: false,
          errorPreview: null,
          conversationId: "c1"
        },
        // Flight Recorder MCP + skill roll together under "Flight Recorder"
        {
          id: 5,
          stepIndex: 6,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: null,
          toolName: "get_chat_analysis",
          category: "mcp",
          mcpServer: "flight-recorder_recorder",
          skillName: null,
          skillPlugin: null,
          targetPath: null,
          childConversationId: null,
          startedAtMs: t0 + 9_000,
          completedAtMs: t0 + 10_000,
          durationMs: 1_000,
          argsPreview: "flight-recorder_recorder/get_chat_analysis",
          resultBytes: 800,
          estResultTokens: 200,
          attributedInputTokens: 1000,
          compoundedCacheTokens: 4000,
          isError: false,
          errorPreview: null,
          conversationId: "c1"
        },
        {
          id: 6,
          stepIndex: 7,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: null,
          toolName: "read_file",
          category: "skill",
          mcpServer: null,
          skillName: "flight-recorder",
          skillPlugin: null,
          targetPath: "/proj/skills/flight-recorder/SKILL.md",
          childConversationId: null,
          startedAtMs: t0 + 11_000,
          completedAtMs: t0 + 12_000,
          durationMs: 1_000,
          argsPreview: "",
          resultBytes: 400,
          estResultTokens: 100,
          attributedInputTokens: 500,
          compoundedCacheTokens: 1500,
          isError: false,
          errorPreview: null,
          conversationId: "c1"
        },
        // Standalone MCP server (not in ~/.gemini/config/plugins) rolls multiple methods into one entry
        {
          id: 7,
          stepIndex: 8,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: null,
          toolName: "emby_get_libraries",
          category: "mcp",
          mcpServer: "emby-mcp",
          skillName: null,
          skillPlugin: null,
          targetPath: null,
          childConversationId: null,
          startedAtMs: t0 + 13_000,
          completedAtMs: t0 + 14_000,
          durationMs: 1_000,
          argsPreview: "emby-mcp/emby_get_libraries",
          resultBytes: 400,
          estResultTokens: 100,
          attributedInputTokens: 600,
          compoundedCacheTokens: 1400,
          isError: false,
          errorPreview: null,
          conversationId: "c1"
        },
        // Gmail skill + Gmail CLI invocation roll together
        {
          id: 8,
          stepIndex: 9,
          plannerStepIndex: 1,
          turnIndex: 0,
          toolCallId: null,
          toolName: "read_file",
          category: "skill",
          mcpServer: null,
          skillName: "gmail",
          skillPlugin: "gmail",
          targetPath: "/x/plugins/gmail/skills/gmail/SKILL.md",
          childConversationId: null,
          startedAtMs: t0 + 15_000,
          completedAtMs: t0 + 16_000,
          durationMs: 1_000,
          argsPreview: "",
          resultBytes: 300,
          estResultTokens: 75,
          attributedInputTokens: 400,
          compoundedCacheTokens: 600,
          isError: false,
          errorPreview: null,
          conversationId: "c1"
        },
        {
          id: 9,
          stepIndex: 11,
          plannerStepIndex: 10,
          turnIndex: 0,
          toolCallId: null,
          toolName: "run_command",
          category: "command",
          mcpServer: null,
          skillName: null,
          skillPlugin: null,
          targetPath: null,
          childConversationId: null,
          startedAtMs: t0 + 17_000,
          completedAtMs: t0 + 19_000,
          durationMs: 2_000,
          argsPreview: 'AGY_ACCOUNT=work gmail readonly read "from:amazon" --max 5',
          resultBytes: 600,
          estResultTokens: 150,
          attributedInputTokens: 1000,
          compoundedCacheTokens: 3000,
          isError: false,
          errorPreview: null,
          conversationId: "c2"
        },
        // Builtin standalone skill remains a Skill entry
        {
          id: 10,
          stepIndex: 12,
          plannerStepIndex: 10,
          turnIndex: 0,
          toolCallId: null,
          toolName: "read_file",
          category: "skill",
          mcpServer: null,
          skillName: "mcp-app-development",
          skillPlugin: "builtin",
          targetPath: "/x/builtin/skills/mcp-app-development/SKILL.md",
          childConversationId: null,
          startedAtMs: t0 + 20_000,
          completedAtMs: t0 + 21_000,
          durationMs: 1_000,
          argsPreview: "",
          resultBytes: 500,
          estResultTokens: 125,
          attributedInputTokens: 200,
          compoundedCacheTokens: 800,
          isError: false,
          errorPreview: null,
          conversationId: "c2"
        }
      ],
      steps,
      DEFAULT_PRICING_RULES,
      registry
    );

    const names = metrics.map((m) => m.name);
    assert.deepEqual(names, [
      "Superpowers",
      "Flight Recorder",
      "Gmail",
      "emby-mcp",
      "mcp-app-development"
    ]);
    // No sub-skills or method names exposed!
    assert.equal(names.includes("test-driven-development"), false);
    assert.equal(names.includes("brainstorming"), false);
    assert.equal(names.includes("get_chat_analysis"), false);
    assert.equal(names.includes("emby_get_libraries"), false);

    assert.equal(metrics[0].kind, "Plugin");
    assert.equal(metrics[0].calls, 3);
    assert.equal(metrics[0].totalTokens, 20_000);
    // [0..4000] merged = 4000 + [5000..6000] = 1000 => 5000ms wall-clock
    assert.equal(metrics[0].totalDurationMs, 5_000);

    assert.equal(metrics[1].kind, "Plugin");
    assert.equal(metrics[1].calls, 2);
    assert.equal(metrics[1].totalTokens, 7_000);

    assert.equal(metrics[2].kind, "Plugin");
    assert.equal(metrics[2].calls, 2);
    assert.equal(metrics[2].chatCount, 2);
    assert.equal(metrics[2].totalTokens, 5_000);

    assert.equal(metrics[4].kind, "Skill");
    assert.equal(metrics[4].totalTokens, 1_000);

    const sumShares = metrics.reduce((s, m) => s + m.tokenShare, 0);
    // Scope-wide context share: 35,000 plugin/skill tokens out of 144,998 total tool context tokens (< 100%)
    assert.ok(Math.abs(sumShares - 35_000 / 144_998) < 1e-6);
    assert.ok(sumShares < 1);

    const merged = mergePluginSkillMetrics([
      { projectPath: "/proj/a", metrics },
      { projectPath: "/proj/b", metrics: metrics.slice(0, 1) }
    ]);
    assert.equal(merged[0].name, "Superpowers");
    assert.equal(merged[0].totalTokens, 40_000);
    assert.equal(merged[0].projectCount, 2);
    assert.equal(merged[1].projectCount, 1);
  } finally {
    clearInstalledPluginsCache();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
