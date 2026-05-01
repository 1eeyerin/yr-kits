import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import assert from "node:assert/strict";
import { test } from "node:test";

import { detectPackageManager } from "./package-manager";

async function createTempProject() {
  return await mkdtemp(join(tmpdir(), "yr-kits-pm-"));
}

test("detectPackageManager는 pnpm-lock.yaml이 있으면 pnpm을 반환한다", async () => {
  const cwd = await createTempProject();
  await writeFile(join(cwd, "pnpm-lock.yaml"), "", "utf-8");

  assert.equal(await detectPackageManager(cwd), "pnpm");
});

test("detectPackageManager는 lockfile이 없으면 pnpm을 기본값으로 반환한다", async () => {
  const cwd = await createTempProject();

  assert.equal(await detectPackageManager(cwd), "pnpm");
});
