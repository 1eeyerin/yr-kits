import { mkdir, mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import { test } from "node:test";

import { initHusky } from "./init-husky";

async function createTempProject(packageJson: object) {
  const cwd = await mkdtemp(join(tmpdir(), "yr-kits-husky-"));
  await writeFile(join(cwd, "package.json"), JSON.stringify(packageJson, null, 2), "utf-8");
  return cwd;
}

test("initHusky는 commit-msg 훅과 prepare 스크립트를 생성한다", async () => {
  const cwd = await createTempProject({ name: "fixture" });

  const result = await initHusky({
    cwd,
    templatesPath: join(process.cwd(), "src/templates"),
    skipInstall: true,
  });

  const hook = await readFile(join(cwd, ".husky", "commit-msg"), "utf-8");
  const hookStat = await stat(join(cwd, ".husky", "commit-msg"));
  const packageJson = JSON.parse(await readFile(join(cwd, "package.json"), "utf-8"));

  assert.equal(result.packageManager, "pnpm");
  assert.equal(result.prepareScriptAdded, true);
  assert.deepEqual(result.backupPaths, []);
  assert.deepEqual(result.installedPackages, ["husky"]);
  assert.match(hook, /커밋 메시지 형식이 올바르지 않습니다/);
  assert.equal(packageJson.scripts.prepare, "husky");
  assert.ok((hookStat.mode & 0o111) > 0);
});

test("initHusky는 기존 commit-msg 훅을 백업한다", async () => {
  const cwd = await createTempProject({ name: "fixture", scripts: { prepare: "husky" } });
  await mkdir(join(cwd, ".husky"), { recursive: true });
  await writeFile(join(cwd, ".husky", "commit-msg"), "legacy hook\n", "utf-8");

  const result = await initHusky({
    cwd,
    templatesPath: join(process.cwd(), "src/templates"),
    skipInstall: true,
    now: new Date("2026-05-13T05:30:12.000Z"),
  });

  const files = await readdir(join(cwd, ".husky"));
  const backupName = "commit-msg.original.20260513-143012";

  assert.deepEqual(result.backupPaths, [join(cwd, ".husky", backupName)]);
  assert.ok(files.includes(backupName));
  assert.equal(await readFile(join(cwd, ".husky", backupName), "utf-8"), "legacy hook\n");
  assert.equal(result.prepareScriptAdded, false);
});
