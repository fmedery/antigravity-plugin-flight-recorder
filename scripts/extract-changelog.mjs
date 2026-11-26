import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseStrictSemver } from "./version-utils.mjs";

export function extractChangelogSection(changelogText, rawVersion) {
  const cleanVersion = String(rawVersion ?? "").trim().replace(/^v/i, "");
  if (!parseStrictSemver(cleanVersion)) {
    throw new Error(`Invalid SemVer version: "${rawVersion}"`);
  }

  const lines = changelogText.replace(/\r\n/g, "\n").split("\n");
  const escaped = cleanVersion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const headingRe = new RegExp(`^##\\s+\\[${escaped}\\](?:\\s+-\\s+.*)?\\s*$`);

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (headingRe.test(lines[i])) {
      startIdx = i + 1;
      break;
    }
  }
  if (startIdx === -1) return null;

  let endIdx = lines.length;
  for (let i = startIdx; i < lines.length; i++) {
    if (/^##\s+\[/.test(lines[i]) || /^\[[^\]]+\]:\s+https?:\/\//.test(lines[i])) {
      endIdx = i;
      break;
    }
  }

  const body = lines.slice(startIdx, endIdx).join("\n").trim();
  return body || null;
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  const repoRoot = path.resolve(import.meta.dirname, "..");
  const rawVersion = process.argv[2];
  const outPath = process.argv[3];

  if (!rawVersion) {
    console.error("Usage: node scripts/extract-changelog.mjs <version|vX.Y.Z> [output-file]");
    process.exit(1);
  }

  const changelogPath = path.join(repoRoot, "CHANGELOG.md");
  if (!fs.existsSync(changelogPath)) {
    console.error(`Missing CHANGELOG.md at ${changelogPath}`);
    process.exit(1);
  }

  const text = fs.readFileSync(changelogPath, "utf8");
  const section = extractChangelogSection(text, rawVersion);
  if (!section) {
    console.error(`No CHANGELOG.md entry found for version ${rawVersion}`);
    process.exit(1);
  }

  if (outPath) {
    fs.writeFileSync(outPath, `${section}\n`, "utf8");
  } else {
    process.stdout.write(`${section}\n`);
  }
}
