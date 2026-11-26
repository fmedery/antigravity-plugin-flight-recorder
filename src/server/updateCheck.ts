import fs from "node:fs";
import path from "node:path";
import type { PluginInstallMethod, UpdateCheckResult } from "../shared/types.js";
import {
  buildGitPullCommand,
  compareSemver,
  parseSemver
} from "../shared/updateCheck.js";

declare const __FLIGHT_RECORDER_VERSION__: string | undefined;

export const FALLBACK_PLUGIN_VERSION =
  typeof __FLIGHT_RECORDER_VERSION__ !== "undefined"
    ? __FLIGHT_RECORDER_VERSION__
    : "0.0.0-dev";

export const REPO_URL =
  "https://github.com/fmedery/antigravity-plugin-flight-recorder";

export const REMOTE_RELEASE_URL =
  "https://api.github.com/repos/fmedery/antigravity-plugin-flight-recorder/releases/latest";

export const REMOTE_MANIFEST_URL =
  "https://raw.githubusercontent.com/fmedery/antigravity-plugin-flight-recorder/main/plugin.json";

const MAX_RESPONSE_BYTES = 131_072;
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
): PluginInstallMethod {
  if (!pluginRoot) return "zip";
  try {
    if (fs.existsSync(path.join(pluginRoot, ".git"))) {
      return "git";
    }

    const dirName = path.basename(pluginRoot);
    if (/^-?\d{10,}$/.test(dirName)) {
      return "marketplace";
    }

    for (const marker of [
      ".marketplace",
      ".antigravity-marketplace",
      "install_metadata.json"
    ]) {
      if (fs.existsSync(path.join(pluginRoot, marker))) {
        return "marketplace";
      }
    }

    const manifestPath = path.join(pluginRoot, "plugin.json");
    if (fs.existsSync(manifestPath)) {
      const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
        source?: unknown;
      };
      if (
        typeof raw.source === "string" &&
        /(?:marketplace|antigravity-plugins-)/i.test(raw.source)
      ) {
        return "marketplace";
      }
    }

    return "zip";
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

async function readBoundedJson(
  res: Response
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const contentLength = Number(res.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
    return { ok: false, message: "Remote manifest exceeded expected size." };
  }

  const rawText = await res.text();
  if (Buffer.byteLength(rawText, "utf8") > MAX_RESPONSE_BYTES) {
    return { ok: false, message: "Remote manifest exceeded expected size." };
  }

  try {
    const parsed = JSON.parse(rawText) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, message: "Remote manifest did not contain a valid version." };
    }
    return { ok: true, data: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, message: "Remote manifest did not contain a valid version." };
  }
}

function sanitizeReleaseUrl(candidate: unknown, tagName: string): string {
  if (typeof candidate === "string" && candidate.startsWith(`${REPO_URL}/`)) {
    return candidate;
  }
  return `${REPO_URL}/releases/tag/${encodeURIComponent(tagName)}`;
}

async function fetchLatestVersionInfo(
  fetchImpl: typeof fetch,
  timeoutMs: number
): Promise<
  | {
      ok: true;
      latestVersion: string;
      releaseUrl: string;
      source: "github_release" | "manifest";
    }
  | { ok: false; message: string }
> {
  // 1. Primary: GitHub Releases API (only published, non-draft, non-prerelease tags).
  const relRes = await fetchImpl(REMOTE_RELEASE_URL, {
    headers: {
      "User-Agent": "flight-recorder",
      Accept: "application/vnd.github+json"
    },
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (relRes.ok) {
    const body = await readBoundedJson(relRes);
    if (!body.ok) return body;
    const d = body.data;

    if (
      typeof d.tag_name === "string" &&
      d.draft !== true &&
      d.prerelease !== true &&
      parseSemver(d.tag_name)
    ) {
      const cleanTag = d.tag_name.trim();
      return {
        ok: true,
        latestVersion: cleanTag.replace(/^v/i, ""),
        releaseUrl: sanitizeReleaseUrl(d.html_url, cleanTag),
        source: "github_release"
      };
    }

    return { ok: false, message: "Remote release did not contain a valid version." };
  }

  // 2. Fallback: raw main/plugin.json when no GitHub Release exists yet (404) or API is rate-limited (403/429).
  if (relRes.status === 404 || relRes.status === 403 || relRes.status === 429) {
    const manRes = await fetchImpl(REMOTE_MANIFEST_URL, {
      headers: {
        "User-Agent": "flight-recorder",
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!manRes.ok) {
      return { ok: false, message: `GitHub returned HTTP ${manRes.status}.` };
    }

    const body = await readBoundedJson(manRes);
    if (!body.ok) return body;
    const d = body.data;

    if (
      d.name !== "flight-recorder" ||
      typeof d.version !== "string" ||
      !parseSemver(d.version)
    ) {
      return {
        ok: false,
        message: "Remote manifest did not contain a valid version."
      };
    }

    return {
      ok: true,
      latestVersion: d.version.trim().replace(/^v/i, ""),
      releaseUrl: REPO_URL,
      source: "manifest"
    };
  }

  return { ok: false, message: `GitHub returned HTTP ${relRes.status}.` };
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
    const fetched = await fetchLatestVersionInfo(fetchImpl, timeoutMs);
    if (!fetched.ok) {
      return {
        ...baseResult,
        status: "error",
        latestVersion: null,
        message: fetched.message
      };
    }

    const cmp = compareSemver(currentVersion, fetched.latestVersion);
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
      latestVersion: fetched.latestVersion,
      releaseUrl: fetched.releaseUrl,
      source: fetched.source
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
