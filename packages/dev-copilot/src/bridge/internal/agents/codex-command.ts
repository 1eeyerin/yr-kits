import type { CliCommandCandidate } from "./cli-candidates";
import { collectCliCandidates } from "./cli-candidates";
import { STATUS_CHECK_TIMEOUT_MS } from "./constants";
import { runCli } from "./run-cli";

interface ResolvedCodexCommand extends CliCommandCandidate {
  version: string;
}

let codexCommandPromise: Promise<string> | null = null;

const collectCodexCandidates = async () => {
  return collectCliCandidates({
    binaryName: "codex",
    envVarName: "DEV_COPILOT_CODEX_BIN",
    macBundleIds: ["com.openai.codex"],
    macAppNames: ["Codex"],
    windowsAppExecutableNames: ["Codex.exe", "codex.exe"],
  });
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

const resolveCandidate = async (candidate: CliCommandCandidate) => {
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
