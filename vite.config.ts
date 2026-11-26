import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import fs from "node:fs";
import path from "node:path";

const STRICT_SEMVER_RE =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function readStrictPluginVersion(manifestPath: string): string {
  const pluginManifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as {
    version?: unknown;
  };
  if (
    typeof pluginManifest.version !== "string" ||
    !STRICT_SEMVER_RE.test(pluginManifest.version.trim())
  ) {
    throw new Error(
      `Invalid or missing "version" in ${manifestPath}: ${JSON.stringify(pluginManifest.version)}`
    );
  }
  return pluginManifest.version.trim();
}

function injectVersionMetaPlugin(version: string): Plugin {
  return {
    name: "inject-flight-recorder-version-meta",
    transformIndexHtml(html) {
      const tag = `<meta name="flight-recorder-version" content="${version}" />`;
      if (html.includes('name="flight-recorder-version"')) {
        return html.replace(
          /<meta\s+name="flight-recorder-version"[^>]*\/?>/i,
          tag
        );
      }
      return html.replace("</head>", `    ${tag}\n  </head>`);
    }
  };
}

const pluginVersion = readStrictPluginVersion(
  path.resolve(import.meta.dirname, "plugin.json")
);

export default defineConfig({
  root: path.resolve(import.meta.dirname, "src/ui"),
  plugins: [react(), injectVersionMetaPlugin(pluginVersion), viteSingleFile()],
  define: {
    __FLIGHT_RECORDER_VERSION__: JSON.stringify(pluginVersion)
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/ui"),
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: {
      input: path.resolve(import.meta.dirname, "src/ui/index.html")
    }
  }
});
