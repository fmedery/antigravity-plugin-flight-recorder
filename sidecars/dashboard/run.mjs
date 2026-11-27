#!/usr/bin/env node
// Minimal Antigravity UI Sidecar launcher for Flight Recorder (zero runtime npm dependencies).

process.on("uncaughtException", (err) => {
  process.stderr.write(
    `[flight-recorder-sidecar] uncaught exception: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`
  );
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  process.stderr.write(
    `[flight-recorder-sidecar] unhandled rejection: ${reason instanceof Error ? reason.stack ?? reason.message : String(reason)}\n`
  );
  process.exit(1);
});

const { startSidecarMain } = await import("../../dist/server/sidecar.js");
await startSidecarMain(process.argv.slice(2));
