import fs from "node:fs";
import path from "node:path";

export const STRICT_SEMVER_RE =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export const PLUGIN_NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function parseStrictSemver(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  const match = STRICT_SEMVER_RE.exec(trimmed);
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
    prerelease: match[4] ?? null,
    normalized: trimmed
  };
}

function comparePrerelease(a, b) {
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
      return aNum ? -1 : 1;
    } else {
      return ap < bp ? -1 : 1;
    }
  }
  return 0;
}

export function compareStrictSemver(a, b) {
  const pa = parseStrictSemver(a);
  const pb = parseStrictSemver(b);
  if (!pa || !pb) return null;

  if (pa.major !== pb.major) return pa.major < pb.major ? -1 : 1;
  if (pa.minor !== pb.minor) return pa.minor < pb.minor ? -1 : 1;
  if (pa.patch !== pb.patch) return pa.patch < pb.patch ? -1 : 1;

  if (pa.prerelease === pb.prerelease) return 0;
  if (pa.prerelease === null) return 1;
  if (pb.prerelease === null) return -1;
  return comparePrerelease(pa.prerelease, pb.prerelease);
}

export function computeNextVersion(currentRaw, bumpSpec, preid = "rc") {
  const current = parseStrictSemver(currentRaw);
  if (!current) {
    throw new Error(`Invalid current version "${currentRaw}" (expected X.Y.Z or X.Y.Z-pre.N)`);
  }

  const safePreid = /^[0-9A-Za-z-]+$/.test(preid) ? preid : "rc";
  const spec = String(bumpSpec ?? "").trim();

  if (spec === "major") {
    return `${current.major + 1}.0.0`;
  }
  if (spec === "minor") {
    return `${current.major}.${current.minor + 1}.0`;
  }
  if (spec === "patch") {
    if (current.prerelease !== null) {
      return `${current.major}.${current.minor}.${current.patch}`;
    }
    return `${current.major}.${current.minor}.${current.patch + 1}`;
  }
  if (spec === "premajor") {
    return `${current.major + 1}.0.0-${safePreid}.1`;
  }
  if (spec === "preminor") {
    return `${current.major}.${current.minor + 1}.0-${safePreid}.1`;
  }
  if (spec === "prepatch") {
    return `${current.major}.${current.minor}.${current.patch + 1}-${safePreid}.1`;
  }
  if (spec === "prerelease") {
    if (current.prerelease !== null) {
      const parts = current.prerelease.split(".");
      const last = parts[parts.length - 1];
      if (/^\d+$/.test(last)) {
        parts[parts.length - 1] = String(Number(last) + 1);
        return `${current.major}.${current.minor}.${current.patch}-${parts.join(".")}`;
      }
      return `${current.major}.${current.minor}.${current.patch}-${current.prerelease}.1`;
    }
    return `${current.major}.${current.minor}.${current.patch + 1}-${safePreid}.1`;
  }

  const cleaned = spec.replace(/^v/i, "");
  const explicit = parseStrictSemver(cleaned);
  if (explicit) {
    return explicit.normalized;
  }

  throw new Error(
    `Invalid version or bump keyword "${bumpSpec}". Use patch, minor, major, prepatch, preminor, premajor, prerelease, or X.Y.Z[-pre.N].`
  );
}

/**
 * Reads and strictly validates the plugin version from plugin.json (single source of truth).
 * Throws instead of falling back so builds never emit stale versions silently.
 */
export function readPluginVersion(repoRoot) {
  const manifestPath = path.join(repoRoot, "plugin.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing plugin.json at ${manifestPath}`);
  }
  const manifest = readJsonFile(manifestPath);
  const parsed = parseStrictSemver(manifest.version);
  if (!parsed) {
    throw new Error(
      `Invalid or missing "version" in ${manifestPath}: ${JSON.stringify(manifest.version)} (expected strict SemVer X.Y.Z or X.Y.Z-pre.N)`
    );
  }
  return parsed.normalized;
}

export function verifyVersionConsistency(
  repoRoot,
  { checkDist = true, expectedTag = null } = {}
) {
  const errors = [];
  const pluginPath = path.join(repoRoot, "plugin.json");
  const packagePath = path.join(repoRoot, "package.json");
  const lockPath = path.join(repoRoot, "package-lock.json");

  if (!fs.existsSync(pluginPath)) {
    return { ok: false, version: null, errors: [`Missing ${pluginPath}`] };
  }

  const pluginJson = readJsonFile(pluginPath);
  const parsedPluginVersion = parseStrictSemver(pluginJson.version);
  if (!parsedPluginVersion) {
    errors.push(
      `plugin.json version "${pluginJson.version}" is not valid strict SemVer (X.Y.Z or X.Y.Z-pre.N).`
    );
  }
  const version = parsedPluginVersion?.normalized ?? null;

  if (typeof pluginJson.name !== "string" || !PLUGIN_NAME_RE.test(pluginJson.name)) {
    errors.push(
      `plugin.json name "${pluginJson.name}" must be lowercase kebab-case.`
    );
  }

  if (!fs.existsSync(packagePath)) {
    errors.push(`Missing ${packagePath}`);
  } else {
    const pkgJson = readJsonFile(packagePath);
    if (version && pkgJson.version !== version) {
      errors.push(
        `package.json version "${pkgJson.version}" does not match plugin.json version "${version}".`
      );
    }
    if (typeof pluginJson.name === "string" && pkgJson.name !== pluginJson.name) {
      errors.push(
        `package.json name "${pkgJson.name}" does not match plugin.json name "${pluginJson.name}".`
      );
    }
  }

  if (fs.existsSync(lockPath)) {
    const lockJson = readJsonFile(lockPath);
    if (version && lockJson.version !== version) {
      errors.push(
        `package-lock.json root version "${lockJson.version}" does not match plugin.json version "${version}".`
      );
    }
    if (typeof pluginJson.name === "string" && lockJson.name !== pluginJson.name) {
      errors.push(
        `package-lock.json root name "${lockJson.name}" does not match plugin.json name "${pluginJson.name}".`
      );
    }
    const rootPkg =
      lockJson.packages && typeof lockJson.packages === "object"
        ? lockJson.packages[""]
        : null;
    if (rootPkg) {
      if (version && rootPkg.version !== version) {
        errors.push(
          `package-lock.json packages[""].version "${rootPkg.version}" does not match plugin.json version "${version}".`
        );
      }
      if (typeof pluginJson.name === "string" && rootPkg.name !== pluginJson.name) {
        errors.push(
          `package-lock.json packages[""].name "${rootPkg.name}" does not match plugin.json name "${pluginJson.name}".`
        );
      }
    }
  }

  if (checkDist && version) {
    const serverBundlePath = path.join(repoRoot, "dist", "server", "index.js");
    const uiBundlePath = path.join(repoRoot, "dist", "ui", "index.html");

    if (!fs.existsSync(serverBundlePath)) {
      errors.push(`Missing built server bundle: ${serverBundlePath}`);
    } else {
      const serverCode = fs.readFileSync(serverBundlePath, "utf8");
      const expectedBanner = `/* flight-recorder v${version} */`;
      if (!serverCode.includes(expectedBanner)) {
        errors.push(
          `dist/server/index.js is missing exact build version header "${expectedBanner}". Run "npm run build".`
        );
      }
    }

    if (!fs.existsSync(uiBundlePath)) {
      errors.push(`Missing built UI bundle: ${uiBundlePath}`);
    } else {
      const uiHtml = fs.readFileSync(uiBundlePath, "utf8");
      const expectedMeta = `<meta name="flight-recorder-version" content="${version}"`;
      if (!uiHtml.includes(expectedMeta)) {
        errors.push(
          `dist/ui/index.html is missing exact build version meta tag (${expectedMeta}). Run "npm run build".`
        );
      }
    }
  }

  if (expectedTag !== null && expectedTag !== undefined && String(expectedTag).trim() !== "") {
    const rawTag = String(expectedTag).trim();
    if (!rawTag.startsWith("v")) {
      errors.push(`Release tag "${rawTag}" must start with "v" (expected "v${version}").`);
    } else if (version && rawTag !== `v${version}`) {
      errors.push(
        `Release tag "${rawTag}" does not match plugin.json version "v${version}".`
      );
    }
  }

  return {
    ok: errors.length === 0,
    version,
    errors
  };
}
