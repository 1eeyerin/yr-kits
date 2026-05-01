import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import { test } from "node:test";

import { ensureLintScript } from "./package-json";

async function createTempProject(packageJson: object) {
  const cwd = await mkdtemp(join(tmpdir(), "yr-kits-pkg-"));
  await writeFile(join(cwd, "package.json"), JSON.stringify(packageJson, null, 2), "utf-8");
  return cwd;
}

test("ensureLintScript는 lint 스크립트가 없으면 eslint .를 추가한다", async () => {
  const cwd = await createTempProject({ name: "fixture", scripts: { test: "node --test" } });

  const result = await ensureLintScript(cwd);
  const packageJson = JSON.parse(await readFile(join(cwd, "package.json"), "utf-8"));

  assert.equal(result, true);
  assert.equal(packageJson.scripts.lint, "eslint .");
  assert.equal(packageJson.scripts.test, "node --test");
});

test("ensureLintScript는 기존 lint 스크립트를 유지한다", async () => {
  const cwd = await createTempProject({ name: "fixture", scripts: { lint: "next lint" } });

  const result = await ensureLintScript(cwd);
  const packageJson = JSON.parse(await readFile(join(cwd, "package.json"), "utf-8"));

  assert.equal(result, false);
  assert.equal(packageJson.scripts.lint, "next lint");
});
