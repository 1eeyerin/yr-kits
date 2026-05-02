import { access, copyFile, readFile, rename, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

import { detectPackageManager, getInstallCommand, type PackageManager } from "./package-manager.js";
import { ensureFormatScript } from "./package-json.js";

export interface InitPrettierOptions {
  cwd: string;
  templatesPath: string;
  skipInstall?: boolean;
  now?: Date;
}

export interface InitPrettierResult {
  packageManager: PackageManager;
  backupPaths: string[];
  formatScriptAdded: boolean;
  installedPackages: string[];
}

const PRETTIER_PACKAGES = ["prettier", "prettier-plugin-tailwindcss"];

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

async function backupIfExists(cwd: string, filename: string, backupName: string) {
  const sourcePath = join(cwd, filename);

  if (!(await exists(sourcePath))) {
    return undefined;
  }

  const backupPath = join(cwd, backupName);
  await rename(sourcePath, backupPath);

  return backupPath;
}

async function copyTemplate(templatesPath: string, sourceName: string, cwd: string, destName: string) {
  const sourcePath = join(templatesPath, "configs", "prettier", sourceName);
  const destPath = join(cwd, destName);

  try {
    await copyFile(sourcePath, destPath);
  } catch {
    const content = await readFile(sourcePath, "utf-8");
    await writeFile(destPath, content, "utf-8");
  }
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

export async function initPrettier(options: InitPrettierOptions): Promise<InitPrettierResult> {
  const { cwd, templatesPath, skipInstall = false, now = new Date() } = options;
  const packageJsonPath = join(cwd, "package.json");

  if (!(await exists(packageJsonPath))) {
    throw new Error("현재 디렉터리에서 package.json을 찾을 수 없습니다.");
  }

  const timestamp = formatTimestamp(now);
  const packageManager = await detectPackageManager(cwd);
  const backupPaths = (
    await Promise.all([
      backupIfExists(cwd, ".prettierrc.js", `.prettierrc.original.${timestamp}.js`),
      backupIfExists(cwd, ".prettierignore", `.prettierignore.original.${timestamp}`),
    ])
  ).filter((path): path is string => !!path);

  await copyTemplate(templatesPath, "prettierrc.js", cwd, ".prettierrc.js");
  await copyTemplate(templatesPath, "prettierignore", cwd, ".prettierignore");

  const formatScriptAdded = await ensureFormatScript(cwd);

  if (!skipInstall) {
    await installPackages(cwd, packageManager, PRETTIER_PACKAGES);
  }

  return {
    packageManager,
    backupPaths,
    formatScriptAdded,
    installedPackages: PRETTIER_PACKAGES,
  };
}
