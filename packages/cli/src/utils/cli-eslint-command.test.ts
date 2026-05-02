import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import assert from "node:assert/strict";
import { test } from "node:test";

const execFileAsync = promisify(execFile);

async function buildCliFixture() {
  const outDir = await mkdtemp(join(process.cwd(), ".tmp-cli-command-"));

  await execFileAsync("pnpm", [
    "exec",
    "tsdown",
    "src/cli.ts",
    "--format",
    "esm",
    "--out-dir",
    outDir,
    "--clean",
  ]);
  await cp(join(process.cwd(), "src/templates"), join(outDir, "templates"), {
    recursive: true,
  });

  return join(outDir, "cli.mjs");
}

test("init eslint와 동일하게 설정 파일을 생성한다", async () => {
  const cliPath = await buildCliFixture();
  const outDir = join(cliPath, "..");
  const cwd = await mkdtemp(join(tmpdir(), "yr-kits-eslint-command-project-"));
  await writeFile(
    join(cwd, "package.json"),
    JSON.stringify({ name: "fixture" }),
    "utf-8",
  );

  try {
    const { stdout } = await execFileAsync(
      "node",
      [cliPath, "eslint", "--target", "react", "--skip-install"],
      { cwd },
    );

    const config = await readFile(join(cwd, "eslint.config.mjs"), "utf-8");

    assert.match(stdout, /eslint.config.mjs에 react 설정을 추가했어요/);
    assert.match(config, /eslint-plugin-react/);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("init eslint 명령은 지원하지 않는다", async () => {
  const cliPath = await buildCliFixture();
  const outDir = join(cliPath, "..");
  const cwd = await mkdtemp(
    join(tmpdir(), "yr-kits-init-eslint-command-project-"),
  );
  await writeFile(
    join(cwd, "package.json"),
    JSON.stringify({ name: "fixture" }),
    "utf-8",
  );

  try {
    await assert.rejects(
      execFileAsync(
        "node",
        [cliPath, "init", "eslint", "--target", "react", "--skip-install"],
        {
          cwd,
        },
      ),
      /unknown command|error: unknown command/i,
    );
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("prettier 명령은 Prettier 설정 파일을 생성한다", async () => {
  const cliPath = await buildCliFixture();
  const outDir = join(cliPath, "..");
  const cwd = await mkdtemp(join(tmpdir(), "yr-kits-prettier-command-project-"));
  await writeFile(join(cwd, "package.json"), JSON.stringify({ name: "fixture" }), "utf-8");

  try {
    const { stdout } = await execFileAsync(
      "node",
      [cliPath, "prettier", "--skip-install"],
      { cwd },
    );

    const config = await readFile(join(cwd, ".prettierrc.js"), "utf-8");

    assert.match(stdout, /\.prettierrc\.js 설정을 추가했어요/);
    assert.match(config, /prettier-plugin-tailwindcss/);
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});
