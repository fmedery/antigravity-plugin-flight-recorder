import fs from "node:fs";
import path from "node:path";
import {
  compareStrictSemver,
  computeNextVersion,
  readJsonFile,
  readPluginVersion,
  verifyVersionConsistency,
  writeJsonFile
} from "./version-utils.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const pluginPath = path.join(repoRoot, "plugin.json");
const packagePath = path.join(repoRoot, "package.json");
const lockPath = path.join(repoRoot, "package-lock.json");

const rawArgs = process.argv.slice(2);
let bumpSpec = "";
let preid = "rc";
let dryRun = false;
let allowSame = false;

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === "--dry-run") {
    dryRun = true;
  } else if (arg === "--allow-same") {
    allowSame = true;
  } else if (arg.startsWith("--preid=")) {
    preid = arg.slice("--preid=".length).trim() || "rc";
  } else if (arg === "--preid" && rawArgs[i + 1]) {
    preid = rawArgs[++i].trim() || "rc";
  } else if (arg === "-h" || arg === "--help") {
    console.log(
      "Usage: npm run version:bump -- <patch|minor|major|prepatch|preminor|premajor|prerelease|X.Y.Z[-pre.N]> [--preid=rc] [--dry-run] [--allow-same]"
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
  console.error(
    "Usage: npm run version:bump -- <patch|minor|major|prepatch|preminor|premajor|prerelease|X.Y.Z[-pre.N]> [--preid=rc] [--dry-run]"
  );
  process.exit(1);
}

const preCheck = verifyVersionConsistency(repoRoot, { checkDist: false });
if (!preCheck.ok) {
  console.error("Cannot bump version because manifests are currently inconsistent:");
  for (const err of preCheck.errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

const currentVersion = readPluginVersion(repoRoot);
const nextVersion = computeNextVersion(currentVersion, bumpSpec, preid);
const cmp = compareStrictSemver(nextVersion, currentVersion);
if (cmp === null || cmp < 0 || (cmp === 0 && !allowSame)) {
  console.error(
    `Refusing to bump version from ${currentVersion} to ${nextVersion} (next version must be greater than current; pass --allow-same to override).`
  );
  process.exit(1);
}

if (dryRun) {
  console.log(`[dry-run] Would bump Flight Recorder version: ${currentVersion} -> ${nextVersion}`);
  process.exit(0);
}

const pluginJson = readJsonFile(pluginPath);
pluginJson.version = nextVersion;
writeJsonFile(pluginPath, pluginJson);

const packageJson = readJsonFile(packagePath);
packageJson.version = nextVersion;
if (typeof pluginJson.name === "string" && pluginJson.name.trim()) {
  packageJson.name = pluginJson.name.trim();
}
writeJsonFile(packagePath, packageJson);

if (fs.existsSync(lockPath)) {
  const lockJson = readJsonFile(lockPath);
  lockJson.version = nextVersion;
  if (typeof packageJson.name === "string" && packageJson.name.trim()) {
    lockJson.name = packageJson.name.trim();
  }
  if (lockJson.packages && typeof lockJson.packages === "object" && lockJson.packages[""]) {
    lockJson.packages[""].version = nextVersion;
    if (typeof packageJson.name === "string" && packageJson.name.trim()) {
      lockJson.packages[""].name = packageJson.name.trim();
    }
  }
  writeJsonFile(lockPath, lockJson);
}

console.log(`Bumped Flight Recorder version: ${currentVersion} -> ${nextVersion}`);
console.log("Next: run `npm run build && npm run version:check && npm test` (or use `npm run release`).");
