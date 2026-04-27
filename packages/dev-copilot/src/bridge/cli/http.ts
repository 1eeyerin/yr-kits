#!/usr/bin/env node

import { runDevCopilotBridgeCli } from "./run-http";

runDevCopilotBridgeCli(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[dev-copilot-bridge] ${message}\n`);
  process.exit(1);
});
