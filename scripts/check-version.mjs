import path from "node:path";
import { verifyVersionConsistency } from "./version-utils.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);

let checkDist = true;
let expectedTag = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--no-dist") {
    checkDist = false;
  } else if (arg.startsWith("--tag=")) {
    expectedTag = arg.slice("--tag=".length);
  } else if (arg === "--tag" && args[i + 1]) {
    expectedTag = args[++i];
  } else if (arg === "-h" || arg === "--help") {
    console.log(
      "Usage: node scripts/check-version.mjs [--no-dist] [--tag=vX.Y.Z]"
    );
    process.exit(0);
  } else {
    console.error(`Unknown argument: ${arg}`);
    process.exit(1);
  }
}

const report = verifyVersionConsistency(repoRoot, { checkDist, expectedTag });
if (!report.ok) {
  console.error("Version consistency check failed:");
  for (const err of report.errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
}

const scope = checkDist
  ? "plugin.json, package.json, package-lock.json, and dist/ bundles"
  : "plugin.json, package.json, and package-lock.json";
const tagSuffix = expectedTag ? ` (matches tag ${expectedTag})` : "";
console.log(`✔ Version consistency OK: v${report.version} across ${scope}${tagSuffix}`);
