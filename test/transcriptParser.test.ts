import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseTranscriptFile } from "../src/server/transcriptParser.js";

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
            Path: '"/Users/frederic/.gemini/config/plugins/superpowers/skills/writing-plans/SKILL.md"'
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
      "/Users/frederic/.gemini/config/plugins/superpowers/skills/writing-plans/SKILL.md"
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
