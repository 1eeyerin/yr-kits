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

test("resolveCodexCommand는 PATH에서 Codex CLI를 찾지 못하면 오류를 던진다", async () => {
  __internal.resetCodexCommandCacheForTests();
  const oldDir = await mkdtemp(join(tmpdir(), "dev-copilot-codex-old-"));
  const newDir = await mkdtemp(join(tmpdir(), "dev-copilot-codex-new-"));
  const originalPath = process.env.PATH;

  process.env.PATH = [oldDir, newDir, dirname(process.execPath)].filter(Boolean).join(":");

  try {
    await assert.rejects(
      () => resolveCodexCommand(),
      /Codex CLI를 찾을 수 없습니다/,
    );
  } finally {
    process.env.PATH = originalPath;
    __internal.resetCodexCommandCacheForTests();
  }
});

test("resolveCodexCommand는 PATH의 첫 번째 실행 가능한 Codex CLI를 사용한다", async () => {
  __internal.resetCodexCommandCacheForTests();
  const pathDir = await mkdtemp(join(tmpdir(), "dev-copilot-codex-path-"));
  const codexCommand = await createFakeCodex(pathDir, "0.130.0");
  const originalPath = process.env.PATH;

  process.env.PATH = [pathDir, dirname(process.execPath)].filter(Boolean).join(":");

  try {
    assert.equal(await resolveCodexCommand(), codexCommand);
  } finally {
    process.env.PATH = originalPath;
    __internal.resetCodexCommandCacheForTests();
  }
});

test("resolveCodexCommand는 PATH 순서를 따른다", async () => {
  __internal.resetCodexCommandCacheForTests();
  const firstDir = await mkdtemp(join(tmpdir(), "dev-copilot-codex-first-"));
  const secondDir = await mkdtemp(join(tmpdir(), "dev-copilot-codex-second-"));
  const firstCommand = await createFakeCodex(firstDir, "0.111.0");
  await createFakeCodex(secondDir, "0.140.0");
  const originalPath = process.env.PATH;

  process.env.PATH = [firstDir, secondDir, dirname(process.execPath)].filter(Boolean).join(":");

  try {
    assert.equal(await resolveCodexCommand(), firstCommand);
  } finally {
    process.env.PATH = originalPath;
    __internal.resetCodexCommandCacheForTests();
  }
});

test("resolveCodexCommand는 PATH에 없어도 macOS 앱 등록 위치에서 Codex CLI를 찾는다", async () => {
  __internal.resetCodexCommandCacheForTests();
  const toolDir = await mkdtemp(join(tmpdir(), "dev-copilot-codex-tools-"));
  const appParentDir = await mkdtemp(join(tmpdir(), "dev-copilot-codex-app-"));
  const appDir = join(appParentDir, "Codex.app");
  const resourcesDir = join(appDir, "Contents", "Resources");
  await mkdir(resourcesDir, { recursive: true });
  const codexCommand = await createFakeCodex(resourcesDir, "0.150.0");
  const mdfindPath = join(toolDir, "mdfind");
  const originalPath = process.env.PATH;

  await writeFile(
    mdfindPath,
    `#!/usr/bin/env node
console.log(${JSON.stringify(appDir)});
`,
    { mode: 0o755 },
  );

  process.env.PATH = [toolDir, dirname(process.execPath)].filter(Boolean).join(":");

  try {
    assert.equal(await resolveCodexCommand(), codexCommand);
  } finally {
    process.env.PATH = originalPath;
    __internal.resetCodexCommandCacheForTests();
  }
});
