import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  extractModelSelectionFromUserInput,
  extractUnavailableModelError,
  normalizeModelSelectionLabel,
  parseTranscriptFile
} from "../src/server/transcriptParser.js";

test("parseTranscriptFile parses turns, tokens, stringified args, skills, MCP, subagents, and errors", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-parser-test-"));
  const transcriptPath = path.join(tmpDir, "transcript_full.jsonl");

  const lines = [
    {
      step_index: 0,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-21T21:32:27Z",
      content:
        "<USER_REQUEST>\n/plan Build tracker dashboard\n</USER_REQUEST>\n<ADDITIONAL_METADATA>\n/plan is a [Slash Command]\n</ADDITIONAL_METADATA>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-21T21:32:27Z",
      model: "gemini-4-neon-high",
      input_tokens: 20143,
      cache_read_tokens: 0,
      output_tokens: 1037,
      thinking: "Thinking about plan",
      content: "Reading skills and docs",
      tool_calls: [
        {
          id: "tc-1",
          name: "read_file",
          args: {
            Path: '"/Users/dev/.gemini/config/plugins/superpowers/skills/writing-plans/SKILL.md"'
          }
        },
        {
          id: "tc-2",
          name: "mcp_gemini-api_gemini-api-docs_gemini_search_docs",
          args: JSON.stringify({ query: "interactions" })
        },
        {
          id: "tc-3",
          name: "invoke_subagent",
          args: {
            TypeName: "research",
            Role: "Codebase Researcher"
          }
        },
        {
          id: "tc-4",
          name: "run_command",
          args: {
            CommandLine: "npm test"
          }
        }
      ]
    },
    {
      step_index: 2,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-21T21:32:36Z",
      content:
        "Created At: 2026-11-21T16:32:36-05:00\nCompleted At: 2026-11-21T16:32:38-05:00\nCreated At: 2026-11-21T16:32:36-05:00\nCompleted At: 2026-11-21T16:32:38-05:00\n---\nname: writing-plans\ndescription: Plan tasks\n---\n# Writing Plans"
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-21T21:32:37Z",
      content:
        "Created At: 2026-11-21T16:32:37-05:00\nCompleted At: 2026-11-21T16:32:38-05:00\n{\"results\":[\"ok\"]}"
    },
    {
      step_index: 4,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-21T21:32:37Z",
      content:
        "Created At: 2026-11-21T16:32:37-05:00\nCompleted At: 2026-11-21T16:32:41-05:00\nSubagent launched with conversationId: 11111111-2222-3333-4444-555555555555"
    },
    {
      step_index: 5,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-21T21:32:38Z",
      content:
        "Created At: 2026-11-21T16:32:38-05:00\nCompleted At: 2026-11-21T16:32:45-05:00\nCommand exited with code 1.\nTest failed"
    }
  ];

  fs.writeFileSync(
    transcriptPath,
    lines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );

  try {
    const parsed = await parseTranscriptFile(transcriptPath, "conv-abc");
    assert.equal(parsed.turns.length, 1);
    assert.equal(parsed.turns[0].slashCommand, "/plan");
    assert.equal(parsed.title, "Build tracker dashboard");
    assert.deepEqual(parsed.models, ["gemini-4-neon-high"]);
    assert.deepEqual(parsed.slashCommands, ["/plan"]);

    assert.equal(parsed.plannerSteps.length, 1);
    assert.equal(parsed.plannerSteps[0].inputTokens, 20143);
    assert.equal(parsed.plannerSteps[0].outputTokens, 1037);

    assert.equal(parsed.toolCalls.length, 4);

    const skillTool = parsed.toolCalls[0];
    assert.equal(skillTool.category, "skill");
    assert.equal(skillTool.skillName, "writing-plans");
    assert.equal(skillTool.skillPlugin, "superpowers");
    assert.equal(skillTool.durationMs, 2000);
    assert.equal(
      skillTool.targetPath,
      "/Users/dev/.gemini/config/plugins/superpowers/skills/writing-plans/SKILL.md"
    );

    const mcpTool = parsed.toolCalls[1];
    assert.equal(mcpTool.category, "mcp");
    assert.equal(mcpTool.mcpServer, "gemini-api");
    assert.equal(mcpTool.durationMs, 1000);

    const subTool = parsed.toolCalls[2];
    assert.equal(subTool.category, "subagent");
    assert.equal(
      subTool.childConversationId,
      "11111111-2222-3333-4444-555555555555"
    );
    assert.equal(subTool.durationMs, 4000);

    const cmdTool = parsed.toolCalls[3];
    assert.equal(cmdTool.category, "command");
    assert.equal(cmdTool.isError, true);
    assert.equal(cmdTool.durationMs, 7000);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("parseTranscriptFile flushes unmatched pending tools on new USER_INPUT or PLANNER_RESPONSE without drifting", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-parser-drift-"));
  const transcriptPath = path.join(tmpDir, "transcript_full.jsonl");

  const lines = [
    {
      step_index: 0,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-10-04T19:00:00Z",
      content: "<USER_REQUEST>\nFirst turn\n</USER_REQUEST>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-10-04T19:00:00Z",
      model: "gemini-2.5-pro",
      input_tokens: 1000,
      cache_read_tokens: 0,
      output_tokens: 50,
      tool_calls: [{ id: "lost-call", name: "run_command", args: { CommandLine: "echo hi" } }]
    },
    // No GENERIC step recorded before next turn/month!
    {
      step_index: 2,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-21T14:00:00Z",
      content: "<USER_REQUEST>\nSecond turn weeks later\n</USER_REQUEST>"
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-21T14:00:00Z",
      model: "gemini-2.5-pro",
      input_tokens: 1200,
      cache_read_tokens: 1000,
      output_tokens: 80,
      tool_calls: [{ id: "real-call", name: "read_file", args: { Path: "/Users/dev/a.ts" } }]
    },
    {
      step_index: 4,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-21T14:00:02Z",
      content: "Created At: 2026-11-21T14:00:02Z\nCompleted At: 2026-11-21T14:00:03Z\nfile contents"
    }
  ];

  fs.writeFileSync(
    transcriptPath,
    lines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );

  try {
    const parsed = await parseTranscriptFile(transcriptPath, "conv-drift");
    assert.equal(parsed.toolCalls.length, 2);

    const flushed = parsed.toolCalls[0];
    assert.equal(flushed.toolName, "run_command");
    assert.equal(flushed.turnIndex, 0);
    assert.equal(flushed.completedAtMs, null);
    assert.equal(flushed.durationMs, 0);

    const second = parsed.toolCalls[1];
    assert.equal(second.toolName, "read_file");
    assert.equal(second.turnIndex, 1);
    assert.equal(second.durationMs, 1000);
    assert.equal(second.startedAtMs, Date.parse("2026-11-21T14:00:02Z"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("parseTranscriptFile resolves canonical skill name from sibling SKILL.md, flags legacy missing tokens, and extracts subagent system task", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-parser-fixes-"));
  const skillDir = path.join(tmpDir, "skills", "antigravity_guide");
  const refDir = path.join(skillDir, "references");
  fs.mkdirSync(refDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    "---\nname: antigravity-guide\ndescription: Guide\n---\n# Guide\n",
    "utf8"
  );
  const refPath = path.join(refDir, "app.md");
  fs.writeFileSync(refPath, "# App reference\n", "utf8");

  const t1 = path.join(tmpDir, "skill_and_legacy.jsonl");
  fs.writeFileSync(
    t1,
    [
      {
        step_index: 0,
        source: "USER_EXPLICIT",
        type: "USER_INPUT",
        status: "DONE",
        created_at: "2026-09-05T15:00:00Z",
        content: "<USER_REQUEST>\nLegacy prompt\n</USER_REQUEST>"
      },
      {
        step_index: 1,
        source: "MODEL",
        type: "PLANNER_RESPONSE",
        status: "DONE",
        created_at: "2026-09-05T15:00:00Z",
        tool_calls: [{ id: "r1", name: "read_file", args: { Path: refPath } }]
      },
      {
        step_index: 2,
        source: "MODEL",
        type: "GENERIC",
        status: "DONE",
        created_at: "2026-09-05T15:00:01Z",
        content: "Created At: 2026-09-05T15:00:01Z\nCompleted At: 2026-09-05T15:00:02Z\n# App reference"
      }
    ]
      .map((l) => JSON.stringify(l))
      .join("\n") + "\n",
    "utf8"
  );

  const t2 = path.join(tmpDir, "subagent_sys.jsonl");
  fs.writeFileSync(
    t2,
    [
      {
        step_index: 0,
        source: "SYSTEM",
        type: "SYSTEM_MESSAGE",
        status: "DONE",
        created_at: "2026-11-21T16:00:00Z",
        content:
          "The following is a <SYSTEM_MESSAGE> not actually sent by the user. It is provided by the system as important information to pay attention to.\n<SYSTEM_MESSAGE>\nImplement backend media service endpoint\n</SYSTEM_MESSAGE>"
      },
      {
        step_index: 1,
        source: "MODEL",
        type: "PLANNER_RESPONSE",
        status: "DONE",
        created_at: "2026-11-21T16:00:01Z",
        model: "gemini-4-hydrogen-xhigh",
        input_tokens: 5000,
        cache_read_tokens: 0,
        output_tokens: 100
      }
    ]
      .map((l) => JSON.stringify(l))
      .join("\n") + "\n",
    "utf8"
  );

  try {
    const parsedLegacy = await parseTranscriptFile(t1, "legacy-12345678");
    assert.equal(parsedLegacy.hasTokenTelemetry, false);
    assert.equal(parsedLegacy.toolCalls.length, 1);
    assert.equal(parsedLegacy.toolCalls[0].category, "skill");
    assert.equal(parsedLegacy.toolCalls[0].skillName, "antigravity-guide");

    const parsedSub = await parseTranscriptFile(t2, "sub-12345678");
    assert.equal(parsedSub.hasTokenTelemetry, true);
    assert.equal(parsedSub.hasExplicitUserPrompt, false);
    assert.equal(parsedSub.systemTaskPreview, "Implement backend media service endpoint");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("parseTranscriptFile classifies write_file/edit_file on SKILL.md as file_write instead of skill invocation", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-parser-write-skill-"));
  const transcriptPath = path.join(tmpDir, "transcript_full.jsonl");
  const skillPath = path.join(tmpDir, "skills", "my-skill", "SKILL.md");

  const lines = [
    {
      step_index: 0,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-22T15:00:00Z",
      content: "<USER_REQUEST>\nAuthor skill\n</USER_REQUEST>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-22T15:00:00Z",
      model: "gemini-2.5-pro",
      input_tokens: 1000,
      cache_read_tokens: 0,
      output_tokens: 100,
      tool_calls: [
        { id: "w1", name: "write_file", args: { Path: skillPath, Content: "# Skill" } },
        { id: "e1", name: "edit_file", args: { Path: skillPath, Target: "a", Replacement: "b" } },
        { id: "r1", name: "read_file", args: { Path: skillPath } }
      ]
    },
    {
      step_index: 2,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-22T15:00:01Z",
      content: "Created At: 2026-11-22T15:00:01Z\nCompleted At: 2026-11-22T15:00:02Z\nWrote file"
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-22T15:00:02Z",
      content: "Created At: 2026-11-22T15:00:02Z\nCompleted At: 2026-11-22T15:00:03Z\nEdited file"
    },
    {
      step_index: 4,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-22T15:00:03Z",
      content: "Created At: 2026-11-22T15:00:03Z\nCompleted At: 2026-11-22T15:00:04Z\n---\nname: my-skill\n---\n# Skill"
    }
  ];

  fs.writeFileSync(
    transcriptPath,
    lines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );

  try {
    const parsed = await parseTranscriptFile(transcriptPath, "conv-write-skill");
    assert.equal(parsed.toolCalls.length, 3);
    assert.equal(parsed.toolCalls[0].category, "file_write");
    assert.equal(parsed.toolCalls[0].skillName, null);
    assert.equal(parsed.toolCalls[1].category, "file_write");
    assert.equal(parsed.toolCalls[1].skillName, null);
    assert.equal(parsed.toolCalls[2].category, "skill");
    assert.equal(parsed.toolCalls[2].skillName, "my-skill");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("parseTranscriptFile infers missing model from USER_SETTINGS_CHANGE, clears on None/Auto, and keeps explicit model authoritative", async () => {
  assert.equal(normalizeModelSelectionLabel("Gemini 4 Carbon (Medium)"), "gemini-4-carbon-medium");
  assert.equal(normalizeModelSelectionLabel("Claude Sonnet 5.5 (High)"), "claude-sonnet-5-5-high");
  assert.equal(normalizeModelSelectionLabel("Gemini 2.5 Pro"), "gemini-2.5-pro");
  assert.equal(normalizeModelSelectionLabel("None"), null);
  assert.equal(normalizeModelSelectionLabel("Auto"), null);

  assert.deepEqual(
    extractModelSelectionFromUserInput(
      "<USER_REQUEST>\nHello\n</USER_REQUEST>\n<USER_SETTINGS_CHANGE>\nThe user changed setting `Model Selection` from None to Claude Sonnet 5.5 (High). No need to comment.\n</USER_SETTINGS_CHANGE>"
    ),
    { found: true, model: "claude-sonnet-5-5-high" }
  );

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-parser-model-fallback-"));
  const transcriptPath = path.join(tmpDir, "transcript_full.jsonl");

  const lines = [
    {
      step_index: 0,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-10T10:00:00Z",
      content:
        "<USER_REQUEST>\nFirst\n</USER_REQUEST>\n<USER_SETTINGS_CHANGE>\nThe user changed setting `Model Selection` from None to Gemini 4 Carbon (Medium).\n</USER_SETTINGS_CHANGE>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-10T10:00:01Z",
      input_tokens: 1000,
      cache_read_tokens: 0,
      output_tokens: 50
    },
    {
      step_index: 2,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-10T10:01:00Z",
      content:
        "<USER_REQUEST>\nSecond\n</USER_REQUEST>\n<USER_SETTINGS_CHANGE>\nThe user changed setting `Model Selection` from Gemini 4 Carbon (Medium) to Claude Sonnet 5.5 (High).\n</USER_SETTINGS_CHANGE>"
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-10T10:01:01Z",
      input_tokens: 1200,
      cache_read_tokens: 500,
      output_tokens: 60
    },
    {
      step_index: 4,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-10T10:01:05Z",
      model: "gemini-4-neon-xhigh",
      input_tokens: 1300,
      cache_read_tokens: 0,
      output_tokens: 70
    },
    {
      step_index: 5,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-10T10:02:00Z",
      content:
        "<USER_REQUEST>\nThird\n</USER_REQUEST>\n<USER_SETTINGS_CHANGE>\nThe user changed setting `Model Selection` from Claude Sonnet 5.5 (High) to Auto.\n</USER_SETTINGS_CHANGE>"
    },
    {
      step_index: 6,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-10T10:02:01Z",
      input_tokens: 1400,
      cache_read_tokens: 0,
      output_tokens: 80
    }
  ];

  fs.writeFileSync(
    transcriptPath,
    lines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );

  try {
    const parsed = await parseTranscriptFile(transcriptPath, "conv-settings-fallback");
    assert.equal(parsed.plannerSteps.length, 4);
    assert.equal(parsed.plannerSteps[0].model, "gemini-4-carbon-medium");
    assert.equal(parsed.plannerSteps[0].modelSource, "settings_change");
    assert.equal(parsed.plannerSteps[1].model, "claude-sonnet-5-5-high");
    assert.equal(parsed.plannerSteps[1].modelSource, "settings_change");
    assert.equal(parsed.plannerSteps[2].model, "gemini-4-neon-xhigh");
    assert.equal(parsed.plannerSteps[2].modelSource, "transcript");
    assert.equal(parsed.plannerSteps[3].model, "unknown");
    assert.equal(parsed.plannerSteps[3].modelSource, "unknown");
    assert.deepEqual(parsed.models, [
      "gemini-4-carbon-medium",
      "claude-sonnet-5-5-high",
      "gemini-4-neon-xhigh"
    ]);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("parseTranscriptFile links swarm explicit conversationId with Role and ignores bare UUIDs in swarm/run_workflow", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-parser-swarm-"));
  const transcriptPath = path.join(tmpDir, "transcript_full.jsonl");

  const lines = [
    {
      step_index: 0,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-24T12:00:00Z",
      content: "<USER_REQUEST>\nRun swarm\n</USER_REQUEST>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-24T12:00:00Z",
      model: "gemini-4-neon-xhigh",
      input_tokens: 2000,
      cache_read_tokens: 0,
      output_tokens: 100,
      tool_calls: [
        {
          id: "sw-1",
          name: "swarm",
          args: { action: "add", name: "ui-author", brief: "Edit UI" }
        },
        {
          id: "sw-2",
          name: "swarm",
          args: { action: "status" }
        },
        {
          id: "wf-1",
          name: "run_workflow",
          args: { Description: "Fan out" }
        }
      ]
    },
    {
      step_index: 2,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-24T12:00:01Z",
      content:
        "Created At: 2026-11-24T12:00:01Z\nCompleted At: 2026-11-24T12:00:02Z\nAdded worker conversationId: 12345678-1111-2222-3333-444455556666"
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-24T12:00:02Z",
      content:
        "Created At: 2026-11-24T12:00:02Z\nCompleted At: 2026-11-24T12:00:03Z\nRandom log uuid 99999999-1111-2222-3333-444455556666"
    },
    {
      step_index: 4,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-24T12:00:03Z",
      content:
        "Created At: 2026-11-24T12:00:03Z\nCompleted At: 2026-11-24T12:00:04Z\nWorkflow finished task 88888888-1111-2222-3333-444455556666"
    }
  ];

  fs.writeFileSync(
    transcriptPath,
    lines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );

  try {
    const parsed = await parseTranscriptFile(transcriptPath, "conv-swarm");
    assert.equal(parsed.toolCalls.length, 3);
    assert.equal(parsed.toolCalls[0].category, "subagent");
    assert.equal(parsed.toolCalls[0].argsPreview, "Type: swarm | Role: ui-author");
    assert.equal(
      parsed.toolCalls[0].childConversationId,
      "12345678-1111-2222-3333-444455556666"
    );
    assert.equal(parsed.toolCalls[1].childConversationId, null);
    assert.equal(parsed.toolCalls[2].childConversationId, null);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("parseTranscriptFile extracts ERROR_MESSAGE model unavailability signals and ignores unrelated errors", async () => {
  assert.deepEqual(
    extractUnavailableModelError(
      "API error (attempt 1): UNAVAILABLE (code 503): No capacity available for model gemini-4-argon-medium on the server"
    ),
    {
      model: "gemini-4-argon-medium",
      reason:
        "API error (attempt 1): UNAVAILABLE (code 503): No capacity available for model gemini-4-argon-medium on the server"
    }
  );
  assert.equal(
    extractUnavailableModelError("models/gemini-4-beta is not found")?.model,
    "gemini-4-beta"
  );
  assert.equal(
    extractUnavailableModelError("Model `claude-legacy-1` has been deprecated")?.model,
    "claude-legacy-1"
  );
  assert.equal(extractUnavailableModelError("Network connection timed out"), null);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-parser-err-sig-"));
  const transcriptPath = path.join(tmpDir, "transcript_full.jsonl");
  const lines = [
    {
      step_index: 0,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-24T12:00:00Z",
      content: "<USER_REQUEST>\nCheck error\n</USER_REQUEST>"
    },
    {
      step_index: 1,
      source: "SYSTEM",
      type: "ERROR_MESSAGE",
      status: "DONE",
      created_at: "2026-11-24T12:00:01Z",
      error: "API error: UNAVAILABLE: No capacity available for model gemini-4-argon-medium on the server"
    },
    {
      step_index: 2,
      source: "SYSTEM",
      type: "ERROR_MESSAGE",
      status: "DONE",
      created_at: "2026-11-24T12:00:02Z",
      error: "Temporary socket timeout"
    },
    {
      step_index: 3,
      source: "SYSTEM",
      type: "ERROR_MESSAGE",
      status: "DONE",
      created_at: "2026-11-24T12:00:05Z",
      error: "models/gemini-4-beta is no longer available"
    }
  ];

  fs.writeFileSync(
    transcriptPath,
    lines.map((l) => JSON.stringify(l)).join("\n") + "\n",
    "utf8"
  );

  try {
    const parsed = await parseTranscriptFile(transcriptPath, "conv-err-sig");
    assert.equal(parsed.modelUnavailableErrors?.length, 2);
    assert.equal(parsed.modelUnavailableErrors?.[0].model, "gemini-4-argon-medium");
    assert.equal(
      parsed.modelUnavailableErrors?.[0].tsMs,
      Date.parse("2026-11-24T12:00:01Z")
    );
    assert.equal(parsed.modelUnavailableErrors?.[1].model, "gemini-4-beta");
    assert.equal(parsed.modelUnavailableErrors?.[1].tsMs, Date.parse("2026-11-24T12:00:05Z"));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test("parseTranscriptFile supports multi-worker swarm spawns, non-spawn swarm actions, swarmTitle, and role detection", async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-parser-swarm-multi-"));
  const coordPath = path.join(tmpDir, "coord.jsonl");
  const workerPath = path.join(tmpDir, "worker.jsonl");

  const coordLines = [
    {
      step_index: 0,
      source: "USER_EXPLICIT",
      type: "USER_INPUT",
      status: "DONE",
      created_at: "2026-11-25T10:00:00Z",
      content: "<USER_REQUEST>\n/swarm Refactor auth\n</USER_REQUEST>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-25T10:00:01Z",
      model: "gemini-4-neon-high",
      input_tokens: 3000,
      cache_read_tokens: 0,
      output_tokens: 120,
      tool_calls: [
        {
          id: "sw-title",
          name: "swarm",
          args: { action: "title", title: "Refactor auth flow" }
        },
        {
          id: "sw-add-multi",
          name: "swarm",
          args: { action: "add", name: "worker", tasks: ["auth", "tests"] }
        },
        {
          id: "sw-status",
          name: "swarm",
          args: { action: "status" }
        }
      ]
    },
    {
      step_index: 2,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-25T10:00:02Z",
      content: "Created At: 2026-11-25T10:00:02Z\nCompleted At: 2026-11-25T10:00:02Z\nTitle updated."
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-25T10:00:02Z",
      content:
        "Created At: 2026-11-25T10:00:02Z\nCompleted At: 2026-11-25T10:00:04Z\nworker-1 conversationId: 11111111-aaaa-2222-3333-444444444441\nworker-2 conversationId: 22222222-aaaa-2222-3333-444444444442"
    },
    {
      step_index: 4,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-25T10:00:05Z",
      content: "Created At: 2026-11-25T10:00:05Z\nCompleted At: 2026-11-25T10:00:05Z\nAll waiting"
    }
  ];

  const workerLines = [
    {
      step_index: 0,
      source: "SYSTEM",
      type: "SYSTEM_MESSAGE",
      status: "DONE",
      created_at: "2026-11-25T10:00:03Z",
      content: "<swarm_worker>\nYou are worker-1.\n</swarm_worker>"
    },
    {
      step_index: 1,
      source: "MODEL",
      type: "PLANNER_RESPONSE",
      status: "DONE",
      created_at: "2026-11-25T10:00:04Z",
      model: "gemini-4-neon-high",
      input_tokens: 1500,
      cache_read_tokens: 0,
      output_tokens: 80,
      tool_calls: [
        { id: "rb", name: "read_board", args: { since: 0 } },
        { id: "sw", name: "swarm_wait", args: { since: 1 } }
      ]
    },
    {
      step_index: 2,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-25T10:00:04Z",
      content: "Created At: 2026-11-25T10:00:04Z\nCompleted At: 2026-11-25T10:00:05Z\n[]"
    },
    {
      step_index: 3,
      source: "MODEL",
      type: "GENERIC",
      status: "DONE",
      created_at: "2026-11-25T10:00:05Z",
      content: "Created At: 2026-11-25T10:00:05Z\nCompleted At: 2026-11-25T10:05:05Z\nNew post arrived"
    }
  ];

  fs.writeFileSync(coordPath, coordLines.map((l) => JSON.stringify(l)).join("\n") + "\n", "utf8");
  fs.writeFileSync(workerPath, workerLines.map((l) => JSON.stringify(l)).join("\n") + "\n", "utf8");

  try {
    const coordParsed = await parseTranscriptFile(coordPath, "conv-coord");
    assert.equal(coordParsed.detectedSwarmRole, "coordinator");
    assert.equal(coordParsed.swarmTitle, "Refactor auth flow");
    assert.equal(coordParsed.toolCalls.length, 3);

    const titleCall = coordParsed.toolCalls[0];
    assert.equal(titleCall.category, "other");
    assert.match(titleCall.argsPreview, /Action: title/);

    const addCall = coordParsed.toolCalls[1];
    assert.equal(addCall.category, "subagent");
    assert.deepEqual(addCall.childConversationIds, [
      "11111111-aaaa-2222-3333-444444444441",
      "22222222-aaaa-2222-3333-444444444442"
    ]);
    assert.deepEqual(
      (addCall.childLinks ?? []).map((l) => l.role),
      ["worker-1", "worker-2"]
    );

    const statusCall = coordParsed.toolCalls[2];
    assert.equal(statusCall.category, "other");
    assert.equal(statusCall.argsPreview, "Action: status");
    assert.equal(statusCall.childConversationId, null);

    const workerParsed = await parseTranscriptFile(workerPath, "conv-worker");
    assert.equal(workerParsed.detectedSwarmRole, "worker");
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
