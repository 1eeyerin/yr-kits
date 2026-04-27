#!/usr/bin/env node

import { runInitCommand } from "./init";

const printHelp = () => {
  process.stdout.write(
    [
      "@yr-kits/dev-copilot",
      "",
      "사용법:",
      "  npx @yr-kits/dev-copilot init [--skip-install]",
      "",
      "명령:",
      "  init    현재 프로젝트에 패키지를 설치하고 bridge 스크립트를 추가합니다.",
      "",
      "옵션:",
      "  --skip-install    패키지 설치 단계를 건너뛰고 scripts만 추가합니다.",
    ].join("\n") + "\n",
  );
};

const [command, ...restArgs] = process.argv.slice(2);

if (!command || command === "--help" || command === "-h") {
  printHelp();
  process.exit(0);
}

if (command === "init") {
  runInitCommand({
    skipInstall: restArgs.includes("--skip-install"),
  }).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[dev-copilot:init] ${message}\n`);
    process.exit(1);
  });
} else {
  printHelp();
  process.exit(1);
}
