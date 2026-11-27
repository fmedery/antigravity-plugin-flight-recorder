import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const UNEXPANDED_TEMPLATE_RE = /\$\{[A-Za-z0-9_.:-]+\}/;

export function isValidExpandedPath(raw?: string | null): raw is string {
  if (typeof raw !== "string") return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (UNEXPANDED_TEMPLATE_RE.test(trimmed)) return false;
  return true;
}

export interface ResolveDataDirOptions {
  argv?: string[];
  env?: NodeJS.ProcessEnv;
  pluginRoot?: string | null;
  homeDir?: string;
  /**
   * When true (used by the bundled UI sidecar), checks whether an existing plugin data
   * directory (from MCP server / hooks) already holds tracker.sqlite or events.jsonl
   * before falling back to ANTIGRAVITY_EXECUTABLE_DATA_DIR so all components share one DB.
   */
  preferSharedPluginData?: boolean;
}

function parseCliDataDir(argv: string[]): string | null {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--data-dir=")) {
      const val = arg.slice("--data-dir=".length).trim();
      if (isValidExpandedPath(val)) return val;
    } else if (arg === "--data-dir" && argv[i + 1]) {
      const val = argv[i + 1].trim();
      if (isValidExpandedPath(val)) return val;
    }
  }
  return null;
}

function deriveAppDataRootFromSidecarDir(sidecarDataDir: string): string | null {
  const norm = sidecarDataDir.replace(/\\/g, "/");
  const idx = norm.lastIndexOf("/sidecar_data/");
  if (idx <= 0) return null;
  return sidecarDataDir.slice(0, idx);
}

function newestTelemetryMtimeMs(dirPath: string): number {
  let newest = 0;
  for (const filename of ["tracker.sqlite", "events.jsonl"]) {
    const filePath = path.join(dirPath, filename);
    try {
      if (!fs.existsSync(filePath)) continue;
      const st = fs.statSync(filePath);
      if (st.isFile() && st.mtimeMs > newest) {
        newest = st.mtimeMs;
      }
    } catch {
      // Ignore unreadable candidate paths
    }
  }
  return newest;
}

function directoryExists(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function discoverSharedPluginDataDir(opts: {
  env: NodeJS.ProcessEnv;
  pluginRoot?: string | null;
  homeDir: string;
}): string | null {
  const pluginDirNames = new Set<string>(["flight-recorder"]);
  if (opts.pluginRoot) {
    const base = path.basename(opts.pluginRoot).trim();
    if (base) pluginDirNames.add(base);
  }

  const pluginDataCandidates: string[] = [];
  const sidecarExecDir = opts.env.ANTIGRAVITY_EXECUTABLE_DATA_DIR;
  if (isValidExpandedPath(sidecarExecDir)) {
    const appDataRoot = deriveAppDataRootFromSidecarDir(sidecarExecDir);
    if (appDataRoot) {
      for (const name of pluginDirNames) {
        pluginDataCandidates.push(path.join(appDataRoot, "plugin_data", name));
      }
    }
  }

  for (const name of pluginDirNames) {
    pluginDataCandidates.push(
      path.join(opts.homeDir, ".gemini", "antigravity", "plugin_data", name)
    );
  }

  const fallbackSharedDir = path.join(opts.homeDir, ".gemini", "flight-recorder-data");
  const allCandidates = Array.from(
    new Set([...pluginDataCandidates, fallbackSharedDir])
  );

  let bestDir: string | null = null;
  let bestMtime = 0;
  for (const candidate of allCandidates) {
    const mtime = newestTelemetryMtimeMs(candidate);
    if (mtime > bestMtime) {
      bestMtime = mtime;
      bestDir = candidate;
    }
  }
  if (bestDir) return bestDir;

  // If no SQLite/JSONL file exists yet, prefer an existing Antigravity plugin_data dir
  // so subsequent MCP server & hook writes automatically land in the same store.
  for (const candidate of Array.from(new Set(pluginDataCandidates))) {
    if (directoryExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function resolveDataDir(options: ResolveDataDirOptions = {}): string {
  const argv = options.argv ?? [];
  const env = options.env ?? process.env;
  const homeDir = options.homeDir ?? os.homedir();

  const cliDir = parseCliDataDir(argv);
  if (cliDir) return cliDir;

  if (isValidExpandedPath(env.FLIGHT_RECORDER_DATA_DIR)) {
    return env.FLIGHT_RECORDER_DATA_DIR.trim();
  }

  if (isValidExpandedPath(env.PLUGIN_DATA)) {
    return env.PLUGIN_DATA.trim();
  }

  if (options.preferSharedPluginData) {
    const shared = discoverSharedPluginDataDir({
      env,
      pluginRoot: options.pluginRoot,
      homeDir
    });
    if (shared) return shared;

    if (isValidExpandedPath(env.ANTIGRAVITY_EXECUTABLE_DATA_DIR)) {
      return env.ANTIGRAVITY_EXECUTABLE_DATA_DIR.trim();
    }
  }

  return path.join(homeDir, ".gemini", "flight-recorder-data");
}
