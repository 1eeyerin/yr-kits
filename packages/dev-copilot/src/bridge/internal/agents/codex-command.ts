import { access } from "node:fs/promises";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

import { STATUS_CHECK_TIMEOUT_MS } from "./constants";
import { runCli } from "./run-cli";

interface CodexCommandCandidate {
  command: string;
}

interface ResolvedCodexCommand extends CodexCommandCandidate {
  version: string;
  versionParts: number[];
}

let codexCommandPromise: Promise<string> | null = null;

const canAccess = async (path: string) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const getPathExecutableNames = () => {
  if (process.platform !== "win32") {
    return ["codex"];
  }

  const pathExts = process.env.PATHEXT?.split(";").filter(Boolean) ?? [".EXE", ".CMD", ".BAT"];
  return ["codex", ...pathExts.map((ext) => `codex${ext.toLowerCase()}`)];
};

const getBundledSearchRoots = () => {
  const overrideRoot = process.env.DEV_COPILOT_PACKAGE_ROOT_FOR_TESTS?.trim();

  if (overrideRoot) {
    return [overrideRoot];
  }

  const roots: string[] = [];
  let current = dirname(fileURLToPath(import.meta.url));
  const { root } = parse(current);

  while (true) {
    roots.push(current);

    if (current === root) {
      break;
    }

    current = dirname(current);
  }

  return roots;
};

const collectBundledCodexCandidates = async () => {
  const executableNames = getPathExecutableNames();
  const candidates: CodexCommandCandidate[] = [];

  for (const root of getBundledSearchRoots()) {
    for (const name of executableNames) {
      const command = join(root, "node_modules", ".bin", name);

      if (await canAccess(command)) {
        candidates.push({ command });
      }
    }
  }

  return candidates;
};

const collectCodexCandidates = async () => {
  const candidates = await collectBundledCodexCandidates();

  return Array.from(
    new Map(candidates.map((candidate) => [candidate.command, candidate])).values(),
  );
};

const parseCodexVersion = (output: string) => {
  const version = output.match(/\d+\.\d+\.\d+(?:[-+][^\s]+)?/)?.[0];

  if (!version) {
    return null;
  }

  return {
    version,
    versionParts: version
      .split(/[.-]/)
      .slice(0, 3)
      .map((part) => Number.parseInt(part, 10) || 0),
  };
};

const resolveCandidate = async (candidate: CodexCommandCandidate) => {
  const { stdout, stderr } = await runCli(candidate.command, ["--version"], {
    cwd: process.cwd(),
    timeoutMs: STATUS_CHECK_TIMEOUT_MS,
    maxBuffer: 1024 * 128,
  });
  const parsedVersion = parseCodexVersion(`${stdout}\n${stderr}`);

  if (!parsedVersion) {
    return null;
  }

  return {
    ...candidate,
    ...parsedVersion,
  } satisfies ResolvedCodexCommand;
};

const compareCodexVersionDesc = (left: ResolvedCodexCommand, right: ResolvedCodexCommand) => {
  for (let index = 0; index < 3; index += 1) {
    const diff = right.versionParts[index] - left.versionParts[index];

    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
};

export const resolveCodexCommand = async () => {
  if (codexCommandPromise) {
    return codexCommandPromise;
  }

  codexCommandPromise = (async () => {
    const candidates = await collectCodexCandidates();
    const resolved = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          return await resolveCandidate(candidate);
        } catch {
          return null;
        }
      }),
    );
    const available = resolved.filter((candidate): candidate is ResolvedCodexCommand => Boolean(candidate));

    if (!available.length) {
      throw new Error("내장 Codex CLI를 찾을 수 없습니다.");
    }

    return available.sort(compareCodexVersionDesc)[0].command;
  })();

  return codexCommandPromise;
};

export const __internal = {
  resetCodexCommandCacheForTests: () => {
    codexCommandPromise = null;
  },
};
