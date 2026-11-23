import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const pluginsDir = path.join(os.homedir(), ".gemini", "config", "plugins");
const targetPath = path.join(pluginsDir, "flight-recorder");
const legacyPath = path.join(pluginsDir, "antigravity-tracker");
const forceFlag = process.argv.includes("--force");

fs.mkdirSync(pluginsDir, { recursive: true });

// Remove legacy symlink if it points to this repo so there are no duplicate plugins.
const legacyStat = fs.lstatSync(legacyPath, { throwIfNoEntry: false });
if (legacyStat?.isSymbolicLink()) {
  const existingLegacy = fs.readlinkSync(legacyPath);
  if (path.resolve(pluginsDir, existingLegacy) === repoRoot) {
    fs.unlinkSync(legacyPath);
    console.log(`Removed legacy symlink: ${legacyPath}`);
  }
}

if (fs.existsSync(targetPath) || fs.lstatSync(targetPath, { throwIfNoEntry: false })) {
  const stat = fs.lstatSync(targetPath);
  if (stat.isSymbolicLink()) {
    const existing = fs.readlinkSync(targetPath);
    if (path.resolve(pluginsDir, existing) === repoRoot) {
      console.log(`Already linked: ${targetPath} -> ${repoRoot}`);
    } else {
      fs.unlinkSync(targetPath);
      fs.symlinkSync(repoRoot, targetPath, "dir");
      console.log(`Updated symlink: ${targetPath} -> ${repoRoot}`);
    }
  } else if (forceFlag) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    fs.symlinkSync(repoRoot, targetPath, "dir");
    console.log(`Replaced directory with symlink: ${targetPath} -> ${repoRoot}`);
  } else {
    throw new Error(
      `Target exists and is not a symlink: ${targetPath}. Re-run with --force to replace.`
    );
  }
} else {
  fs.symlinkSync(repoRoot, targetPath, "dir");
  console.log(`Linked plugin: ${targetPath} -> ${repoRoot}`);
}

const manifestPath = path.join(targetPath, "plugin.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
console.log(
  `Verified manifest at ${manifestPath}: name=${manifest.name}, version=${manifest.version}`
);
