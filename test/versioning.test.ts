import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

async function importScript(relPath: string): Promise<Record<string, any>> {
  const fullPath = path.join(repoRoot, relPath);
  return import(pathToFileURL(fullPath).href) as Promise<Record<string, any>>;
}

test("version-utils computes SemVer bumps, prereleases, and enforces fail-fast consistency", async () => {
  const utils = await importScript("scripts/version-utils.mjs");

  assert.equal(utils.computeNextVersion("0.3.0", "patch"), "0.3.1");
  assert.equal(utils.computeNextVersion("0.3.0", "minor"), "0.4.0");
  assert.equal(utils.computeNextVersion("0.3.0", "major"), "1.0.0");
  assert.equal(utils.computeNextVersion("0.3.0", "preminor", "rc"), "0.4.0-rc.1");
  assert.equal(utils.computeNextVersion("0.4.0-rc.1", "prerelease"), "0.4.0-rc.2");
  assert.equal(utils.computeNextVersion("0.4.0-rc.2", "patch"), "0.4.0");
  assert.equal(utils.computeNextVersion("0.3.0", "v1.0.0-beta.1"), "1.0.0-beta.1");
  assert.throws(() => utils.computeNextVersion("0.3.0", "not-a-bump"));

  assert.equal(utils.compareStrictSemver("0.4.0-rc.1", "0.4.0"), -1);
  assert.equal(utils.compareStrictSemver("0.4.0-rc.2", "0.4.0-rc.10"), -1);
  assert.equal(utils.compareStrictSemver("1.0.0", "0.9.9"), 1);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fr-ver-test-"));
  try {
    // Missing/invalid version in plugin.json fails fast
    fs.writeFileSync(
      path.join(tmp, "plugin.json"),
      JSON.stringify({ name: "flight-recorder", version: "bad" }),
      "utf8"
    );
    assert.throws(() => utils.readPluginVersion(tmp), /Invalid or missing "version"/);

    // Valid repo layout passes parity + tag check
    fs.mkdirSync(path.join(tmp, "dist", "server"), { recursive: true });
    fs.mkdirSync(path.join(tmp, "dist", "ui"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "plugin.json"),
      JSON.stringify({ name: "flight-recorder", version: "1.0.0" }),
      "utf8"
    );
    fs.writeFileSync(
      path.join(tmp, "package.json"),
      JSON.stringify({ name: "flight-recorder", version: "1.0.0" }),
      "utf8"
    );
    fs.writeFileSync(
      path.join(tmp, "package-lock.json"),
      JSON.stringify({
        name: "flight-recorder",
        version: "1.0.0",
        packages: { "": { name: "flight-recorder", version: "1.0.0" } }
      }),
      "utf8"
    );
    fs.writeFileSync(
      path.join(tmp, "dist", "server", "index.js"),
      "/* flight-recorder v1.0.0 */\nconsole.log('ok');\n",
      "utf8"
    );
    fs.writeFileSync(
      path.join(tmp, "dist", "ui", "index.html"),
      '<!doctype html><html><head><meta name="flight-recorder-version" content="1.0.0" /></head></html>',
      "utf8"
    );

    const okReport = utils.verifyVersionConsistency(tmp, {
      checkDist: true,
      expectedTag: "v1.0.0"
    });
    assert.equal(okReport.ok, true);
    assert.equal(okReport.version, "1.0.0");

    // Tag mismatch fails
    const badTag = utils.verifyVersionConsistency(tmp, {
      checkDist: true,
      expectedTag: "v1.0.1"
    });
    assert.equal(badTag.ok, false);
    assert.match(badTag.errors[0], /does not match/);

    // Lockfile name drift & stale dist UI fail
    fs.writeFileSync(
      path.join(tmp, "package-lock.json"),
      JSON.stringify({
        name: "antigravity-tracker",
        version: "1.0.0",
        packages: { "": { name: "antigravity-tracker", version: "0.9.0" } }
      }),
      "utf8"
    );
    fs.writeFileSync(
      path.join(tmp, "dist", "ui", "index.html"),
      '<!doctype html><html><head><meta name="flight-recorder-version" content="0.9.0" /></head></html>',
      "utf8"
    );
    const driftReport = utils.verifyVersionConsistency(tmp, { checkDist: true });
    assert.equal(driftReport.ok, false);
    assert.ok(driftReport.errors.some((e: string) => /package-lock\.json root name/.test(e)));
    assert.ok(driftReport.errors.some((e: string) => /packages\[""\]\.version/.test(e)));
    assert.ok(driftReport.errors.some((e: string) => /dist\/ui\/index\.html/.test(e)));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("release changelog generator and extractor handle Conventional Commits and CHANGELOG.md sections", async () => {
  const releaseMod = await importScript("scripts/release.mjs");
  const extractMod = await importScript("scripts/extract-changelog.mjs");

  const groups = releaseMod.categorizeCommits([
    "feat(swarm): add coordinator worker rollups",
    "fix: prevent duplicate hook reads",
    "security: redact custom *_TOKEN keys",
    "docs: clarify Marketplace install steps",
    "chore(release): v0.4.0"
  ]);
  assert.deepEqual(groups.Added, ["**swarm:** add coordinator worker rollups"]);
  assert.deepEqual(groups.Fixed, ["prevent duplicate hook reads"]);
  assert.deepEqual(groups.Security, ["redact custom *_TOKEN keys"]);
  assert.deepEqual(groups.Documentation, ["clarify Marketplace install steps"]);
  assert.equal(groups.Maintenance.length, 0);

  const sampleChangelog = [
    "# Changelog",
    "",
    "## [Unreleased]",
    "",
    "## [0.3.0] - 2026-11-25",
    "",
    "### Added",
    "",
    "- Initial update check.",
    "",
    "[Unreleased]: https://github.com/fmedery/antigravity-plugin-flight-recorder/compare/v0.3.0...HEAD",
    "[0.3.0]: https://github.com/fmedery/antigravity-plugin-flight-recorder/commits/69efe49",
    ""
  ].join("\n");

  const updated = releaseMod.updateChangelogContent(sampleChangelog, {
    nextVersion: "0.4.0",
    prevVersion: "0.3.0",
    dateStr: "2026-11-26",
    groups
  });

  const extracted040 = extractMod.extractChangelogSection(updated, "v0.4.0");
  assert.ok(extracted040);
  assert.match(extracted040, /\*\*swarm:\*\* add coordinator worker rollups/);
  assert.match(extracted040, /redact custom \*_TOKEN keys/);
  assert.equal(extracted040.includes("Initial update check"), false);

  const extracted030 = extractMod.extractChangelogSection(updated, "0.3.0");
  assert.match(extracted030, /Initial update check/);
  assert.match(updated, /\[Unreleased\]: .*\/compare\/v0\.4\.0\.\.\.HEAD/);
  assert.match(updated, /\[0\.4\.0\]: .*\/compare\/v0\.3\.0\.\.\.v0\.4\.0/);
});

test("CLI scripts check-version.mjs, extract-changelog.mjs, and release.mjs --dry-run execute cleanly", () => {
  const checkRes = spawnSync(
    process.execPath,
    [path.join(repoRoot, "scripts", "check-version.mjs")],
    { cwd: repoRoot, encoding: "utf8" }
  );
  assert.equal(checkRes.status, 0, checkRes.stderr || checkRes.stdout);
  assert.match(checkRes.stdout, /Version consistency OK/);

  const extractRes = spawnSync(
    process.execPath,
    [path.join(repoRoot, "scripts", "extract-changelog.mjs"), "v0.3.0"],
    { cwd: repoRoot, encoding: "utf8" }
  );
  assert.equal(extractRes.status, 0, extractRes.stderr || extractRes.stdout);
  assert.match(extractRes.stdout, /Context Health/);

  const dryRes = spawnSync(
    process.execPath,
    [path.join(repoRoot, "scripts", "release.mjs"), "minor", "--dry-run"],
    { cwd: repoRoot, encoding: "utf8" }
  );
  assert.equal(dryRes.status, 0, dryRes.stderr || dryRes.stdout);
  assert.match(dryRes.stdout, /\[dry-run\] Release plan:/);
});
