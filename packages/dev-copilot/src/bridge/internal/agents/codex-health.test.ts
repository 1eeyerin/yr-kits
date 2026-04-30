import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { getCodexHealthCheck, __internal } from "./codex-health";
import { __internal as codexCommandInternal } from "./codex-command";

const createFakeCodex = async (
  dir: string,
  version: string,
  options?: {
    loginRequired?: boolean;
    failAnswerExec?: boolean;
    failSchemaExec?: boolean;
  },
) => {
  const commandPath = join(dir, "codex");
  const script = `#!/usr/bin/env node
const { writeFileSync } = require("node:fs");
const args = process.argv.slice(2);

if (args.includes("--version")) {
  console.log("codex-cli ${version}");
  process.exit(0);
}

if (args[0] === "login" && args[1] === "status") {
  console.log(${options?.loginRequired ? JSON.stringify("Not logged in") : JSON.stringify("Logged in as user")});
  process.exit(0);
}

if (args.includes("--output-schema")) {
  if (${options?.failSchemaExec === true ? "true" : "false"}) {
    console.error("Invalid schema for response_format");
    process.exit(1);
  }

  const outputIndex = args.indexOf("--output-last-message");
  if (outputIndex >= 0) {
    writeFileSync(args[outputIndex + 1], JSON.stringify({
      message: "ok",
      warnings: [],
      changes: [{ path: "src/App.tsx", oldText: "before", newText: "after" }],
    }));
  }

  process.exit(0);
}

if (args.includes("exec")) {
  if (${options?.failAnswerExec === true ? "true" : "false"}) {
    console.error("exec failed");
    process.exit(1);
  }

  const outputIndex = args.indexOf("--output-last-message");
  if (outputIndex >= 0) {
    writeFileSync(args[outputIndex + 1], "OK");
  }
}

process.exit(0);
`;

  await writeFile(commandPath, script, { mode: 0o755 });
  return commandPath;
};

test("getCodexHealthCheck는 login_required 상태를 반환한다", async () => {
  __internal.resetCodexHealthCheckCacheForTests();
  codexCommandInternal.resetCodexCommandCacheForTests();
  const packageRoot = await mkdtemp(join(tmpdir(), "dev-copilot-codex-health-login-"));
  const bundledBinDir = join(packageRoot, "node_modules", ".bin");
  await mkdir(bundledBinDir, { recursive: true });
  const originalPath = process.env.PATH;
  const originalPackageRoot = process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS;

  process.env.PATH = dirname(process.execPath);
  process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS = packageRoot;
  await createFakeCodex(bundledBinDir, "0.130.0", { loginRequired: true });

  try {
    const result = await getCodexHealthCheck(packageRoot);

    assert.equal(result.status, "login_required");
    assert.equal(result.loginCommand, "codex login");
  } finally {
    process.env.PATH = originalPath;
    if (originalPackageRoot === undefined) {
      delete process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS;
    } else {
      process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS = originalPackageRoot;
    }
    __internal.resetCodexHealthCheckCacheForTests();
    codexCommandInternal.resetCodexCommandCacheForTests();
  }
});

test("getCodexHealthCheck는 schema smoke test 실패를 구분한다", async () => {
  __internal.resetCodexHealthCheckCacheForTests();
  codexCommandInternal.resetCodexCommandCacheForTests();
  const packageRoot = await mkdtemp(join(tmpdir(), "dev-copilot-codex-health-schema-"));
  const bundledBinDir = join(packageRoot, "node_modules", ".bin");
  await mkdir(bundledBinDir, { recursive: true });
  const originalPath = process.env.PATH;
  const originalPackageRoot = process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS;

  process.env.PATH = dirname(process.execPath);
  process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS = packageRoot;
  await createFakeCodex(bundledBinDir, "0.130.0", { failSchemaExec: true });

  try {
    const result = await getCodexHealthCheck(packageRoot);

    assert.equal(result.status, "schema_failed");
    assert.match(result.message, /edit 응답 스키마 smoke test/);
  } finally {
    process.env.PATH = originalPath;
    if (originalPackageRoot === undefined) {
      delete process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS;
    } else {
      process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS = originalPackageRoot;
    }
    __internal.resetCodexHealthCheckCacheForTests();
    codexCommandInternal.resetCodexCommandCacheForTests();
  }
});
