import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type {
  PluginSkillChildKind,
  ToolCallRecord
} from "../shared/types.js";

export interface InstalledSkillMeta {
  name: string;
  dirName: string;
  mentionsMcpOrCli: boolean;
}

export interface InstalledPluginInfo {
  id: string;
  dirName: string;
  displayName: string;
  cliNames: string[];
  mcpServerNames: string[];
  skills: Map<string, InstalledSkillMeta>;
  hasExecutableSurface: boolean;
}

export interface InstalledPluginRegistry {
  byId: Map<string, InstalledPluginInfo>;
  cliToPlugin: Map<string, string>;
  mcpToPlugin: Map<string, string>;
}

export interface ResolvedPluginSkillHit {
  parentId: string;
  parentName: string;
  parentKind: "Plugin" | "Skill";
  childKey: string;
  childName: string;
  childKind: PluginSkillChildKind;
  footprint: "instruction" | "execution";
  requiresExecution: boolean;
  targetPath: string | null;
}

const PLUGIN_REGISTRY_TTL_MS = 30_000;
const pluginRegistryCache = new Map<
  string,
  { registry: InstalledPluginRegistry; expiresAt: number }
>();

export function clearInstalledPluginsCache(): void {
  pluginRegistryCache.clear();
}

const GENERIC_CLI_NAMES = new Set([
  "run",
  "test",
  "build",
  "start",
  "stop",
  "status",
  "check",
  "install",
  "bash",
  "sh",
  "zsh",
  "node",
  "python",
  "python3",
  "git",
  "ls",
  "cat",
  "env",
  "echo",
  "sed",
  "awk",
  "grep"
]);

function readTextSafe(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    if (!fs.statSync(filePath).isFile()) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function extractYamlSkillName(text: string): string | null {
  const fmMatch = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return null;
  const nameMatch = fmMatch[1].match(/(?:^|\n)\s*name:\s*["']?([a-zA-Z0-9_.-]+)["']?/);
  return nameMatch ? nameMatch[1].trim() : null;
}

function collectPluginCliBinaries(
  dirPath: string,
  idLower: string,
  entryLower: string,
  out: Set<string>
): void {
  try {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isFile() && !ent.isSymbolicLink()) continue;
      const base = ent.name;
      if (base.includes(".")) continue;
      const lower = base.toLowerCase();
      if (GENERIC_CLI_NAMES.has(lower)) continue;
      if (
        lower === idLower ||
        lower === entryLower ||
        lower.startsWith(`${idLower}-`) ||
        lower.startsWith(`${entryLower}-`)
      ) {
        out.add(lower);
      }
    }
  } catch {
    // Ignore inaccessible directories
  }
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textMentionsAnyToken(body: string, tokens: string[]): boolean {
  if (!body || tokens.length === 0) return false;
  const cleanBody = body.replace(/https?:\/\/[^\s)>\]"']+/gi, " ");
  for (const tok of tokens) {
    if (!tok) continue;
    const pattern = tok.endsWith("_")
      ? `(?:^|[^a-zA-Z0-9_-])${escapeRegex(tok)}[a-zA-Z0-9_-]+`
      : `(?:^|[^a-zA-Z0-9_-])${escapeRegex(tok)}(?:$|[^a-zA-Z0-9_-])`;
    const re = new RegExp(pattern, "i");
    if (re.test(cleanBody)) return true;
  }
  return false;
}

export function discoverInstalledPlugins(
  pluginsDir = path.join(os.homedir(), ".gemini", "config", "plugins")
): InstalledPluginRegistry {
  const now = Date.now();
  const cached = pluginRegistryCache.get(pluginsDir);
  if (cached && cached.expiresAt > now) {
    return cached.registry;
  }

  const byId = new Map<string, InstalledPluginInfo>();
  const cliToPlugin = new Map<string, string>();
  const mcpToPlugin = new Map<string, string>();

  try {
    if (fs.existsSync(pluginsDir)) {
      const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
        const pluginPath = path.join(pluginsDir, entry.name);
        let stat: fs.Stats | null = null;
        try {
          stat = fs.statSync(pluginPath);
        } catch {
          stat = null;
        }
        if (!stat || !stat.isDirectory()) continue;

        let id = entry.name;
        let displayName = entry.name;
        const manifestText = readTextSafe(path.join(pluginPath, "plugin.json"));
        if (manifestText) {
          try {
            const parsed = JSON.parse(manifestText) as Record<string, unknown>;
            if (typeof parsed.name === "string" && parsed.name.trim()) {
              id = parsed.name.trim();
            }
            if (typeof parsed.displayName === "string" && parsed.displayName.trim()) {
              displayName = parsed.displayName.trim();
            } else {
              displayName = id;
            }
          } catch {
            // Keep directory basename fallback
          }
        }

        const mcpSet = new Set<string>();
        const mcpText = readTextSafe(path.join(pluginPath, "mcp_config.json"));
        if (mcpText) {
          try {
            const parsedMcp = JSON.parse(mcpText) as { mcpServers?: Record<string, unknown> };
            if (parsedMcp?.mcpServers && typeof parsedMcp.mcpServers === "object") {
              for (const serverKey of Object.keys(parsedMcp.mcpServers)) {
                const clean = serverKey.trim();
                if (clean) mcpSet.add(clean);
              }
            }
          } catch {
            // Ignore invalid mcp_config.json
          }
        }

        const cliSet = new Set<string>();
        const idLower = id.toLowerCase();
        const entryLower = entry.name.toLowerCase();
        collectPluginCliBinaries(path.join(pluginPath, "bin"), idLower, entryLower, cliSet);

        const skillsDir = path.join(pluginPath, "skills");
        const rawSkills: Array<{ dirName: string; name: string; body: string }> = [];
        try {
          if (fs.existsSync(skillsDir)) {
            for (const skillEnt of fs.readdirSync(skillsDir, { withFileTypes: true })) {
              if (!skillEnt.isDirectory() && !skillEnt.isSymbolicLink()) continue;
              const skillFolder = path.join(skillsDir, skillEnt.name);
              collectPluginCliBinaries(
                path.join(skillFolder, "scripts"),
                idLower,
                entryLower,
                cliSet
              );
              const skillMd = readTextSafe(path.join(skillFolder, "SKILL.md")) ?? "";
              const yamlName = skillMd ? extractYamlSkillName(skillMd) : null;
              rawSkills.push({
                dirName: skillEnt.name,
                name: yamlName || skillEnt.name,
                body: skillMd
              });
            }
          }
        } catch {
          // Ignore inaccessible skills directory
        }

        const cliNames = Array.from(cliSet).sort();
        const mcpServerNames = Array.from(mcpSet).sort();
        const mentionTokens: string[] = [
          ...cliNames,
          ...mcpServerNames.map((s) => `${id}_${s}`),
          ...mcpServerNames.map((s) => `${entry.name}_${s}`),
          ...(mcpServerNames.length > 0
            ? [
                `mcp_${id}_`,
                `mcp_${entry.name}_`,
                ...mcpServerNames.map((s) => `mcp_${s}_`),
                "call_mcp_tool"
              ]
            : [])
        ];

        const skills = new Map<string, InstalledSkillMeta>();
        for (const sk of rawSkills) {
          const mentions = textMentionsAnyToken(sk.body, mentionTokens);
          const meta: InstalledSkillMeta = {
            name: sk.name,
            dirName: sk.dirName,
            mentionsMcpOrCli: mentions
          };
          skills.set(sk.name, meta);
          skills.set(sk.dirName, meta);
        }

        const info: InstalledPluginInfo = {
          id,
          dirName: entry.name,
          displayName,
          cliNames,
          mcpServerNames,
          skills,
          hasExecutableSurface: cliNames.length > 0 || mcpServerNames.length > 0
        };
        byId.set(entry.name, info);
        byId.set(id, info);
        for (const cli of cliNames) {
          cliToPlugin.set(cli, id);
        }
        for (const srv of mcpServerNames) {
          mcpToPlugin.set(srv, id);
          mcpToPlugin.set(`${id}_${srv}`, id);
          mcpToPlugin.set(`${entry.name}_${srv}`, id);
        }
      }
    }
  } catch {
    // Return partial/empty registry if pluginsDir cannot be scanned
  }

  const registry: InstalledPluginRegistry = { byId, cliToPlugin, mcpToPlugin };
  pluginRegistryCache.set(pluginsDir, {
    registry,
    expiresAt: now + PLUGIN_REGISTRY_TTL_MS
  });
  return registry;
}

function isSkillRequiresExecution(
  plugin: InstalledPluginInfo | undefined,
  skillName: string | null
): boolean {
  if (!plugin || !plugin.hasExecutableSurface) return false;
  const distinctSkillNames = new Set<string>();
  for (const meta of plugin.skills.values()) {
    distinctSkillNames.add(meta.name);
  }
  const singleSkill = distinctSkillNames.size <= 1;
  const skillMeta = skillName ? plugin.skills.get(skillName) : undefined;
  const mentions = Boolean(skillMeta?.mentionsMcpOrCli);

  if (plugin.cliNames.length > 0 && (singleSkill || mentions)) return true;
  if (plugin.mcpServerNames.length > 0 && (singleSkill || mentions)) return true;
  return false;
}

export function resolveToolPluginAndChild(
  tc: Pick<
    ToolCallRecord,
    | "category"
    | "toolName"
    | "mcpServer"
    | "skillName"
    | "skillPlugin"
    | "targetPath"
    | "argsPreview"
  >,
  registry: InstalledPluginRegistry
): ResolvedPluginSkillHit | null {
  const makePluginHit = (
    rawPluginId: string,
    childKind: PluginSkillChildKind,
    childName: string,
    footprint: "instruction" | "execution",
    skillNameForExecCheck: string | null
  ): ResolvedPluginSkillHit => {
    const info = registry.byId.get(rawPluginId);
    const resolvedId = info?.id ?? rawPluginId;
    return {
      parentId: `plugin:${resolvedId}`,
      parentName: info?.displayName ?? rawPluginId,
      parentKind: "Plugin",
      childKey: `${childKind}:${childName}`,
      childName,
      childKind,
      footprint,
      requiresExecution:
        footprint === "instruction"
          ? isSkillRequiresExecution(info, skillNameForExecCheck)
          : false,
      targetPath: tc.targetPath
    };
  };

  if (tc.category === "skill") {
    if (tc.skillPlugin && tc.skillPlugin !== "builtin") {
      const childLabel =
        tc.skillName ||
        (tc.targetPath ? path.basename(path.dirname(tc.targetPath)) : "skill");
      return makePluginHit(
        tc.skillPlugin,
        "SubSkill",
        childLabel,
        "instruction",
        tc.skillName
      );
    }
    if (tc.skillName) {
      if (registry.byId.has(tc.skillName)) {
        return makePluginHit(
          tc.skillName,
          "SubSkill",
          tc.skillName,
          "instruction",
          tc.skillName
        );
      }
      const refName = tc.targetPath ? path.basename(tc.targetPath) : "SKILL.md";
      return {
        parentId: `skill:${tc.skillName}`,
        parentName: tc.skillName,
        parentKind: "Skill",
        childKey: `Reference:${refName}`,
        childName: refName,
        childKind: "Reference",
        footprint: "instruction",
        requiresExecution: false,
        targetPath: tc.targetPath
      };
    }
    return null;
  }

  if (tc.category === "mcp") {
    const rawServer = (tc.mcpServer || "").trim();
    if (!rawServer) return null;
    let childLabel = tc.toolName;
    if (tc.toolName === "call_mcp_tool" && tc.argsPreview.includes("/")) {
      const slashIdx = tc.argsPreview.indexOf("/");
      const extracted = tc.argsPreview.slice(slashIdx + 1).trim();
      if (extracted) childLabel = extracted;
    } else if (tc.toolName.startsWith(`mcp_${rawServer}_`)) {
      childLabel = tc.toolName.slice(`mcp_${rawServer}_`.length) || tc.toolName;
    } else {
      childLabel = tc.toolName.replace(/^mcp_[^_]+_/, "");
    }

    const mappedPlugin = registry.mcpToPlugin.get(rawServer);
    if (mappedPlugin) {
      return makePluginHit(mappedPlugin, "MCP", childLabel, "execution", null);
    }
    if (registry.byId.has(rawServer)) {
      return makePluginHit(rawServer, "MCP", childLabel, "execution", null);
    }
    let longestMatch = "";
    for (const knownId of registry.byId.keys()) {
      if (
        rawServer.startsWith(`${knownId}_`) &&
        knownId.length > longestMatch.length
      ) {
        longestMatch = knownId;
      }
    }
    if (longestMatch) {
      return makePluginHit(longestMatch, "MCP", childLabel, "execution", null);
    }
    return {
      parentId: `plugin:${rawServer}`,
      parentName: rawServer,
      parentKind: "Plugin",
      childKey: `MCP:${childLabel}`,
      childName: childLabel,
      childKind: "MCP",
      footprint: "execution",
      requiresExecution: false,
      targetPath: tc.targetPath
    };
  }

  if (tc.category === "command") {
    const cmd = tc.argsPreview || "";
    const segments = cmd.split(/&&|\|\||;|\r?\n/);
    for (const rawSeg of segments) {
      let seg = rawSeg.trim();
      if (!seg) continue;

      while (/^[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S+)\s+/.test(seg)) {
        seg = seg
          .replace(/^[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|\S+)\s+/, "")
          .trim();
      }
      if (!seg) continue;

      const scriptMatch = seg.match(
        /^(?:(?:bash|sh|zsh|python3?|node)\s+)?["']?([^\s"']*\.gemini\/config\/plugins\/([^/\s"']+)\/(?:skills|scripts|bin)\/([^\s"']+))/
      );
      if (scriptMatch && scriptMatch[2]) {
        const scriptBase = path.basename(scriptMatch[3] || scriptMatch[2]);
        return makePluginHit(scriptMatch[2], "CLI", scriptBase, "execution", null);
      }

      const firstTokMatch = seg.match(/^(?:"([^"]+)"|'([^']+)'|(\S+))/);
      if (firstTokMatch) {
        const rawTok = firstTokMatch[1] ?? firstTokMatch[2] ?? firstTokMatch[3] ?? "";
        const baseTok = path.basename(rawTok).toLowerCase();
        const pluginId = registry.cliToPlugin.get(baseTok);
        if (pluginId) {
          return makePluginHit(pluginId, "CLI", baseTok, "execution", null);
        }
      }
    }
    return null;
  }

  return null;
}

export function resolveToolPluginOrSkill(
  tc: Pick<
    ToolCallRecord,
    | "category"
    | "toolName"
    | "mcpServer"
    | "skillName"
    | "skillPlugin"
    | "targetPath"
    | "argsPreview"
  >,
  registry: InstalledPluginRegistry
): { id: string; name: string; kind: "Plugin" | "Skill" } | null {
  const hit = resolveToolPluginAndChild(tc, registry);
  if (!hit) return null;
  return {
    id: hit.parentId,
    name: hit.parentName,
    kind: hit.parentKind
  };
}

import { estimateStepCost } from "../shared/pricing.js";
import type {
  DiagnosticFinding,
  FileTouchRecord,
  ModelPricingRule,
  PlannerStepRecord,
  PluginSkillChildMetric,
  PluginSkillMetric
} from "../shared/types.js";

export interface ConversationEfficiencyInput {
  conversationId: string;
  parentConversationId: string | null;
  activeMs: number;
  hasTokenTelemetry: boolean;
  plannerSteps: Array<Omit<PlannerStepRecord, "estimatedCostUsd">>;
  toolCalls: ToolCallRecord[];
  filesTouched: FileTouchRecord[];
}

export interface ScopeEfficiencyResult {
  pluginSkillMetrics: PluginSkillMetric[];
  diagnosticsByConv: Map<string, DiagnosticFinding[]>;
  topPluginsByConv: Map<string, string[]>;
  scopeActiveMs: number;
  scopeCostUsd: number | null;
  scopeContextTokens: number;
}

interface TimeInterval {
  start: number;
  end: number;
}

function mergeIntervalsMs(intervals: TimeInterval[]): number {
  if (intervals.length === 0) return 0;
  const sorted = intervals
    .filter((iv) => iv.end >= iv.start && iv.start > 0)
    .sort((a, b) => a.start - b.start);
  if (sorted.length === 0) return 0;

  let total = 0;
  let curStart = sorted[0].start;
  let curEnd = sorted[0].end;

  for (let i = 1; i < sorted.length; i++) {
    const iv = sorted[i];
    if (iv.start <= curEnd) {
      if (iv.end > curEnd) curEnd = iv.end;
    } else {
      total += curEnd - curStart;
      curStart = iv.start;
      curEnd = iv.end;
    }
  }
  total += curEnd - curStart;
  return total;
}

function fmtShortTok(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(Math.round(n));
}

function fmtShortDur(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(totalSec / 60);
  const remSec = totalSec % 60;
  if (min < 60) return `${min}m ${remSec}s`;
  const hr = Math.floor(min / 60);
  const remMin = min % 60;
  return `${hr}h ${remMin}m`;
}

function sortConversationsParentsFirst(
  conversations: ConversationEfficiencyInput[]
): ConversationEfficiencyInput[] {
  const byId = new Map<string, ConversationEfficiencyInput>();
  for (const c of conversations) {
    byId.set(c.conversationId, c);
  }

  const depthCache = new Map<string, number>();
  const computeDepth = (id: string, visited: Set<string>): number => {
    if (depthCache.has(id)) return depthCache.get(id)!;
    if (visited.has(id) || visited.size >= 16) return 0;
    const conv = byId.get(id);
    if (!conv || !conv.parentConversationId || !byId.has(conv.parentConversationId)) {
      depthCache.set(id, 0);
      return 0;
    }
    visited.add(id);
    const d = 1 + computeDepth(conv.parentConversationId, visited);
    depthCache.set(id, d);
    return d;
  };

  return [...conversations].sort((a, b) => {
    const da = computeDepth(a.conversationId, new Set());
    const db = computeDepth(b.conversationId, new Set());
    return da - db;
  });
}

function collectDescendantIds(
  rootId: string,
  childrenMap: Map<string, string[]>
): Set<string> {
  const out = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length > 0 && out.size < 256) {
    const cur = queue.shift()!;
    for (const childId of childrenMap.get(cur) ?? []) {
      if (!out.has(childId)) {
        out.add(childId);
        queue.push(childId);
      }
    }
  }
  return out;
}

interface ChildAccumulator {
  key: string;
  name: string;
  kind: PluginSkillChildMetric["kind"];
  calls: number;
  errors: number;
  intervals: TimeInterval[];
  unplacedDrivenMs: number;
  drivenCostKnown: boolean;
  drivenCostAcc: number;
  instructionTokens: number;
  executionTokens: number;
  duplicateReads: number;
  isUnusedLoad: boolean;
  targetPaths: Set<string>;
}

interface ParentAccumulator {
  id: string;
  name: string;
  kind: "Plugin" | "Skill";
  calls: number;
  errors: number;
  toolIntervals: TimeInterval[];
  unplacedToolMs: number;
  drivenIntervals: TimeInterval[];
  unplacedDrivenMs: number;
  drivenCostKnown: boolean;
  drivenCostAcc: number;
  contextCostKnown: boolean;
  contextCostAcc: number;
  instructionTokens: number;
  executionTokens: number;
  directTokens: number;
  compoundedCacheTokens: number;
  warnings: Set<string>;
  targetPaths: Set<string>;
  children: Map<string, ChildAccumulator>;
  chatIds: Set<string>;
}

function buildPrescription(
  name: string,
  kind: "Plugin" | "Skill",
  instructionTokens: number,
  totalTokens: number,
  unusedChildren: string[],
  dupChildren: Array<{ name: string; dup: number }>
): string | null {
  const parts: string[] = [];
  if (unusedChildren.length > 0) {
    parts.push(
      `Loaded ${unusedChildren.join(", ")} without invoking its CLI/MCP tools—tighten the skill description trigger so it only loads when needed.`
    );
  }
  if (dupChildren.length > 0) {
    const dupDesc = dupChildren.map((d) => `${d.name} (+${d.dup}× extra)`).join(", ");
    parts.push(`Avoid re-reading SKILL.md within the same chat: ${dupDesc}.`);
  }
  const instrShare = totalTokens > 0 ? instructionTokens / totalTokens : 0;
  if (instructionTokens >= 25_000 && instrShare >= 0.75) {
    parts.push(
      `${Math.round(instrShare * 100)}% (+${fmtShortTok(instructionTokens)} tok) of ${name}'s context footprint is instruction markdown carried across steps—move reference tables and examples out of SKILL.md into on-demand references/ files.`
    );
  }
  return parts.length > 0 ? parts.join(" ") : null;
}

export function comparePluginSkillMetricsByImpact(
  a: PluginSkillMetric,
  b: PluginSkillMetric
): number {
  const aCost = a.drivenCostUsd ?? -1;
  const bCost = b.drivenCostUsd ?? -1;
  if (aCost !== bCost && (aCost >= 0 || bCost >= 0)) {
    return bCost - aCost;
  }
  return (
    b.drivenActiveMs - a.drivenActiveMs ||
    b.totalTokens - a.totalTokens ||
    b.calls - a.calls ||
    a.name.localeCompare(b.name)
  );
}

export function computeScopeSkillEfficiency(
  conversations: ConversationEfficiencyInput[],
  pricingRules: ModelPricingRule[],
  options: {
    scopeActiveMsOverride?: number;
    registry?: InstalledPluginRegistry;
    fallbackChatCount?: number;
  } = {}
): ScopeEfficiencyResult {
  const registry = options.registry ?? discoverInstalledPlugins();
  const fallbackChatCount = options.fallbackChatCount ?? 1;
  const orderedConvs = sortConversationsParentsFirst(conversations);
  const scopeConvIds = new Set(orderedConvs.map((c) => c.conversationId));

  const childrenMap = new Map<string, string[]>();
  const parentById = new Map<string, string>();
  for (const c of orderedConvs) {
    if (c.parentConversationId && scopeConvIds.has(c.parentConversationId)) {
      const list = childrenMap.get(c.parentConversationId) ?? [];
      list.push(c.conversationId);
      childrenMap.set(c.parentConversationId, list);
      parentById.set(c.conversationId, c.parentConversationId);
    }
  }

  const rootConvById = new Map<string, string>();
  for (const c of orderedConvs) {
    let cur = c.conversationId;
    const visited = new Set<string>([cur]);
    while (parentById.has(cur) && visited.size < 16) {
      const next = parentById.get(cur)!;
      if (visited.has(next)) break;
      visited.add(next);
      cur = next;
    }
    rootConvById.set(c.conversationId, cur);
  }

  // Pre-resolve all tool call hits and execution presence per conversation
  const toolHitByConv = new Map<string, Map<ToolCallRecord, ResolvedPluginSkillHit>>();
  const execParentsByConv = new Map<string, Set<string>>();

  for (const c of orderedConvs) {
    const hitMap = new Map<ToolCallRecord, ResolvedPluginSkillHit>();
    const execSet = new Set<string>();
    for (const tc of c.toolCalls) {
      const hit = resolveToolPluginAndChild(tc, registry);
      if (hit) {
        hitMap.set(tc, hit);
        if (hit.footprint === "execution") {
          execSet.add(hit.parentId);
        }
      }
    }
    toolHitByConv.set(c.conversationId, hitMap);
    execParentsByConv.set(c.conversationId, execSet);
  }

  // Unused load lookup per conversation (considering descendant subagents in scope)
  const unusedToolsByConv = new Map<string, Set<ToolCallRecord>>();
  for (const c of orderedConvs) {
    const familyIds = collectDescendantIds(c.conversationId, childrenMap);
    const familyExecParents = new Set<string>();
    for (const fid of familyIds) {
      for (const pid of execParentsByConv.get(fid) ?? []) {
        familyExecParents.add(pid);
      }
    }
    const unusedSet = new Set<ToolCallRecord>();
    const hitMap = toolHitByConv.get(c.conversationId)!;
    for (const [tc, hit] of hitMap.entries()) {
      if (hit.footprint === "instruction" && hit.requiresExecution) {
        if (!familyExecParents.has(hit.parentId)) {
          unusedSet.add(tc);
        }
      }
    }
    unusedToolsByConv.set(c.conversationId, unusedSet);
  }

  const parentsMap = new Map<string, ParentAccumulator>();
  const getOrCreateParent = (hit: ResolvedPluginSkillHit): ParentAccumulator => {
    let p = parentsMap.get(hit.parentId);
    if (!p) {
      p = {
        id: hit.parentId,
        name: hit.parentName,
        kind: hit.parentKind,
        calls: 0,
        errors: 0,
        toolIntervals: [],
        unplacedToolMs: 0,
        drivenIntervals: [],
        unplacedDrivenMs: 0,
        drivenCostKnown: false,
        drivenCostAcc: 0,
        contextCostKnown: false,
        contextCostAcc: 0,
        instructionTokens: 0,
        executionTokens: 0,
        directTokens: 0,
        compoundedCacheTokens: 0,
        warnings: new Set<string>(),
        targetPaths: new Set<string>(),
        children: new Map<string, ChildAccumulator>(),
        chatIds: new Set<string>()
      };
      parentsMap.set(hit.parentId, p);
    }
    return p;
  };

  const getOrCreateChild = (
    p: ParentAccumulator,
    hit: ResolvedPluginSkillHit
  ): ChildAccumulator => {
    let ch = p.children.get(hit.childKey);
    if (!ch) {
      ch = {
        key: hit.childKey,
        name: hit.childName,
        kind: hit.childKind,
        calls: 0,
        errors: 0,
        intervals: [],
        unplacedDrivenMs: 0,
        drivenCostKnown: false,
        drivenCostAcc: 0,
        instructionTokens: 0,
        executionTokens: 0,
        duplicateReads: 0,
        isUnusedLoad: false,
        targetPaths: new Set<string>()
      };
      p.children.set(hit.childKey, ch);
    }
    return ch;
  };

  const spawnInheritedGuide = new Map<string, ResolvedPluginSkillHit>();
  const topPluginsByConv = new Map<string, string[]>();
  const diagnosticsByConv = new Map<string, DiagnosticFinding[]>();

  const allScopeIntervals: TimeInterval[] = [];
  let unplacedScopeActiveMs = 0;
  let scopeCostKnown = false;
  let scopeCostSum = 0;
  let sumStepsContextTokens = 0;
  let sumAllToolsContextTokens = 0;

  for (const c of orderedConvs) {
    const hitMap = toolHitByConv.get(c.conversationId)!;
    const unusedSet = unusedToolsByConv.get(c.conversationId)!;
    const convParentImpact = new Map<string, { name: string; ms: number; tok: number }>();

    // Index tools by plannerStepIndex and record direct context footprint per tool call
    const stepModelMap = new Map<number, string>();
    for (const ps of c.plannerSteps) {
      stepModelMap.set(ps.stepIndex, ps.model);
      if (c.hasTokenTelemetry) {
        sumStepsContextTokens += ps.inputTokens + ps.cacheReadTokens;
      }
    }

    const toolsByStep = new Map<number, ToolCallRecord[]>();
    const skillReadCounts = new Map<
      string,
      { count: number; hit: ResolvedPluginSkillHit; firstStep: number; firstTurn: number; wastedTok: number }
    >();

    for (const tc of c.toolCalls) {
      const list = toolsByStep.get(tc.plannerStepIndex) ?? [];
      list.push(tc);
      toolsByStep.set(tc.plannerStepIndex, list);

      if (c.hasTokenTelemetry) {
        sumAllToolsContextTokens += tc.attributedInputTokens + tc.compoundedCacheTokens;
      }

      const hit = hitMap.get(tc);
      if (!hit) continue;

      const p = getOrCreateParent(hit);
      const ch = getOrCreateChild(p, hit);
      p.calls += 1;
      ch.calls += 1;
      p.chatIds.add(rootConvById.get(c.conversationId) ?? c.conversationId);
      if (tc.isError) {
        p.errors += 1;
        ch.errors += 1;
      }
      if (tc.targetPath) {
        p.targetPaths.add(tc.targetPath);
        ch.targetPaths.add(tc.targetPath);
      }

      if (tc.startedAtMs !== null && tc.startedAtMs > 0) {
        p.toolIntervals.push({
          start: tc.startedAtMs,
          end: Math.max(tc.startedAtMs, tc.completedAtMs ?? tc.startedAtMs + tc.durationMs)
        });
      } else {
        p.unplacedToolMs += tc.durationMs;
      }

      const callTok = tc.attributedInputTokens + tc.compoundedCacheTokens;
      p.directTokens += tc.attributedInputTokens;
      p.compoundedCacheTokens += tc.compoundedCacheTokens;
      if (hit.footprint === "instruction") {
        p.instructionTokens += callTok;
        ch.instructionTokens += callTok;
      } else {
        p.executionTokens += callTok;
        ch.executionTokens += callTok;
      }

      if (unusedSet.has(tc)) {
        ch.isUnusedLoad = true;
        p.warnings.add("Unused load");
      }

      if (tc.category === "skill" && (!tc.targetPath || tc.targetPath.endsWith("/SKILL.md"))) {
        const readKey = tc.targetPath || `${hit.parentId}:${hit.childKey}`;
        const prev = skillReadCounts.get(readKey);
        if (!prev) {
          skillReadCounts.set(readKey, {
            count: 1,
            hit,
            firstStep: tc.stepIndex,
            firstTurn: tc.turnIndex,
            wastedTok: 0
          });
        } else {
          prev.count += 1;
          prev.wastedTok += callTok;
          ch.duplicateReads += 1;
          p.warnings.add("Duplicate read");
        }
      }

      const model = stepModelMap.get(tc.plannerStepIndex) ?? "";
      const ctxEst = estimateStepCost(
        {
          inputTokens: tc.attributedInputTokens,
          cacheReadTokens: tc.compoundedCacheTokens,
          outputTokens: 0
        },
        model,
        pricingRules
      );
      if (!ctxEst.unpriced && ctxEst.totalUsd !== null) {
        p.contextCostKnown = true;
        p.contextCostAcc += ctxEst.totalUsd;
      }

      const prevConvImpact = convParentImpact.get(p.id) ?? { name: p.name, ms: 0, tok: 0 };
      prevConvImpact.tok += callTok;
      convParentImpact.set(p.id, prevConvImpact);
    }

    // Walk planner steps for Driven Active Time & Driven Spend
    let guidingHit: ResolvedPluginSkillHit | null =
      (c.parentConversationId ? spawnInheritedGuide.get(c.conversationId) : null) ?? null;

    let convHadPlacedIntervals = false;

    for (let i = 0; i < c.plannerSteps.length; i++) {
      const step = c.plannerSteps[i];
      const prevStep = i > 0 ? c.plannerSteps[i - 1] : null;

      // Context compaction clears un-reread guiding skill; TTL & model-switch misses do NOT!
      if (
        step.isCacheMiss &&
        step.cacheMissCause === "Context compaction or prefix reset"
      ) {
        guidingHit = null;
      }

      const stepTools = toolsByStep.get(step.stepIndex) ?? [];
      const prevTools = prevStep ? toolsByStep.get(prevStep.stepIndex) ?? [] : [];

      // Collect step intervals (excluding synchronous subagent wait when child is in scope)
      const stepIntervals: TimeInterval[] = [];
      let stepUnplacedMs = 0;

      if (step.createdAtMs > 0 && step.modelDurationMs > 0) {
        const mEnd =
          step.completedAtMs && step.completedAtMs >= step.createdAtMs
            ? step.completedAtMs
            : step.createdAtMs + step.modelDurationMs;
        stepIntervals.push({ start: step.createdAtMs, end: mEnd });
      } else if (step.modelDurationMs > 0) {
        stepUnplacedMs += step.modelDurationMs;
      }

      for (const tc of stepTools) {
        const skipSubagentWait =
          tc.category === "subagent" &&
          tc.childConversationId !== null &&
          scopeConvIds.has(tc.childConversationId);
        if (skipSubagentWait) continue;

        if (tc.startedAtMs !== null && tc.startedAtMs > 0) {
          stepIntervals.push({
            start: tc.startedAtMs,
            end: Math.max(tc.startedAtMs, tc.completedAtMs ?? tc.startedAtMs + tc.durationMs)
          });
        } else {
          stepUnplacedMs += tc.durationMs;
        }
      }

      if (stepIntervals.length > 0) {
        convHadPlacedIntervals = true;
        allScopeIntervals.push(...stepIntervals);
      } else {
        unplacedScopeActiveMs += stepUnplacedMs;
      }

      const stepHasTokens =
        step.inputTokens + step.cacheReadTokens + step.outputTokens > 0;
      const stepEst = stepHasTokens
        ? estimateStepCost(step, step.model, pricingRules)
        : { unpriced: true, totalUsd: null };
      if (!stepEst.unpriced && stepEst.totalUsd !== null) {
        scopeCostKnown = true;
        scopeCostSum += stepEst.totalUsd;
      }

      // Determine step drivers: ownHits -> prevStepIngestionHits -> guidingHit
      const ownHits: ResolvedPluginSkillHit[] = [];
      for (const tc of stepTools) {
        const h = hitMap.get(tc);
        if (!h) continue;
        ownHits.push(h);
        if (tc.category === "skill" && !unusedSet.has(tc)) {
          guidingHit = h;
        }
      }

      let activeStepHits: ResolvedPluginSkillHit[] = ownHits;
      if (activeStepHits.length === 0 && prevTools.length > 0) {
        const prevHits: ResolvedPluginSkillHit[] = [];
        for (const ptc of prevTools) {
          const ph = hitMap.get(ptc);
          if (ph) prevHits.push(ph);
        }
        if (prevHits.length > 0) {
          activeStepHits = prevHits;
        }
      }
      if (activeStepHits.length === 0 && guidingHit) {
        activeStepHits = [guidingHit];
      }

      // Propagate guide to any subagents spawned in this step
      const guideAtSpawn =
        guidingHit ?? (activeStepHits.length > 0 ? activeStepHits[0] : null);
      if (guideAtSpawn) {
        for (const tc of stepTools) {
          if (tc.childConversationId && !spawnInheritedGuide.has(tc.childConversationId)) {
            spawnInheritedGuide.set(tc.childConversationId, guideAtSpawn);
          }
        }
      }

      if (activeStepHits.length > 0) {
        // Deduplicate by parentId for parent attribution, and by parentId+childKey for child attribution
        const uniqueParents = new Map<string, ResolvedPluginSkillHit>();
        const uniqueChildren = new Map<string, ResolvedPluginSkillHit>();
        for (const h of activeStepHits) {
          if (!uniqueParents.has(h.parentId)) uniqueParents.set(h.parentId, h);
          const ck = `${h.parentId}#${h.childKey}`;
          if (!uniqueChildren.has(ck)) uniqueChildren.set(ck, h);
        }

        const pCount = uniqueParents.size;
        const stepMergedMs = mergeIntervalsMs(stepIntervals) + stepUnplacedMs;

        for (const ph of uniqueParents.values()) {
          const p = getOrCreateParent(ph);
          p.chatIds.add(rootConvById.get(c.conversationId) ?? c.conversationId);
          if (pCount === 1 && stepIntervals.length > 0) {
            p.drivenIntervals.push(...stepIntervals);
          } else if (stepMergedMs > 0) {
            p.unplacedDrivenMs += stepMergedMs / pCount;
          }
          if (!stepEst.unpriced && stepEst.totalUsd !== null) {
            p.drivenCostKnown = true;
            p.drivenCostAcc += stepEst.totalUsd / pCount;
          }
          const imp = convParentImpact.get(p.id) ?? { name: p.name, ms: 0, tok: 0 };
          imp.ms += stepMergedMs / pCount;
          convParentImpact.set(p.id, imp);
        }

        const cCount = uniqueChildren.size;
        for (const chHit of uniqueChildren.values()) {
          const p = getOrCreateParent(chHit);
          const ch = getOrCreateChild(p, chHit);
          if (cCount === 1 && stepIntervals.length > 0) {
            ch.intervals.push(...stepIntervals);
          } else if (stepMergedMs > 0) {
            ch.unplacedDrivenMs += stepMergedMs / cCount;
          }
          if (!stepEst.unpriced && stepEst.totalUsd !== null) {
            ch.drivenCostKnown = true;
            ch.drivenCostAcc += stepEst.totalUsd / cCount;
          }
        }
      }
    }

    // Handle synthetic callers (like aggregatePluginSkillMetrics) where plannerSteps had no timestamps
    if (!convHadPlacedIntervals && c.plannerSteps.length === 0 && c.activeMs > 0) {
      unplacedScopeActiveMs += c.activeMs;
    } else if (!convHadPlacedIntervals && c.plannerSteps.length > 0) {
      // Also collect tool intervals if steps had createdAtMs === 0
      const fallbackToolIvs: TimeInterval[] = [];
      for (const tc of c.toolCalls) {
        if (tc.startedAtMs !== null && tc.startedAtMs > 0) {
          fallbackToolIvs.push({
            start: tc.startedAtMs,
            end: Math.max(tc.startedAtMs, tc.completedAtMs ?? tc.startedAtMs + tc.durationMs)
          });
        }
      }
      if (fallbackToolIvs.length > 0) {
        allScopeIntervals.push(...fallbackToolIvs);
      } else if (c.activeMs > 0 && unplacedScopeActiveMs === 0) {
        unplacedScopeActiveMs += c.activeMs;
      }
    }

    const sortedConvParents = Array.from(convParentImpact.values())
      .sort((a, b) => b.ms - a.ms || b.tok - a.tok || a.name.localeCompare(b.name))
      .map((x) => x.name);
    topPluginsByConv.set(c.conversationId, sortedConvParents.slice(0, 6));

    // Build live diagnostics for conversation C
    const convDiags = buildConversationLiveDiagnostics(
      c,
      hitMap,
      unusedSet,
      skillReadCounts
    );
    diagnosticsByConv.set(c.conversationId, convDiags);
  }

  const computedScopeActiveMs = mergeIntervalsMs(allScopeIntervals) + unplacedScopeActiveMs;
  const scopeActiveMs =
    options.scopeActiveMsOverride !== undefined && options.scopeActiveMsOverride > 0
      ? options.scopeActiveMsOverride
      : computedScopeActiveMs;
  const scopeCostUsd = scopeCostKnown ? scopeCostSum : null;
  const scopeContextTokens =
    sumStepsContextTokens > 0 ? sumStepsContextTokens : sumAllToolsContextTokens;

  // Materialize parent metrics and clamp sum(drivenActiveMs) <= scopeActiveMs
  const rawParents = Array.from(parentsMap.values()).map((p) => {
    const rawToolMs = mergeIntervalsMs(p.toolIntervals) + p.unplacedToolMs;
    const rawDrivenMs =
      mergeIntervalsMs(p.drivenIntervals) + p.unplacedDrivenMs || rawToolMs;
    return { p, rawToolMs, rawDrivenMs };
  });

  const sumDrivenMs = rawParents.reduce((s, r) => s + r.rawDrivenMs, 0);
  const timeScale =
    scopeActiveMs > 0 && sumDrivenMs > scopeActiveMs
      ? scopeActiveMs / sumDrivenMs
      : 1;

  const effectiveScopeActiveMs =
    scopeActiveMs > 0 ? scopeActiveMs : sumDrivenMs;

  const pluginSkillMetrics: PluginSkillMetric[] = rawParents
    .map(({ p, rawToolMs, rawDrivenMs }) => {
      const drivenActiveMs = Math.round(rawDrivenMs * timeScale);
      const totalTokens = p.directTokens + p.compoundedCacheTokens;
      if (
        p.instructionTokens >= 25_000 &&
        totalTokens > 0 &&
        p.instructionTokens / totalTokens >= 0.75
      ) {
        p.warnings.add("High markdown carry");
      }

      const drivenCostUsd = p.drivenCostKnown
        ? p.drivenCostAcc
        : p.contextCostKnown
          ? p.contextCostAcc
          : null;
      const estimatedCostUsd = p.contextCostKnown
        ? p.contextCostAcc
        : drivenCostUsd;

      const children: PluginSkillChildMetric[] = Array.from(p.children.values())
        .map((ch) => {
          const chDrivenMs = Math.round(
            (mergeIntervalsMs(ch.intervals) + ch.unplacedDrivenMs) * timeScale
          );
          const chTotalTok = ch.instructionTokens + ch.executionTokens;
          return {
            key: ch.key,
            name: ch.name,
            kind: ch.kind,
            calls: ch.calls,
            errors: ch.errors,
            drivenActiveMs: chDrivenMs,
            drivenCostUsd: ch.drivenCostKnown ? ch.drivenCostAcc : null,
            instructionTokens: ch.instructionTokens,
            executionTokens: ch.executionTokens,
            totalTokens: chTotalTok,
            duplicateReads: ch.duplicateReads,
            isUnusedLoad: ch.isUnusedLoad,
            targetPaths: Array.from(ch.targetPaths).slice(0, 8)
          };
        })
        .sort(
          (a, b) =>
            (b.drivenCostUsd ?? -1) - (a.drivenCostUsd ?? -1) ||
            b.drivenActiveMs - a.drivenActiveMs ||
            b.totalTokens - a.totalTokens ||
            a.name.localeCompare(b.name)
        );

      const unusedChildren = children.filter((c) => c.isUnusedLoad).map((c) => c.name);
      const dupChildren = children
        .filter((c) => c.duplicateReads > 0)
        .map((c) => ({ name: c.name, dup: c.duplicateReads }));
      const prescription = buildPrescription(
        p.name,
        p.kind,
        p.instructionTokens,
        totalTokens,
        unusedChildren,
        dupChildren
      );

      const warnings = Array.from(p.warnings);
      const timeShare =
        effectiveScopeActiveMs > 0
          ? Math.min(1, drivenActiveMs / effectiveScopeActiveMs)
          : 0;
      const costShare =
        scopeCostUsd !== null && scopeCostUsd > 0 && drivenCostUsd !== null
          ? Math.min(1, drivenCostUsd / scopeCostUsd)
          : null;
      const tokenShare =
        scopeContextTokens > 0
          ? Math.min(1, totalTokens / scopeContextTokens)
          : 0;

      return {
        id: p.id,
        name: p.name,
        kind: p.kind,
        calls: p.calls,
        errors: p.errors,
        totalDurationMs: rawToolMs,
        drivenActiveMs,
        timeShare,
        drivenCostUsd,
        costShare,
        instructionTokens: p.instructionTokens,
        executionTokens: p.executionTokens,
        directTokens: p.directTokens,
        compoundedCacheTokens: p.compoundedCacheTokens,
        totalTokens,
        tokenShare,
        estimatedCostUsd,
        warningCount: warnings.length,
        warnings,
        prescription,
        targetPaths: Array.from(p.targetPaths).slice(0, 10),
        children,
        chatCount: p.chatIds.size > 0 ? p.chatIds.size : fallbackChatCount
      };
    })
    .sort(comparePluginSkillMetricsByImpact);

  return {
    pluginSkillMetrics,
    diagnosticsByConv,
    topPluginsByConv,
    scopeActiveMs: effectiveScopeActiveMs,
    scopeCostUsd,
    scopeContextTokens
  };
}

function buildConversationLiveDiagnostics(
  c: ConversationEfficiencyInput,
  hitMap: Map<ToolCallRecord, ResolvedPluginSkillHit>,
  unusedSet: Set<ToolCallRecord>,
  skillReadCounts: Map<
    string,
    { count: number; hit: ResolvedPluginSkillHit; firstStep: number; firstTurn: number; wastedTok: number }
  >
): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];
  const plannerSteps = c.plannerSteps;
  const toolCalls = c.toolCalls;
  const filesTouched = c.filesTouched;

  // 1. Top token drivers (Parent-First formatting!)
  const topTokenTools = [...toolCalls]
    .filter((tc) => tc.attributedInputTokens > 0 || tc.compoundedCacheTokens > 0)
    .sort(
      (a, b) =>
        b.attributedInputTokens +
        b.compoundedCacheTokens -
        (a.attributedInputTokens + a.compoundedCacheTokens)
    )
    .slice(0, 5);

  for (const tc of topTokenTools) {
    const hit = hitMap.get(tc);
    let label: string;
    if (hit) {
      if (hit.parentKind === "Plugin") {
        const showChild =
          hit.childName &&
          hit.childName.toLowerCase() !== hit.parentName.toLowerCase();
        label = showChild
          ? `Plugin ${hit.parentName} › ${hit.childName}`
          : `Plugin ${hit.parentName}`;
      } else {
        label = `Skill: ${hit.parentName}`;
      }
    } else if (tc.skillName) {
      label = `Skill: ${tc.skillName}`;
    } else if (tc.mcpServer) {
      label = `MCP ${tc.mcpServer}: ${tc.toolName}`;
    } else {
      label = `${tc.toolName}${tc.targetPath ? ` (${path.basename(tc.targetPath)})` : ""}`;
    }

    findings.push({
      id: `tok-${tc.stepIndex}-${tc.toolName}`,
      severity: tc.compoundedCacheTokens > 25_000 ? "warning" : "info",
      category: "token_driver",
      title: `Token driver: ${label}`,
      detail: `${(tc.resultBytes / 1024).toFixed(1)} KB output added ~${fmtShortTok(tc.attributedInputTokens)} direct input tokens and ~${fmtShortTok(tc.compoundedCacheTokens)} compounded cache reads.`,
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      impactTokens: tc.attributedInputTokens + tc.compoundedCacheTokens,
      impactMs: tc.durationMs,
      citation: `Step ${tc.stepIndex} (Turn ${tc.turnIndex + 1})`
    });
  }

  // 2. Unused tool-backed skill loads & duplicate SKILL.md reads
  const reportedUnusedKeys = new Set<string>();
  for (const tc of unusedSet) {
    const hit = hitMap.get(tc);
    if (!hit) continue;
    const uk = `${hit.parentId}:${hit.childKey}`;
    if (reportedUnusedKeys.has(uk)) continue;
    reportedUnusedKeys.add(uk);

    const wasted = tc.attributedInputTokens + tc.compoundedCacheTokens;
    const subLabel =
      hit.childName.toLowerCase() !== hit.parentName.toLowerCase()
        ? ` › ${hit.childName}`
        : "";
    findings.push({
      id: `unused-${tc.stepIndex}-${hit.parentId}`,
      severity: "warning",
      category: "unused_skill",
      title: `Unused skill load: ${hit.parentName}${subLabel}`,
      detail: `SKILL.md was loaded (+${fmtShortTok(wasted)} direct + cache carry) without any ${hit.parentName} CLI or MCP tool calls in this chat. Tighten its description trigger so it only activates when needed.`,
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      impactTokens: wasted,
      impactMs: tc.durationMs,
      citation: `Step ${tc.stepIndex} (Turn ${tc.turnIndex + 1})`
    });
  }

  for (const [readKey, info] of skillReadCounts.entries()) {
    if (info.count < 2) continue;
    const subLabel =
      info.hit.childName &&
      info.hit.childName !== "SKILL.md" &&
      info.hit.childName.toLowerCase() !== info.hit.parentName.toLowerCase()
        ? ` › ${info.hit.childName}`
        : "";
    findings.push({
      id: `dupskill-${info.firstStep}-${path.basename(readKey)}`,
      severity: "warning",
      category: "unused_skill",
      title: `Duplicate skill read: ${info.hit.parentName}${subLabel} (${info.count}×)`,
      detail: `The same SKILL.md was read ${info.count} times in one conversation, adding ~${fmtShortTok(info.wastedTok)} redundant tokens.`,
      stepIndex: info.firstStep,
      turnIndex: info.firstTurn,
      impactTokens: info.wastedTok,
      impactMs: null,
      citation: `Step ${info.firstStep}`
    });
  }

  // 3. High skill instruction overhead (>= 25k instruction tokens and >= 75% instruction ratio)
  const convParentTokens = new Map<
    string,
    { name: string; instr: number; total: number; firstStep: number; firstTurn: number }
  >();
  for (const tc of toolCalls) {
    const hit = hitMap.get(tc);
    if (!hit) continue;
    const tok = tc.attributedInputTokens + tc.compoundedCacheTokens;
    const cur = convParentTokens.get(hit.parentId) ?? {
      name: hit.parentName,
      instr: 0,
      total: 0,
      firstStep: tc.stepIndex,
      firstTurn: tc.turnIndex
    };
    cur.total += tok;
    if (hit.footprint === "instruction") cur.instr += tok;
    convParentTokens.set(hit.parentId, cur);
  }
  for (const [pid, stat] of convParentTokens.entries()) {
    if (stat.instr >= 25_000 && stat.total > 0 && stat.instr / stat.total >= 0.75) {
      findings.push({
        id: `overhead-${pid}`,
        severity: "warning",
        category: "high_skill_overhead",
        title: `High instruction carry: ${stat.name}`,
        detail: `${Math.round((stat.instr / stat.total) * 100)}% (+${fmtShortTok(stat.instr)} tok) of ${stat.name}'s context footprint came from SKILL.md / reference markdown carried in prompt cache. Split bulky reference material into on-demand files.`,
        stepIndex: stat.firstStep,
        turnIndex: stat.firstTurn,
        impactTokens: stat.instr,
        impactMs: null,
        citation: `Step ${stat.firstStep}`
      });
    }
  }

  // 4. Compaction cliff (200k warning, 256k critical)
  if (c.hasTokenTelemetry) {
    const first200k = plannerSteps.find(
      (s) => s.totalContextTokens >= 200_000 && s.totalContextTokens < 256_000
    );
    const first256k = plannerSteps.find((s) => s.totalContextTokens >= 256_000);

    if (first256k) {
      findings.push({
        id: `cliff-256k-${first256k.stepIndex}`,
        severity: "critical",
        category: "compaction_cliff",
        title: `Exceeded 256k soft compaction ceiling at Step ${first256k.stepIndex}`,
        detail: `Context reached ${fmtShortTok(first256k.totalContextTokens)} tokens (${first256k.attributedSummary || "context growth"}), risking forced compaction and cache resets.`,
        stepIndex: first256k.stepIndex,
        turnIndex: first256k.turnIndex,
        impactTokens: first256k.totalContextTokens,
        impactMs: first256k.modelDurationMs,
        citation: `Planner Step ${first256k.stepIndex}`
      });
    }
    if (first200k && (!first256k || first200k.stepIndex !== first256k.stepIndex)) {
      findings.push({
        id: `cliff-200k-${first200k.stepIndex}`,
        severity: "warning",
        category: "compaction_cliff",
        title: `Crossed 200k context cliff at Step ${first200k.stepIndex}`,
        detail: `Context crossed 200k (${fmtShortTok(first200k.totalContextTokens)} tokens — ${first200k.attributedSummary || "context growth"}). Pipe noisy outputs or delegate broad reads to subagents.`,
        stepIndex: first200k.stepIndex,
        turnIndex: first200k.turnIndex,
        impactTokens: first200k.totalContextTokens,
        impactMs: first200k.modelDurationMs,
        citation: `Planner Step ${first200k.stepIndex}`
      });
    }
  }

  // 5. Tool thrash (consecutive errors on same tool, OR >=3 attempts with >=2 errors on same target in one turn)
  const coveredThrashCalls = new Set<ToolCallRecord>();
  let runStart = 0;
  while (runStart < toolCalls.length) {
    const tc = toolCalls[runStart];
    if (!tc.isError) {
      runStart += 1;
      continue;
    }
    let runEnd = runStart + 1;
    while (
      runEnd < toolCalls.length &&
      toolCalls[runEnd].isError &&
      toolCalls[runEnd].toolName === tc.toolName
    ) {
      runEnd += 1;
    }
    const streak = toolCalls.slice(runStart, runEnd);
    if (streak.length >= 2) {
      for (const s of streak) coveredThrashCalls.add(s);
      const wastedTok = streak.reduce(
        (s, x) => s + x.attributedInputTokens + x.compoundedCacheTokens,
        0
      );
      const wastedMs = streak.reduce((s, x) => s + x.durationMs, 0);
      const targetHint = tc.targetPath ? ` (${path.basename(tc.targetPath)})` : "";
      findings.push({
        id: `thrash-${tc.stepIndex}-${tc.toolName}`,
        severity: "warning",
        category: "tool_thrash",
        title: `Tool retry thrash: ${tc.toolName}${targetHint} (${streak.length} consecutive errors)`,
        detail: `${streak.length} consecutive failed ${tc.toolName} calls wasted ${fmtShortDur(wastedMs)} and ~${fmtShortTok(wastedTok)} tokens${tc.errorPreview ? `: ${tc.errorPreview.slice(0, 100)}` : ""}.`,
        stepIndex: tc.stepIndex,
        turnIndex: tc.turnIndex,
        impactTokens: wastedTok,
        impactMs: wastedMs,
        citation: `Step ${tc.stepIndex} (Turn ${tc.turnIndex + 1})`
      });
    }
    runStart = runEnd;
  }

  const turnTargetGroups = new Map<string, ToolCallRecord[]>();
  for (const tc of toolCalls) {
    let targetKey: string | null = null;
    if (
      tc.toolName === "edit_file" ||
      tc.toolName === "replace_file_content" ||
      tc.toolName === "multi_replace_file_content"
    ) {
      const tgt = (tc.targetPath || tc.argsPreview || "").trim();
      if (tgt) targetKey = `${tc.turnIndex}|edit|${tgt}`;
    } else if (tc.toolName === "run_command") {
      const cmd = (tc.argsPreview || "").trim().slice(0, 80);
      if (cmd) targetKey = `${tc.turnIndex}|cmd|${cmd}`;
    }
    if (targetKey) {
      const list = turnTargetGroups.get(targetKey) ?? [];
      list.push(tc);
      turnTargetGroups.set(targetKey, list);
    }
  }

  for (const group of turnTargetGroups.values()) {
    if (group.length < 3) continue;
    const errCalls = group.filter((x) => x.isError);
    if (errCalls.length < 2) continue;
    if (errCalls.every((x) => coveredThrashCalls.has(x))) continue;

    const first = errCalls[0];
    const wastedTok = errCalls.reduce(
      (s, x) => s + x.attributedInputTokens + x.compoundedCacheTokens,
      0
    );
    const wastedMs = errCalls.reduce((s, x) => s + x.durationMs, 0);
    const targetHint = first.targetPath
      ? ` (${path.basename(first.targetPath)})`
      : first.argsPreview
        ? ` (${first.argsPreview.slice(0, 32)})`
        : "";
    findings.push({
      id: `thrash-turn-${first.turnIndex}-${first.stepIndex}-${first.toolName}`,
      severity: "warning",
      category: "tool_thrash",
      title: `Tool retry thrash: ${first.toolName}${targetHint} (${errCalls.length} errors in ${group.length} attempts)`,
      detail: `${group.length} ${first.toolName} attempts in Turn ${first.turnIndex + 1} hit ${errCalls.length} errors, wasting ${fmtShortDur(wastedMs)} and ~${fmtShortTok(wastedTok)} tokens${first.errorPreview ? `: ${first.errorPreview.slice(0, 100)}` : ""}.`,
      stepIndex: first.stepIndex,
      turnIndex: first.turnIndex,
      impactTokens: wastedTok,
      impactMs: wastedMs,
      citation: `Step ${first.stepIndex} (Turn ${first.turnIndex + 1})`
    });
  }

  // 6. Subagent delegation candidate (top-level chat turn with >= 6 read/search/command calls, >= 25k carry, 0 writes, 0 subagents)
  if (c.parentConversationId === null) {
    const toolsByTurn = new Map<number, ToolCallRecord[]>();
    for (const tc of toolCalls) {
      const arr = toolsByTurn.get(tc.turnIndex) ?? [];
      arr.push(tc);
      toolsByTurn.set(tc.turnIndex, arr);
    }
    for (const [turnIdx, tTools] of toolsByTurn.entries()) {
      const explore = tTools.filter(
        (t) =>
          t.category === "file_read" ||
          t.category === "search" ||
          t.category === "command"
      );
      const writes = tTools.filter((t) => t.category === "file_write");
      const subs = tTools.filter((t) => t.category === "subagent");
      const carryTok = explore.reduce((s, t) => s + t.compoundedCacheTokens, 0);
      if (
        explore.length >= 6 &&
        writes.length === 0 &&
        subs.length === 0 &&
        carryTok >= 25_000
      ) {
        const firstStep = explore[0].stepIndex;
        const durMs = explore.reduce((s, t) => s + t.durationMs, 0);
        findings.push({
          id: `subcand-turn-${turnIdx}`,
          severity: carryTok >= 50_000 ? "warning" : "info",
          category: "subagent_candidate",
          title: `Subagent candidate: ${explore.length} lookups in Turn ${turnIdx + 1}`,
          detail: `${explore.length} read/search/command calls stayed in the parent prompt cache (+${fmtShortTok(carryTok)} carry tokens). Delegate broad codebase exploration to a research subagent.`,
          stepIndex: firstStep,
          turnIndex: turnIdx,
          impactTokens: carryTok,
          impactMs: durMs,
          citation: `Turn ${turnIdx + 1} (Step ${firstStep})`
        });
      }
    }
  }

  // 7. Cache misses / resets
  for (const step of plannerSteps) {
    if (!step.isCacheMiss) continue;
    findings.push({
      id: `miss-${step.stepIndex}`,
      severity: "warning",
      category: "cache_miss",
      title: `Cache miss at Step ${step.stepIndex}`,
      detail: `${step.cacheMissCause ?? "Prompt cache reset"} — ${fmtShortTok(step.inputTokens)} uncached input tokens (${Math.round(step.cacheHitRatio * 100)}% cache hit).`,
      stepIndex: step.stepIndex,
      turnIndex: step.turnIndex,
      impactTokens: step.inputTokens,
      impactMs: step.modelDurationMs,
      citation: `Planner Step ${step.stepIndex}`
    });
  }

  // 8. Top slowest steps
  const slowestCandidates: Array<{
    id: string;
    title: string;
    detail: string;
    stepIndex: number;
    turnIndex: number;
    ms: number;
  }> = [];
  for (const tc of toolCalls) {
    if (tc.durationMs >= 1500) {
      slowestCandidates.push({
        id: `slow-tc-${tc.stepIndex}-${tc.toolName}`,
        title: `Slow tool: ${tc.toolName}${tc.argsPreview ? ` (${tc.argsPreview.slice(0, 48)})` : ""}`,
        detail: `Took ${fmtShortDur(tc.durationMs)}${tc.isError ? " and exited with an error" : ""}.`,
        stepIndex: tc.stepIndex,
        turnIndex: tc.turnIndex,
        ms: tc.durationMs
      });
    }
  }
  for (const ps of plannerSteps) {
    if (ps.modelDurationMs >= 3000) {
      slowestCandidates.push({
        id: `slow-ps-${ps.stepIndex}`,
        title: `Long model step: ${ps.model} (Step ${ps.stepIndex})`,
        detail: `Model thinking/generation took ${fmtShortDur(ps.modelDurationMs)} (${fmtShortTok(ps.outputTokens)} output tokens).`,
        stepIndex: ps.stepIndex,
        turnIndex: ps.turnIndex,
        ms: ps.modelDurationMs
      });
    }
  }
  slowestCandidates
    .sort((a, b) => b.ms - a.ms)
    .slice(0, 5)
    .forEach((item) => {
      findings.push({
        id: item.id,
        severity: item.ms >= 10_000 ? "warning" : "info",
        category: "slow_step",
        title: item.title,
        detail: item.detail,
        stepIndex: item.stepIndex,
        turnIndex: item.turnIndex,
        impactTokens: null,
        impactMs: item.ms,
        citation: `Step ${item.stepIndex}`
      });
    });

  // 9. Repeated reads of the same file
  for (const f of filesTouched) {
    if (f.reads >= 3) {
      findings.push({
        id: `reread-${f.path}`,
        severity: "info",
        category: "repeated_read",
        title: `Repeated reads: ${path.basename(f.path)} (${f.reads}×)`,
        detail: `${f.path} was read ${f.reads} times (${(f.totalBytesRead / 1024).toFixed(1)} KB total), contributing ~${fmtShortTok(f.directTokens)} direct tokens.`,
        stepIndex: null,
        turnIndex: null,
        impactTokens: f.directTokens,
        impactMs: null,
        citation: f.path
      });
    }
  }

  // 10. Errors & failed commands
  for (const tc of toolCalls) {
    if (!tc.isError) continue;
    findings.push({
      id: `err-${tc.stepIndex}-${tc.toolName}`,
      severity: "critical",
      category: "error_retry",
      title: `Tool error: ${tc.toolName} at Step ${tc.stepIndex}`,
      detail: tc.errorPreview ?? "Tool reported an execution error.",
      stepIndex: tc.stepIndex,
      turnIndex: tc.turnIndex,
      impactTokens: tc.attributedInputTokens,
      impactMs: tc.durationMs,
      citation: `Step ${tc.stepIndex}`
    });
  }

  // 11. Orchestrator model switches (model_split)
  if (plannerSteps.length > 0) {
    let switchCount = 0;
    let missCount = 0;
    let missUncachedTokens = 0;
    let firstSwitch: { stepIndex: number; turnIndex: number } | null = null;
    const modelTotals = new Map<string, { tokens: number; steps: number }>();

    for (let i = 0; i < plannerSteps.length; i++) {
      const ps = plannerSteps[i];
      const normModel = (ps.model || "").trim() || "unknown";
      const curTotals = modelTotals.get(normModel) ?? { tokens: 0, steps: 0 };
      curTotals.tokens += ps.inputTokens + ps.cacheReadTokens + ps.outputTokens;
      curTotals.steps += 1;
      modelTotals.set(normModel, curTotals);

      if (i > 0) {
        const prevModel = (plannerSteps[i - 1].model || "").trim() || "unknown";
        if (prevModel !== normModel) {
          switchCount += 1;
          if (!firstSwitch) {
            firstSwitch = { stepIndex: ps.stepIndex, turnIndex: ps.turnIndex };
          }
          if (ps.isCacheMiss) {
            missCount += 1;
            missUncachedTokens += ps.inputTokens;
          }
        }
      }
    }

    if (switchCount > 0 && firstSwitch) {
      const grandTokens = Array.from(modelTotals.values()).reduce(
        (sum, v) => sum + v.tokens,
        0
      );
      const grandSteps = plannerSteps.length;
      const mixParts = Array.from(modelTotals.entries())
        .sort((a, b) => b[1].tokens - a[1].tokens || b[1].steps - a[1].steps)
        .slice(0, 4)
        .map(([model, v]) => {
          const pct =
            grandTokens > 0
              ? Math.round((v.tokens / grandTokens) * 100)
              : Math.round((v.steps / grandSteps) * 100);
          return `${pct}% ${model}`;
        });

      const missNote =
        missCount > 0
          ? `${missCount} switch(es) triggered a prompt cache miss (+${fmtShortTok(missUncachedTokens)} uncached input).`
          : "All switches preserved prompt cache.";

      findings.push({
        id: "model-split-summary",
        severity: missCount > 0 ? "warning" : "info",
        category: "model_split",
        title: `Orchestrator switched models ${switchCount}× across ${modelTotals.size} models`,
        detail: `Model mix${grandTokens > 0 ? "" : " (by steps)"}: ${mixParts.join(", ")} · ${missNote}`,
        stepIndex: firstSwitch.stepIndex,
        turnIndex: firstSwitch.turnIndex,
        impactTokens: missUncachedTokens > 0 ? missUncachedTokens : null,
        impactMs: null,
        citation: `Step ${firstSwitch.stepIndex}`
      });
    }
  }

  return findings;
}

export function mergePluginSkillMetrics(
  projectLists: Array<{ projectPath: string; metrics: PluginSkillMetric[] }>,
  globalTotals?: {
    activeMs: number;
    estimatedCostUsd: number | null;
    contextTokens: number;
  }
): PluginSkillMetric[] {
  const map = new Map<
    string,
    {
      id: string;
      name: string;
      kind: "Plugin" | "Skill";
      calls: number;
      errors: number;
      totalDurationMs: number;
      drivenActiveMs: number;
      anyDrivenCost: boolean;
      drivenCostSum: number;
      anyEstCost: boolean;
      estCostSum: number;
      instructionTokens: number;
      executionTokens: number;
      directTokens: number;
      compoundedCacheTokens: number;
      totalTokens: number;
      warnings: Set<string>;
      targetPaths: Set<string>;
      childrenMap: Map<string, PluginSkillChildMetric & { anyCost: boolean; costSum: number }>;
      chatCount: number;
      projects: Set<string>;
    }
  >();

  let sumMergedTokens = 0;
  let sumMergedDrivenMs = 0;

  for (const { projectPath, metrics } of projectLists) {
    for (const m of metrics) {
      const cur = map.get(m.id) ?? {
        id: m.id,
        name: m.name,
        kind: m.kind,
        calls: 0,
        errors: 0,
        totalDurationMs: 0,
        drivenActiveMs: 0,
        anyDrivenCost: false,
        drivenCostSum: 0,
        anyEstCost: false,
        estCostSum: 0,
        instructionTokens: 0,
        executionTokens: 0,
        directTokens: 0,
        compoundedCacheTokens: 0,
        totalTokens: 0,
        warnings: new Set<string>(),
        targetPaths: new Set<string>(),
        childrenMap: new Map(),
        chatCount: 0,
        projects: new Set<string>()
      };

      cur.calls += m.calls;
      cur.errors += m.errors;
      cur.totalDurationMs += m.totalDurationMs;
      cur.drivenActiveMs += m.drivenActiveMs;
      if (m.drivenCostUsd !== null) {
        cur.anyDrivenCost = true;
        cur.drivenCostSum += m.drivenCostUsd;
      }
      if (m.estimatedCostUsd !== null) {
        cur.anyEstCost = true;
        cur.estCostSum += m.estimatedCostUsd;
      }
      cur.instructionTokens += m.instructionTokens;
      cur.executionTokens += m.executionTokens;
      cur.directTokens += m.directTokens;
      cur.compoundedCacheTokens += m.compoundedCacheTokens;
      cur.totalTokens += m.totalTokens;
      cur.chatCount += m.chatCount;
      cur.projects.add(projectPath);

      for (const w of m.warnings) cur.warnings.add(w);
      for (const tp of m.targetPaths) cur.targetPaths.add(tp);

      for (const ch of m.children) {
        const existingCh = cur.childrenMap.get(ch.key) ?? {
          ...ch,
          calls: 0,
          errors: 0,
          drivenActiveMs: 0,
          drivenCostUsd: null,
          instructionTokens: 0,
          executionTokens: 0,
          totalTokens: 0,
          duplicateReads: 0,
          isUnusedLoad: false,
          targetPaths: [],
          anyCost: false,
          costSum: 0
        };
        existingCh.calls += ch.calls;
        existingCh.errors += ch.errors;
        existingCh.drivenActiveMs += ch.drivenActiveMs;
        existingCh.instructionTokens += ch.instructionTokens;
        existingCh.executionTokens += ch.executionTokens;
        existingCh.totalTokens += ch.totalTokens;
        existingCh.duplicateReads += ch.duplicateReads;
        existingCh.isUnusedLoad = existingCh.isUnusedLoad || ch.isUnusedLoad;
        existingCh.targetPaths = Array.from(
          new Set([...existingCh.targetPaths, ...ch.targetPaths])
        ).slice(0, 8);
        if (ch.drivenCostUsd !== null) {
          existingCh.anyCost = true;
          existingCh.costSum += ch.drivenCostUsd;
        }
        cur.childrenMap.set(ch.key, existingCh);
      }

      map.set(m.id, cur);
      sumMergedTokens += m.totalTokens;
      sumMergedDrivenMs += m.drivenActiveMs;
    }
  }

  const denomActiveMs =
    globalTotals && globalTotals.activeMs > 0
      ? globalTotals.activeMs
      : sumMergedDrivenMs;
  const denomCostUsd = globalTotals?.estimatedCostUsd ?? null;
  const denomContextTok =
    globalTotals && globalTotals.contextTokens > 0
      ? globalTotals.contextTokens
      : sumMergedTokens;

  const timeScale =
    denomActiveMs > 0 && sumMergedDrivenMs > denomActiveMs
      ? denomActiveMs / sumMergedDrivenMs
      : 1;

  return Array.from(map.values())
    .map((e) => {
      const drivenActiveMs = Math.round(e.drivenActiveMs * timeScale);
      const drivenCostUsd = e.anyDrivenCost ? e.drivenCostSum : null;
      const estimatedCostUsd = e.anyEstCost ? e.estCostSum : drivenCostUsd;

      const children: PluginSkillChildMetric[] = Array.from(e.childrenMap.values())
        .map(({ anyCost, costSum, ...rest }) => ({
          ...rest,
          drivenActiveMs: Math.round(rest.drivenActiveMs * timeScale),
          drivenCostUsd: anyCost ? costSum : null
        }))
        .sort(
          (a, b) =>
            (b.drivenCostUsd ?? -1) - (a.drivenCostUsd ?? -1) ||
            b.drivenActiveMs - a.drivenActiveMs ||
            b.totalTokens - a.totalTokens ||
            a.name.localeCompare(b.name)
        );

      const unusedChildren = children.filter((c) => c.isUnusedLoad).map((c) => c.name);
      const dupChildren = children
        .filter((c) => c.duplicateReads > 0)
        .map((c) => ({ name: c.name, dup: c.duplicateReads }));
      const prescription = buildPrescription(
        e.name,
        e.kind,
        e.instructionTokens,
        e.totalTokens,
        unusedChildren,
        dupChildren
      );

      const warnings = Array.from(e.warnings);
      return {
        id: e.id,
        name: e.name,
        kind: e.kind,
        calls: e.calls,
        errors: e.errors,
        totalDurationMs: e.totalDurationMs,
        drivenActiveMs,
        timeShare: denomActiveMs > 0 ? Math.min(1, drivenActiveMs / denomActiveMs) : 0,
        drivenCostUsd,
        costShare:
          denomCostUsd !== null && denomCostUsd > 0 && drivenCostUsd !== null
            ? Math.min(1, drivenCostUsd / denomCostUsd)
            : null,
        instructionTokens: e.instructionTokens,
        executionTokens: e.executionTokens,
        directTokens: e.directTokens,
        compoundedCacheTokens: e.compoundedCacheTokens,
        totalTokens: e.totalTokens,
        tokenShare:
          denomContextTok > 0 ? Math.min(1, e.totalTokens / denomContextTok) : 0,
        estimatedCostUsd,
        warningCount: warnings.length,
        warnings,
        prescription,
        targetPaths: Array.from(e.targetPaths).slice(0, 10),
        children,
        chatCount: e.chatCount,
        projectCount: e.projects.size
      };
    })
    .sort(comparePluginSkillMetricsByImpact);
}
