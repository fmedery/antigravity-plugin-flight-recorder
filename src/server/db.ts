import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";

function loadDatabaseSync(): typeof DatabaseSyncType {
  const req = createRequire(import.meta.url);
  const origEmit = process.emitWarning;
  process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
    const msg = typeof warning === "string" ? warning : warning?.message ?? "";
    const typeArg =
      typeof args[0] === "string"
        ? args[0]
        : (args[0] as { type?: string } | undefined)?.type ??
          (warning as Error)?.name ??
          "";
    if (typeArg === "ExperimentalWarning" && /sqlite/i.test(msg)) {
      return;
    }
    return (origEmit as (...a: unknown[]) => void).call(process, warning, ...args);
  }) as typeof process.emitWarning;
  try {
    const mod = req("node:sqlite") as { DatabaseSync: typeof DatabaseSyncType };
    return mod.DatabaseSync;
  } finally {
    process.emitWarning = origEmit;
  }
}

const DatabaseSync = loadDatabaseSync();
import { DEFAULT_PRICING_RULES } from "../shared/pricing.js";
import type {
  ChildConversationLink,
  ConversationDetail,
  ConversationSummary,
  DiagnosticFinding,
  FileTouchRecord,
  ModelAvailabilitySignal,
  ModelPricingRule,
  PlannerStepRecord,
  ProjectSource,
  SkillToolMetric,
  SurfaceType,
  SwarmRole,
  ToolCallRecord,
  ToolCategory,
  TurnRecord
} from "../shared/types.js";
import { extractUnavailableModelError } from "./transcriptParser.js";

export interface HookEventRow {
  id: number;
  tsMs: number;
  hookEventName: string;
  conversationId: string;
  workspacePaths: string[];
  transcriptPath: string | null;
  modelName: string | null;
  cwd: string | null;
  stepIdx: number | null;
  invocationNum: number | null;
  terminationReason: string | null;
  error: string | null;
  lastUserInput: string | null;
  toolCallId: string | null;
  toolName: string | null;
  argBytes: number | null;
}

export interface IndexedFileRow {
  path: string;
  fileSize: number;
  mtimeMs: number;
  lastOffset: number;
  updatedAtMs: number;
}

export interface PersistConversationInput {
  conversationId: string;
  title: string;
  surface: SurfaceType;
  transcriptPath: string;
  projectPath: string;
  projectSource: ProjectSource;
  parentConversationId: string | null;
  subagentRole: string | null;
  subagentType: string | null;
  swarmRole?: SwarmRole | null;
  swarmTitle?: string | null;
  swarmTasks?: Record<string, string>;
  startedAtMs: number;
  endedAtMs: number;
  terminationReason: string | null;
  models: string[];
  slashCommands: string[];
  skillsUsed: string[];
  hasLiveHooks: boolean;
  hasTokenTelemetry: boolean;
  inputTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  peakContextTokens: number;
  activeMs: number;
  modelMs: number;
  toolWallMs: number;
  toolSumMs: number;
  userIdleMs: number;
  wallClockMs: number;
  errorCount: number;
  turns: TurnRecord[];
  plannerSteps: Array<Omit<PlannerStepRecord, "estimatedCostUsd">>;
  toolCalls: Array<Omit<ToolCallRecord, "id">>;
  diagnostics: DiagnosticFinding[];
  filesTouched: FileTouchRecord[];
  modelUnavailableErrors?: Array<{ model: string; tsMs: number; reason: string }>;
  indexedAtMs: number;
}

export class TrackerDatabase {
  public readonly db: DatabaseSyncType;
  public readonly dbPath: string;

  constructor(dataDir: string) {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    this.dbPath = path.join(dataDir, "tracker.sqlite");
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec("PRAGMA busy_timeout = 5000;");
    if (process.platform !== "win32") {
      for (const [target, mode] of [
        [dataDir, 0o700],
        [this.dbPath, 0o600],
        [`${this.dbPath}-wal`, 0o600],
        [`${this.dbPath}-shm`, 0o600]
      ] as const) {
        try {
          if (fs.existsSync(target)) {
            fs.chmodSync(target, mode);
          }
        } catch {
          // Best-effort permission tightening
        }
      }
    }
    this.migrate();
    this.seedDefaultPricing();
  }

  close(): void {
    this.db.close();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS indexed_files (
        path TEXT PRIMARY KEY,
        file_size INTEGER NOT NULL,
        mtime_ms REAL NOT NULL,
        last_offset INTEGER NOT NULL DEFAULT 0,
        updated_at_ms INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        conversation_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        surface TEXT NOT NULL,
        transcript_path TEXT NOT NULL,
        project_path TEXT NOT NULL,
        project_source TEXT NOT NULL,
        parent_conversation_id TEXT,
        subagent_role TEXT,
        subagent_type TEXT,
        swarm_role TEXT,
        swarm_title TEXT,
        swarm_tasks_json TEXT NOT NULL DEFAULT '{}',
        started_at_ms INTEGER NOT NULL,
        ended_at_ms INTEGER NOT NULL,
        termination_reason TEXT,
        models_json TEXT NOT NULL,
        slash_commands_json TEXT NOT NULL,
        skills_used_json TEXT NOT NULL,
        has_live_hooks INTEGER NOT NULL DEFAULT 0,
        has_token_telemetry INTEGER NOT NULL DEFAULT 1,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        cache_read_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        peak_context_tokens INTEGER NOT NULL DEFAULT 0,
        active_ms INTEGER NOT NULL DEFAULT 0,
        model_ms INTEGER NOT NULL DEFAULT 0,
        tool_wall_ms INTEGER NOT NULL DEFAULT 0,
        tool_sum_ms INTEGER NOT NULL DEFAULT 0,
        user_idle_ms INTEGER NOT NULL DEFAULT 0,
        wall_clock_ms INTEGER NOT NULL DEFAULT 0,
        error_count INTEGER NOT NULL DEFAULT 0,
        diagnostics_json TEXT NOT NULL DEFAULT '[]',
        files_touched_json TEXT NOT NULL DEFAULT '[]',
        indexed_at_ms INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_path);
      CREATE INDEX IF NOT EXISTS idx_conversations_parent ON conversations(parent_conversation_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_ended ON conversations(ended_at_ms DESC);

      CREATE TABLE IF NOT EXISTS turns (
        conversation_id TEXT NOT NULL,
        turn_index INTEGER NOT NULL,
        prompt_preview TEXT NOT NULL,
        slash_command TEXT,
        started_at_ms INTEGER NOT NULL,
        ended_at_ms INTEGER NOT NULL,
        active_ms INTEGER NOT NULL,
        model_ms INTEGER NOT NULL,
        tool_wall_ms INTEGER NOT NULL,
        user_idle_before_ms INTEGER NOT NULL,
        input_tokens INTEGER NOT NULL,
        cache_read_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        PRIMARY KEY (conversation_id, turn_index),
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS planner_steps (
        conversation_id TEXT NOT NULL,
        seq_index INTEGER NOT NULL,
        step_index INTEGER NOT NULL,
        turn_index INTEGER NOT NULL,
        model TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL,
        completed_at_ms INTEGER,
        model_duration_ms INTEGER NOT NULL,
        input_tokens INTEGER NOT NULL,
        cache_read_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        total_context_tokens INTEGER NOT NULL,
        is_cache_miss INTEGER NOT NULL DEFAULT 0,
        cache_miss_cause TEXT,
        thinking_chars INTEGER NOT NULL DEFAULT 0,
        content_chars INTEGER NOT NULL DEFAULT 0,
        tool_call_count INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        attributed_summary TEXT NOT NULL DEFAULT '',
        PRIMARY KEY (conversation_id, seq_index),
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tool_calls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        step_index INTEGER NOT NULL,
        planner_step_index INTEGER NOT NULL,
        turn_index INTEGER NOT NULL,
        tool_call_id TEXT,
        tool_name TEXT NOT NULL,
        category TEXT NOT NULL,
        mcp_server TEXT,
        skill_name TEXT,
        skill_plugin TEXT,
        target_path TEXT,
        child_conversation_id TEXT,
        child_conversation_ids_json TEXT NOT NULL DEFAULT '[]',
        started_at_ms INTEGER,
        completed_at_ms INTEGER,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        args_preview TEXT NOT NULL DEFAULT '',
        result_bytes INTEGER NOT NULL DEFAULT 0,
        est_result_tokens INTEGER NOT NULL DEFAULT 0,
        attributed_input_tokens INTEGER NOT NULL DEFAULT 0,
        compounded_cache_tokens INTEGER NOT NULL DEFAULT 0,
        is_error INTEGER NOT NULL DEFAULT 0,
        error_preview TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tool_calls_conv ON tool_calls(conversation_id, step_index);
      CREATE INDEX IF NOT EXISTS idx_tool_calls_child ON tool_calls(child_conversation_id);

      CREATE TABLE IF NOT EXISTS hook_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts_ms INTEGER NOT NULL,
        hook_event_name TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        workspace_paths_json TEXT NOT NULL DEFAULT '[]',
        transcript_path TEXT,
        model_name TEXT,
        cwd TEXT,
        step_idx INTEGER,
        invocation_num INTEGER,
        termination_reason TEXT,
        error TEXT,
        last_user_input TEXT,
        tool_call_id TEXT,
        tool_name TEXT,
        arg_bytes INTEGER,
        dedup_key TEXT UNIQUE
      );

      CREATE INDEX IF NOT EXISTS idx_hook_events_conv ON hook_events(conversation_id, ts_ms);

      CREATE TABLE IF NOT EXISTS project_overrides (
        conversation_id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        updated_at_ms INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS model_pricing (
        id TEXT PRIMARY KEY,
        pattern TEXT NOT NULL,
        label TEXT NOT NULL,
        input_per_1m REAL NOT NULL,
        cache_read_per_1m REAL NOT NULL,
        output_per_1m REAL NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        retired INTEGER,
        sort_order INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS model_error_signals (
        conversation_id TEXT NOT NULL,
        model TEXT NOT NULL,
        error_ts_ms INTEGER NOT NULL,
        reason TEXT NOT NULL,
        PRIMARY KEY (conversation_id, model),
        FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
      );
    `);

    const cols = this.db
      .prepare("PRAGMA table_info(planner_steps)")
      .all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === "seq_index")) {
      this.db.exec(`
        DROP TABLE IF EXISTS planner_steps;
        CREATE TABLE planner_steps (
          conversation_id TEXT NOT NULL,
          seq_index INTEGER NOT NULL,
          step_index INTEGER NOT NULL,
          turn_index INTEGER NOT NULL,
          model TEXT NOT NULL,
          created_at_ms INTEGER NOT NULL,
          completed_at_ms INTEGER,
          model_duration_ms INTEGER NOT NULL,
          input_tokens INTEGER NOT NULL,
          cache_read_tokens INTEGER NOT NULL,
          output_tokens INTEGER NOT NULL,
          total_context_tokens INTEGER NOT NULL,
          is_cache_miss INTEGER NOT NULL DEFAULT 0,
          cache_miss_cause TEXT,
          thinking_chars INTEGER NOT NULL DEFAULT 0,
          content_chars INTEGER NOT NULL DEFAULT 0,
          tool_call_count INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL,
          attributed_summary TEXT NOT NULL DEFAULT '',
          PRIMARY KEY (conversation_id, seq_index),
          FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE
        );
        DELETE FROM indexed_files WHERE path LIKE '%transcript%';
      `);
    }

    const convCols = this.db
      .prepare("PRAGMA table_info(conversations)")
      .all() as Array<{ name: string }>;
    if (!convCols.some((c) => c.name === "has_token_telemetry")) {
      this.db.exec(
        "ALTER TABLE conversations ADD COLUMN has_token_telemetry INTEGER NOT NULL DEFAULT 1;"
      );
    }
    if (!convCols.some((c) => c.name === "swarm_role")) {
      this.db.exec("ALTER TABLE conversations ADD COLUMN swarm_role TEXT;");
    }
    if (!convCols.some((c) => c.name === "swarm_title")) {
      this.db.exec("ALTER TABLE conversations ADD COLUMN swarm_title TEXT;");
    }
    if (!convCols.some((c) => c.name === "swarm_tasks_json")) {
      this.db.exec(
        "ALTER TABLE conversations ADD COLUMN swarm_tasks_json TEXT NOT NULL DEFAULT '{}';"
      );
    }

    const tcCols = this.db
      .prepare("PRAGMA table_info(tool_calls)")
      .all() as Array<{ name: string }>;
    if (!tcCols.some((c) => c.name === "child_conversation_ids_json")) {
      this.db.exec(
        "ALTER TABLE tool_calls ADD COLUMN child_conversation_ids_json TEXT NOT NULL DEFAULT '[]';"
      );
    }

    const pricingCols = this.db
      .prepare("PRAGMA table_info(model_pricing)")
      .all() as Array<{ name: string }>;
    if (!pricingCols.some((c) => c.name === "retired")) {
      this.db.exec("ALTER TABLE model_pricing ADD COLUMN retired INTEGER;");
    }

    const versionRow = this.db
      .prepare("PRAGMA user_version")
      .get() as { user_version: number } | undefined;
    if (Number(versionRow?.user_version ?? 0) < 9) {
      this.db.exec(`
        DELETE FROM indexed_files WHERE path LIKE '%transcript%';
        PRAGMA user_version = 9;
      `);
    }
  }

  private seedDefaultPricing(): void {
    const row = this.db
      .prepare("SELECT COUNT(*) AS cnt FROM model_pricing")
      .get() as { cnt: number };
    if (row && Number(row.cnt) > 0) {
      return;
    }

    const insert = this.db.prepare(`
      INSERT INTO model_pricing (
        id, pattern, label, input_per_1m, cache_read_per_1m, output_per_1m, enabled, retired, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    DEFAULT_PRICING_RULES.forEach((rule, index) => {
      insert.run(
        rule.id,
        rule.pattern,
        rule.label,
        rule.inputPer1M,
        rule.cacheReadPer1M,
        rule.outputPer1M,
        rule.enabled ? 1 : 0,
        typeof rule.retired === "boolean" ? (rule.retired ? 1 : 0) : null,
        index
      );
    });
  }

  getIndexedFile(filePath: string): IndexedFileRow | null {
    const row = this.db
      .prepare(
        "SELECT path, file_size, mtime_ms, last_offset, updated_at_ms FROM indexed_files WHERE path = ?"
      )
      .get(filePath) as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      path: String(row.path),
      fileSize: Number(row.file_size),
      mtimeMs: Number(row.mtime_ms),
      lastOffset: Number(row.last_offset),
      updatedAtMs: Number(row.updated_at_ms)
    };
  }

  upsertIndexedFile(entry: IndexedFileRow): void {
    this.db
      .prepare(`
        INSERT INTO indexed_files (path, file_size, mtime_ms, last_offset, updated_at_ms)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
          file_size = excluded.file_size,
          mtime_ms = excluded.mtime_ms,
          last_offset = excluded.last_offset,
          updated_at_ms = excluded.updated_at_ms
      `)
      .run(
        entry.path,
        entry.fileSize,
        entry.mtimeMs,
        entry.lastOffset,
        entry.updatedAtMs
      );
  }

  insertHookEvents(events: Array<Omit<HookEventRow, "id"> & { dedupKey: string }>): void {
    if (events.length === 0) return;
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO hook_events (
        ts_ms, hook_event_name, conversation_id, workspace_paths_json,
        transcript_path, model_name, cwd, step_idx, invocation_num,
        termination_reason, error, last_user_input, tool_call_id,
        tool_name, arg_bytes, dedup_key
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    this.db.exec("BEGIN");
    try {
      for (const ev of events) {
        stmt.run(
          ev.tsMs,
          ev.hookEventName,
          ev.conversationId,
          JSON.stringify(ev.workspacePaths),
          ev.transcriptPath,
          ev.modelName,
          ev.cwd,
          ev.stepIdx,
          ev.invocationNum,
          ev.terminationReason,
          ev.error,
          ev.lastUserInput,
          ev.toolCallId,
          ev.toolName,
          ev.argBytes,
          ev.dedupKey
        );
      }
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  getHookEventsForConversation(conversationId: string): HookEventRow[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM hook_events WHERE conversation_id = ? ORDER BY ts_ms ASC, id ASC"
      )
      .all(conversationId) as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: Number(r.id),
      tsMs: Number(r.ts_ms),
      hookEventName: String(r.hook_event_name),
      conversationId: String(r.conversation_id),
      workspacePaths: safeJsonParse<string[]>(r.workspace_paths_json, []),
      transcriptPath: r.transcript_path ? String(r.transcript_path) : null,
      modelName: r.model_name ? String(r.model_name) : null,
      cwd: r.cwd ? String(r.cwd) : null,
      stepIdx: r.step_idx !== null && r.step_idx !== undefined ? Number(r.step_idx) : null,
      invocationNum:
        r.invocation_num !== null && r.invocation_num !== undefined
          ? Number(r.invocation_num)
          : null,
      terminationReason: r.termination_reason ? String(r.termination_reason) : null,
      error: r.error ? String(r.error) : null,
      lastUserInput: r.last_user_input ? String(r.last_user_input) : null,
      toolCallId: r.tool_call_id ? String(r.tool_call_id) : null,
      toolName: r.tool_name ? String(r.tool_name) : null,
      argBytes: r.arg_bytes !== null && r.arg_bytes !== undefined ? Number(r.arg_bytes) : null
    }));
  }

  getHookTranscriptPaths(): Array<{ conversationId: string; transcriptPath: string }> {
    const rows = this.db
      .prepare(`
        SELECT conversation_id, MAX(transcript_path) AS transcript_path
        FROM hook_events
        WHERE transcript_path IS NOT NULL AND transcript_path != ''
        GROUP BY conversation_id
      `)
      .all() as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      conversationId: String(r.conversation_id),
      transcriptPath: String(r.transcript_path)
    }));
  }

  getLatestHookTsForConversation(conversationId: string): number {
    const row = this.db
      .prepare("SELECT MAX(ts_ms) AS max_ts FROM hook_events WHERE conversation_id = ?")
      .get(conversationId) as { max_ts: number | null } | undefined;
    return row?.max_ts ? Number(row.max_ts) : 0;
  }

  getProjectOverride(conversationId: string): { projectPath: string; updatedAtMs: number } | null {
    const row = this.db
      .prepare("SELECT project_path, updated_at_ms FROM project_overrides WHERE conversation_id = ?")
      .get(conversationId) as { project_path: string; updated_at_ms: number } | undefined;
    if (!row) return null;
    return {
      projectPath: String(row.project_path),
      updatedAtMs: Number(row.updated_at_ms)
    };
  }

  setProjectOverride(conversationId: string, projectPath: string): void {
    const now = Date.now();
    this.db.exec("BEGIN");
    try {
      this.db
        .prepare(`
          INSERT INTO project_overrides (conversation_id, project_path, updated_at_ms)
          VALUES (?, ?, ?)
          ON CONFLICT(conversation_id) DO UPDATE SET
            project_path = excluded.project_path,
            updated_at_ms = excluded.updated_at_ms
        `)
        .run(conversationId, projectPath, now);

      this.db
        .prepare(`
          UPDATE conversations
          SET project_path = ?, project_source = 'manual'
          WHERE conversation_id = ? OR parent_conversation_id = ?
        `)
        .run(projectPath, conversationId, conversationId);
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  getPricingRules(): ModelPricingRule[] {
    const rows = this.db
      .prepare(
        "SELECT id, pattern, label, input_per_1m, cache_read_per_1m, output_per_1m, enabled, retired FROM model_pricing ORDER BY sort_order ASC, id ASC"
      )
      .all() as Array<Record<string, unknown>>;

    return rows.map((r) => ({
      id: String(r.id),
      pattern: String(r.pattern),
      label: String(r.label),
      inputPer1M: Number(r.input_per_1m),
      cacheReadPer1M: Number(r.cache_read_per_1m),
      outputPer1M: Number(r.output_per_1m),
      enabled: Number(r.enabled) === 1,
      ...(r.retired !== null && r.retired !== undefined
        ? { retired: Number(r.retired) === 1 }
        : {})
    }));
  }

  savePricingRules(rules: ModelPricingRule[]): void {
    this.db.exec("BEGIN");
    try {
      this.db.exec("DELETE FROM model_pricing");
      const insert = this.db.prepare(`
        INSERT INTO model_pricing (
          id, pattern, label, input_per_1m, cache_read_per_1m, output_per_1m, enabled, retired, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      rules.forEach((rule, idx) => {
        insert.run(
          rule.id,
          rule.pattern,
          rule.label,
          rule.inputPer1M,
          rule.cacheReadPer1M,
          rule.outputPer1M,
          rule.enabled ? 1 : 0,
          typeof rule.retired === "boolean" ? (rule.retired ? 1 : 0) : null,
          idx
        );
      });
      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  upsertConversation(input: PersistConversationInput): void {
    this.db.exec("BEGIN");
    try {
      this.db
        .prepare(`
          INSERT INTO conversations (
            conversation_id, title, surface, transcript_path, project_path, project_source,
            parent_conversation_id, subagent_role, subagent_type,
            swarm_role, swarm_title, swarm_tasks_json,
            started_at_ms, ended_at_ms, termination_reason,
            models_json, slash_commands_json, skills_used_json, has_live_hooks, has_token_telemetry,
            input_tokens, cache_read_tokens, output_tokens, peak_context_tokens,
            active_ms, model_ms, tool_wall_ms, tool_sum_ms, user_idle_ms, wall_clock_ms,
            error_count, diagnostics_json, files_touched_json, indexed_at_ms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(conversation_id) DO UPDATE SET
            title = excluded.title,
            surface = excluded.surface,
            transcript_path = excluded.transcript_path,
            project_path = excluded.project_path,
            project_source = excluded.project_source,
            parent_conversation_id = excluded.parent_conversation_id,
            subagent_role = excluded.subagent_role,
            subagent_type = excluded.subagent_type,
            swarm_role = excluded.swarm_role,
            swarm_title = excluded.swarm_title,
            swarm_tasks_json = excluded.swarm_tasks_json,
            started_at_ms = excluded.started_at_ms,
            ended_at_ms = excluded.ended_at_ms,
            termination_reason = excluded.termination_reason,
            models_json = excluded.models_json,
            slash_commands_json = excluded.slash_commands_json,
            skills_used_json = excluded.skills_used_json,
            has_live_hooks = excluded.has_live_hooks,
            has_token_telemetry = excluded.has_token_telemetry,
            input_tokens = excluded.input_tokens,
            cache_read_tokens = excluded.cache_read_tokens,
            output_tokens = excluded.output_tokens,
            peak_context_tokens = excluded.peak_context_tokens,
            active_ms = excluded.active_ms,
            model_ms = excluded.model_ms,
            tool_wall_ms = excluded.tool_wall_ms,
            tool_sum_ms = excluded.tool_sum_ms,
            user_idle_ms = excluded.user_idle_ms,
            wall_clock_ms = excluded.wall_clock_ms,
            error_count = excluded.error_count,
            diagnostics_json = excluded.diagnostics_json,
            files_touched_json = excluded.files_touched_json,
            indexed_at_ms = excluded.indexed_at_ms
        `)
        .run(
          input.conversationId,
          input.title,
          input.surface,
          input.transcriptPath,
          input.projectPath,
          input.projectSource,
          input.parentConversationId,
          input.subagentRole,
          input.subagentType,
          input.swarmRole ?? null,
          input.swarmTitle ?? null,
          JSON.stringify(input.swarmTasks ?? {}),
          input.startedAtMs,
          input.endedAtMs,
          input.terminationReason,
          JSON.stringify(input.models),
          JSON.stringify(input.slashCommands),
          JSON.stringify(input.skillsUsed),
          input.hasLiveHooks ? 1 : 0,
          input.hasTokenTelemetry ? 1 : 0,
          input.inputTokens,
          input.cacheReadTokens,
          input.outputTokens,
          input.peakContextTokens,
          input.activeMs,
          input.modelMs,
          input.toolWallMs,
          input.toolSumMs,
          input.userIdleMs,
          input.wallClockMs,
          input.errorCount,
          JSON.stringify(input.diagnostics),
          JSON.stringify(input.filesTouched),
          input.indexedAtMs
        );

      this.db.prepare("DELETE FROM turns WHERE conversation_id = ?").run(input.conversationId);
      this.db.prepare("DELETE FROM planner_steps WHERE conversation_id = ?").run(input.conversationId);
      this.db.prepare("DELETE FROM tool_calls WHERE conversation_id = ?").run(input.conversationId);
      this.db.prepare("DELETE FROM model_error_signals WHERE conversation_id = ?").run(input.conversationId);

      if (input.modelUnavailableErrors && input.modelUnavailableErrors.length > 0) {
        const insertErrSignal = this.db.prepare(`
          INSERT INTO model_error_signals (conversation_id, model, error_ts_ms, reason)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(conversation_id, model) DO UPDATE SET
            error_ts_ms = CASE
              WHEN excluded.error_ts_ms >= model_error_signals.error_ts_ms
              THEN excluded.error_ts_ms
              ELSE model_error_signals.error_ts_ms
            END,
            reason = CASE
              WHEN excluded.error_ts_ms >= model_error_signals.error_ts_ms
              THEN excluded.reason
              ELSE model_error_signals.reason
            END
        `);
        for (const errSig of input.modelUnavailableErrors) {
          insertErrSignal.run(
            input.conversationId,
            errSig.model.trim().toLowerCase(),
            errSig.tsMs,
            errSig.reason
          );
        }
      }

      const insertTurn = this.db.prepare(`
        INSERT INTO turns (
          conversation_id, turn_index, prompt_preview, slash_command,
          started_at_ms, ended_at_ms, active_ms, model_ms, tool_wall_ms,
          user_idle_before_ms, input_tokens, cache_read_tokens, output_tokens
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of input.turns) {
        insertTurn.run(
          input.conversationId,
          t.turnIndex,
          t.promptPreview,
          t.slashCommand,
          t.startedAtMs,
          t.endedAtMs,
          t.activeMs,
          t.modelMs,
          t.toolWallMs,
          t.userIdleBeforeMs,
          t.inputTokens,
          t.cacheReadTokens,
          t.outputTokens
        );
      }

      const insertPlanner = this.db.prepare(`
        INSERT INTO planner_steps (
          conversation_id, seq_index, step_index, turn_index, model, created_at_ms, completed_at_ms,
          model_duration_ms, input_tokens, cache_read_tokens, output_tokens, total_context_tokens,
          is_cache_miss, cache_miss_cause, thinking_chars, content_chars, tool_call_count,
          status, attributed_summary
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      input.plannerSteps.forEach((s, seqIdx) => {
        insertPlanner.run(
          input.conversationId,
          seqIdx,
          s.stepIndex,
          s.turnIndex,
          s.model,
          s.createdAtMs,
          s.completedAtMs,
          s.modelDurationMs,
          s.inputTokens,
          s.cacheReadTokens,
          s.outputTokens,
          s.totalContextTokens,
          s.isCacheMiss ? 1 : 0,
          s.cacheMissCause,
          s.thinkingChars,
          s.contentChars,
          s.toolCallCount,
          s.status,
          s.attributedSummary
        );
      });

      const insertTool = this.db.prepare(`
        INSERT INTO tool_calls (
          conversation_id, step_index, planner_step_index, turn_index, tool_call_id,
          tool_name, category, mcp_server, skill_name, skill_plugin, target_path,
          child_conversation_id, child_conversation_ids_json, started_at_ms, completed_at_ms, duration_ms,
          args_preview, result_bytes, est_result_tokens, attributed_input_tokens,
          compounded_cache_tokens, is_error, error_preview
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const tc of input.toolCalls) {
        const serializedLinks =
          tc.childLinks && tc.childLinks.length > 0
            ? tc.childLinks
            : tc.childConversationId
              ? [{ conversationId: tc.childConversationId, role: null, typeName: null }]
              : [];
        insertTool.run(
          input.conversationId,
          tc.stepIndex,
          tc.plannerStepIndex,
          tc.turnIndex,
          tc.toolCallId,
          tc.toolName,
          tc.category,
          tc.mcpServer,
          tc.skillName,
          tc.skillPlugin,
          tc.targetPath,
          tc.childConversationId,
          JSON.stringify(serializedLinks),
          tc.startedAtMs,
          tc.completedAtMs,
          tc.durationMs,
          tc.argsPreview,
          tc.resultBytes,
          tc.estResultTokens,
          tc.attributedInputTokens,
          tc.compoundedCacheTokens,
          tc.isError ? 1 : 0,
          tc.errorPreview
        );
      }

      this.db.exec("COMMIT");
    } catch (err) {
      this.db.exec("ROLLBACK");
      throw err;
    }
  }

  getConversationRecord(conversationId: string): StoredConversationRow | null {
    const row = this.db
      .prepare("SELECT * FROM conversations WHERE conversation_id = ?")
      .get(conversationId) as Record<string, unknown> | undefined;
    return row ? mapStoredConversationRow(row) : null;
  }

  getAllConversationRecords(): StoredConversationRow[] {
    const rows = this.db
      .prepare("SELECT * FROM conversations ORDER BY ended_at_ms DESC")
      .all() as Array<Record<string, unknown>>;
    return rows.map(mapStoredConversationRow);
  }

  getTurnsForConversation(conversationId: string): TurnRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM turns WHERE conversation_id = ? ORDER BY turn_index ASC")
      .all(conversationId) as Array<Record<string, unknown>>;
    return rows.map((r) => {
      const inputTokens = Number(r.input_tokens);
      const cacheReadTokens = Number(r.cache_read_tokens);
      const denom = inputTokens + cacheReadTokens;
      return {
        turnIndex: Number(r.turn_index),
        promptPreview: String(r.prompt_preview),
        slashCommand: r.slash_command ? String(r.slash_command) : null,
        startedAtMs: Number(r.started_at_ms),
        endedAtMs: Number(r.ended_at_ms),
        activeMs: Number(r.active_ms),
        modelMs: Number(r.model_ms),
        toolWallMs: Number(r.tool_wall_ms),
        userIdleBeforeMs: Number(r.user_idle_before_ms),
        inputTokens,
        cacheReadTokens,
        outputTokens: Number(r.output_tokens),
        cacheHitRatio: denom > 0 ? cacheReadTokens / denom : 0
      };
    });
  }

  getPlannerStepsForConversation(
    conversationId: string
  ): Array<Omit<PlannerStepRecord, "estimatedCostUsd">> {
    const rows = this.db
      .prepare("SELECT * FROM planner_steps WHERE conversation_id = ? ORDER BY seq_index ASC")
      .all(conversationId) as Array<Record<string, unknown>>;
    return rows.map((r) => {
      const inputTokens = Number(r.input_tokens);
      const cacheReadTokens = Number(r.cache_read_tokens);
      const denom = inputTokens + cacheReadTokens;
      return {
        stepIndex: Number(r.step_index),
        turnIndex: Number(r.turn_index),
        model: String(r.model),
        createdAtMs: Number(r.created_at_ms),
        completedAtMs:
          r.completed_at_ms !== null && r.completed_at_ms !== undefined
            ? Number(r.completed_at_ms)
            : null,
        modelDurationMs: Number(r.model_duration_ms),
        inputTokens,
        cacheReadTokens,
        outputTokens: Number(r.output_tokens),
        totalContextTokens: Number(r.total_context_tokens),
        cacheHitRatio: denom > 0 ? cacheReadTokens / denom : 0,
        isCacheMiss: Number(r.is_cache_miss) === 1,
        cacheMissCause: r.cache_miss_cause ? String(r.cache_miss_cause) : null,
        thinkingChars: Number(r.thinking_chars),
        contentChars: Number(r.content_chars),
        toolCallCount: Number(r.tool_call_count),
        status: String(r.status),
        attributedSummary: String(r.attributed_summary ?? "")
      };
    });
  }

  getToolCallsForConversation(conversationId: string): ToolCallRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM tool_calls WHERE conversation_id = ? ORDER BY step_index ASC, id ASC")
      .all(conversationId) as Array<Record<string, unknown>>;
    return rows.map((r) => {
      const childConversationId = r.child_conversation_id
        ? String(r.child_conversation_id)
        : null;
      const parsedLinks = safeJsonParse<ChildConversationLink[]>(
        r.child_conversation_ids_json,
        []
      ).filter((l) => l && typeof l.conversationId === "string" && l.conversationId.length > 0);
      const childLinks: ChildConversationLink[] =
        parsedLinks.length > 0
          ? parsedLinks
          : childConversationId
            ? [{ conversationId: childConversationId, role: null, typeName: null }]
            : [];
      const childConversationIds = childLinks.map((l) => l.conversationId);

      return {
        id: Number(r.id),
        stepIndex: Number(r.step_index),
        plannerStepIndex: Number(r.planner_step_index),
        turnIndex: Number(r.turn_index),
        toolCallId: r.tool_call_id ? String(r.tool_call_id) : null,
        toolName: String(r.tool_name),
        category: String(r.category) as ToolCategory,
        mcpServer: r.mcp_server ? String(r.mcp_server) : null,
        skillName: r.skill_name ? String(r.skill_name) : null,
        skillPlugin: r.skill_plugin ? String(r.skill_plugin) : null,
        targetPath: r.target_path ? String(r.target_path) : null,
        childConversationId,
        ...(childConversationIds.length > 0 ? { childConversationIds } : {}),
        ...(childLinks.length > 0 ? { childLinks } : {}),
        startedAtMs:
          r.started_at_ms !== null && r.started_at_ms !== undefined
            ? Number(r.started_at_ms)
            : null,
        completedAtMs:
          r.completed_at_ms !== null && r.completed_at_ms !== undefined
            ? Number(r.completed_at_ms)
            : null,
        durationMs: Number(r.duration_ms),
        argsPreview: String(r.args_preview ?? ""),
        resultBytes: Number(r.result_bytes),
        estResultTokens: Number(r.est_result_tokens),
        attributedInputTokens: Number(r.attributed_input_tokens),
        compoundedCacheTokens: Number(r.compounded_cache_tokens),
        isError: Number(r.is_error) === 1,
        errorPreview: r.error_preview ? String(r.error_preview) : null
      };
    });
  }

  getSubagentLinkMap(): Map<
    string,
    { parentConversationId: string; role: string | null; typeName: string | null }
  > {
    const rows = this.db
      .prepare(`
        SELECT conversation_id, child_conversation_id, child_conversation_ids_json, args_preview
        FROM tool_calls
        WHERE (child_conversation_id IS NOT NULL AND child_conversation_id != '')
           OR (child_conversation_ids_json IS NOT NULL AND child_conversation_ids_json != '' AND child_conversation_ids_json != '[]')
      `)
      .all() as Array<Record<string, unknown>>;

    const map = new Map<
      string,
      { parentConversationId: string; role: string | null; typeName: string | null }
    >();
    for (const row of rows) {
      const parentId = String(row.conversation_id);
      const preview = String(row.args_preview ?? "");
      const roleMatch = preview.match(/Role:\s*([^|]+)/i);
      const typeMatch = preview.match(/Type:\s*([^|]+)/i);
      const fallbackRole = roleMatch ? roleMatch[1].trim() : null;
      const fallbackType = typeMatch ? typeMatch[1].trim() : null;

      const parsedLinks = safeJsonParse<ChildConversationLink[]>(
        row.child_conversation_ids_json,
        []
      );
      const seenInRow = new Set<string>();
      for (const link of parsedLinks) {
        if (!link || typeof link.conversationId !== "string" || !link.conversationId) {
          continue;
        }
        seenInRow.add(link.conversationId);
        map.set(link.conversationId, {
          parentConversationId: parentId,
          role: link.role ?? fallbackRole,
          typeName: link.typeName ?? fallbackType
        });
      }

      const legacyChildId = row.child_conversation_id
        ? String(row.child_conversation_id)
        : "";
      if (legacyChildId && !seenInRow.has(legacyChildId)) {
        map.set(legacyChildId, {
          parentConversationId: parentId,
          role: fallbackRole,
          typeName: fallbackType
        });
      }
    }
    return map;
  }

  getModelAvailabilitySignals(): {
    signals: Record<string, ModelAvailabilitySignal>;
    latestGlobalActivityMs: number;
  } {
    const signals: Record<string, ModelAvailabilitySignal> = {};
    let latestGlobalActivityMs = 0;

    const maxConvRow = this.db
      .prepare("SELECT MAX(ended_at_ms) AS max_ended FROM conversations")
      .get() as { max_ended?: number | null } | undefined;
    if (maxConvRow?.max_ended && Number.isFinite(Number(maxConvRow.max_ended))) {
      latestGlobalActivityMs = Math.max(latestGlobalActivityMs, Number(maxConvRow.max_ended));
    }

    const seenRows = this.db
      .prepare(`
        SELECT LOWER(TRIM(model)) AS model, MAX(created_at_ms) AS last_seen_ms
        FROM planner_steps
        WHERE model IS NOT NULL AND TRIM(model) != ''
        GROUP BY LOWER(TRIM(model))
      `)
      .all() as Array<{ model: string; last_seen_ms: number | null }>;

    for (const r of seenRows) {
      const model = String(r.model || "").trim().toLowerCase();
      if (!model || model === "unknown" || model === "auto") continue;
      const lastSeenAtMs = Number(r.last_seen_ms ?? 0);
      if (lastSeenAtMs > latestGlobalActivityMs) {
        latestGlobalActivityMs = lastSeenAtMs;
      }
      signals[model] = {
        model,
        lastSeenAtMs,
        lastUnavailableErrorAtMs: null,
        lastUnavailableReason: null
      };
    }

    const mergeError = (modelRaw: string, errTsMs: number, reason: string) => {
      const model = modelRaw.trim().toLowerCase();
      if (!model || model === "unknown" || model === "auto") return;
      const existing = signals[model] ?? {
        model,
        lastSeenAtMs: 0,
        lastUnavailableErrorAtMs: null,
        lastUnavailableReason: null
      };
      if (
        existing.lastUnavailableErrorAtMs === null ||
        errTsMs >= existing.lastUnavailableErrorAtMs
      ) {
        existing.lastUnavailableErrorAtMs = errTsMs;
        existing.lastUnavailableReason = reason;
      }
      signals[model] = existing;
    };

    const errRows = this.db
      .prepare(
        "SELECT LOWER(TRIM(model)) AS model, error_ts_ms, reason FROM model_error_signals ORDER BY error_ts_ms DESC"
      )
      .all() as Array<{ model: string; error_ts_ms: number; reason: string }>;
    for (const r of errRows) {
      mergeError(String(r.model || ""), Number(r.error_ts_ms ?? 0), String(r.reason ?? ""));
    }

    const hookErrRows = this.db
      .prepare("SELECT ts_ms, error FROM hook_events WHERE error IS NOT NULL AND error != ''")
      .all() as Array<{ ts_ms: number; error: string }>;
    for (const r of hookErrRows) {
      const extracted = extractUnavailableModelError(String(r.error || ""));
      if (extracted) {
        mergeError(extracted.model, Number(r.ts_ms ?? 0), extracted.reason);
      }
    }

    return { signals, latestGlobalActivityMs };
  }
}

export interface StoredConversationRow {
  conversationId: string;
  title: string;
  surface: SurfaceType;
  transcriptPath: string;
  projectPath: string;
  projectSource: ProjectSource;
  parentConversationId: string | null;
  subagentRole: string | null;
  subagentType: string | null;
  swarmRole?: SwarmRole | null;
  swarmTitle?: string | null;
  swarmTasks?: Record<string, string>;
  startedAtMs: number;
  endedAtMs: number;
  terminationReason: string | null;
  models: string[];
  slashCommands: string[];
  skillsUsed: string[];
  hasLiveHooks: boolean;
  hasTokenTelemetry: boolean;
  inputTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  peakContextTokens: number;
  activeMs: number;
  modelMs: number;
  toolWallMs: number;
  toolSumMs: number;
  userIdleMs: number;
  wallClockMs: number;
  errorCount: number;
  diagnostics: DiagnosticFinding[];
  filesTouched: FileTouchRecord[];
  modelUnavailableErrors?: Array<{ model: string; tsMs: number; reason: string }>;
  indexedAtMs: number;
}

function mapStoredConversationRow(r: Record<string, unknown>): StoredConversationRow {
  return {
    conversationId: String(r.conversation_id),
    title: String(r.title),
    surface: String(r.surface) as SurfaceType,
    transcriptPath: String(r.transcript_path),
    projectPath: String(r.project_path),
    projectSource: String(r.project_source) as ProjectSource,
    parentConversationId: r.parent_conversation_id ? String(r.parent_conversation_id) : null,
    subagentRole: r.subagent_role ? String(r.subagent_role) : null,
    subagentType: r.subagent_type ? String(r.subagent_type) : null,
    swarmRole:
      r.swarm_role === "coordinator" || r.swarm_role === "worker"
        ? r.swarm_role
        : null,
    swarmTitle: r.swarm_title ? String(r.swarm_title) : null,
    swarmTasks: safeJsonParse<Record<string, string>>(r.swarm_tasks_json, {}),
    startedAtMs: Number(r.started_at_ms),
    endedAtMs: Number(r.ended_at_ms),
    terminationReason: r.termination_reason ? String(r.termination_reason) : null,
    models: safeJsonParse<string[]>(r.models_json, []),
    slashCommands: safeJsonParse<string[]>(r.slash_commands_json, []),
    skillsUsed: safeJsonParse<string[]>(r.skills_used_json, []),
    hasLiveHooks: Number(r.has_live_hooks) === 1,
    hasTokenTelemetry:
      r.has_token_telemetry === undefined || r.has_token_telemetry === null
        ? true
        : Number(r.has_token_telemetry) === 1,
    inputTokens: Number(r.input_tokens),
    cacheReadTokens: Number(r.cache_read_tokens),
    outputTokens: Number(r.output_tokens),
    peakContextTokens: Number(r.peak_context_tokens),
    activeMs: Number(r.active_ms),
    modelMs: Number(r.model_ms),
    toolWallMs: Number(r.tool_wall_ms),
    toolSumMs: Number(r.tool_sum_ms),
    userIdleMs: Number(r.user_idle_ms),
    wallClockMs: Number(r.wall_clock_ms),
    errorCount: Number(r.error_count),
    diagnostics: safeJsonParse<DiagnosticFinding[]>(r.diagnostics_json, []),
    filesTouched: safeJsonParse<FileTouchRecord[]>(r.files_touched_json, []),
    indexedAtMs: Number(r.indexed_at_ms)
  };
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export type { ConversationDetail, ConversationSummary, SkillToolMetric };
