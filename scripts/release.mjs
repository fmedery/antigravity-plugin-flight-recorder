import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { extractChangelogSection } from "./extract-changelog.mjs";
import {
  compareStrictSemver,
  computeNextVersion,
  readJsonFile,
  readPluginVersion,
  verifyVersionConsistency,
  writeJsonFile
} from "./version-utils.mjs";

const REPO_URL = "https://github.com/fmedery/antigravity-plugin-flight-recorder";

function runCmd(cmd, args, cwd, { capture = false, allowFail = false } = {}) {
  const res = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    shell: process.platform === "win32" && (cmd === "npm" || cmd === "agy")
  });
  if (res.error) {
    if (allowFail) return { status: 1, stdout: "", stderr: res.error.message };
    throw res.error;
  }
  if (res.status !== 0 && !allowFail) {
    const detail = capture ? `\n${res.stderr || res.stdout}` : "";
    throw new Error(`Command failed (${res.status}): ${cmd} ${args.join(" ")}${detail}`);
  }
  return {
    status: res.status ?? 1,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? ""
  };
}

function getLatestVersionTag(cwd) {
  const res = runCmd(
    "git",
    ["tag", "--list", "v*", "--sort=-v:refname"],
    cwd,
    { capture: true, allowFail: true }
  );
  if (res.status !== 0) return null;
  const tags = res.stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return tags[0] ?? null;
}

function getCommitRangeStart(cwd, latestTag) {
  if (latestTag) return latestTag;
  const res = runCmd(
    "git",
    ["log", "-n", "1", "--format=%H", "--", "plugin.json"],
    cwd,
    { capture: true, allowFail: true }
  );
  if (res.status === 0 && res.stdout.trim()) {
    return res.stdout.trim();
  }
  return null;
}

export function categorizeCommits(subjects) {
  const groups = {
    Added: [],
    Fixed: [],
    Security: [],
    Changed: [],
    Documentation: [],
    Maintenance: []
  };

  for (const raw of subjects) {
    const line = raw.trim();
    if (!line) continue;
    if (/^chore\(release\):/i.test(line)) continue;

    const ccMatch = /^([a-z]+)(?:\(([^)]+)\))?(!)?:\s+(.+)$/i.exec(line);
    if (!ccMatch) {
      groups.Changed.push(line);
      continue;
    }

    const type = ccMatch[1].toLowerCase();
    const scope = ccMatch[2] ? `**${ccMatch[2]}:** ` : "";
    const breaking = ccMatch[3] ? "**BREAKING:** " : "";
    const msg = `${breaking}${scope}${ccMatch[4]}`;

    if (type === "feat") groups.Added.push(msg);
    else if (type === "fix") groups.Fixed.push(msg);
    else if (type === "security") groups.Security.push(msg);
    else if (type === "docs") groups.Documentation.push(msg);
    else if (type === "refactor" || type === "perf") groups.Changed.push(msg);
    else groups.Maintenance.push(msg);
  }

  return groups;
}

export function formatChangelogEntry(version, dateStr, groups, existingUnreleasedBody = "") {
  const lines = [`## [${version}] - ${dateStr}`, ""];
  const cleanedManual = existingUnreleasedBody
    .replace(/\r\n/g, "\n")
    .trim();

  if (cleanedManual && !/^_No unreleased changes yet\._$/i.test(cleanedManual)) {
    lines.push(cleanedManual, "");
  } else {
    let addedAny = false;
    for (const [heading, items] of Object.entries(groups)) {
      if (items.length === 0) continue;
      addedAny = true;
      lines.push(`### ${heading}`, "");
      for (const item of items) {
        lines.push(`- ${item}`);
      }
      lines.push("");
    }
    if (!addedAny) {
      lines.push("### Changed", "", `- Release v${version}.`, "");
    }
  }

  return lines.join("\n").trimEnd();
}

export function updateChangelogContent(existingText, { nextVersion, prevVersion, dateStr, groups }) {
  const normalized = existingText.replace(/\r\n/g, "\n");
  const unreleasedMatch = /^## \[Unreleased\]\s*$/m.exec(normalized);

  if (!unreleasedMatch) {
    const entry = formatChangelogEntry(nextVersion, dateStr, groups);
    return [
      "# Changelog",
      "",
      "All notable changes to **Flight Recorder** are documented in this file.",
      "",
      "The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).",
      "",
      "## [Unreleased]",
      "",
      entry,
      "",
      `[Unreleased]: ${REPO_URL}/compare/v${nextVersion}...HEAD`,
      `[${nextVersion}]: ${REPO_URL}/releases/tag/v${nextVersion}`,
      ""
    ].join("\n");
  }

  const afterUnreleasedIdx = unreleasedMatch.index + unreleasedMatch[0].length;
  const rest = normalized.slice(afterUnreleasedIdx);
  const nextSectionMatch = /\n(?=## \[|\[[^\]]+\]:\s+https?:\/\/)/.exec(rest);
  const unreleasedBody = nextSectionMatch ? rest.slice(0, nextSectionMatch.index) : rest;
  const tail = nextSectionMatch ? rest.slice(nextSectionMatch.index + 1) : "";

  const entry = formatChangelogEntry(nextVersion, dateStr, groups, unreleasedBody);
  const beforeUnreleased = normalized.slice(0, afterUnreleasedIdx);

  let updated = `${beforeUnreleased}\n\n${entry}\n\n${tail.trimStart()}`.replace(/\n{3,}/g, "\n\n");

  const unreleasedLinkRe = /^\[Unreleased\]:\s+.+$/m;
  const newUnreleasedLink = `[Unreleased]: ${REPO_URL}/compare/v${nextVersion}...HEAD`;
  const newVersionLink = prevVersion
    ? `[${nextVersion}]: ${REPO_URL}/compare/v${prevVersion}...v${nextVersion}`
    : `[${nextVersion}]: ${REPO_URL}/releases/tag/v${nextVersion}`;

  if (unreleasedLinkRe.test(updated)) {
    updated = updated.replace(unreleasedLinkRe, `${newUnreleasedLink}\n${newVersionLink}`);
  } else {
    updated = `${updated.trimEnd()}\n\n${newUnreleasedLink}\n${newVersionLink}\n`;
  }

  return `${updated.trimEnd()}\n`;
}

function main() {
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const args = process.argv.slice(2);

  let bumpSpec = "";
  let preid = "rc";
  let dryRun = false;
  let noCommit = false;
  let noTag = false;
  let allowDirty = false;
  let skipValidate = false;
  let skipChangelog = false;
  let dateStr = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--no-commit") noCommit = true;
    else if (arg === "--no-tag") noTag = true;
    else if (arg === "--allow-dirty") allowDirty = true;
    else if (arg === "--skip-validate") skipValidate = true;
    else if (arg === "--skip-changelog") skipChangelog = true;
    else if (arg.startsWith("--preid=")) preid = arg.slice("--preid=".length).trim() || "rc";
    else if (arg === "--preid" && args[i + 1]) preid = args[++i].trim() || "rc";
    else if (arg.startsWith("--date=")) dateStr = arg.slice("--date=".length).trim();
    else if (arg === "-h" || arg === "--help") {
      console.log(
        [
          "Usage: npm run release -- <patch|minor|major|prepatch|preminor|premajor|prerelease|X.Y.Z[-pre.N]> [options]",
          "",
          "Options:",
          "  --dry-run         Preview version bump, changelog entry, and checks without modifying files",
          "  --preid=<id>      Prerelease identifier (default: rc)",
          "  --no-commit       Update files, build, and test without creating a git commit or tag",
          "  --no-tag          Create release commit without creating a git tag",
          "  --allow-dirty     Allow running with uncommitted working tree changes",
          "  --skip-validate   Skip `agy plugin validate --strict .`",
          "  --skip-changelog  Skip updating CHANGELOG.md",
          "  --date=YYYY-MM-DD Override release date in CHANGELOG.md"
        ].join("\n")
      );
      process.exit(0);
    } else if (!arg.startsWith("-") && !bumpSpec) {
      bumpSpec = arg.trim();
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }

  if (!bumpSpec) {
    console.error("Missing bump type or target version. Run with --help for usage.");
    process.exit(1);
  }

  // 1. Verify working tree state
  const statusRes = runCmd("git", ["status", "--porcelain"], repoRoot, {
    capture: true
  });
  const isDirty = statusRes.stdout.trim().length > 0;
  if (isDirty && !allowDirty && !dryRun) {
    console.error(
      "Working tree has uncommitted changes. Commit or stash your work before running `npm run release` (or pass --allow-dirty / --dry-run)."
    );
    process.exit(1);
  }

  // 2. Verify current manifest consistency
  const preCheck = verifyVersionConsistency(repoRoot, { checkDist: false });
  if (!preCheck.ok) {
    console.error("Manifest consistency check failed before release:");
    for (const err of preCheck.errors) console.error(`  - ${err}`);
    process.exit(1);
  }

  const currentVersion = readPluginVersion(repoRoot);
  const nextVersion = computeNextVersion(currentVersion, bumpSpec, preid);
  const cmp = compareStrictSemver(nextVersion, currentVersion);
  if (cmp === null || cmp <= 0) {
    console.error(
      `Next version "${nextVersion}" must be strictly greater than current version "${currentVersion}".`
    );
    process.exit(1);
  }

  // 3. Ensure tag doesn't already exist
  const tagName = `v${nextVersion}`;
  const tagCheck = runCmd(
    "git",
    ["rev-parse", "--verify", "--quiet", `refs/tags/${tagName}`],
    repoRoot,
    { capture: true, allowFail: true }
  );
  if (tagCheck.status === 0) {
    console.error(`Git tag "${tagName}" already exists.`);
    process.exit(1);
  }

  // 4. Collect commits for changelog
  const latestTag = getLatestVersionTag(repoRoot);
  const rangeStart = getCommitRangeStart(repoRoot, latestTag);
  const logRange = rangeStart ? `${rangeStart}..HEAD` : "HEAD";
  const logRes = runCmd("git", ["log", logRange, "--format=%s"], repoRoot, {
    capture: true,
    allowFail: true
  });
  const subjects =
    logRes.status === 0
      ? logRes.stdout
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const groups = categorizeCommits(subjects);

  const changelogPath = path.join(repoRoot, "CHANGELOG.md");
  const existingChangelog = fs.existsSync(changelogPath)
    ? fs.readFileSync(changelogPath, "utf8")
    : "";
  const nextChangelog = updateChangelogContent(existingChangelog, {
    nextVersion,
    prevVersion: latestTag ? latestTag.replace(/^v/i, "") : currentVersion,
    dateStr,
    groups
  });

  if (dryRun) {
    console.log(`[dry-run] Release plan: ${currentVersion} -> ${nextVersion} (tag: ${tagName})`);
    if (isDirty) {
      console.log("[dry-run] Note: working tree currently has uncommitted changes.");
    }
    console.log(`[dry-run] Commit range scanned: ${logRange} (${subjects.length} commit(s))`);
    console.log("\n[dry-run] Preview CHANGELOG.md entry:\n");
    const previewBody = extractChangelogSection(nextChangelog, nextVersion);
    console.log(`## [${nextVersion}] - ${dateStr}\n\n${previewBody ?? ""}`);
    console.log("\n[dry-run] Planned steps:");
    console.log("  1. Update plugin.json, package.json, package-lock.json" + (skipChangelog ? "" : ", CHANGELOG.md"));
    console.log("  2. Run `npm run build`");
    console.log("  3. Run `npm run version:check`");
    console.log("  4. Run `npm test`");
    if (!skipValidate) console.log("  5. Run `agy plugin validate --strict .` (if agy is installed)");
    if (!noCommit) {
      console.log(`  6. Commit release files as "chore(release): ${tagName}"`);
      if (!noTag) console.log(`  7. Create annotated git tag "${tagName}"`);
    }
    process.exit(0);
  }

  // 5. Write manifests and CHANGELOG.md
  const pluginPath = path.join(repoRoot, "plugin.json");
  const packagePath = path.join(repoRoot, "package.json");
  const lockPath = path.join(repoRoot, "package-lock.json");

  const pluginJson = readJsonFile(pluginPath);
  pluginJson.version = nextVersion;
  writeJsonFile(pluginPath, pluginJson);

  const packageJson = readJsonFile(packagePath);
  packageJson.version = nextVersion;
  packageJson.name = pluginJson.name;
  writeJsonFile(packagePath, packageJson);

  if (fs.existsSync(lockPath)) {
    const lockJson = readJsonFile(lockPath);
    lockJson.version = nextVersion;
    lockJson.name = pluginJson.name;
    if (lockJson.packages && typeof lockJson.packages === "object" && lockJson.packages[""]) {
      lockJson.packages[""].version = nextVersion;
      lockJson.packages[""].name = pluginJson.name;
    }
    writeJsonFile(lockPath, lockJson);
  }

  if (!skipChangelog) {
    fs.writeFileSync(changelogPath, nextChangelog, "utf8");
  }

  // 6. Rebuild, verify parity, test, and validate
  console.log(`\n==> Building bundles for v${nextVersion}...`);
  runCmd("npm", ["run", "build"], repoRoot);

  console.log("\n==> Verifying version consistency across manifests and dist/...");
  runCmd("npm", ["run", "version:check"], repoRoot);

  console.log("\n==> Running full test suite...");
  runCmd("npm", ["test"], repoRoot);

  if (!skipValidate) {
    const agyCheck = runCmd("agy", ["--version"], repoRoot, {
      capture: true,
      allowFail: true
    });
    if (agyCheck.status === 0) {
      console.log("\n==> Running `agy plugin validate --strict .`...");
      runCmd("agy", ["plugin", "validate", "--strict", "."], repoRoot);
    } else {
      console.log("\n==> Skipping `agy plugin validate` (`agy` CLI not found on PATH).");
    }
  }

  // 7. Commit and tag (never pushes automatically)
  if (!noCommit) {
    const filesToStage = [
      "plugin.json",
      "package.json",
      "dist/server/index.js",
      "dist/server/sidecar.js",
      "dist/ui/index.html"
    ];
    if (fs.existsSync(lockPath)) filesToStage.push("package-lock.json");
    if (!skipChangelog && fs.existsSync(changelogPath)) filesToStage.push("CHANGELOG.md");

    execFileSync("git", ["add", "--", ...filesToStage], { cwd: repoRoot, stdio: "inherit" });
    execFileSync("git", ["commit", "-m", `chore(release): ${tagName}`], {
      cwd: repoRoot,
      stdio: "inherit"
    });

    if (!noTag) {
      execFileSync("git", ["tag", "-a", tagName, "-m", `Release ${tagName}`], {
        cwd: repoRoot,
        stdio: "inherit"
      });
    }
  }

  console.log(`\n✔ Release ${tagName} prepared cleanly!`);
  if (!noCommit && !noTag) {
    console.log("Review the commit & tag, then publish with:");
    console.log("  git push origin main --follow-tags");
  }
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  main();
}
