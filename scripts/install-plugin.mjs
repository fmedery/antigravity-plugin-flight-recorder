import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const pluginsDir = path.join(os.homedir(), ".gemini", "config", "plugins");
const targetPath = path.join(pluginsDir, "flight-recorder");
const legacyPath = path.join(pluginsDir, "antigravity-tracker");
const forceFlag = process.argv.includes("--force");
const linkType = process.platform === "win32" ? "junction" : "dir";

function sameResolvedPath(a: string, b: string): boolean {
  return process.platform === "win32"
    ? a.toLowerCase() === b.toLowerCase()
    : a === b;
}

function linkOrCopyPlugin(src: string, dest: string): void {
  try {
    fs.symlinkSync(src, dest, linkType);
    console.log(`Linked plugin (${linkType}): ${dest} -> ${src}`);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "EPERM" || code === "ENOTSUP" || code === "EXDEV") {
      fs.cpSync(src, dest, {
        recursive: true,
        filter: (item) => {
          const rel = path.relative(src, item);
          if (!rel) return true;
          const top = rel.split(path.sep)[0];
          return (
            top !== "node_modules" &&
            top !== ".git" &&
            top !== "dist-test" &&
            top !== ".superpowers" &&
            top !== ".worktrees"
          );
        }
      });
      console.log(`Copied plugin bundle (symlink unavailable: ${code}): ${dest}`);
      return;
    }
    throw err;
  }
}

fs.mkdirSync(pluginsDir, { recursive: true });

const legacyStat = fs.lstatSync(legacyPath, { throwIfNoEntry: false });
if (legacyStat?.isSymbolicLink()) {
  const existingLegacy = fs.readlinkSync(legacyPath);
  if (sameResolvedPath(path.resolve(pluginsDir, existingLegacy), repoRoot)) {
    fs.unlinkSync(legacyPath);
    console.log(`Removed legacy symlink: ${legacyPath}`);
  }
}

const stat = fs.lstatSync(targetPath, { throwIfNoEntry: false });
if (stat) {
  if (stat.isSymbolicLink()) {
    const existing = fs.readlinkSync(targetPath);
    if (sameResolvedPath(path.resolve(pluginsDir, existing), repoRoot)) {
      console.log(`Already linked: ${targetPath} -> ${repoRoot}`);
    } else {
      fs.unlinkSync(targetPath);
      linkOrCopyPlugin(repoRoot, targetPath);
    }
  } else if (forceFlag) {
    fs.rmSync(targetPath, { recursive: true, force: true });
    linkOrCopyPlugin(repoRoot, targetPath);
  } else {
    throw new Error(
      `Target exists and is not a symlink: ${targetPath}. Re-run with --force to replace.`
    );
  }
} else {
  linkOrCopyPlugin(repoRoot, targetPath);
}

const manifestPath = path.join(targetPath, "plugin.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
console.log(
  `Verified manifest at ${manifestPath}: name=${manifest.name}, version=${manifest.version}`
);
