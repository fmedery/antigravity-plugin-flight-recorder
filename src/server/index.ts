import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import os from "node:os";
import path from "node:path";
import { TrackerDatabase } from "./db.js";
import { runScan } from "./scanner.js";
import { createTrackerMcpServer } from "./tools.js";

function parseDataDirArg(argv: string[]): string {
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith("--data-dir=")) {
      const val = arg.slice("--data-dir=".length).trim();
      if (val) return val;
    } else if (arg === "--data-dir" && argv[i + 1]) {
      return argv[i + 1].trim();
    }
  }
  const envDir = process.env.PLUGIN_DATA?.trim();
  if (envDir) return envDir;
  return path.join(os.homedir(), ".gemini", "flight-recorder-data");
}

async function main(): Promise<void> {
  const dataDir = parseDataDirArg(process.argv.slice(2));
  const db = new TrackerDatabase(dataDir);

  // dist/server/index.js -> dist/ui/index.html and plugin root
  const uiHtmlPath = path.resolve(import.meta.dirname, "..", "ui", "index.html");
  const pluginRoot = path.resolve(import.meta.dirname, "..", "..");

  const server = createTrackerMcpServer({
    db,
    dataDir,
    uiHtmlPath,
    pluginRoot
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Kick off initial scan right after MCP transport connects so initialize responds immediately.
  void runScan({ db, dataDir }).catch((err) => {
    process.stderr.write(
      `[flight-recorder] initial scan warning: ${err instanceof Error ? err.message : String(err)}\n`
    );
  });

  const shutdown = () => {
    try {
      db.close();
    } catch {
      // Ignore close errors on exit
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  process.stderr.write(
    `[flight-recorder] fatal error: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`
  );
  process.exit(1);
});
