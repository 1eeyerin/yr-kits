import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

interface PackageJsonShape {
  name?: string;
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

interface InitCommandOptions {
  skipInstall?: boolean;
}

const PACKAGE_NAME = "@yr-kits/dev-copilot";
const SCRIPT_NAME = "dev-copilot-bridge";
const SCRIPT_VALUE = "dev-copilot-bridge";

const readOwnVersion = () => {
  const packageJsonPath = fileURLToPath(
    new URL("../../package.json", import.meta.url),
  );
  const content = readFileSync(packageJsonPath, "utf-8");
  const parsed = JSON.parse(content) as { version?: string };
  return parsed.version && parsed.version !== "0.0.0"
    ? parsed.version
    : "latest";
};

const detectPackageManager = (cwd: string, packageJson: PackageJsonShape): PackageManager => {
  const declared = packageJson.packageManager?.split("@")[0];

  if (declared === "pnpm" || declared === "npm" || declared === "yarn" || declared === "bun") {
    return declared;
  }

  if (existsSync(join(cwd, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (existsSync(join(cwd, "yarn.lock"))) {
    return "yarn";
  }

  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) {
    return "bun";
  }

  return "npm";
};

const getInstallCommand = (manager: PackageManager, spec: string) => {
  switch (manager) {
    case "pnpm":
      return { command: "pnpm", args: ["add", spec] };
    case "yarn":
      return { command: "yarn", args: ["add", spec] };
    case "bun":
      return { command: "bun", args: ["add", spec] };
    case "npm":
    default:
      return { command: "npm", args: ["install", spec] };
  }
};

const ensurePackageInstalled = (cwd: string, packageJson: PackageJsonShape) => {
  const installed =
    packageJson.dependencies?.[PACKAGE_NAME] ||
    packageJson.devDependencies?.[PACKAGE_NAME];

  if (installed) {
    process.stdout.write(`[dev-copilot:init] ${PACKAGE_NAME} 이미 설치되어 있습니다.\n`);
    return;
  }

  const manager = detectPackageManager(cwd, packageJson);
  const version = readOwnVersion();
  const spec = `${PACKAGE_NAME}@${version}`;
  const install = getInstallCommand(manager, spec);

  process.stdout.write(
    `[dev-copilot:init] ${manager}로 ${spec} 설치를 시작합니다.\n`,
  );

  const result = spawnSync(install.command, install.args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(`${PACKAGE_NAME} 설치에 실패했습니다.`);
  }
};

const ensureBridgeScript = (cwd: string, packageJsonPath: string, packageJson: PackageJsonShape) => {
  const nextPackageJson: PackageJsonShape = {
    ...packageJson,
    scripts: {
      ...(packageJson.scripts ?? {}),
    },
  };

  if (!nextPackageJson.scripts?.[SCRIPT_NAME]) {
    nextPackageJson.scripts![SCRIPT_NAME] = SCRIPT_VALUE;
    writeFileSync(packageJsonPath, `${JSON.stringify(nextPackageJson, null, 2)}\n`, "utf-8");
    process.stdout.write(
      `[dev-copilot:init] package.json scripts에 \"${SCRIPT_NAME}\"를 추가했습니다.\n`,
    );
    return;
  }

  process.stdout.write(
    `[dev-copilot:init] package.json scripts에 이미 \"${SCRIPT_NAME}\"가 있습니다.\n`,
  );
};

export const runInitCommand = async (options: InitCommandOptions = {}) => {
  const cwd = process.cwd();
  const packageJsonPath = join(cwd, "package.json");

  if (!existsSync(packageJsonPath)) {
    throw new Error("현재 디렉터리에 package.json이 없습니다.");
  }

  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf-8"),
  ) as PackageJsonShape;

  if (!options.skipInstall) {
    ensurePackageInstalled(cwd, packageJson);
  } else {
    process.stdout.write("[dev-copilot:init] --skip-install 옵션으로 설치 단계를 건너뜁니다.\n");
  }

  const refreshedPackageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf-8"),
  ) as PackageJsonShape;

  ensureBridgeScript(cwd, packageJsonPath, refreshedPackageJson);

  process.stdout.write(
    [
      "",
      "다음 단계",
      `1. pnpm run ${SCRIPT_NAME}`,
      "2. React 트리에 DevCopilotProvider와 DevCopilotOverlay를 연결합니다.",
      "3. 자세한 문서는 https://yr-kits.vercel.app/docs/dev-copilot/overview 를 확인합니다.",
    ].join("\n") + "\n",
  );
};
