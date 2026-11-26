import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { TrackerDatabase } from "../src/server/db.js";
import { ingestHookEvents } from "../src/server/hookIngestor.js";

test("scripts/record-event.mjs writes compact JSONL fast and ingestHookEvents tracks incremental byte offsets", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "agy-hook-test-"));
  const hookScript = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "scripts",
    "record-event.mjs"
  );
  const eventsPath = path.join(tmpDir, "events.jsonl");

  try {
    const payloads = [
      {
        hookEventName: "SessionStart",
        conversationId: "conv-hook-1",
        workspacePaths: ["/Users/dev/my-app"],
        transcriptPath: "/tmp/t.jsonl",
        modelName: "gemini-2.5-pro",
        cwd: "/Users/dev/my-app"
      },
      {
        hookEventName: "PostToolUse",
        conversationId: "conv-hook-1",
        workspacePaths: ["/Users/dev/my-app"],
        stepIdx: 3,
        toolCall: {
          id: "call_1",
          name: "write_file",
          args: {
            Path: "/Users/dev/my-app/big.txt",
            Content: "x".repeat(1200)
          }
        }
      },
      {
        hookEventName: "Stop",
        conversationId: "conv-hook-1",
        terminationReason: "NO_TOOL_CALL",
        fullyIdle: true
      }
    ];

    for (const p of payloads) {
      const res = spawnSync(process.execPath, [hookScript], {
        input: JSON.stringify(p),
        env: { ...process.env, PLUGIN_DATA: tmpDir },
        encoding: "utf8"
      });
      assert.equal(res.status, 0);
      assert.equal(res.stdout.trim(), "{}");
    }

    assert.ok(fs.existsSync(eventsPath));
    const lines = fs.readFileSync(eventsPath, "utf8").trim().split("\n");
    assert.equal(lines.length, 3);

    const parsedToolLine = JSON.parse(lines[1]) as {
      toolCall: { args: { Content: string }; argBytes: number };
    };
    assert.ok(parsedToolLine.toolCall.argBytes > 1200);
    assert.ok(parsedToolLine.toolCall.args.Content.length < 320);

    const db = new TrackerDatabase(tmpDir);
    try {
      const first = ingestHookEvents(db, eventsPath);
      assert.equal(first.ingestedCount, 3);
      assert.deepEqual(first.touchedConversationIds, ["conv-hook-1"]);

      // Second call without new lines should ingest 0
      const second = ingestHookEvents(db, eventsPath);
      assert.equal(second.ingestedCount, 0);

      // Simulate partial line without trailing newline
      fs.appendFileSync(
        eventsPath,
        '{"hookEventName":"PreInvocation","conversationId":"conv-hook-2"',
        "utf8"
      );
      const partial = ingestHookEvents(db, eventsPath);
      assert.equal(partial.ingestedCount, 0);

      // Finish line with newline
      fs.appendFileSync(eventsPath, ',"tsMs":123456}\n', "utf8");
      const completed = ingestHookEvents(db, eventsPath);
      assert.equal(completed.ingestedCount, 1);
      assert.deepEqual(completed.touchedConversationIds, ["conv-hook-2"]);
    } finally {
      db.close();
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
