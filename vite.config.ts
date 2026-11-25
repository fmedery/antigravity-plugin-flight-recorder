import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import fs from "node:fs";
import path from "node:path";

const pluginManifest = JSON.parse(
  fs.readFileSync(path.resolve(import.meta.dirname, "plugin.json"), "utf8")
) as { version?: unknown };
const pluginVersion =
  typeof pluginManifest.version === "string" ? pluginManifest.version : "0.2.0";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "src/ui"),
  plugins: [react(), viteSingleFile()],
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
