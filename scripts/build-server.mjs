import fs from "node:fs";
import { builtinModules, createRequire } from "node:module";
import path from "node:path";
import { readPluginVersion } from "./version-utils.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const distServerDir = path.join(repoRoot, "dist", "server");
const distSharedDir = path.join(repoRoot, "dist", "shared");
const pluginVersion = readPluginVersion(repoRoot);

// Resolve esbuild either hoisted or nested under vite so pnpm/npm both work without extra deps.
const rootReq = createRequire(path.join(repoRoot, "package.json"));
let esbuild;
try {
  esbuild = rootReq("esbuild");
} catch {
  const vitePkgPath = rootReq.resolve("vite/package.json");
  const viteReq = createRequire(vitePkgPath);
  esbuild = viteReq("esbuild");
}

fs.rmSync(distServerDir, { recursive: true, force: true });
fs.rmSync(distSharedDir, { recursive: true, force: true });
fs.mkdirSync(distServerDir, { recursive: true });

const externals = Array.from(
  new Set([
    "node:*",
    ...builtinModules,
    ...builtinModules.map((m) => (m.startsWith("node:") ? m : `node:${m}`))
  ])
);

await esbuild.build({
  entryPoints: [path.join(repoRoot, "src", "server", "index.ts")],
  outfile: path.join(distServerDir, "index.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  sourcemap: false,
  minifySyntax: true,
  define: {
    __FLIGHT_RECORDER_VERSION__: JSON.stringify(pluginVersion)
  },
  external: externals,
  banner: {
    js: `/* flight-recorder v${pluginVersion} */\nimport { createRequire as __frCreateRequire } from "node:module"; const require = __frCreateRequire(import.meta.url);`
  }
});

const outStat = fs.statSync(path.join(distServerDir, "index.js"));
console.log(
  `Bundled dist/server/index.js (${(outStat.size / 1024).toFixed(1)} kB, zero runtime npm dependencies)`
);
