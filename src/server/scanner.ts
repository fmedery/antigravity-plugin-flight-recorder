import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isAbsoluteLocalPath,
  isWindowsPath,
  pathBaseName,
  pathDirName,
  pathExtName,
  pathJoin,
  unwrapFileUri
} from "../shared/paths.js";
import { sanitizePreviewText } from "../shared/redact.js";
import type {
  ChildConversationLink,
  ProjectSource,
  SurfaceType,
  SwarmRole
} from "../shared/types.js";
import { analyzeConversation } from "./analytics.js";
import type { HookEventRow, TrackerDatabase } from "./db.js";
import { ingestHookEvents } from "./hookIngestor.js";
import { parseTranscriptFile, type ParsedTranscript } from "./transcriptParser.js";

export interface BrainRootConfig {
  surface: SurfaceType;
  dir: string;
}

export interface ScannerOptions {
  db: TrackerDatabase;
  dataDir: string;
  brainRoots?: BrainRootConfig[];
  eventsPath?: string;
}

export interface ScanStats {
  hookEventsIngested: number;
  transcriptsDiscovered: number;
  transcriptsIndexed: number;
  transcriptsSkipped: number;
}

interface DiscoveredTranscript {
  conversationId: string;
  transcriptPath: string;
  convDir: string | null;
  surface: SurfaceType;
  size: number;
  mtimeMs: number;
  swarmMetaMtimeMs: number;
}

interface SwarmDirMetadata {
  hasPlan: boolean;
  planTitle: string | null;
  tasks: Record<string, string>;
  rosterLinks: ChildConversationLink[];
  latestMtimeMs: number;
}

const IGNORED_PATH_PREFIXES = [
  "/tmp/",
  "/private/tmp/",
  "/var/",
  "/usr/",
  "/bin/",
  "/sbin/",
  "/opt/",
  "/System/",
  "/Library/",
  "/dev/",
  "/etc/"
];

const PROJECT_MARKERS = [
  ".git",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "pom.xml"
];

export function defaultBrainRoots(): BrainRootConfig[] {
  const home = os.homedir();
  return [
    { surface: "antigravity", dir: path.join(home, ".gemini", "antigravity", "brain") },
    { surface: "cli", dir: path.join(home, ".gemini", "antigravity-cli", "brain") },
    { surface: "ide", dir: path.join(home, ".gemini", "antigravity-ide", "brain") }
  ];
}

function inferSurfaceFromPath(filePath: string): SurfaceType {
  const norm = filePath.replace(/\\/g, "/");
  if (norm.includes("/antigravity-cli/")) return "cli";
  if (norm.includes("/antigravity-ide/")) return "ide";
  if (norm.includes("/antigravity/")) return "antigravity";
  return "unknown";
}

function isIgnoredSystemPath(p: string, homeOverride?: string): boolean {
  const norm = p.replace(/\\/g, "/");
  const lower = norm.toLowerCase();
  const home = (homeOverride || os.homedir()).replace(/\\/g, "/").replace(/\/+$/, "");
  const homeLower = home.toLowerCase();
  const geminiLower = `${homeLower}/.gemini`;
  if (lower === geminiLower || lower.startsWith(`${geminiLower}/`)) return true;
  if (norm === "/tmp" || lower === homeLower) return true;

  const tmpDirNorm = os.tmpdir().replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  if (tmpDirNorm && (lower === tmpDirNorm || lower.startsWith(`${tmpDirNorm}/`))) {
    return true;
  }

  // Windows system & temp locations
  if (
    /^[a-z]:\/(?:windows|program files|program files \(x86\)|programdata|perflogs|\$recycle\.bin)(?:\/|$)/i.test(
      norm
    ) ||
    lower.includes("/appdata/local/temp/") ||
    lower.endsWith("/appdata/local/temp")
  ) {
    return true;
  }

  return IGNORED_PATH_PREFIXES.some((prefix) => norm.startsWith(prefix));
}

export interface FindProjectRootOptions {
  existsFn?: (p: string) => boolean;
  isFileFn?: (p: string) => boolean;
  readFileFn?: (p: string) => string | null;
  homeDir?: string;
}

const UUID_EXACT_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function resolveWorktreeMainRoot(
  repoDir: string,
  options: FindProjectRootOptions = {}
): string {
  const canReadDisk =
    Boolean(options.readFileFn) || (!options.existsFn && !options.isFileFn);
  if (!canReadDisk) return repoDir;

  const isFileFn =
    options.isFileFn ??
    ((p: string) => {
      try {
        return fs.existsSync(p) && fs.statSync(p).isFile();
      } catch {
        return false;
      }
    });
  const readFileFn =
    options.readFileFn ??
    ((p: string) => {
      try {
        return fs.existsSync(p) && fs.statSync(p).isFile()
          ? fs.readFileSync(p, "utf8")
          : null;
      } catch {
        return null;
      }
    });

  const dotGit = pathJoin(repoDir, ".git");
  if (!isFileFn(dotGit)) return repoDir;

  const pointer = readFileFn(dotGit);
  if (!pointer) return repoDir;
  const gitDirMatch = pointer.match(/^gitdir:\s*(.+)$/im);
  if (!gitDirMatch || !gitDirMatch[1].trim()) return repoDir;

  const rawTarget = gitDirMatch[1].trim();
  const resolveLocal = (baseDir: string, relTarget: string): string => {
    if (isAbsoluteLocalPath(relTarget)) return relTarget;
    return isWindowsPath(baseDir)
      ? path.win32.resolve(baseDir, relTarget)
      : path.posix.resolve(baseDir, relTarget);
  };

  const resolvedGitDir = resolveLocal(repoDir, rawTarget);

  const commonDirText = readFileFn(pathJoin(resolvedGitDir, "commondir"));
  if (commonDirText && commonDirText.trim()) {
    const commonRaw = commonDirText.trim();
    const commonDir = resolveLocal(resolvedGitDir, commonRaw);
    const cleanedCommon = commonDir.replace(/[\\/]+$/, "");
    if (pathBaseName(cleanedCommon).toLowerCase() === ".git") {
      const parent = pathDirName(cleanedCommon);
      if (parent && parent !== ".") return parent;
    }
  }

  const wtMatch = resolvedGitDir
    .replace(/[\\/]+$/, "")
    .match(/^(.+)[\\/]\.git[\\/]worktrees[\\/][^\\/]+$/i);
  if (wtMatch && wtMatch[1]) {
    return wtMatch[1];
  }

  return repoDir;
}

export function findProjectRootForPath(
  rawCandidatePath: string,
  options: FindProjectRootOptions = {}
): string | null {
  const candidatePath = unwrapFileUri(rawCandidatePath);
  if (!candidatePath || !isAbsoluteLocalPath(candidatePath)) return null;
  const home = options.homeDir ?? os.homedir();
  if (isIgnoredSystemPath(candidatePath, home)) return null;

  const existsFn = options.existsFn ?? ((p: string) => fs.existsSync(p));
  const isFileFn =
    options.isFileFn ??
    ((p: string) => {
      try {
        return fs.existsSync(p) && fs.statSync(p).isFile();
      } catch {
        return false;
      }
    });

  const winMode = isWindowsPath(candidatePath);
  const samePath = (a: string, b: string) => {
    const na = a.replace(/[\\/]+$/, "");
    const nb = b.replace(/[\\/]+$/, "");
    return winMode ? na.toLowerCase() === nb.toLowerCase() : na === nb;
  };

  let dir = candidatePath;
  try {
    if (isFileFn(candidatePath)) {
      dir = pathDirName(candidatePath);
    } else if (!existsFn(candidatePath) && pathExtName(candidatePath)) {
      dir = pathDirName(candidatePath);
    }
  } catch {
    dir = pathDirName(candidatePath);
  }

  let fallbackCandidate: string | null = null;
  for (let depth = 0; depth < 12; depth++) {
    if (
      !dir ||
      dir === "/" ||
      /^[a-zA-Z]:[\\/]?$/.test(dir) ||
      samePath(dir, home)
    ) {
      break;
    }

    for (const marker of PROJECT_MARKERS) {
      try {
        if (existsFn(pathJoin(dir, marker))) {
          if (marker === ".git") return resolveWorktreeMainRoot(dir, options);
          if (!fallbackCandidate) fallbackCandidate = dir;
        }
      } catch {
        // Ignore stat permission errors
      }
    }

    const parent = pathDirName(dir);
    if (parent === dir || parent === ".") break;
    dir = parent;
  }

  if (fallbackCandidate) return fallbackCandidate;

  // Fallback for non-repo folders directly under ~/git/<project> or ~/Projects/<project>
  const normHome = home.replace(/\\/g, "/").replace(/\/+$/, "");
  const normCand = candidatePath.replace(/\\/g, "/");
  const startsWithHome = winMode
    ? normCand.toLowerCase().startsWith(`${normHome.toLowerCase()}/`)
    : normCand.startsWith(`${normHome}/`);
  if (startsWithHome) {
    const rel = normCand.slice(normHome.length + 1);
    const segs = rel.split("/").filter(Boolean);
    if (
      segs.length >= 2 &&
      ["git", "projects", "Projects", "src", "workspace", "workspaces", "code", "dev", "repos"].includes(
        segs[0]
      )
    ) {
      return pathJoin(pathJoin(home, segs[0]), segs[1]);
    }
  }

  return null;
}

export function inferProjectFromPaths(candidatePaths: string[]): string | null {
  const votes = new Map<string, number>();
  for (const p of candidatePaths) {
    const root = findProjectRootForPath(p);
    if (!root) continue;
    const hasGit = fs.existsSync(path.join(root, ".git"));
    votes.set(root, (votes.get(root) ?? 0) + (hasGit ? 3 : 1));
  }
  if (votes.size === 0) return null;

  let bestRoot: string | null = null;
  let bestScore = -1;
  for (const [root, score] of votes.entries()) {
    if (score > bestScore) {
      bestScore = score;
      bestRoot = root;
    }
  }
  return bestRoot;
}

function getSwarmMetaMtimeMs(convDir: string): number {
  const swarmDir = path.join(convDir, ".system_generated", "swarm");
  try {
    if (!fs.existsSync(swarmDir) || !fs.statSync(swarmDir).isDirectory()) return 0;
    let maxMtime = 0;
    for (const entry of fs.readdirSync(swarmDir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (!/\.(?:json|jsonl)$/i.test(entry.name)) continue;
      const st = fs.statSync(path.join(swarmDir, entry.name));
      if (st.mtimeMs > maxMtime) maxMtime = st.mtimeMs;
    }
    return maxMtime;
  } catch {
    return 0;
  }
}

function collectRosterLinksFromObject(
  node: unknown,
  selfConversationId: string,
  out: Map<string, ChildConversationLink>,
  depth = 0
): void {
  if (!node || typeof node !== "object" || depth > 6) return;
  if (Array.isArray(node)) {
    for (const item of node) {
      collectRosterLinksFromObject(item, selfConversationId, out, depth + 1);
    }
    return;
  }

  const obj = node as Record<string, unknown>;
  const idCand =
    obj.conversationId ??
    obj.conversation_id ??
    obj.convId ??
    obj.conv_id ??
    obj.id;
  if (
    typeof idCand === "string" &&
    UUID_EXACT_RE.test(idCand.trim()) &&
    idCand.trim() !== selfConversationId
  ) {
    const cid = idCand.trim();
    const roleCand =
      typeof obj.name === "string" && obj.name.trim()
        ? obj.name.trim()
        : typeof obj.role === "string" && obj.role.trim()
          ? obj.role.trim()
          : typeof obj.worker === "string" && obj.worker.trim()
            ? obj.worker.trim()
            : typeof obj.roster_name === "string" && obj.roster_name.trim()
              ? obj.roster_name.trim()
              : null;
    if (!out.has(cid) || (roleCand && !out.get(cid)!.role)) {
      out.set(cid, {
        conversationId: cid,
        role: roleCand ? sanitizePreviewText(roleCand, 40) : null,
        typeName: "swarm"
      });
    }
  }

  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      collectRosterLinksFromObject(val, selfConversationId, out, depth + 1);
    }
  }
}

function readSwarmDirMetadata(
  convDir: string | null,
  selfConversationId: string
): SwarmDirMetadata | null {
  if (!convDir) return null;
  const swarmDir = path.join(convDir, ".system_generated", "swarm");
  try {
    if (!fs.existsSync(swarmDir) || !fs.statSync(swarmDir).isDirectory()) {
      return null;
    }
  } catch {
    return null;
  }

  let hasPlan = false;
  let planTitle: string | null = null;
  const tasks: Record<string, string> = {};
  const rosterMap = new Map<string, ChildConversationLink>();
  let latestMtimeMs = 0;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(swarmDir, { withFileTypes: true });
  } catch {
    return null;
  }

  const MAX_META_BYTES = 1024 * 1024;
  let extraFilesScanned = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const fullPath = path.join(swarmDir, entry.name);
    let st: fs.Stats;
    try {
      st = fs.statSync(fullPath);
    } catch {
      continue;
    }
    if (st.mtimeMs > latestMtimeMs) latestMtimeMs = st.mtimeMs;
    if (st.size === 0 || st.size > MAX_META_BYTES) continue;

    if (entry.name.toLowerCase() === "plan.json") {
      try {
        const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8")) as {
          goal?: { title?: unknown };
          tasks?: Record<string, unknown>;
        };
        hasPlan = true;
        if (typeof parsed?.goal?.title === "string" && parsed.goal.title.trim()) {
          planTitle = sanitizePreviewText(parsed.goal.title.trim(), 80);
        }
        if (parsed?.tasks && typeof parsed.tasks === "object" && !Array.isArray(parsed.tasks)) {
          for (const [workerKey, desc] of Object.entries(parsed.tasks)) {
            if (typeof desc === "string" && desc.trim()) {
              tasks[workerKey] = sanitizePreviewText(desc.trim(), 120);
            }
          }
        }
      } catch {
        // Ignore malformed plan.json
      }
      continue;
    }

    if (!/\.(?:json|jsonl)$/i.test(entry.name) || extraFilesScanned >= 8) {
      continue;
    }
    extraFilesScanned += 1;
    try {
      const text = fs.readFileSync(fullPath, "utf8");
      if (entry.name.toLowerCase().endsWith(".jsonl")) {
        for (const line of text.split(/\r?\n/)) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            collectRosterLinksFromObject(
              JSON.parse(trimmed),
              selfConversationId,
              rosterMap
            );
          } catch {
            // Skip bad line
          }
        }
      } else {
        collectRosterLinksFromObject(
          JSON.parse(text),
          selfConversationId,
          rosterMap
        );
      }
    } catch {
      // Ignore malformed swarm state file
    }
  }

  return {
    hasPlan,
    planTitle,
    tasks,
    rosterLinks: Array.from(rosterMap.values()),
    latestMtimeMs
  };
}

function inferConvDirFromTranscriptPath(transcriptPath: string): string | null {
  const norm = transcriptPath.replace(/\\/g, "/");
  const idx = norm.lastIndexOf("/.system_generated/logs/");
  if (idx > 0) {
    return transcriptPath.slice(0, idx);
  }
  return path.dirname(transcriptPath);
}

function discoverTranscripts(
  roots: BrainRootConfig[],
  db: TrackerDatabase
): DiscoveredTranscript[] {
  const byConv = new Map<string, DiscoveredTranscript>();

  for (const root of roots) {
    if (!fs.existsSync(root.dir)) continue;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(root.dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const convId = entry.name;
      const convDir = path.join(root.dir, convId);
      const candidates = [
        path.join(convDir, ".system_generated", "logs", "transcript_full.jsonl"),
        path.join(convDir, ".system_generated", "logs", "transcript.jsonl"),
        path.join(convDir, "transcript_full.jsonl"),
        path.join(convDir, "transcript.jsonl")
      ];

      for (const candidate of candidates) {
        try {
          if (!fs.existsSync(candidate)) continue;
          const st = fs.statSync(candidate);
          if (!st.isFile() || st.size === 0) continue;
          if (!byConv.has(convId)) {
            byConv.set(convId, {
              conversationId: convId,
              transcriptPath: candidate,
              convDir,
              surface: root.surface,
              size: st.size,
              mtimeMs: st.mtimeMs,
              swarmMetaMtimeMs: getSwarmMetaMtimeMs(convDir)
            });
          }
          break;
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  // Also include any transcript paths surfaced via hooks outside default brain roots.
  for (const hk of db.getHookTranscriptPaths()) {
    if (byConv.has(hk.conversationId)) continue;
    let candidate = hk.transcriptPath;
    if (/[\\/]transcript\.jsonl$/i.test(candidate)) {
      const sep = candidate.endsWith("\\transcript.jsonl") ? "\\" : "/";
      const fullVariant =
        candidate.slice(0, -"transcript.jsonl".length) + "transcript_full.jsonl";
      if (sep && fs.existsSync(fullVariant)) {
        candidate = fullVariant;
      }
    }
    try {
      if (!fs.existsSync(candidate)) continue;
      const st = fs.statSync(candidate);
      if (!st.isFile() || st.size === 0) continue;
      const convDir = inferConvDirFromTranscriptPath(candidate);
      byConv.set(hk.conversationId, {
        conversationId: hk.conversationId,
        transcriptPath: candidate,
        convDir,
        surface: inferSurfaceFromPath(candidate),
        size: st.size,
        mtimeMs: st.mtimeMs,
        swarmMetaMtimeMs: convDir ? getSwarmMetaMtimeMs(convDir) : 0
      });
    } catch {
      // Skip unreadable path
    }
  }

  return Array.from(byConv.values());
}

function resolveProject(
  conversationId: string,
  parsed: ParsedTranscript | null,
  hookEvents: HookEventRow[],
  db: TrackerDatabase,
  subagentLinks: Map<
    string,
    { parentConversationId: string; role: string | null; typeName: string | null }
  >
): {
  projectPath: string;
  projectSource: ProjectSource;
  parentConversationId: string | null;
  subagentRole: string | null;
  subagentType: string | null;
} {
  const link = subagentLinks.get(conversationId) ?? null;
  const parentConversationId = link?.parentConversationId ?? null;
  const subagentRole = link?.role ?? null;
  const subagentType = link?.typeName ?? null;

  // 1. Manual override
  const manual = db.getProjectOverride(conversationId);
  if (manual) {
    return {
      projectPath: manual.projectPath,
      projectSource: "manual",
      parentConversationId,
      subagentRole,
      subagentType
    };
  }

  // 2. Parent conversation's resolved project (keeps isolated share/branch workers in parent's project)
  if (parentConversationId) {
    const parentOverride = db.getProjectOverride(parentConversationId);
    if (parentOverride) {
      return {
        projectPath: parentOverride.projectPath,
        projectSource: "parent",
        parentConversationId,
        subagentRole,
        subagentType
      };
    }
    const parentRow = db.getConversationRecord(parentConversationId);
    if (parentRow && parentRow.projectPath && parentRow.projectPath !== "Unassigned") {
      return {
        projectPath: parentRow.projectPath,
        projectSource: "parent",
        parentConversationId,
        subagentRole,
        subagentType
      };
    }
  }

  // 3. Authoritative hook workspacePaths / cwd (normalizing git worktrees to main repo root)
  for (const ev of hookEvents) {
    for (const wp of ev.workspacePaths) {
      if (wp) {
        const normalizedWp = resolveWorktreeMainRoot(wp);
        if (!isIgnoredSystemPath(normalizedWp)) {
          return {
            projectPath: normalizedWp,
            projectSource: "hook",
            parentConversationId,
            subagentRole,
            subagentType
          };
        }
      }
    }
    if (ev.cwd) {
      const normalizedCwd = resolveWorktreeMainRoot(ev.cwd);
      if (!isIgnoredSystemPath(normalizedCwd)) {
        return {
          projectPath: normalizedCwd,
          projectSource: "hook",
          parentConversationId,
          subagentRole,
          subagentType
        };
      }
    }
  }

  // 4. Heuristic inference from file & command paths referenced in transcript
  if (parsed) {
    const inferred = inferProjectFromPaths(parsed.candidatePaths);
    if (inferred) {
      return {
        projectPath: inferred,
        projectSource: "inferred",
        parentConversationId,
        subagentRole,
        subagentType
      };
    }
  }

  return {
    projectPath: "Unassigned",
    projectSource: "unassigned",
    parentConversationId,
    subagentRole,
    subagentType
  };
}

const inFlightScans = new Map<string, Promise<ScanStats>>();

export function runScan(options: ScannerOptions): Promise<ScanStats> {
  const key = options.db.dbPath;
  const existing = inFlightScans.get(key);
  if (existing) return existing;

  const promise = runScanInternal(options).finally(() => {
    inFlightScans.delete(key);
  });
  inFlightScans.set(key, promise);
  return promise;
}

async function runScanInternal(options: ScannerOptions): Promise<ScanStats> {
  const { db, dataDir } = options;
  const eventsPath = options.eventsPath ?? path.join(dataDir, "events.jsonl");
  const brainRoots = options.brainRoots ?? defaultBrainRoots();

  const hookResult = ingestHookEvents(db, eventsPath);
  const touchedByHooks = new Set(hookResult.touchedConversationIds);

  const discovered = discoverTranscripts(brainRoots, db);
  const toProcess: DiscoveredTranscript[] = [];
  let skipped = 0;

  for (const item of discovered) {
    const indexed = db.getIndexedFile(item.transcriptPath);
    const existingConv = db.getConversationRecord(item.conversationId);
    const latestHookTs = db.getLatestHookTsForConversation(item.conversationId);
    const override = db.getProjectOverride(item.conversationId);

    const fileUnchanged =
      indexed !== null &&
      indexed.fileSize === item.size &&
      Math.abs(indexed.mtimeMs - item.mtimeMs) < 1 &&
      (!existingConv || item.swarmMetaMtimeMs <= existingConv.indexedAtMs);

    const hookUnchanged =
      !touchedByHooks.has(item.conversationId) &&
      (!existingConv || latestHookTs <= existingConv.indexedAtMs);

    const overrideUnchanged =
      !override || !existingConv || override.updatedAtMs <= existingConv.indexedAtMs;

    if (fileUnchanged && hookUnchanged && overrideUnchanged && existingConv) {
      skipped += 1;
      continue;
    }
    toProcess.push(item);
  }

  // Read .system_generated/swarm metadata for discovered transcripts when present.
  const swarmMetaMap = new Map<string, SwarmDirMetadata>();
  for (const item of discovered) {
    if (item.swarmMetaMtimeMs > 0 || item.convDir) {
      const meta = readSwarmDirMetadata(item.convDir, item.conversationId);
      if (meta) {
        swarmMetaMap.set(item.conversationId, meta);
      }
    }
  }

  // Pass 1: Parse modified transcripts.
  const parsedMap = new Map<string, ParsedTranscript>();
  for (const item of toProcess) {
    try {
      const parsed = await parseTranscriptFile(
        item.transcriptPath,
        item.conversationId
      );
      parsedMap.set(item.conversationId, parsed);
    } catch {
      // Skip transient parse errors gracefully.
    }
  }

  // Merge newly discovered subagent & swarm links with already-stored links in DB.
  const subagentLinks = db.getSubagentLinkMap();
  for (const [convId, parsed] of parsedMap.entries()) {
    for (const tc of parsed.toolCalls) {
      const links =
        tc.childLinks && tc.childLinks.length > 0
          ? tc.childLinks
          : tc.childConversationId
            ? [{ conversationId: tc.childConversationId, role: null, typeName: null }]
            : [];
      if (links.length === 0) continue;

      const roleMatch = tc.argsPreview.match(/Role:\s*([^|]+)/i);
      const typeMatch = tc.argsPreview.match(/Type:\s*([^|]+)/i);
      const fallbackRole = roleMatch ? roleMatch[1].trim() : null;
      const fallbackType = typeMatch ? typeMatch[1].trim() : null;

      for (const link of links) {
        subagentLinks.set(link.conversationId, {
          parentConversationId: convId,
          role: link.role ?? fallbackRole,
          typeName: link.typeName ?? fallbackType
        });
      }
    }
  }

  for (const [convId, swarmMeta] of swarmMetaMap.entries()) {
    for (const link of swarmMeta.rosterLinks) {
      const existing = subagentLinks.get(link.conversationId);
      if (!existing) {
        subagentLinks.set(link.conversationId, {
          parentConversationId: convId,
          role: link.role,
          typeName: "swarm"
        });
      } else if (!existing.role && link.role) {
        subagentLinks.set(link.conversationId, {
          ...existing,
          role: link.role,
          typeName: existing.typeName ?? "swarm"
        });
      }
    }
  }

  const swarmParentsSet = new Set<string>();
  for (const link of subagentLinks.values()) {
    if (link.typeName === "swarm") {
      swarmParentsSet.add(link.parentConversationId);
    }
  }

  // Sort toProcess so parents are analyzed and persisted before their subagents/workers.
  toProcess.sort((a, b) => {
    const aIsChild = subagentLinks.has(a.conversationId) ? 1 : 0;
    const bIsChild = subagentLinks.has(b.conversationId) ? 1 : 0;
    return aIsChild - bIsChild;
  });

  let indexedCount = 0;
  for (const item of toProcess) {
    const parsed = parsedMap.get(item.conversationId);
    if (!parsed) continue;
    try {
      const hookEvents = db.getHookEventsForConversation(item.conversationId);
      const meta = resolveProject(
        item.conversationId,
        parsed,
        hookEvents,
        db,
        subagentLinks
      );
      const swarmMeta = swarmMetaMap.get(item.conversationId);
      const isSwarmChild = meta.subagentType === "swarm";
      const swarmRole: SwarmRole | null = isSwarmChild
        ? "worker"
        : parsed.detectedSwarmRole === "worker"
          ? "worker"
          : swarmMeta?.hasPlan ||
              swarmParentsSet.has(item.conversationId) ||
              parsed.detectedSwarmRole === "coordinator"
            ? "coordinator"
            : null;
      const swarmTitle = parsed.swarmTitle || swarmMeta?.planTitle || null;
      const swarmTasks =
        swarmMeta?.tasks && Object.keys(swarmMeta.tasks).length > 0
          ? swarmMeta.tasks
          : undefined;

      const analyzed = analyzeConversation(parsed, hookEvents, {
        surface: item.surface,
        ...meta,
        swarmRole,
        swarmTitle,
        swarmTasks
      });
      db.upsertConversation(analyzed);
      db.upsertIndexedFile({
        path: item.transcriptPath,
        fileSize: item.size,
        mtimeMs: item.mtimeMs,
        lastOffset: item.size,
        updatedAtMs: Date.now()
      });
      indexedCount += 1;
    } catch (err) {
      process.stderr.write(
        `[flight-recorder] skip conversation ${item.conversationId}: ${err instanceof Error ? err.message : String(err)}\n`
      );
    }
  }

  // Pass 2: If any existing child subagent/worker in DB now has a newly discovered parent link
  // or its parent gained a project path, propagate parent linkage cleanly.
  for (const [childId, link] of subagentLinks.entries()) {
    const childRow = db.getConversationRecord(childId);
    const parentRow = db.getConversationRecord(link.parentConversationId);
    if (!childRow || !parentRow) continue;

    const needsLinkUpdate =
      childRow.parentConversationId !== link.parentConversationId ||
      childRow.subagentRole !== link.role ||
      childRow.subagentType !== link.typeName;

    const needsProjectInherit =
      childRow.projectSource !== "manual" &&
      parentRow.projectPath !== "Unassigned" &&
      childRow.projectPath !== parentRow.projectPath;

    const needsTitleUpdate =
      (childRow.title === childId.slice(0, 8) || !childRow.title) &&
      Boolean(link.role || link.typeName);

    const needsSwarmWorkerRole =
      link.typeName === "swarm" && childRow.swarmRole !== "worker";

    if (needsLinkUpdate || needsProjectInherit || needsTitleUpdate || needsSwarmWorkerRole) {
      db.db
        .prepare(`
          UPDATE conversations
          SET parent_conversation_id = ?,
              subagent_role = COALESCE(?, subagent_role),
              subagent_type = COALESCE(?, subagent_type),
              swarm_role = CASE WHEN ? = 'swarm' THEN 'worker' ELSE swarm_role END,
              title = CASE WHEN title = ? OR title = '' THEN COALESCE(?, ?, title) ELSE title END,
              project_path = CASE WHEN project_source != 'manual' AND ? != 'Unassigned' THEN ? ELSE project_path END,
              project_source = CASE WHEN project_source != 'manual' AND ? != 'Unassigned' THEN 'parent' ELSE project_source END
          WHERE conversation_id = ?
        `)
        .run(
          link.parentConversationId,
          link.role,
          link.typeName,
          link.typeName ?? "",
          childId.slice(0, 8),
          link.role,
          link.typeName,
          parentRow.projectPath,
          parentRow.projectPath,
          parentRow.projectPath,
          childId
        );
    }

    if (link.typeName === "swarm" && !parentRow.swarmRole) {
      db.db
        .prepare("UPDATE conversations SET swarm_role = 'coordinator' WHERE conversation_id = ?")
        .run(parentRow.conversationId);
    }
  }

  return {
    hookEventsIngested: hookResult.ingestedCount,
    transcriptsDiscovered: discovered.length,
    transcriptsIndexed: indexedCount,
    transcriptsSkipped: skipped
  };
}
