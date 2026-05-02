import { access, copyFile, readFile, rename, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

import { detectPackageManager, getInstallCommand, type PackageManager } from "./package-manager.js";
import { ensureLintScript } from "./package-json.js";

export type EslintTarget = "react" | "next";

export interface InitEslintOptions {
  cwd: string;
  templatesPath: string;
  target: EslintTarget;
  skipInstall?: boolean;
  now?: Date;
}

export interface InitEslintResult {
  target: EslintTarget;
  packageManager: PackageManager;
  backupPath?: string;
  lintScriptAdded: boolean;
  installedPackages: string[];
}

const COMMON_PACKAGES = [
  "@eslint/js",
  "@tanstack/eslint-plugin-query",
  "eslint",
  "eslint-config-prettier",
  "eslint-plugin-import",
  "eslint-plugin-prettier",
  "eslint-plugin-unused-imports",
  "globals",
  "prettier",
  "typescript",
];

const TARGET_PACKAGES: Record<EslintTarget, string[]> = {
  react: [
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "eslint-plugin-react",
    "eslint-plugin-react-hooks",
  ],
  next: ["eslint-config-next"],
};

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function formatTimestamp(date: Date): string {
  const parts = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ].map((value) => String(value).padStart(2, "0"));

  return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}`;
}

async function backupExistingConfig(cwd: string, now: Date): Promise<string | undefined> {
  const configPath = join(cwd, "eslint.config.mjs");

  if (!(await exists(configPath))) {
    return undefined;
  }

  const backupPath = join(cwd, `eslint.config.original.${formatTimestamp(now)}.mjs`);
  await rename(configPath, backupPath);

  return backupPath;
}

async function installPackages(cwd: string, packageManager: PackageManager, packages: string[]) {
  const { command, args } = getInstallCommand(packageManager, packages);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} 명령이 실패했습니다. 종료 코드: ${code}`));
    });
  });
}

export async function initEslint(options: InitEslintOptions): Promise<InitEslintResult> {
  const { cwd, templatesPath, target, skipInstall = false, now = new Date() } = options;
  const packageJsonPath = join(cwd, "package.json");

  if (!(await exists(packageJsonPath))) {
    throw new Error("현재 디렉터리에서 package.json을 찾을 수 없습니다.");
  }

  const packageManager = await detectPackageManager(cwd);
  const backupPath = await backupExistingConfig(cwd, now);
  const sourcePath = join(templatesPath, "configs", "eslint", `${target}.config.mjs`);
  const configPath = join(cwd, "eslint.config.mjs");

  try {
    await copyFile(sourcePath, configPath);
  } catch {
    const content = await readFile(sourcePath, "utf-8");
    await writeFile(configPath, content, "utf-8");
  }

  const lintScriptAdded = await ensureLintScript(cwd);
  const installedPackages = [...COMMON_PACKAGES, ...TARGET_PACKAGES[target]];

  if (!skipInstall) {
    await installPackages(cwd, packageManager, installedPackages);
  }

  return {
    target,
    packageManager,
    backupPath,
    lintScriptAdded,
    installedPackages,
  };
}
