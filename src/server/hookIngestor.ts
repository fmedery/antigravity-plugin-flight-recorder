import crypto from "node:crypto";
import fs from "node:fs";
import { sanitizePreviewText } from "../shared/redact.js";
import type { HookEventRow, TrackerDatabase } from "./db.js";

export interface HookIngestResult {
  ingestedCount: number;
  touchedConversationIds: string[];
}

export interface HookIngestOptions {
  maxChunkBytes?: number;
}

const DEFAULT_MAX_CHUNK_BYTES = 16 * 1024 * 1024; // 16 MiB per pass

export function ingestHookEvents(
  db: TrackerDatabase,
  eventsPath: string,
  options: HookIngestOptions = {}
): HookIngestResult {
  if (!fs.existsSync(eventsPath)) {
    return { ingestedCount: 0, touchedConversationIds: [] };
  }

  if (process.platform !== "win32") {
    try {
      fs.chmodSync(eventsPath, 0o600);
    } catch {
      // Best-effort permission tightening
    }
  }

  const stat = fs.statSync(eventsPath);
  if (stat.size === 0) {
    return { ingestedCount: 0, touchedConversationIds: [] };
  }

  const prev = db.getIndexedFile(eventsPath);
  let startOffset = prev?.lastOffset ?? 0;
  if (startOffset > stat.size) {
    startOffset = 0;
  }
  if (startOffset === stat.size) {
    return { ingestedCount: 0, touchedConversationIds: [] };
  }

  const maxChunkBytes = Math.max(
    64,
    options.maxChunkBytes ?? DEFAULT_MAX_CHUNK_BYTES
  );
  const hardCapBytes = 64 * 1024 * 1024;
  let windowBytes = Math.min(stat.size - startOffset, maxChunkBytes);

  const fd = fs.openSync(eventsPath, "r");
  let chunkBuf: Buffer = Buffer.alloc(0);
  let lastNewlineIdx = -1;
  try {
    while (true) {
      const buf = Buffer.alloc(windowBytes);
      const bytesRead = fs.readSync(fd, buf, 0, windowBytes, startOffset);
      if (bytesRead <= 0) {
        return { ingestedCount: 0, touchedConversationIds: [] };
      }
      chunkBuf = buf.subarray(0, bytesRead);
      lastNewlineIdx = chunkBuf.lastIndexOf(0x0a); // '\n'
      if (
        lastNewlineIdx >= 0 ||
        startOffset + bytesRead >= stat.size ||
        windowBytes >= hardCapBytes
      ) {
        break;
      }
      windowBytes = Math.min(stat.size - startOffset, windowBytes * 2, hardCapBytes);
    }
  } finally {
    fs.closeSync(fd);
  }

  if (lastNewlineIdx < 0) {
    // Partial line at EOF still being written; wait for newline on next scan.
    return { ingestedCount: 0, touchedConversationIds: [] };
  }

  const completeBuf = chunkBuf.subarray(0, lastNewlineIdx + 1);
  const newOffset = startOffset + lastNewlineIdx + 1;
  const text = completeBuf.toString("utf8");

  const toInsert: Array<Omit<HookEventRow, "id"> & { dedupKey: string }> = [];
  const touched = new Set<string>();

  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(line) as Record<string, unknown>;
    } catch {
      continue;
    }

    const conversationId =
      typeof raw.conversationId === "string" ? raw.conversationId.trim() : "";
    const hookEventName =
      typeof raw.hookEventName === "string" ? raw.hookEventName.trim() : "";
    if (!conversationId || !hookEventName) continue;

    touched.add(conversationId);

    const workspacePaths = Array.isArray(raw.workspacePaths)
      ? raw.workspacePaths.filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      : [];
    const toolCall =
      raw.toolCall && typeof raw.toolCall === "object"
        ? (raw.toolCall as Record<string, unknown>)
        : null;

    const dedupKey = crypto
      .createHash("sha1")
      .update(`${startOffset}:${i}:${line}`)
      .digest("hex");

    toInsert.push({
      tsMs: typeof raw.tsMs === "number" ? raw.tsMs : Date.now(),
      hookEventName,
      conversationId,
      workspacePaths,
      transcriptPath:
        typeof raw.transcriptPath === "string" ? raw.transcriptPath : null,
      modelName: typeof raw.modelName === "string" ? raw.modelName : null,
      cwd: typeof raw.cwd === "string" ? raw.cwd : null,
      stepIdx: typeof raw.stepIdx === "number" ? raw.stepIdx : null,
      invocationNum:
        typeof raw.invocationNum === "number" ? raw.invocationNum : null,
      terminationReason:
        typeof raw.terminationReason === "string" ? raw.terminationReason : null,
      error:
        typeof raw.error === "string"
          ? sanitizePreviewText(raw.error, 300)
          : null,
      lastUserInput:
        typeof raw.lastUserInput === "string"
          ? sanitizePreviewText(raw.lastUserInput, 500)
          : null,
      toolCallId:
        toolCall && typeof toolCall.id === "string" ? toolCall.id : null,
      toolName:
        toolCall && typeof toolCall.name === "string" ? toolCall.name : null,
      argBytes:
        toolCall && typeof toolCall.argBytes === "number"
          ? toolCall.argBytes
          : null,
      dedupKey
    });
  }

  db.insertHookEvents(toInsert);
  db.upsertIndexedFile({
    path: eventsPath,
    fileSize: stat.size,
    mtimeMs: stat.mtimeMs,
    lastOffset: newOffset,
    updatedAtMs: Date.now()
  });

  return {
    ingestedCount: toInsert.length,
    touchedConversationIds: Array.from(touched)
  };
}
