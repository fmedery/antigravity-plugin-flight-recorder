import fs from "node:fs";
import path from "node:path";
import type { UpdateCheckResult } from "../shared/types.js";
import {
  buildGitPullCommand,
  compareSemver,
  parseSemver
} from "../shared/updateCheck.js";

declare const __FLIGHT_RECORDER_VERSION__: string | undefined;

export const FALLBACK_PLUGIN_VERSION =
  typeof __FLIGHT_RECORDER_VERSION__ !== "undefined"
    ? __FLIGHT_RECORDER_VERSION__
    : "0.2.0";

export const REMOTE_MANIFEST_URL =
  "https://raw.githubusercontent.com/fmedery/antigravity-plugin-flight-recorder/main/plugin.json";

export const REPO_URL =
  "https://github.com/fmedery/antigravity-plugin-flight-recorder";

const MAX_MANIFEST_BYTES = 65_536;
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_CACHE_TTL_MS = 30_000;

interface CachedCheck {
  expiresAtMs: number;
  result: UpdateCheckResult;
}

const checkCache = new Map<string, CachedCheck>();

export function readInstalledVersion(pluginRoot?: string | null): string {
  if (!pluginRoot) return FALLBACK_PLUGIN_VERSION;
  try {
    const manifestPath = path.join(pluginRoot, "plugin.json");
    if (!fs.existsSync(manifestPath)) return FALLBACK_PLUGIN_VERSION;
    const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
      version?: unknown;
    };
    if (typeof raw.version === "string" && parseSemver(raw.version)) {
      return raw.version.trim().replace(/^v/i, "");
    }
  } catch {
    // Fall back to build-time version if plugin.json is missing or unreadable.
  }
  return FALLBACK_PLUGIN_VERSION;
}

export function detectInstallMethod(
  pluginRoot?: string | null
): "git" | "zip" {
  if (!pluginRoot) return "zip";
  try {
    return fs.existsSync(path.join(pluginRoot, ".git")) ? "git" : "zip";
  } catch {
    return "zip";
  }
}

export interface CheckForUpdateOptions {
  pluginRoot?: string | null;
  platform?: NodeJS.Platform;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  cacheTtlMs?: number;
  nowMs?: number;
}

export async function checkForUpdate(
  opts: CheckForUpdateOptions = {}
): Promise<UpdateCheckResult> {
  const pluginRoot = opts.pluginRoot ?? null;
  const platform = opts.platform ?? process.platform;
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const cacheTtlMs = opts.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const nowMs = opts.nowMs ?? Date.now();

  const useCache = cacheTtlMs > 0 && fetchImpl === globalThis.fetch;
  const cacheKey = `${pluginRoot ?? ""}::${platform}`;
  if (useCache) {
    const cached = checkCache.get(cacheKey);
    if (cached && nowMs < cached.expiresAtMs) {
      return cached.result;
    }
  }

  const currentVersion = readInstalledVersion(pluginRoot);
  const installMethod = detectInstallMethod(pluginRoot);
  const updateCommand =
    installMethod === "git" && pluginRoot
      ? buildGitPullCommand(pluginRoot, platform)
      : null;

  const baseResult = {
    currentVersion,
    installMethod,
    pluginRoot,
    updateCommand,
    repoUrl: REPO_URL,
    checkedAtMs: nowMs
  };

  try {
    const res = await fetchImpl(REMOTE_MANIFEST_URL, {
      headers: {
        "User-Agent": "flight-recorder",
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!res.ok) {
      return {
        ...baseResult,
        status: "error",
        latestVersion: null,
        message: `GitHub returned HTTP ${res.status}.`
      };
    }

    const contentLength = Number(res.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_MANIFEST_BYTES) {
      return {
        ...baseResult,
        status: "error",
        latestVersion: null,
        message: "Remote manifest exceeded expected size."
      };
    }

    const rawText = await res.text();
    if (Buffer.byteLength(rawText, "utf8") > MAX_MANIFEST_BYTES) {
      return {
        ...baseResult,
        status: "error",
        latestVersion: null,
        message: "Remote manifest exceeded expected size."
      };
    }

    let parsed: { name?: unknown; version?: unknown };
    try {
      parsed = JSON.parse(rawText) as { name?: unknown; version?: unknown };
    } catch {
      return {
        ...baseResult,
        status: "error",
        latestVersion: null,
        message: "Remote manifest did not contain a valid version."
      };
    }

    if (
      parsed.name !== "flight-recorder" ||
      typeof parsed.version !== "string" ||
      !parseSemver(parsed.version)
    ) {
      return {
        ...baseResult,
        status: "error",
        latestVersion: null,
        message: "Remote manifest did not contain a valid version."
      };
    }

    const latestVersion = parsed.version.trim().replace(/^v/i, "");
    const cmp = compareSemver(currentVersion, latestVersion);
    if (cmp === null) {
      return {
        ...baseResult,
        status: "error",
        latestVersion: null,
        message: "Unable to compare installed and remote versions."
      };
    }

    const result: UpdateCheckResult = {
      ...baseResult,
      status: cmp < 0 ? "update_available" : "up_to_date",
      latestVersion
    };

    if (useCache) {
      checkCache.set(cacheKey, {
        expiresAtMs: nowMs + cacheTtlMs,
        result
      });
    }

    return result;
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    const message =
      name === "TimeoutError" || name === "AbortError"
        ? "Request timed out."
        : "Could not reach GitHub (offline or blocked).";
    return {
      ...baseResult,
      status: "error",
      latestVersion: null,
      message
    };
  }
}
