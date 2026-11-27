import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "node:path";
import { resolveDataDir } from "./dataDir.js";
import { TrackerDatabase } from "./db.js";
import { runScan } from "./scanner.js";
import { createTrackerMcpServer } from "./tools.js";

async function main(): Promise<void> {
  // dist/server/index.js -> plugin root
  const pluginRoot = path.resolve(import.meta.dirname, "..", "..");
  const dataDir = resolveDataDir({
    argv: process.argv.slice(2),
    pluginRoot,
    preferSharedPluginData: false
  });
  const db = new TrackerDatabase(dataDir);

  const server = createTrackerMcpServer({
    db,
    dataDir,
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
