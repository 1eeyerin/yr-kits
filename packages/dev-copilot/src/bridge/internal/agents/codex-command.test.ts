import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { __internal, resolveCodexCommand } from "./codex-command";

const createFakeCodex = async (dir: string, version: string, options?: { failExec?: boolean }) => {
  const commandPath = join(dir, "codex");
  const script = `#!/usr/bin/env node
const { writeFileSync } = require("node:fs");
const args = process.argv.slice(2);

if (args.includes("--version")) {
  console.log("codex-cli ${version}");
  process.exit(0);
}

if (${options?.failExec === true ? "true" : "false"} && args.includes("exec")) {
  console.error("Error loading config.toml: invalid transport 'streamable-http'");
  process.exit(1);
}

const outputIndex = args.indexOf("--output-last-message");
if (outputIndex >= 0) {
  writeFileSync(args[outputIndex + 1], "OK");
}

process.exit(0);
`;

  await writeFile(commandPath, script, { mode: 0o755 });
  return commandPath;
};

test("resolveCodexCommand는 내장 Codex가 없으면 오류를 던진다", async () => {
  __internal.resetCodexCommandCacheForTests();
  const oldDir = await mkdtemp(join(tmpdir(), "dev-copilot-codex-old-"));
  const newDir = await mkdtemp(join(tmpdir(), "dev-copilot-codex-new-"));
  await createFakeCodex(oldDir, "0.111.0");
  await createFakeCodex(newDir, "0.124.0-alpha.2");
  const packageRoot = await mkdtemp(join(tmpdir(), "dev-copilot-empty-package-"));
  const originalPath = process.env.PATH;
  const originalPackageRoot = process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS;

  process.env.PATH = [oldDir, newDir, dirname(process.execPath)].filter(Boolean).join(":");
  process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS = packageRoot;
  delete process.env.DEV_COPILOT_CODEX_BIN;

  try {
    await assert.rejects(
      () => resolveCodexCommand(),
      /내장 Codex CLI를 찾을 수 없습니다/,
    );
  } finally {
    process.env.PATH = originalPath;
    if (originalPackageRoot === undefined) {
      delete process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS;
    } else {
      process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS = originalPackageRoot;
    }
    __internal.resetCodexCommandCacheForTests();
  }
});

test("resolveCodexCommand는 내장 Codex CLI만 사용한다", async () => {
  __internal.resetCodexCommandCacheForTests();
  const packageRoot = await mkdtemp(join(tmpdir(), "dev-copilot-package-"));
  const bundledBinDir = join(packageRoot, "node_modules", ".bin");
  await mkdir(bundledBinDir, { recursive: true });
  const bundledCommand = await createFakeCodex(bundledBinDir, "0.130.0");
  const originalPath = process.env.PATH;
  const originalPackageRoot = process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS;

  process.env.PATH = dirname(process.execPath);
  process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS = packageRoot;

  try {
    assert.equal(await resolveCodexCommand(), bundledCommand);
  } finally {
    process.env.PATH = originalPath;
    if (originalPackageRoot === undefined) {
      delete process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS;
    } else {
      process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS = originalPackageRoot;
    }
    __internal.resetCodexCommandCacheForTests();
  }
});

test("resolveCodexCommand는 PATH 후보보다 내장 Codex CLI를 우선 선택한다", async () => {
  __internal.resetCodexCommandCacheForTests();
  const packageRoot = await mkdtemp(join(tmpdir(), "dev-copilot-package-"));
  const bundledBinDir = join(packageRoot, "node_modules", ".bin");
  const pathDir = await mkdtemp(join(tmpdir(), "dev-copilot-codex-system-"));
  await mkdir(bundledBinDir, { recursive: true });
  const bundledCommand = await createFakeCodex(bundledBinDir, "0.130.0");
  await createFakeCodex(pathDir, "0.140.0");
  const originalPath = process.env.PATH;
  const originalEnvCommand = process.env.DEV_COPILOT_CODEX_BIN;
  const originalPackageRoot = process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS;

  process.env.PATH = [pathDir, dirname(process.execPath)].filter(Boolean).join(":");
  process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS = packageRoot;
  delete process.env.DEV_COPILOT_CODEX_BIN;

  try {
    assert.equal(await resolveCodexCommand(), bundledCommand);
  } finally {
    process.env.PATH = originalPath;
    if (originalEnvCommand === undefined) {
      delete process.env.DEV_COPILOT_CODEX_BIN;
    } else {
      process.env.DEV_COPILOT_CODEX_BIN = originalEnvCommand;
    }
    if (originalPackageRoot === undefined) {
      delete process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS;
    } else {
      process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS = originalPackageRoot;
    }
    __internal.resetCodexCommandCacheForTests();
  }
});
