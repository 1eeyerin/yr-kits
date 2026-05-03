import { collectCliCandidates } from "./cli-candidates";
import { runCli } from "./run-cli";
import { QUICK_STATUS_CHECK_TIMEOUT_MS } from "./constants";

let claudeCommandPromise: Promise<string> | null = null;

const CLAUDE_SMOKE_MODEL = process.env.DEV_COPILOT_CLAUDE_MODEL ?? "haiku";

const collectClaudeCandidates = () => {
  return collectCliCandidates({
    binaryName: "claude",
    envVarName: "DEV_COPILOT_CLAUDE_BIN",
    macAppNames: ["Claude"],
    windowsAppExecutableNames: ["Claude.exe", "claude.exe"],
  });
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
    const candidates = await collectClaudeCandidates();
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
