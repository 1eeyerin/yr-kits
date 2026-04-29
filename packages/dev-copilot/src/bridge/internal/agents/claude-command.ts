import { delimiter, join } from "node:path";

import { runCli } from "./run-cli";
import { QUICK_STATUS_CHECK_TIMEOUT_MS } from "./constants";

interface ClaudeCommandCandidate {
  command: string;
  source: "env" | "path";
}

let claudeCommandPromise: Promise<string> | null = null;

const CLAUDE_SMOKE_MODEL = process.env.DEV_COPILOT_CLAUDE_MODEL ?? "haiku";

const getPathExecutableNames = () => {
  if (process.platform !== "win32") {
    return ["claude"];
  }

  const pathExts = process.env.PATHEXT?.split(";").filter(Boolean) ?? [".EXE", ".CMD", ".BAT"];
  return ["claude", ...pathExts.map((ext) => `claude${ext.toLowerCase()}`)];
};

const collectClaudeCandidates = () => {
  const candidates: ClaudeCommandCandidate[] = [];
  const envCommand = process.env.DEV_COPILOT_CLAUDE_BIN?.trim();

  if (envCommand) {
    candidates.push({ command: envCommand, source: "env" });
  }

  const executableNames = getPathExecutableNames();
  const pathCandidates = (process.env.PATH ?? "")
    .split(delimiter)
    .filter(Boolean)
    .flatMap((pathDir) => executableNames.map((name) => join(pathDir, name)));

  for (const command of pathCandidates) {
    candidates.push({ command, source: "path" });
  }

  return Array.from(
    new Map(candidates.map((candidate) => [candidate.command, candidate])).values(),
  );
};

const canRunClaude = async (command: string) => {
  try {
    await runCli(
      command,
      [
        "-p",
        "--output-format",
        "json",
        "--model",
        CLAUDE_SMOKE_MODEL,
        "--tools",
        "",
        "--strict-mcp-config",
        "--mcp-config",
        '{"mcpServers":{}}',
        "--",
        "OK만 출력해줘.",
      ],
      {
        cwd: process.cwd(),
        timeoutMs: QUICK_STATUS_CHECK_TIMEOUT_MS,
        maxBuffer: 1024 * 128,
      },
    );
    return true;
  } catch {
    return false;
  }
};

export const resolveClaudeCommand = async () => {
  if (claudeCommandPromise) {
    return claudeCommandPromise;
  }

  claudeCommandPromise = (async () => {
    const candidates = collectClaudeCandidates();
    const envCandidate = candidates.find((candidate) => candidate.source === "env");

    if (envCandidate) {
      return envCandidate.command;
    }

    for (const candidate of candidates) {
      if (await canRunClaude(candidate.command)) {
        return candidate.command;
      }
    }

    return process.env.DEV_COPILOT_CLAUDE_BIN?.trim() || "claude";
  })();

  return claudeCommandPromise;
};
