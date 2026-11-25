export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

const SEMVER_RE =
  /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/i;

export function parseSemver(raw: string): ParsedSemver | null {
  const match = SEMVER_RE.exec(raw.trim());
  if (!match) return null;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  if (
    !Number.isSafeInteger(major) ||
    !Number.isSafeInteger(minor) ||
    !Number.isSafeInteger(patch)
  ) {
    return null;
  }
  return {
    major,
    minor,
    patch,
    prerelease: match[4] ?? null
  };
}

function comparePrerelease(a: string, b: string): number {
  const aParts = a.split(".");
  const bParts = b.split(".");
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    const ap = aParts[i];
    const bp = bParts[i];
    if (ap === undefined) return -1;
    if (bp === undefined) return 1;
    if (ap === bp) continue;

    const aNum = /^\d+$/.test(ap);
    const bNum = /^\d+$/.test(bp);
    if (aNum && bNum) {
      const diff = Number(ap) - Number(bp);
      if (diff !== 0) return diff < 0 ? -1 : 1;
    } else if (aNum !== bNum) {
      // Numeric identifiers always have lower precedence than non-numeric.
      return aNum ? -1 : 1;
    } else {
      return ap < bp ? -1 : 1;
    }
  }
  return 0;
}

/**
 * Compare two semver strings. Returns -1 if a < b, 0 if equal, 1 if a > b, or null if invalid.
 */
export function compareSemver(a: string, b: string): number | null {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return null;

  if (pa.major !== pb.major) return pa.major < pb.major ? -1 : 1;
  if (pa.minor !== pb.minor) return pa.minor < pb.minor ? -1 : 1;
  if (pa.patch !== pb.patch) return pa.patch < pb.patch ? -1 : 1;

  if (pa.prerelease === pb.prerelease) return 0;
  if (pa.prerelease === null) return 1;
  if (pb.prerelease === null) return -1;
  return comparePrerelease(pa.prerelease, pb.prerelease);
}

export function buildGitPullCommand(
  pluginRoot: string,
  platform: NodeJS.Platform = process.platform
): string {
  if (platform === "win32") {
    return `git -C "${pluginRoot.replace(/"/g, '\\"')}" pull`;
  }
  if (/^[a-zA-Z0-9._/~-]+$/.test(pluginRoot)) {
    return `git -C ${pluginRoot} pull`;
  }
  return `git -C '${pluginRoot.replace(/'/g, "'\\''")}' pull`;
}
