import { access } from "node:fs/promises";
import { delimiter, dirname, join } from "node:path";

import { QUICK_STATUS_CHECK_TIMEOUT_MS } from "./constants";
import { runCli } from "./run-cli";

export interface CliCommandCandidate {
  command: string;
  source: "env" | "path" | "app";
}

interface CollectCliCandidatesOptions {
  binaryName: string;
  envVarName?: string;
  macBundleIds?: string[];
  macAppNames?: string[];
  windowsAppExecutableNames?: string[];
}

const canAccess = async (path: string) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const getExecutableNames = (binaryName: string) => {
  if (process.platform !== "win32") {
    return [binaryName];
  }

  const pathExts = process.env.PATHEXT?.split(";").filter(Boolean) ?? [".EXE", ".CMD", ".BAT"];
  return [binaryName, ...pathExts.map((ext) => `${binaryName}${ext.toLowerCase()}`)];
};

const getPathCandidates = (binaryName: string) => {
  const executableNames = getExecutableNames(binaryName);

  return (process.env.PATH ?? "")
    .split(delimiter)
    .filter(Boolean)
    .flatMap((pathDir) => executableNames.map((name) => join(pathDir, name)))
    .map((command) => ({ command, source: "path" as const }));
};

const runOptionalCli = async (command: string, args: string[]) => {
  try {
    const { stdout } = await runCli(command, args, {
      cwd: process.cwd(),
      timeoutMs: QUICK_STATUS_CHECK_TIMEOUT_MS,
      maxBuffer: 1024 * 128,
    });
    return stdout;
  } catch {
    return "";
  }
};

const getMacAppPaths = async (options: CollectCliCandidatesOptions) => {
  if (process.platform !== "darwin") {
    return [];
  }

  const queries = [
    ...(options.macBundleIds ?? []).map((bundleId) => `kMDItemCFBundleIdentifier == "${bundleId}"`),
    ...(options.macAppNames ?? []).map((appName) => `kMDItemFSName == "${appName}.app"`),
  ];
  const appPaths = new Set<string>();

  for (const query of queries) {
    const stdout = await runOptionalCli("mdfind", [query]);
    for (const line of stdout.split("\n")) {
      const appPath = line.trim();
      if (appPath.endsWith(".app")) {
        appPaths.add(appPath);
      }
    }
  }

  return [...appPaths];
};

const getMacAppCandidates = async (options: CollectCliCandidatesOptions) => {
  const appPaths = await getMacAppPaths(options);

  return appPaths.flatMap((appPath) => [
    {
      command: join(appPath, "Contents", "Resources", options.binaryName),
      source: "app" as const,
    },
    {
      command: join(appPath, "Contents", "MacOS", options.binaryName),
      source: "app" as const,
    },
  ]);
};

const parseWindowsRegistryDefaultValue = (stdout: string) => {
  for (const line of stdout.split("\n")) {
    const match = line.match(/^\s*\(Default\)\s+REG_\w+\s+(.+)\s*$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
};

const getWindowsAppPaths = async (options: CollectCliCandidatesOptions) => {
  if (process.platform !== "win32") {
    return [];
  }

  const appExecutableNames = options.windowsAppExecutableNames ?? [`${options.binaryName}.exe`];
  const registryRoots = [
    "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths",
    "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\App Paths",
  ];
  const appPaths = new Set<string>();

  for (const root of registryRoots) {
    for (const executableName of appExecutableNames) {
      const stdout = await runOptionalCli("reg", ["query", `${root}\\${executableName}`, "/ve"]);
      const appPath = parseWindowsRegistryDefaultValue(stdout);

      if (appPath) {
        appPaths.add(appPath.replace(/^"|"$/g, ""));
      }
    }
  }

  return [...appPaths];
};

const getWindowsAppCandidates = async (options: CollectCliCandidatesOptions) => {
  const appPaths = await getWindowsAppPaths(options);
  const executableNames = getExecutableNames(options.binaryName);

  return appPaths.flatMap((appPath) => {
    const appDir = dirname(appPath);
    return [
      { command: appPath, source: "app" as const },
      ...executableNames.flatMap((name) => [
        { command: join(appDir, name), source: "app" as const },
        { command: join(appDir, "resources", name), source: "app" as const },
        { command: join(appDir, "app", name), source: "app" as const },
      ]),
    ];
  });
};

export const collectCliCandidates = async (options: CollectCliCandidatesOptions) => {
  const candidates: CliCommandCandidate[] = [];
  const envCommand = options.envVarName ? process.env[options.envVarName]?.trim() : "";

  if (envCommand) {
    candidates.push({ command: envCommand, source: "env" });
  }

  candidates.push(...getPathCandidates(options.binaryName));
  candidates.push(...await getMacAppCandidates(options));
  candidates.push(...await getWindowsAppCandidates(options));

  const existingCandidates: CliCommandCandidate[] = [];
  for (const candidate of candidates) {
    if (candidate.source === "env" || await canAccess(candidate.command)) {
      existingCandidates.push(candidate);
    }
  }

  return Array.from(
    new Map(existingCandidates.map((candidate) => [candidate.command, candidate])).values(),
  );
};
