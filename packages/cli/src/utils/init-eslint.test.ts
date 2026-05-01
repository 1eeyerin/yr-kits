import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import { test } from "node:test";

import { initEslint } from "./init-eslint";

async function createTempProject(packageJson: object) {
  const cwd = await mkdtemp(join(tmpdir(), "yr-kits-eslint-"));
  await writeFile(join(cwd, "package.json"), JSON.stringify(packageJson, null, 2), "utf-8");
  return cwd;
}

test("initEslint는 react 타깃 설정 파일과 lint 스크립트를 생성한다", async () => {
  const cwd = await createTempProject({ name: "fixture" });

  const result = await initEslint({
    cwd,
    templatesPath: join(process.cwd(), "src/templates"),
    target: "react",
    skipInstall: true,
  });

  const config = await readFile(join(cwd, "eslint.config.mjs"), "utf-8");
  const packageJson = JSON.parse(await readFile(join(cwd, "package.json"), "utf-8"));

  assert.equal(result.target, "react");
  assert.equal(result.packageManager, "pnpm");
  assert.equal(result.backupPath, undefined);
  assert.match(config, /eslint-plugin-react/);
  assert.match(config, /@tanstack\/eslint-plugin-query/);
  assert.match(config, /from "globals"/);
  assert.equal(packageJson.scripts.lint, "eslint .");
});

test("initEslint는 next 타깃 설정 파일을 생성하고 기존 설정을 백업한다", async () => {
  const cwd = await createTempProject({ name: "fixture" });
  await writeFile(join(cwd, "eslint.config.mjs"), "export default [];\n", "utf-8");

  const result = await initEslint({
    cwd,
    templatesPath: join(process.cwd(), "src/templates"),
    target: "next",
    skipInstall: true,
    now: new Date("2026-05-13T05:30:12.000Z"),
  });

  const files = await readdir(cwd);
  const config = await readFile(join(cwd, "eslint.config.mjs"), "utf-8");
  const backupName = "eslint.config.original.20260513-143012.mjs";

  assert.equal(result.backupPath, join(cwd, backupName));
  assert.ok(files.includes(backupName));
  assert.equal(await readFile(join(cwd, backupName), "utf-8"), "export default [];\n");
  assert.match(config, /eslint-config-next\/core-web-vitals/);
  assert.match(config, /globalIgnores/);
});
