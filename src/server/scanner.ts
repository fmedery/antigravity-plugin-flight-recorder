import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  isAbsoluteLocalPath,
  isWindowsPath,
  pathDirName,
  pathExtName,
  pathJoin,
  unwrapFileUri
} from "../shared/paths.js";
import type { ProjectSource, SurfaceType } from "../shared/types.js";
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
  surface: SurfaceType;
  size: number;
  mtimeMs: number;
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
  homeDir?: string;
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
          if (marker === ".git") return dir;
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
              surface: root.surface,
              size: st.size,
              mtimeMs: st.mtimeMs
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
      byConv.set(hk.conversationId, {
        conversationId: hk.conversationId,
        transcriptPath: candidate,
        surface: inferSurfaceFromPath(candidate),
        size: st.size,
        mtimeMs: st.mtimeMs
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

  // 2. Authoritative hook workspacePaths / cwd
  for (const ev of hookEvents) {
    for (const wp of ev.workspacePaths) {
      if (wp && !isIgnoredSystemPath(wp)) {
        return {
          projectPath: wp,
          projectSource: "hook",
          parentConversationId,
          subagentRole,
          subagentType
        };
      }
    }
    if (ev.cwd && !isIgnoredSystemPath(ev.cwd)) {
      return {
        projectPath: ev.cwd,
        projectSource: "hook",
        parentConversationId,
        subagentRole,
        subagentType
      };
    }
  }

  // 3. Parent conversation's resolved project
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
      Math.abs(indexed.mtimeMs - item.mtimeMs) < 1;

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

  // Merge newly discovered subagent links with already-stored links in DB.
  const subagentLinks = db.getSubagentLinkMap();
  for (const [convId, parsed] of parsedMap.entries()) {
    for (const tc of parsed.toolCalls) {
      if (tc.childConversationId) {
        const roleMatch = tc.argsPreview.match(/Role:\s*([^|]+)/i);
        const typeMatch = tc.argsPreview.match(/Type:\s*([^|]+)/i);
        subagentLinks.set(tc.childConversationId, {
          parentConversationId: convId,
          role: roleMatch ? roleMatch[1].trim() : null,
          typeName: typeMatch ? typeMatch[1].trim() : null
        });
      }
    }
  }

  // Sort toProcess so parents are analyzed and persisted before their subagents.
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

      const analyzed = analyzeConversation(parsed, hookEvents, {
        surface: item.surface,
        ...meta
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

  // Pass 2: If any existing child subagent in DB now has a newly discovered parent link
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
      (childRow.projectSource === "unassigned" || childRow.projectSource === "parent") &&
      parentRow.projectPath !== "Unassigned" &&
      childRow.projectPath !== parentRow.projectPath;

    const needsTitleUpdate =
      (childRow.title === childId.slice(0, 8) || !childRow.title) &&
      Boolean(link.role || link.typeName);

    if (needsLinkUpdate || needsProjectInherit || needsTitleUpdate) {
      db.db
        .prepare(`
          UPDATE conversations
          SET parent_conversation_id = ?,
              subagent_role = COALESCE(?, subagent_role),
              subagent_type = COALESCE(?, subagent_type),
              title = CASE WHEN title = ? OR title = '' THEN COALESCE(?, ?, title) ELSE title END,
              project_path = CASE WHEN project_source IN ('unassigned', 'parent') AND ? != 'Unassigned' THEN ? ELSE project_path END,
              project_source = CASE WHEN project_source IN ('unassigned', 'parent') AND ? != 'Unassigned' THEN 'parent' ELSE project_source END
          WHERE conversation_id = ?
        `)
        .run(
          link.parentConversationId,
          link.role,
          link.typeName,
          childId.slice(0, 8),
          link.role,
          link.typeName,
          parentRow.projectPath,
          parentRow.projectPath,
          parentRow.projectPath,
          childId
        );
    }
  }

  return {
    hookEventsIngested: hookResult.ingestedCount,
    transcriptsDiscovered: discovered.length,
    transcriptsIndexed: indexedCount,
    transcriptsSkipped: skipped
  };
}
