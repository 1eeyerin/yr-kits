import { access } from "node:fs/promises";
import { delimiter, join } from "node:path";

import { STATUS_CHECK_TIMEOUT_MS } from "./constants";
import { runCli } from "./run-cli";

interface CodexCommandCandidate {
  command: string;
}

interface ResolvedCodexCommand extends CodexCommandCandidate {
  version: string;
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

const collectCodexCandidates = async () => {
  const executableNames = getPathExecutableNames();
  const candidates: CodexCommandCandidate[] = [];
  const pathCandidates = (process.env.PATH ?? "")
    .split(delimiter)
    .filter(Boolean)
    .flatMap((pathDir) => executableNames.map((name) => join(pathDir, name)));

  for (const command of pathCandidates) {
    if (await canAccess(command)) {
      candidates.push({ command });
    }
  }

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
      throw new Error("Codex CLI를 찾을 수 없습니다.");
    }

    return available[0].command;
  })();

  return codexCommandPromise;
};

export const __internal = {
  resetCodexCommandCacheForTests: () => {
    codexCommandPromise = null;
  },
};
