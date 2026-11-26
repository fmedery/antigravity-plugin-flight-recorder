import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const pluginPath = path.join(repoRoot, "plugin.json");
const packagePath = path.join(repoRoot, "package.json");
const lockPath = path.join(repoRoot, "package-lock.json");

const arg = (process.argv[2] ?? "").trim();
const semverRe = /^(\d+)\.(\d+)\.(\d+)$/;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const pluginJson = readJson(pluginPath);
const currentRaw = typeof pluginJson.version === "string" ? pluginJson.version.trim() : "";
const currentMatch = semverRe.exec(currentRaw);

if (!currentMatch) {
  console.error(`Invalid current version in plugin.json: "${currentRaw}"`);
  process.exit(1);
}

const [, majStr, minStr, patStr] = currentMatch;
const maj = Number(majStr);
const min = Number(minStr);
const pat = Number(patStr);

let nextVersion = "";
if (arg === "major") {
  nextVersion = `${maj + 1}.0.0`;
} else if (arg === "minor") {
  nextVersion = `${maj}.${min + 1}.0`;
} else if (arg === "patch") {
  nextVersion = `${maj}.${min}.${pat + 1}`;
} else {
  const cleaned = arg.replace(/^v/i, "");
  if (semverRe.test(cleaned)) {
    nextVersion = cleaned;
  }
}

if (!nextVersion) {
  console.error(
    "Usage: npm run version:bump -- <patch|minor|major|X.Y.Z>"
  );
  process.exit(1);
}

pluginJson.version = nextVersion;
writeJson(pluginPath, pluginJson);

const packageJson = readJson(packagePath);
packageJson.version = nextVersion;
writeJson(packagePath, packageJson);

if (fs.existsSync(lockPath)) {
  const lockJson = readJson(lockPath);
  lockJson.version = nextVersion;
  if (lockJson.packages && typeof lockJson.packages === "object" && lockJson.packages[""]) {
    lockJson.packages[""].version = nextVersion;
  }
  writeJson(lockPath, lockJson);
}

console.log(`Bumped Flight Recorder version: ${currentRaw} -> ${nextVersion}`);
console.log("Next: run `npm run build && npm test` to update dist/ and verify.");
