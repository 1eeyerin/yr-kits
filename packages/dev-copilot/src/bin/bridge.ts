#!/usr/bin/env node

import { runDevCopilotBridgeCli } from "../bridge/app/run-bridge-cli";

runDevCopilotBridgeCli(process.argv.slice(2)).catch((error) => {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : String(error);
  const normalized =
    code === "EADDRINUSE"
      ? "요청한 브리지 포트가 이미 사용 중입니다. 포트를 변경해서 다시 실행해 주세요."
      : message;
  process.stderr.write(`[dev-copilot-bridge] ${normalized}\n`);
  process.exit(1);
});
