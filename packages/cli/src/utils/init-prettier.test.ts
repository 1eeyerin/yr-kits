import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import { test } from "node:test";

import { initPrettier } from "./init-prettier";

async function createTempProject(packageJson: object) {
  const cwd = await mkdtemp(join(tmpdir(), "yr-kits-prettier-"));
  await writeFile(join(cwd, "package.json"), JSON.stringify(packageJson, null, 2), "utf-8");
  return cwd;
}

test("initPrettier는 Prettier 설정과 format 스크립트를 생성한다", async () => {
  const cwd = await createTempProject({ name: "fixture" });

  const result = await initPrettier({
    cwd,
    templatesPath: join(process.cwd(), "src/templates"),
    skipInstall: true,
  });

  const prettierConfig = await readFile(join(cwd, ".prettierrc.js"), "utf-8");
  const prettierIgnore = await readFile(join(cwd, ".prettierignore"), "utf-8");
  const packageJson = JSON.parse(await readFile(join(cwd, "package.json"), "utf-8"));

  assert.equal(result.packageManager, "pnpm");
  assert.equal(result.formatScriptAdded, true);
  assert.deepEqual(result.backupPaths, []);
  assert.match(prettierConfig, /singleQuote: true/);
  assert.match(prettierConfig, /plugins: \["prettier-plugin-tailwindcss"\]/);
  assert.match(prettierIgnore, /\.next\//);
  assert.equal(packageJson.scripts.format, "prettier . --write");
});

test("initPrettier는 기존 설정 파일을 백업한다", async () => {
  const cwd = await createTempProject({ name: "fixture", scripts: { format: "prettier --check ." } });
  await writeFile(join(cwd, ".prettierrc.js"), "module.exports = {};\n", "utf-8");
  await writeFile(join(cwd, ".prettierignore"), "dist/\n", "utf-8");

  const result = await initPrettier({
    cwd,
    templatesPath: join(process.cwd(), "src/templates"),
    skipInstall: true,
    now: new Date("2026-05-13T05:30:12.000Z"),
  });

  const files = await readdir(cwd);

  assert.deepEqual(result.backupPaths, [
    join(cwd, ".prettierrc.original.20260513-143012.js"),
    join(cwd, ".prettierignore.original.20260513-143012"),
  ]);
  assert.ok(files.includes(".prettierrc.original.20260513-143012.js"));
  assert.ok(files.includes(".prettierignore.original.20260513-143012"));
  assert.equal(await readFile(join(cwd, ".prettierrc.original.20260513-143012.js"), "utf-8"), "module.exports = {};\n");
  assert.equal(await readFile(join(cwd, ".prettierignore.original.20260513-143012"), "utf-8"), "dist/\n");
  assert.equal(result.formatScriptAdded, false);
});
