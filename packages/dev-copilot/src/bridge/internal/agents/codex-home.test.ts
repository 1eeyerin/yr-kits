import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { __internal, getCodexExecutionEnv } from "./codex-home";

test("getCodexExecutionEnv는 MCP가 비어 있는 전용 CODEX_HOME을 만든다", async () => {
  __internal.resetCodexExecutionEnvCacheForTests();
  const sourceHome = await mkdtemp(join(tmpdir(), "dev-copilot-source-codex-home-"));
  await writeFile(join(sourceHome, "auth.json"), '{"token":"auth"}', "utf-8");
  await writeFile(join(sourceHome, ".credentials.json"), '{"token":"creds"}', "utf-8");

  const env = await getCodexExecutionEnv({ sourceCodexHome: sourceHome });
  const isolatedHome = env.CODEX_HOME;

  assert.ok(isolatedHome);
  assert.notEqual(isolatedHome, sourceHome);
  assert.equal(await readFile(join(isolatedHome, "auth.json"), "utf-8"), '{"token":"auth"}');
  assert.equal(
    await readFile(join(isolatedHome, ".credentials.json"), "utf-8"),
    '{"token":"creds"}',
  );
  assert.equal(await readFile(join(isolatedHome, "config.toml"), "utf-8"), "");
});

test("getCodexExecutionEnv는 결과를 캐시한다", async () => {
  __internal.resetCodexExecutionEnvCacheForTests();
  const envA = await getCodexExecutionEnv();
  const envB = await getCodexExecutionEnv();

  assert.equal(envA.CODEX_HOME, envB.CODEX_HOME);
});

test("resolveSourceCodexHome는 환경변수가 없으면 홈 디렉터리 .codex를 사용한다", async () => {
  const expected = join(homedir(), ".codex");
  assert.equal(__internal.resolveSourceCodexHome({}), expected);
});

test("resolveSourceCodexHome는 CODEX_HOME 환경변수를 우선한다", async () => {
  assert.equal(
    __internal.resolveSourceCodexHome({ CODEX_HOME: "/tmp/custom-codex-home" }),
    "/tmp/custom-codex-home",
  );
});
