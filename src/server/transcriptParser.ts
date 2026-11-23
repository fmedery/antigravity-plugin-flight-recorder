import fs from "node:fs";
import readline from "node:readline";
import { isAbsoluteLocalPath, unwrapFileUri } from "../shared/paths.js";
import { sanitizePreviewText } from "../shared/redact.js";
import type { ToolCategory } from "../shared/types.js";

export interface ParsedTurnRaw {
  turnIndex: number;
  stepIndex: number;
  createdAtMs: number;
  promptText: string;
  promptPreview: string;
  promptBytes: number;
  slashCommand: string | null;
}

export interface ParsedToolCallRaw {
  stepIndex: number;
  plannerStepIndex: number;
  turnIndex: number;
  toolCallId: string | null;
  toolName: string;
  category: ToolCategory;
  mcpServer: string | null;
  skillName: string | null;
  skillPlugin: string | null;
  targetPath: string | null;
  childConversationId: string | null;
  startedAtMs: number | null;
  completedAtMs: number | null;
  durationMs: number;
  argsPreview: string;
  commandPathHints: string[];
  resultBytes: number;
  estResultTokens: number;
  isError: boolean;
  errorPreview: string | null;
}

export interface ParsedPlannerStepRaw {
  stepIndex: number;
  turnIndex: number;
  model: string;
  createdAtMs: number;
  thinkingChars: number;
  contentChars: number;
  inputTokens: number;
  cacheReadTokens: number;
  outputTokens: number;
  totalContextTokens: number;
  toolCallCount: number;
  status: string;
}

export interface ParsedTranscript {
  conversationId: string;
  transcriptPath: string;
  title: string;
  hasExplicitUserPrompt?: boolean;
  systemTaskPreview?: string | null;
  hasTokenTelemetry?: boolean;
  startedAtMs: number;
  endedAtMs: number;
  models: string[];
  slashCommands: string[];
  turns: ParsedTurnRaw[];
  plannerSteps: ParsedPlannerStepRaw[];
  toolCalls: ParsedToolCallRaw[];
  candidatePaths: string[];
}

interface RawLine {
  step_index?: number;
  source?: string;
  type?: string;
  status?: string;
  created_at?: string;
  model?: string;
  input_tokens?: number;
  cache_read_tokens?: number;
  output_tokens?: number;
  content?: string;
  thinking?: string;
  tool_calls?: Array<{
    id?: string;
    name?: string;
    args?: unknown;
  }>;
}

export function parseTimestampMs(raw: string | undefined | null): number | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const ms = Date.parse(trimmed);
  return Number.isFinite(ms) ? ms : null;
}

function unwrapStringValue(val: unknown): unknown {
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return val;
    }
  }
  return val;
}

export function normalizeArgs(rawArgs: unknown): Record<string, unknown> {
  const unwrapped = unwrapStringValue(rawArgs);
  if (!unwrapped || typeof unwrapped !== "object" || Array.isArray(unwrapped)) {
    return unwrapped !== undefined && unwrapped !== null ? { value: unwrapped } : {};
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(unwrapped as Record<string, unknown>)) {
    out[k] = unwrapStringValue(v);
  }
  return out;
}

function extractUserRequest(content: string): {
  promptText: string;
  slashCommand: string | null;
} {
  let text = content;
  const reqMatch = content.match(/<USER_REQUEST>\s*([\s\S]*?)\s*<\/USER_REQUEST>/);
  if (reqMatch) {
    text = reqMatch[1].trim();
  } else {
    text = content.trim();
  }

  let slashCommand: string | null = null;
  const slashMatch = text.match(/^(\/[a-zA-Z][a-zA-Z0-9_-]*)(?:\s|$)/);
  if (slashMatch) {
    slashCommand = slashMatch[1];
  } else {
    const metaSlash = content.match(/(\/[a-zA-Z][a-zA-Z0-9_-]*)\s+is a \[Slash Command\]/);
    if (metaSlash) {
      slashCommand = metaSlash[1];
    }
  }

  return { promptText: text, slashCommand };
}

function makePreview(text: string, maxLen: number): string {
  return sanitizePreviewText(text, maxLen);
}

function extractGenericHeaders(content: string): {
  createdAtMs: number | null;
  completedAtMs: number | null;
  body: string;
} {
  const lines = content.split(/\r?\n/);
  let createdAtMs: number | null = null;
  let completedAtMs: number | null = null;
  let bodyStartLine = 0;

  const limit = Math.min(lines.length, 8);
  for (let i = 0; i < limit; i++) {
    const line = lines[i].trim();
    if (line.startsWith("Created At:")) {
      const parsed = parseTimestampMs(line.slice("Created At:".length));
      if (parsed !== null && createdAtMs === null) {
        createdAtMs = parsed;
      }
      bodyStartLine = i + 1;
      continue;
    }
    if (line.startsWith("Completed At:")) {
      const parsed = parseTimestampMs(line.slice("Completed At:".length));
      if (parsed !== null && completedAtMs === null) {
        completedAtMs = parsed;
      }
      bodyStartLine = i + 1;
      continue;
    }
    if (line === "") {
      if (bodyStartLine === i) bodyStartLine = i + 1;
      continue;
    }
    break;
  }

  const body = lines.slice(bodyStartLine).join("\n");
  return { createdAtMs, completedAtMs, body };
}

function detectToolError(status: string | undefined, body: string): {
  isError: boolean;
  errorPreview: string | null;
} {
  if (status === "ERROR") {
    return {
      isError: true,
      errorPreview: makePreview(body || "Step status ERROR", 180)
    };
  }
  const exitCodeMatch = body.match(/Command exited with code ([1-9]\d*)/);
  if (exitCodeMatch) {
    return {
      isError: true,
      errorPreview: makePreview(body, 180)
    };
  }
  if (
    body.startsWith("Encountered error in tool execution") ||
    /"isError"\s*:\s*true/.test(body) ||
    /isError:\s*true/.test(body)
  ) {
    return {
      isError: true,
      errorPreview: makePreview(body, 180)
    };
  }
  return { isError: false, errorPreview: null };
}

const skillFrontmatterCache = new Map<string, string | null>();

function extractYamlName(text: string): string | null {
  const fmMatch = text.match(/^(?:\d+:\s*)?---\s*\r?\n([\s\S]*?)\r?\n(?:\d+:\s*)?---/);
  const block = fmMatch ? fmMatch[1] : text.slice(0, 600);
  const nameMatch = block.match(/(?:^|\n)\s*(?:\d+:\s*)?name:\s*["']?([a-zA-Z0-9_.-]+)["']?/);
  return nameMatch ? nameMatch[1].trim() : null;
}

function lookupCanonicalSkillName(skillRootDir: string): string | null {
  if (skillFrontmatterCache.has(skillRootDir)) {
    return skillFrontmatterCache.get(skillRootDir) ?? null;
  }
  const skillMdPath = `${skillRootDir}/SKILL.md`;
  let resolved: string | null = null;
  try {
    if (fs.existsSync(skillMdPath) && fs.statSync(skillMdPath).isFile()) {
      const content = fs.readFileSync(skillMdPath, "utf8");
      resolved = extractYamlName(content);
    }
  } catch {
    resolved = null;
  }
  skillFrontmatterCache.set(skillRootDir, resolved);
  return resolved;
}

function extractSkillMetadata(
  targetPath: string,
  body: string
): { skillName: string | null; skillPlugin: string | null } {
  const norm = targetPath.replace(/\\/g, "/");
  let skillPlugin: string | null = null;
  const pluginMatch = norm.match(/\/(?:builtin\/)?plugins\/([^/]+)\//);
  if (pluginMatch) {
    skillPlugin = pluginMatch[1];
  } else if (norm.includes("/builtin/skills/")) {
    skillPlugin = "builtin";
  }

  const skillDirMatch = norm.match(/^(.*\/skills\/([^/]+))\//);
  let skillName: string | null = skillDirMatch ? skillDirMatch[2] : null;

  if (norm.endsWith("/SKILL.md")) {
    const parsedName = extractYamlName(body);
    if (parsedName) {
      skillName = parsedName;
      if (skillDirMatch) {
        skillFrontmatterCache.set(skillDirMatch[1], parsedName);
      }
    }
  } else if (skillDirMatch) {
    const canonical = lookupCanonicalSkillName(skillDirMatch[1]);
    if (canonical) {
      skillName = canonical;
    }
  }

  return { skillName, skillPlugin };
}

function extractPathFromArgs(args: Record<string, unknown>): string | null {
  const candidates = [
    args.Path,
    args.TargetFile,
    args.AbsolutePath,
    args.ScriptPath,
    args.path,
    args.file_path,
    args.uri,
    args.Cwd
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      const unwrapped = unwrapFileUri(c.trim());
      if (isAbsoluteLocalPath(unwrapped)) {
        return unwrapped;
      }
    }
  }
  return null;
}

function extractCommandPathHints(cmd: string): string[] {
  const posixMatches = cmd.match(/\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)+/g) ?? [];
  const winMatches = cmd.match(/[a-zA-Z]:[\\/][a-zA-Z0-9_.\-\\/]+/g) ?? [];
  const combined = [...posixMatches, ...winMatches];
  return combined.length > 0 ? Array.from(new Set(combined)) : [];
}

function extractChildConversationId(body: string): string | null {
  const explicitMatch = body.match(
    /(?:conversationId|conversation_id|conversation:\/\/)["'\s:=]+([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  if (explicitMatch) {
    return explicitMatch[1];
  }
  const anyUuid = body.match(
    /\b([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b/i
  );
  return anyUuid ? anyUuid[1] : null;
}

function classifyTool(
  toolName: string,
  args: Record<string, unknown>,
  body: string
): {
  category: ToolCategory;
  mcpServer: string | null;
  skillName: string | null;
  skillPlugin: string | null;
  targetPath: string | null;
  childConversationId: string | null;
  argsPreview: string;
  commandPathHints: string[];
} {
  const targetPath = extractPathFromArgs(args);
  let category: ToolCategory = "other";
  let mcpServer: string | null = null;
  let skillName: string | null = null;
  let skillPlugin: string | null = null;
  let childConversationId: string | null = null;
  let commandPathHints: string[] = [];

  if (
    targetPath &&
    (toolName === "read_file" || toolName === "view_file") &&
    (targetPath.endsWith("/SKILL.md") || /\/skills\/[^/]+\//.test(targetPath))
  ) {
    const skillMeta = extractSkillMetadata(targetPath, body);
    if (skillMeta.skillName) {
      category = "skill";
      skillName = skillMeta.skillName;
      skillPlugin = skillMeta.skillPlugin;
    }
  }

  if (category !== "skill") {
    if (toolName === "call_mcp_tool") {
      category = "mcp";
      mcpServer = typeof args.ServerName === "string" ? args.ServerName : "mcp";
    } else if (toolName.startsWith("mcp_")) {
      category = "mcp";
      const rest = toolName.slice(4);
      const firstSeg = rest.split("_")[0];
      mcpServer = firstSeg || "mcp";
    } else if (
      toolName === "invoke_subagent" ||
      toolName === "swarm" ||
      toolName === "run_workflow"
    ) {
      category = "subagent";
      if (toolName === "invoke_subagent") {
        childConversationId = extractChildConversationId(body);
      }
    } else if (toolName === "run_command") {
      category = "command";
      const cmd = typeof args.CommandLine === "string" ? args.CommandLine : "";
      commandPathHints = extractCommandPathHints(cmd);
    } else if (
      toolName === "read_file" ||
      toolName === "view_file" ||
      toolName === "list_dir" ||
      toolName === "read_resource"
    ) {
      category = "file_read";
    } else if (
      toolName === "edit_file" ||
      toolName === "write_file" ||
      toolName === "replace_file_content" ||
      toolName === "multi_replace_file_content"
    ) {
      category = "file_write";
    } else if (
      toolName === "search_web" ||
      toolName === "grep_search" ||
      toolName === "find_by_name"
    ) {
      category = "search";
    } else if (toolName.startsWith("browser_")) {
      category = "browser";
    }
  }

  let argsPreview = "";
  if (toolName === "run_command" && typeof args.CommandLine === "string") {
    argsPreview = makePreview(args.CommandLine, 160);
  } else if (toolName === "invoke_subagent") {
    const typeName = typeof args.TypeName === "string" ? args.TypeName : "subagent";
    const role = typeof args.Role === "string" ? args.Role : "";
    argsPreview = `Type: ${typeName}${role ? ` | Role: ${role}` : ""}`;
  } else if (toolName === "call_mcp_tool") {
    argsPreview = `${String(args.ServerName ?? "")}/${String(args.ToolName ?? "")}`;
  } else if (targetPath) {
    argsPreview = targetPath;
  } else if (typeof args.query === "string") {
    argsPreview = makePreview(args.query, 140);
  } else {
    argsPreview = makePreview(JSON.stringify(args), 140);
  }

  return {
    category,
    mcpServer,
    skillName,
    skillPlugin,
    targetPath,
    childConversationId,
    argsPreview,
    commandPathHints
  };
}

export async function parseTranscriptFile(
  transcriptPath: string,
  conversationId: string
): Promise<ParsedTranscript> {
  const turns: ParsedTurnRaw[] = [];
  const plannerSteps: ParsedPlannerStepRaw[] = [];
  const toolCalls: ParsedToolCallRaw[] = [];
  const candidatePaths: string[] = [];
  const modelsSet = new Set<string>();
  const slashSet = new Set<string>();

  interface PendingTool {
    plannerStepIndex: number;
    turnIndex: number;
    plannerCreatedAtMs: number;
    toolCallId: string | null;
    toolName: string;
    args: Record<string, unknown>;
  }
  const pendingQueue: PendingTool[] = [];

  let currentTurnIndex = -1;
  let minTs = Number.POSITIVE_INFINITY;
  let maxTs = 0;
  let hasTokenTelemetry = false;
  let firstSystemMessage: string | null = null;

  const flushPendingTools = () => {
    while (pendingQueue.length > 0) {
      const pending = pendingQueue.shift()!;
      const classified = classifyTool(pending.toolName, pending.args, "");
      if (classified.targetPath) candidatePaths.push(classified.targetPath);
      for (const hint of classified.commandPathHints) candidatePaths.push(hint);

      toolCalls.push({
        stepIndex: pending.plannerStepIndex,
        plannerStepIndex: pending.plannerStepIndex,
        turnIndex: pending.turnIndex,
        toolCallId: pending.toolCallId,
        toolName: pending.toolName,
        category: classified.category,
        mcpServer: classified.mcpServer,
        skillName: classified.skillName,
        skillPlugin: classified.skillPlugin,
        targetPath: classified.targetPath,
        childConversationId: classified.childConversationId,
        startedAtMs: pending.plannerCreatedAtMs,
        completedAtMs: null,
        durationMs: 0,
        argsPreview: classified.argsPreview,
        commandPathHints: classified.commandPathHints,
        resultBytes: 0,
        estResultTokens: 0,
        isError: false,
        errorPreview: null
      });
    }
  };

  const stream = fs.createReadStream(transcriptPath, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let raw: RawLine;
    try {
      raw = JSON.parse(trimmed) as RawLine;
    } catch {
      continue;
    }

    const stepIndex = typeof raw.step_index === "number" ? raw.step_index : 0;
    const stepCreatedAtMs = parseTimestampMs(raw.created_at) ?? 0;
    if (stepCreatedAtMs > 0) {
      if (stepCreatedAtMs < minTs) minTs = stepCreatedAtMs;
      if (stepCreatedAtMs > maxTs) maxTs = stepCreatedAtMs;
    }

    if (raw.type === "SYSTEM_MESSAGE") {
      if (firstSystemMessage === null && typeof raw.content === "string" && raw.content.trim()) {
        firstSystemMessage = raw.content;
      }
      continue;
    }

    if (raw.type === "USER_INPUT") {
      flushPendingTools();
      currentTurnIndex += 1;
      const content = typeof raw.content === "string" ? raw.content : "";
      const { promptText, slashCommand } = extractUserRequest(content);
      if (slashCommand) slashSet.add(slashCommand);

      turns.push({
        turnIndex: currentTurnIndex,
        stepIndex,
        createdAtMs: stepCreatedAtMs,
        promptText,
        promptPreview: makePreview(promptText || "(empty prompt)", 140),
        promptBytes: Buffer.byteLength(promptText, "utf8"),
        slashCommand
      });
      continue;
    }

    if (raw.type === "PLANNER_RESPONSE") {
      flushPendingTools();
      if (currentTurnIndex < 0) {
        currentTurnIndex = 0;
        turns.push({
          turnIndex: 0,
          stepIndex: 0,
          createdAtMs: stepCreatedAtMs,
          promptText: "(implicit start)",
          promptPreview: "(implicit start)",
          promptBytes: 0,
          slashCommand: null
        });
      }

      const model =
        typeof raw.model === "string" && raw.model.trim() ? raw.model.trim() : "unknown";
      if (model !== "unknown") modelsSet.add(model);

      if (
        Object.prototype.hasOwnProperty.call(raw, "input_tokens") ||
        Object.prototype.hasOwnProperty.call(raw, "cache_read_tokens") ||
        Object.prototype.hasOwnProperty.call(raw, "output_tokens")
      ) {
        hasTokenTelemetry = true;
      }

      const inputTokens = Number(raw.input_tokens ?? 0);
      const cacheReadTokens = Number(raw.cache_read_tokens ?? 0);
      const outputTokens = Number(raw.output_tokens ?? 0);
      const totalContextTokens = inputTokens + cacheReadTokens;
      const calls = Array.isArray(raw.tool_calls) ? raw.tool_calls : [];

      plannerSteps.push({
        stepIndex,
        turnIndex: currentTurnIndex,
        model,
        createdAtMs: stepCreatedAtMs,
        thinkingChars: typeof raw.thinking === "string" ? raw.thinking.length : 0,
        contentChars: typeof raw.content === "string" ? raw.content.length : 0,
        inputTokens,
        cacheReadTokens,
        outputTokens,
        totalContextTokens,
        toolCallCount: calls.length,
        status: typeof raw.status === "string" ? raw.status : "DONE"
      });

      for (const tc of calls) {
        const toolName =
          typeof tc?.name === "string" && tc.name.trim() ? tc.name.trim() : "unknown_tool";
        pendingQueue.push({
          plannerStepIndex: stepIndex,
          turnIndex: currentTurnIndex,
          plannerCreatedAtMs: stepCreatedAtMs,
          toolCallId: typeof tc?.id === "string" ? tc.id : null,
          toolName,
          args: normalizeArgs(tc?.args)
        });
      }
      continue;
    }

    if (raw.type === "GENERIC" && raw.source === "MODEL" && pendingQueue.length > 0) {
      const pending = pendingQueue.shift()!;
      const content = typeof raw.content === "string" ? raw.content : "";
      const { createdAtMs, completedAtMs, body } = extractGenericHeaders(content);
      const startedAtMs = createdAtMs ?? (stepCreatedAtMs || pending.plannerCreatedAtMs);
      const endMs = completedAtMs ?? startedAtMs;
      const durationMs =
        completedAtMs !== null && startedAtMs !== null
          ? Math.max(0, completedAtMs - startedAtMs)
          : 0;

      if (endMs > maxTs) maxTs = endMs;
      if (startedAtMs > 0 && startedAtMs < minTs) minTs = startedAtMs;

      const resultBytes = Buffer.byteLength(body, "utf8");
      const estResultTokens = Math.ceil(resultBytes / 4);
      const { isError, errorPreview } = detectToolError(raw.status, body);
      const classified = classifyTool(pending.toolName, pending.args, body);

      if (classified.targetPath) candidatePaths.push(classified.targetPath);
      for (const hint of classified.commandPathHints) candidatePaths.push(hint);

      toolCalls.push({
        stepIndex,
        plannerStepIndex: pending.plannerStepIndex,
        turnIndex: pending.turnIndex,
        toolCallId: pending.toolCallId,
        toolName: pending.toolName,
        category: classified.category,
        mcpServer: classified.mcpServer,
        skillName: classified.skillName,
        skillPlugin: classified.skillPlugin,
        targetPath: classified.targetPath,
        childConversationId: classified.childConversationId,
        startedAtMs,
        completedAtMs: endMs,
        durationMs,
        argsPreview: classified.argsPreview,
        commandPathHints: classified.commandPathHints,
        resultBytes,
        estResultTokens,
        isError,
        errorPreview
      });
    }
  }

  // Handle any tool calls whose GENERIC result wasn't flushed yet (active/in-flight chat).
  flushPendingTools();

  const firstPrompt = turns.find((t) => t.promptText && t.promptText !== "(implicit start)");
  const hasExplicitUserPrompt = Boolean(firstPrompt);
  let title = conversationId.slice(0, 8);
  if (firstPrompt) {
    const cleaned = firstPrompt.promptText.replace(/^\/[a-zA-Z0-9_-]+\s*/, "").trim();
    title = makePreview(cleaned || firstPrompt.promptText, 76);
  }

  let systemTaskPreview: string | null = null;
  if (!hasExplicitUserPrompt && firstSystemMessage) {
    const cleanedSys = firstSystemMessage
      .replace(/The following is a <SYSTEM_MESSAGE>[\s\S]*?pay attention to\./gi, " ")
      .replace(/<\/?[A-Z_]+>/g, " ")
      .replace(/\[Notice\][\s\S]*$/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleanedSys.length >= 4) {
      systemTaskPreview = makePreview(cleanedSys, 60);
    }
  }

  const startedAtMs = Number.isFinite(minTs) ? minTs : 0;
  const endedAtMs = maxTs >= startedAtMs ? maxTs : startedAtMs;

  return {
    conversationId,
    transcriptPath,
    title,
    hasExplicitUserPrompt,
    systemTaskPreview,
    hasTokenTelemetry,
    startedAtMs,
    endedAtMs,
    models: Array.from(modelsSet),
    slashCommands: Array.from(slashSet),
    turns,
    plannerSteps,
    toolCalls,
    candidatePaths
  };
}
