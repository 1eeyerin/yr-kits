import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

type PackageJson = {
  scripts?: Record<string, string>;
  [key: string]: unknown;
};

export async function ensureLintScript(cwd: string): Promise<boolean> {
  const packageJsonPath = join(cwd, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8")) as PackageJson;

  packageJson.scripts ??= {};

  if (packageJson.scripts.lint) {
    return false;
  }

  packageJson.scripts.lint = "eslint .";
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf-8");

  return true;
}

export async function ensureFormatScript(cwd: string): Promise<boolean> {
  const packageJsonPath = join(cwd, "package.json");
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8")) as PackageJson;

  packageJson.scripts ??= {};

  if (packageJson.scripts.format) {
    return false;
  }

  packageJson.scripts.format = "prettier . --write";
  await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf-8");

  return true;
}
