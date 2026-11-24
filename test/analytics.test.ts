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
  computeContextHealth,
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
import {
  computeLocalPresetSinceMs,
  computePriorTimeRangeBounds,
  resolveTimeRangeBounds
} from "../src/shared/timeRange.js";
import {
  deltaBadgeTone,
  fmtDateSpan,
  fmtDeltaPct,
  fmtDeltaPp,
  formatTimeRangeSummary
} from "../src/ui/format.js";

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

test("aggregateSkillToolMetrics captures deduplicated errorSamples with counts and chat/step context", () => {
  const t0 = Date.parse("2026-11-23T15:00:00Z");
  const baseCall = {
    plannerStepIndex: 1,
    turnIndex: 0,
    toolCallId: null,
    mcpServer: null,
    skillName: null,
    skillPlugin: null,
    targetPath: null,
    childConversationId: null,
    startedAtMs: t0,
    completedAtMs: t0 + 1000,
    durationMs: 1000,
    resultBytes: 120,
    estResultTokens: 30,
    attributedInputTokens: 100,
    compoundedCacheTokens: 200
  };

  const metrics = aggregateSkillToolMetrics(
    [
      {
        ...baseCall,
        id: 1,
        stepIndex: 2,
        toolName: "run_command",
        category: "command",
        argsPreview: "npm test",
        isError: true,
        errorPreview: "Command exited with code 1.\nTest failed",
        conversationId: "chat-1",
        conversationTitle: "Fix parser"
      },
      {
        ...baseCall,
        id: 2,
        stepIndex: 4,
        toolName: "run_command",
        category: "command",
        argsPreview: "npm test",
        isError: true,
        errorPreview: "command exited with code 1.   Test failed",
        conversationId: "chat-2",
        conversationTitle: "Retry parser"
      },
      {
        ...baseCall,
        id: 3,
        stepIndex: 5,
        toolName: "run_command",
        category: "command",
        argsPreview: "npm run lint",
        isError: true,
        errorPreview: "Command exited with code 2. Lint error",
        conversationId: "chat-2",
        conversationTitle: "Retry parser"
      },
      {
        ...baseCall,
        id: 4,
        stepIndex: 6,
        toolName: "run_command",
        category: "command",
        argsPreview: "npm run typecheck",
        isError: true,
        errorPreview: "Command exited with code 2. Type error",
        conversationId: "chat-2",
        conversationTitle: "Retry parser"
      },
      {
        ...baseCall,
        id: 5,
        stepIndex: 7,
        toolName: "run_command",
        category: "command",
        argsPreview: "npm run build",
        isError: true,
        errorPreview: "Command exited with code 2. Build error",
        conversationId: "chat-2",
        conversationTitle: "Retry parser"
      },
      {
        ...baseCall,
        id: 6,
        stepIndex: 8,
        toolName: "read_file",
        category: "file_read",
        targetPath: "/repo/src/index.ts",
        argsPreview: "/repo/src/index.ts",
        isError: false,
        errorPreview: null,
        conversationId: "chat-1",
        conversationTitle: "Fix parser"
      }
    ],
    [{ stepIndex: 1, model: "gemini-2.5-pro", inputTokens: 100, cacheReadTokens: 0, outputTokens: 50 }],
    DEFAULT_PRICING_RULES
  );

  const cmdMetric = metrics.find((m) => m.name === "run_command");
  assert.ok(cmdMetric);
  assert.equal(cmdMetric.errors, 5);
  assert.ok(cmdMetric.errorSamples);
  assert.equal(cmdMetric.errorSamples.length, 3, "Tool errorSamples must cap at 3");
  assert.equal(cmdMetric.errorSamples[0].count, 2);
  assert.equal(cmdMetric.errorSamples[0].target, "npm test");
  assert.equal(cmdMetric.errorSamples[0].conversationId, "chat-1");
  assert.equal(cmdMetric.errorSamples[0].conversationTitle, "Fix parser");
  assert.equal(cmdMetric.errorSamples[0].stepIndex, 2);

  const readMetric = metrics.find((m) => m.name === "read_file");
  assert.ok(readMetric);
  assert.equal(readMetric.errors, 0);
  assert.equal(readMetric.errorSamples, undefined);
});

test("time-range helpers and dashboard/project filtering slice conversations accurately", () => {
  // Choose a deterministic local reference instant: Nov 23, 2026 15:00 local time
  const refNow = new Date(2026, 10, 23, 15, 0, 0, 0).getTime();
  const midnightToday = new Date(2026, 10, 23, 0, 0, 0, 0).getTime();
  const sevenDaysStart = new Date(2026, 10, 17, 0, 0, 0, 0).getTime();
  const thirtyDaysStart = new Date(2026, 9, 25, 0, 0, 0, 0).getTime();

  assert.equal(computeLocalPresetSinceMs("all", refNow), null);
  assert.equal(computeLocalPresetSinceMs("today", refNow), midnightToday);
  assert.equal(computeLocalPresetSinceMs("7d", refNow), sevenDaysStart);
  assert.equal(computeLocalPresetSinceMs("30d", refNow), thirtyDaysStart);

  const customSince = midnightToday - 3_600_000;
  assert.deepEqual(
    resolveTimeRangeBounds({ preset: "today", sinceMs: customSince, untilMs: refNow }),
    { preset: "today", sinceMs: customSince, untilMs: refNow }
  );
  assert.deepEqual(
    resolveTimeRangeBounds({ preset: "all", sinceMs: customSince, untilMs: refNow }),
    { preset: "all", sinceMs: null, untilMs: refNow }
  );

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-timerange-"));
  const db = new TrackerDatabase(tmpDir);
  try {
    const insertConv = (
      id: string,
      title: string,
      projectPath: string,
      startedAtMs: number,
      endedAtMs: number,
      inputTokens: number
    ) => {
      db.upsertConversation({
        conversationId: id,
        title,
        surface: "antigravity",
        transcriptPath: `/tmp/${id}.jsonl`,
        projectPath,
        projectSource: "hook",
        parentConversationId: null,
        subagentRole: null,
        subagentType: null,
        startedAtMs,
        endedAtMs,
        terminationReason: "stop",
        models: ["gemini-2.5-pro"],
        slashCommands: [],
        skillsUsed: [],
        hasLiveHooks: false,
        hasTokenTelemetry: true,
        inputTokens,
        cacheReadTokens: 0,
        outputTokens: 100,
        peakContextTokens: inputTokens,
        activeMs: 5_000,
        modelMs: 4_000,
        toolWallMs: 1_000,
        toolSumMs: 1_000,
        userIdleMs: 0,
        wallClockMs: endedAtMs - startedAtMs,
        errorCount: 0,
        turns: [],
        plannerSteps: [
          {
            stepIndex: 1,
            turnIndex: 0,
            model: "gemini-2.5-pro",
            createdAtMs: endedAtMs - 4_000,
            completedAtMs: endedAtMs,
            modelDurationMs: 4_000,
            thinkingChars: 100,
            contentChars: 100,
            inputTokens,
            cacheReadTokens: 0,
            outputTokens: 100,
            totalContextTokens: inputTokens,
            cacheHitRatio: 0,
            toolCallCount: 0,
            status: "DONE",
            attributedSummary: "Work",
            isCacheMiss: false,
            cacheMissCause: null
          }
        ],
        toolCalls: [],
        diagnostics: [],
        filesTouched: [],
        indexedAtMs: endedAtMs
      });
    };

    // 1. Conversation strictly today
    insertConv(
      "conv-today",
      "Today work",
      "/proj/alpha",
      midnightToday + 3_600_000,
      midnightToday + 7_200_000,
      1_000
    );
    // 2. Conversation spanning midnight (started yesterday, ended today -> counts in Today)
    insertConv(
      "conv-midnight",
      "Overnight work",
      "/proj/alpha",
      midnightToday - 1_800_000,
      midnightToday + 900_000,
      2_000
    );
    // 3. Conversation 5 days ago
    insertConv(
      "conv-5d",
      "Five days ago",
      "/proj/beta",
      midnightToday - 5 * 86_400_000 + 1_000,
      midnightToday - 5 * 86_400_000 + 6_000,
      4_000
    );
    // 4. Conversation 45 days ago
    insertConv(
      "conv-45d",
      "Old work",
      "/proj/gamma",
      midnightToday - 45 * 86_400_000,
      midnightToday - 45 * 86_400_000 + 6_000,
      8_000
    );

    const dashAll = buildDashboardData(db, { preset: "all", untilMs: refNow });
    assert.equal(dashAll.totals.projectCount, 3);
    assert.equal(dashAll.totals.chatCount, 4);
    assert.equal(dashAll.timeRange.preset, "all");
    assert.equal(dashAll.timeRange.sinceMs, null);
    assert.equal(dashAll.timeRange.firstActivityMs, midnightToday - 45 * 86_400_000);
    assert.equal(dashAll.timeRange.lastActivityMs, midnightToday + 7_200_000);

    const dashToday = buildDashboardData(db, {
      preset: "today",
      sinceMs: midnightToday,
      untilMs: refNow
    });
    assert.equal(dashToday.totals.projectCount, 1);
    assert.equal(dashToday.totals.chatCount, 2);
    assert.equal(dashToday.totals.tokens.inputTokens, 3_000);
    assert.equal(dashToday.recentChats.length, 2);
    assert.equal(dashToday.timeRange.preset, "today");
    assert.equal(dashToday.timeRange.sinceMs, midnightToday);

    const dash7d = buildDashboardData(db, {
      preset: "7d",
      sinceMs: sevenDaysStart,
      untilMs: refNow
    });
    assert.equal(dash7d.totals.projectCount, 2);
    assert.equal(dash7d.totals.chatCount, 3);
    assert.equal(dash7d.totals.tokens.inputTokens, 7_000);

    const dash30d = buildDashboardData(db, {
      preset: "30d",
      sinceMs: thirtyDaysStart,
      untilMs: refNow
    });
    assert.equal(dash30d.totals.projectCount, 2);
    assert.equal(dash30d.totals.chatCount, 3);

    // Project exists all-time (/proj/gamma) but has 0 chats in Today -> non-null empty ProjectDetail
    const emptyProj = buildProjectDetail(db, "/proj/gamma", {
      preset: "today",
      sinceMs: midnightToday,
      untilMs: refNow
    });
    assert.ok(emptyProj);
    assert.equal(emptyProj.summary.chatCount, 0);
    assert.equal(emptyProj.summary.tokens.estimatedCostUsd, 0);
    assert.deepEqual(emptyProj.chats, []);
    assert.equal(emptyProj.timeRange.preset, "today");

    // Non-existent project still returns null
    assert.equal(
      buildProjectDetail(db, "/proj/does-not-exist", {
        preset: "today",
        sinceMs: midnightToday,
        untilMs: refNow
      }),
      null
    );

    // Date-span formatting
    const sameDaySpan = fmtDateSpan(
      new Date(2026, 10, 23, 9, 0).getTime(),
      new Date(2026, 10, 23, 18, 0).getTime(),
      refNow
    );
    assert.ok(sameDaySpan.includes("23"));
    assert.equal(sameDaySpan.includes("2026"), false);

    const crossYearSpan = fmtDateSpan(
      new Date(2025, 11, 20, 12, 0).getTime(),
      new Date(2026, 0, 5, 12, 0).getTime(),
      refNow
    );
    assert.ok(crossYearSpan.includes("2025"));
    assert.ok(crossYearSpan.includes("2026"));

    const emptyAllSummary = formatTimeRangeSummary(
      { preset: "all", sinceMs: null, untilMs: refNow, firstActivityMs: 0, lastActivityMs: 0 },
      false
    );
    assert.deepEqual(emptyAllSummary, { label: "All time", span: null });
  } finally {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("computeContextHealth and ContextHealthSummary aggregate 200k cliffs, 256k compactions, resets, and legacy chats", () => {
  const unitHealth = computeContextHealth(
    [
      { hasTokenTelemetry: true, peakContextTokens: 80_000 },
      { hasTokenTelemetry: true, peakContextTokens: 210_000 },
      { hasTokenTelemetry: true, peakContextTokens: 270_000 },
      { hasTokenTelemetry: false, peakContextTokens: 999_000 },
      { hasTokenTelemetry: true, peakContextTokens: 0 }
    ],
    2
  );
  assert.equal(unitHealth.measuredChatCount, 3);
  assert.equal(unitHealth.avgPeakContextTokens, Math.round((80_000 + 210_000 + 270_000) / 3));
  assert.equal(unitHealth.maxPeakContextTokens, 270_000);
  assert.equal(unitHealth.under200kCount, 1);
  assert.ok(Math.abs(unitHealth.under200kRatio - 1 / 3) < 1e-9);
  assert.equal(unitHealth.cliff200kChats, 2);
  assert.equal(unitHealth.compaction256kChats, 1);
  assert.equal(unitHealth.compactionEventCount, 2);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fr-ctx-health-"));
  try {
    const db = new TrackerDatabase(tmpDir);
    const t0 = Date.parse("2026-11-23T10:00:00Z");

    const addConv = (opts: {
      id: string;
      projectPath: string;
      hasTokenTelemetry: boolean;
      peakContextTokens: number;
      compactionResets?: number;
      ttlMisses?: number;
    }) => {
      const steps = [] as Array<{
        stepIndex: number;
        turnIndex: number;
        model: string;
        createdAtMs: number;
        completedAtMs: number;
        modelDurationMs: number;
        thinkingChars: number;
        contentChars: number;
        inputTokens: number;
        cacheReadTokens: number;
        outputTokens: number;
        totalContextTokens: number;
        cacheHitRatio: number;
        toolCallCount: number;
        status: string;
        attributedSummary: string;
        isCacheMiss: boolean;
        cacheMissCause: string | null;
      }>;
      let stepIdx = 1;
      for (let i = 0; i < (opts.compactionResets ?? 0); i++) {
        steps.push({
          stepIndex: stepIdx++,
          turnIndex: 0,
          model: "gemini-2.5-pro",
          createdAtMs: t0 + stepIdx * 1_000,
          completedAtMs: t0 + stepIdx * 1_000 + 500,
          modelDurationMs: 500,
          thinkingChars: 10,
          contentChars: 10,
          inputTokens: opts.peakContextTokens,
          cacheReadTokens: 0,
          outputTokens: 50,
          totalContextTokens: opts.peakContextTokens,
          cacheHitRatio: 0,
          toolCallCount: 0,
          status: "DONE",
          attributedSummary: "Compaction",
          isCacheMiss: true,
          cacheMissCause: "Context compaction or prefix reset"
        });
      }
      for (let i = 0; i < (opts.ttlMisses ?? 0); i++) {
        steps.push({
          stepIndex: stepIdx++,
          turnIndex: 1,
          model: "gemini-2.5-pro",
          createdAtMs: t0 + stepIdx * 1_000,
          completedAtMs: t0 + stepIdx * 1_000 + 500,
          modelDurationMs: 500,
          thinkingChars: 10,
          contentChars: 10,
          inputTokens: 1_000,
          cacheReadTokens: 0,
          outputTokens: 50,
          totalContextTokens: opts.peakContextTokens,
          cacheHitRatio: 0,
          toolCallCount: 0,
          status: "DONE",
          attributedSummary: "TTL",
          isCacheMiss: true,
          cacheMissCause: "Idle gap expired prompt cache TTL"
        });
      }
      if (steps.length === 0) {
        steps.push({
          stepIndex: 1,
          turnIndex: 0,
          model: "gemini-2.5-pro",
          createdAtMs: t0,
          completedAtMs: t0 + 1_000,
          modelDurationMs: 1_000,
          thinkingChars: 10,
          contentChars: 10,
          inputTokens: opts.hasTokenTelemetry ? opts.peakContextTokens : 0,
          cacheReadTokens: 0,
          outputTokens: 50,
          totalContextTokens: opts.hasTokenTelemetry ? opts.peakContextTokens : 0,
          cacheHitRatio: 0,
          toolCallCount: 0,
          status: "DONE",
          attributedSummary: "Work",
          isCacheMiss: false,
          cacheMissCause: null
        });
      }

      db.upsertConversation({
        conversationId: opts.id,
        title: opts.id,
        surface: "antigravity",
        transcriptPath: `/tmp/${opts.id}.jsonl`,
        projectPath: opts.projectPath,
        projectSource: "hook",
        parentConversationId: null,
        subagentRole: null,
        subagentType: null,
        startedAtMs: t0,
        endedAtMs: t0 + 5_000,
        terminationReason: "stop",
        models: ["gemini-2.5-pro"],
        slashCommands: [],
        skillsUsed: [],
        hasLiveHooks: false,
        hasTokenTelemetry: opts.hasTokenTelemetry,
        inputTokens: opts.hasTokenTelemetry ? opts.peakContextTokens : 0,
        cacheReadTokens: 0,
        outputTokens: 50,
        peakContextTokens: opts.peakContextTokens,
        activeMs: 1_000,
        modelMs: 1_000,
        toolWallMs: 0,
        toolSumMs: 0,
        userIdleMs: 0,
        wallClockMs: 5_000,
        errorCount: 0,
        turns: [],
        plannerSteps: steps,
        toolCalls: [],
        diagnostics: [],
        filesTouched: [],
        indexedAtMs: t0 + 5_000
      });
    };

    // Proj A: 1 healthy (<200k), 1 >=200k + 1 compaction reset + 1 TTL miss
    addConv({
      id: "ctx-a1",
      projectPath: "/proj/ctx-a",
      hasTokenTelemetry: true,
      peakContextTokens: 100_000
    });
    addConv({
      id: "ctx-a2",
      projectPath: "/proj/ctx-a",
      hasTokenTelemetry: true,
      peakContextTokens: 220_000,
      compactionResets: 1,
      ttlMisses: 1
    });
    // Legacy chat should be excluded from measuredChatCount and avg
    addConv({
      id: "ctx-a-legacy",
      projectPath: "/proj/ctx-a",
      hasTokenTelemetry: false,
      peakContextTokens: 0
    });

    // Proj B: 1 >=256k with 2 compaction resets
    addConv({
      id: "ctx-b1",
      projectPath: "/proj/ctx-b",
      hasTokenTelemetry: true,
      peakContextTokens: 280_000,
      compactionResets: 2
    });

    const projA = buildProjectDetail(db, "/proj/ctx-a");
    assert.ok(projA);
    assert.equal(projA.summary.contextHealth.measuredChatCount, 2);
    assert.equal(projA.summary.contextHealth.avgPeakContextTokens, 160_000);
    assert.equal(projA.summary.contextHealth.maxPeakContextTokens, 220_000);
    assert.equal(projA.summary.contextHealth.under200kCount, 1);
    assert.equal(projA.summary.contextHealth.under200kRatio, 0.5);
    assert.equal(projA.summary.contextHealth.cliff200kChats, 1);
    assert.equal(projA.summary.contextHealth.compaction256kChats, 0);
    assert.equal(projA.summary.contextHealth.compactionEventCount, 1);

    // Global totals should average across all 3 measured chats directly: (100k + 220k + 280k) / 3 = 200k
    const dash = buildDashboardData(db);
    assert.equal(dash.totals.contextHealth.measuredChatCount, 3);
    assert.equal(dash.totals.contextHealth.avgPeakContextTokens, 200_000);
    assert.equal(dash.totals.contextHealth.maxPeakContextTokens, 280_000);
    assert.equal(dash.totals.contextHealth.under200kCount, 1);
    assert.equal(dash.totals.contextHealth.cliff200kChats, 2);
    assert.equal(dash.totals.contextHealth.compaction256kChats, 1);
    assert.equal(dash.totals.contextHealth.compactionEventCount, 3);

    db.close();
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("computePriorTimeRangeBounds, buildDashboardData/buildProjectDetail periodComparison, and delta formatters handle window boundaries and edge cases", () => {
  const refNow = new Date(2026, 10, 24, 15, 0, 0).getTime();
  const todaySince = computeLocalPresetSinceMs("today", refNow)!;
  const sevenSince = computeLocalPresetSinceMs("7d", refNow)!;
  const thirtySince = computeLocalPresetSinceMs("30d", refNow)!;

  assert.equal(
    computePriorTimeRangeBounds({ preset: "all", sinceMs: null, untilMs: refNow }),
    null
  );

  const priorToday = computePriorTimeRangeBounds({
    preset: "today",
    sinceMs: todaySince,
    untilMs: refNow
  });
  assert.ok(priorToday);
  assert.equal(priorToday.label, "vs yesterday");
  assert.equal(priorToday.priorUntilMs, todaySince);
  assert.equal(
    priorToday.priorSinceMs,
    new Date(2026, 10, 23, 0, 0, 0).getTime()
  );

  const prior7d = computePriorTimeRangeBounds({
    preset: "7d",
    sinceMs: sevenSince,
    untilMs: refNow
  });
  assert.ok(prior7d);
  assert.equal(prior7d.label, "vs prior 7d");
  assert.equal(prior7d.priorUntilMs, sevenSince);

  const prior30d = computePriorTimeRangeBounds({
    preset: "30d",
    sinceMs: thirtySince,
    untilMs: refNow
  });
  assert.ok(prior30d);
  assert.equal(prior30d.label, "vs prior 30d");
  assert.equal(prior30d.priorUntilMs, thirtySince);

  // UI delta formatter edge cases
  assert.equal(fmtDeltaPct(null), null);
  assert.equal(fmtDeltaPct(Number.NaN), null);
  assert.equal(fmtDeltaPct(0), "0%");
  assert.equal(fmtDeltaPct(0.134), "+13%");
  assert.equal(fmtDeltaPct(-0.256), "-26%");
  assert.equal(fmtDeltaPct(12.5), ">+999%");
  assert.equal(fmtDeltaPct(-12.5), "<-999%");

  assert.equal(fmtDeltaPp(null), null);
  assert.equal(fmtDeltaPp(0.2), null);
  assert.equal(fmtDeltaPp(6.4), "+6pp");
  assert.equal(fmtDeltaPp(-4.6), "-5pp");

  assert.equal(deltaBadgeTone(-0.1, "lower-is-better"), "success");
  assert.equal(deltaBadgeTone(0.1, "lower-is-better"), "warning");
  assert.equal(deltaBadgeTone(0.1, "higher-is-better"), "success");
  assert.equal(deltaBadgeTone(-0.1, "higher-is-better"), "warning");
  assert.equal(deltaBadgeTone(0.002, "lower-is-better"), "neutral");
  assert.equal(deltaBadgeTone(0.5, "neutral"), "neutral");
  assert.equal(deltaBadgeTone(null, "lower-is-better"), "neutral");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "fr-period-cmp-"));
  const db = new TrackerDatabase(tmpDir);
  try {
    const insertConv = (opts: {
      id: string;
      projectPath: string;
      endedAtMs: number;
      model: string;
      inputTokens: number;
      cacheReadTokens: number;
      outputTokens: number;
      peakContextTokens: number;
      activeMs: number;
    }) => {
      const startMs = opts.endedAtMs - opts.activeMs;
      const denom = opts.inputTokens + opts.cacheReadTokens;
      db.upsertConversation({
        conversationId: opts.id,
        title: opts.id,
        surface: "antigravity",
        transcriptPath: `/tmp/${opts.id}.jsonl`,
        projectPath: opts.projectPath,
        projectSource: "hook",
        parentConversationId: null,
        subagentRole: null,
        subagentType: null,
        startedAtMs: startMs,
        endedAtMs: opts.endedAtMs,
        terminationReason: "stop",
        models: [opts.model],
        slashCommands: [],
        skillsUsed: [],
        hasLiveHooks: false,
        hasTokenTelemetry: true,
        inputTokens: opts.inputTokens,
        cacheReadTokens: opts.cacheReadTokens,
        outputTokens: opts.outputTokens,
        peakContextTokens: opts.peakContextTokens,
        activeMs: opts.activeMs,
        modelMs: opts.activeMs,
        toolWallMs: 0,
        toolSumMs: 0,
        userIdleMs: 0,
        wallClockMs: opts.activeMs,
        errorCount: 0,
        turns: [],
        plannerSteps: [
          {
            stepIndex: 1,
            turnIndex: 0,
            model: opts.model,
            createdAtMs: startMs,
            completedAtMs: opts.endedAtMs,
            modelDurationMs: opts.activeMs,
            thinkingChars: 100,
            contentChars: 100,
            inputTokens: opts.inputTokens,
            cacheReadTokens: opts.cacheReadTokens,
            outputTokens: opts.outputTokens,
            totalContextTokens: opts.peakContextTokens,
            cacheHitRatio: denom > 0 ? opts.cacheReadTokens / denom : 0,
            toolCallCount: 0,
            status: "DONE",
            attributedSummary: "Work",
            isCacheMiss: false,
            cacheMissCause: null
          }
        ],
        toolCalls: [],
        diagnostics: [],
        filesTouched: [],
        indexedAtMs: opts.endedAtMs
      });
    };

    // Boundary check: ends EXACTLY at todaySince -> belongs only to Today, NOT yesterday
    insertConv({
      id: "curr-boundary",
      projectPath: "/proj/cmp-a",
      endedAtMs: todaySince,
      model: "gemini-2.5-pro",
      inputTokens: 20_000,
      cacheReadTokens: 80_000, // 80% cache hit
      outputTokens: 1_000,
      peakContextTokens: 100_000,
      activeMs: 5_000
    });
    // Yesterday conversation in /proj/cmp-a
    insertConv({
      id: "prev-1",
      projectPath: "/proj/cmp-a",
      endedAtMs: todaySince - 3_600_000,
      model: "gemini-2.5-pro",
      inputTokens: 50_000,
      cacheReadTokens: 150_000, // 75% cache hit
      outputTokens: 2_000,
      peakContextTokens: 200_000,
      activeMs: 10_000
    });
    // /proj/cmp-b was active yesterday ONLY (dropped to 0 today -> -100% in ProjectDetail)
    insertConv({
      id: "prev-b-only",
      projectPath: "/proj/cmp-b",
      endedAtMs: todaySince - 7_200_000,
      model: "gemini-2.5-pro",
      inputTokens: 10_000,
      cacheReadTokens: 10_000,
      outputTokens: 500,
      peakContextTokens: 50_000,
      activeMs: 4_000
    });
    // /proj/cmp-unpriced has an unpriced model in prior window -> suppresses costDeltaPct
    insertConv({
      id: "curr-u",
      projectPath: "/proj/cmp-unpriced",
      endedAtMs: todaySince + 3_600_000,
      model: "gemini-2.5-pro",
      inputTokens: 10_000,
      cacheReadTokens: 0,
      outputTokens: 100,
      peakContextTokens: 10_000,
      activeMs: 2_000
    });
    insertConv({
      id: "prev-u",
      projectPath: "/proj/cmp-unpriced",
      endedAtMs: todaySince - 1_000,
      model: "custom-unknown-model-xyz",
      inputTokens: 10_000,
      cacheReadTokens: 0,
      outputTokens: 100,
      peakContextTokens: 10_000,
      activeMs: 2_000
    });

    // 1. "all" preset returns null periodComparison
    assert.equal(buildDashboardData(db, { preset: "all", untilMs: refNow }).periodComparison, null);
    const projAll = buildProjectDetail(db, "/proj/cmp-a", { preset: "all", untilMs: refNow });
    assert.ok(projAll);
    assert.equal(projAll.periodComparison, null);

    // 2. Project /proj/cmp-a Today vs yesterday (boundary not double-counted)
    const projAToday = buildProjectDetail(db, "/proj/cmp-a", {
      preset: "today",
      sinceMs: todaySince,
      untilMs: refNow
    });
    assert.ok(projAToday);
    assert.ok(projAToday.periodComparison);
    assert.equal(projAToday.periodComparison.hasPriorActivity, true);
    assert.equal(projAToday.periodComparison.label, "vs yesterday");
    assert.equal(projAToday.periodComparison.priorChatCount, 1);
    assert.equal(projAToday.periodComparison.priorTotalTokens, 202_000);
    assert.equal(projAToday.periodComparison.priorActiveMs, 10_000);
    assert.equal(projAToday.periodComparison.priorAvgPeakContextTokens, 200_000);
    assert.equal(projAToday.periodComparison.chatsDeltaPct, 0);
    assert.ok(
      Math.abs((projAToday.periodComparison.tokensDeltaPct ?? 0) - -0.5) < 1e-9
    );
    assert.equal(projAToday.periodComparison.cacheHitDeltaPp, 5); // 80% vs 75%
    assert.ok(
      Math.abs((projAToday.periodComparison.activeMsDeltaPct ?? 0) - -0.5) < 1e-9
    );
    assert.ok(
      Math.abs((projAToday.periodComparison.avgPeakContextDeltaPct ?? 0) - -0.5) < 1e-9
    );
    assert.ok(projAToday.periodComparison.costDeltaPct !== null && projAToday.periodComparison.costDeltaPct < 0);

    // 3. Project /proj/cmp-b Today: 0 chats today vs 1 yesterday -> -100% (-1)
    const projBToday = buildProjectDetail(db, "/proj/cmp-b", {
      preset: "today",
      sinceMs: todaySince,
      untilMs: refNow
    });
    assert.ok(projBToday?.periodComparison);
    assert.equal(projBToday.periodComparison.hasPriorActivity, true);
    assert.equal(projBToday.periodComparison.chatsDeltaPct, -1);
    assert.equal(projBToday.periodComparison.tokensDeltaPct, -1);
    assert.equal(projBToday.periodComparison.activeMsDeltaPct, -1);
    assert.equal(projBToday.periodComparison.costDeltaPct, -1);
    assert.equal(projBToday.periodComparison.cacheHitDeltaPp, null);
    assert.equal(projBToday.periodComparison.avgPeakContextDeltaPct, null);

    // 4. Unpriced model in prior suppresses costDeltaPct
    const projUToday = buildProjectDetail(db, "/proj/cmp-unpriced", {
      preset: "today",
      sinceMs: todaySince,
      untilMs: refNow
    });
    assert.ok(projUToday?.periodComparison);
    assert.equal(projUToday.periodComparison.costDeltaPct, null);

    // 5. Global dashboard periodComparison for 30d when prior 30d has no activity -> hasPriorActivity: false
    const dash30d = buildDashboardData(db, {
      preset: "30d",
      sinceMs: thirtySince,
      untilMs: refNow
    });
    assert.ok(dash30d.periodComparison);
    assert.equal(dash30d.periodComparison.label, "vs prior 30d");
    assert.equal(dash30d.periodComparison.hasPriorActivity, false);
    assert.equal(dash30d.periodComparison.tokensDeltaPct, null);
  } finally {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
