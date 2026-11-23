import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "src/ui"),
  plugins: [react(), viteSingleFile()],
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
