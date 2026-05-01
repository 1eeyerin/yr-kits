import { access } from "node:fs/promises";
import { join } from "node:path";

export type PackageManager = "pnpm" | "yarn" | "npm";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function detectPackageManager(cwd: string): Promise<PackageManager> {
  if (await exists(join(cwd, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (await exists(join(cwd, "yarn.lock"))) {
    return "yarn";
  }

  if (await exists(join(cwd, "package-lock.json"))) {
    return "npm";
  }

  return "pnpm";
}

export function getInstallCommand(packageManager: PackageManager, packages: string[]) {
  if (packageManager === "pnpm") {
    return { command: "pnpm", args: ["add", "-D", ...packages] };
  }

  if (packageManager === "yarn") {
    return { command: "yarn", args: ["add", "-D", ...packages] };
  }

  return { command: "npm", args: ["install", "-D", ...packages] };
}
