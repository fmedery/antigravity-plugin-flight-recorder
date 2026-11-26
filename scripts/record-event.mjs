#!/usr/bin/env node
// Ultra-lightweight passive lifecycle hook spooler for Flight Recorder (cross-platform Windows/macOS/Linux).

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const MAX_USER_INPUT_CHARS = 500;
const MAX_ARG_STR_CHARS = 300;
const MAX_ARG_KEYS = 20;

function sanitizeText(input, maxChars) {
  if (typeof input !== "string" || !input) return input;
  const bounded =
    typeof maxChars === "number" && input.length > Math.max(4096, maxChars * 8)
      ? input.slice(0, Math.max(4096, maxChars * 8))
      : input;
  const cleaned = bounded
    .replace(/\x1b\][\s\S]*?(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, "")
    .replace(/(https?:\/\/)([^/\s:@]+:[^/\s@]+)@/gi, "$1[REDACTED]@")
    .replace(/\b((?:Bearer|Basic)\s+)[A-Za-z0-9._~+/=-]{12,}/gi, "$1[REDACTED]")
    .replace(
      /\b(?:AIza[0-9A-Za-z_-]{20,}|ya29\.[0-9A-Za-z_-]{20,}|sk-(?:proj-|ant-|live-|test-)?[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g,
      "[REDACTED]"
    )
    .replace(
      /\b([A-Za-z0-9_]{0,64}?(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE[_-]?KEY|ACCESS[_-]?KEY|AUTH[_-]?TOKEN|CLIENT[_-]?SECRET|SESSION[_-]?ID|COOKIE)[A-Za-z0-9_]{0,64})((?:["'])?\s*[=:]\s*)(?!(?:[0-9]+(?:\.[0-9]+)?|true|false|null)\b)("[^"\r\n]{0,512}"|'[^'\r\n]{0,512}'|[^\s"',;}\]]{1,512})/gi,
      (_m, k, sep, val) =>
        val.startsWith('"') && val.endsWith('"')
          ? `${k}${sep}"[REDACTED]"`
          : `${k}${sep}[REDACTED]`
    );

  if (typeof maxChars === "number" && cleaned.length > maxChars) {
    return cleaned.slice(0, maxChars) + "...";
  }
  return cleaned;
}

function isSensitiveKeyName(key) {
  return /(?:api[_-]?key|secret|password|passwd|private[_-]?key|access[_-]?key|auth[_-]?token|access[_-]?token|refresh[_-]?token|client[_-]?secret|cookie|authorization)/i.test(
    String(key)
  );
}

function compactArgs(args) {
  if (args === null || args === undefined) return [null, 0];
  let argBytes = 0;
  try {
    const raw = JSON.stringify(args);
    argBytes = raw ? Buffer.byteLength(raw, "utf8") : 0;
  } catch {
    return [{ _unserializable: true }, 0];
  }

  if (typeof args === "object" && !Array.isArray(args)) {
    const compacted = {};
    const entries = Object.entries(args);
    for (let i = 0; i < entries.length; i++) {
      if (i >= MAX_ARG_KEYS) {
        compacted._truncatedKeys = entries.length - MAX_ARG_KEYS;
        break;
      }
      const [k, v] = entries[i];
      if (isSensitiveKeyName(k) && v !== null && v !== undefined && v !== "") {
        compacted[k] = "[REDACTED]";
      } else if (typeof v === "string") {
        compacted[k] = sanitizeText(v, MAX_ARG_STR_CHARS);
      } else if (
        typeof v === "number" ||
        typeof v === "boolean" ||
        v === null
      ) {
        compacted[k] = v;
      } else if (Array.isArray(v)) {
        compacted[k] = `<list:${v.length}>`;
      } else if (typeof v === "object") {
        compacted[k] = `<dict:${Object.keys(v).length}>`;
      } else {
        compacted[k] = sanitizeText(String(v), MAX_ARG_STR_CHARS);
      }
    }
    return [compacted, argBytes];
  }

  if (typeof args === "string") {
    return [sanitizeText(args, MAX_ARG_STR_CHARS), argBytes];
  }

  return [sanitizeText(String(args), MAX_ARG_STR_CHARS), argBytes];
}

function main() {
  try {
    const rawStdin = fs.readFileSync(0, "utf8");
    if (!rawStdin || !rawStdin.trim()) return;

    const payload = JSON.parse(rawStdin);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return;
    }

    const dataDir =
      (process.env.PLUGIN_DATA && process.env.PLUGIN_DATA.trim()) ||
      path.join(os.homedir(), ".gemini", "flight-recorder-data");

    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    if (process.platform !== "win32") {
      try {
        fs.chmodSync(dataDir, 0o700);
      } catch {
        // Best-effort permission tightening
      }
    }

    const eventsPath = path.join(dataDir, "events.jsonl");

    const record = {
      tsMs: Date.now(),
      hookEventName: payload.hookEventName,
      conversationId: payload.conversationId,
      workspacePaths: payload.workspacePaths,
      transcriptPath: payload.transcriptPath,
      artifactDirectoryPath: payload.artifactDirectoryPath,
      modelName: payload.modelName,
      cwd: payload.cwd,
      stepIdx: payload.stepIdx,
      invocationNum: payload.invocationNum,
      initialNumSteps: payload.initialNumSteps,
      executionNum: payload.executionNum,
      terminationReason: payload.terminationReason,
      fullyIdle: payload.fullyIdle,
      continuationActive: payload.continuationActive,
      error:
        typeof payload.error === "string"
          ? sanitizeText(payload.error, MAX_ARG_STR_CHARS)
          : undefined
    };

    if (typeof payload.lastUserInput === "string" && payload.lastUserInput) {
      record.lastUserInput = sanitizeText(
        payload.lastUserInput,
        MAX_USER_INPUT_CHARS
      );
    }

    if (
      payload.toolCall &&
      typeof payload.toolCall === "object" &&
      !Array.isArray(payload.toolCall)
    ) {
      const [compactedArgs, argBytes] = compactArgs(payload.toolCall.args);
      record.toolCall = {
        id: payload.toolCall.id,
        name: payload.toolCall.name,
        args: compactedArgs,
        argBytes
      };
    }

    const compactRecord = {};
    for (const [k, v] of Object.entries(record)) {
      if (v !== undefined && v !== null) {
        compactRecord[k] = v;
      }
    }

    const line = JSON.stringify(compactRecord) + "\n";
    fs.appendFileSync(eventsPath, line, { encoding: "utf8", mode: 0o600 });
    if (process.platform !== "win32") {
      try {
        fs.chmodSync(eventsPath, 0o600);
      } catch {
        // Best-effort permission tightening
      }
    }
  } catch {
    // Fail open so telemetry never disrupts an active chat.
  } finally {
    process.stdout.write("{}\n");
  }
}

main();
