import { access, rm } from "node:fs/promises";
import { delimiter, join } from "node:path";

import { runCli } from "./run-cli";
import { STATUS_CHECK_TIMEOUT_MS } from "./constants";
import { createTempPath } from "../../shared/lib/temp-path";

interface CodexCommandCandidate {
  command: string;
  source: "env" | "path";
}

interface ResolvedCodexCommand extends CodexCommandCandidate {
  version: string;
  versionParts: number[];
}

const CODEX_SMOKE_MODEL = process.env.DEV_COPILOT_CODEX_MODEL ?? "gpt-5.3-codex";
const SMOKE_TEST_DISABLE_MCP_ARGS = [
  "-c",
  "mcp_servers.notion.enabled=false",
  "-c",
  "mcp_servers.figma.enabled=false",
  "-c",
  "mcp_servers.linear.enabled=false",
  "-c",
  "mcp_servers.context7.enabled=false",
  "-c",
  "mcp_servers.playwright.enabled=false",
  "-c",
  "mcp_servers.zeplin.enabled=false",
] as const;

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
  const candidates: CodexCommandCandidate[] = [];
  const envCommand = process.env.DEV_COPILOT_CODEX_BIN?.trim();

  if (envCommand) {
    candidates.push({ command: envCommand, source: "env" });
  }

  const executableNames = getPathExecutableNames();
  const pathCandidates = (process.env.PATH ?? "")
    .split(delimiter)
    .filter(Boolean)
    .flatMap((pathDir) => executableNames.map((name) => join(pathDir, name)));

  for (const command of pathCandidates) {
    if (await canAccess(command)) {
      candidates.push({ command, source: "path" });
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
    versionParts: version
      .split(/[.-]/)
      .slice(0, 3)
      .map((part) => Number.parseInt(part, 10) || 0),
  };
};

const canRunCodexExec = async (command: string) => {
  const outputPath = createTempPath("dev-copilot-codex-smoke", ".txt");

  try {
    await runCli(
      command,
      [
        ...SMOKE_TEST_DISABLE_MCP_ARGS,
        "exec",
        "--ephemeral",
        "--model",
        CODEX_SMOKE_MODEL,
        "--cd",
        process.cwd(),
        "--sandbox",
        "read-only",
        "--skip-git-repo-check",
        "--output-last-message",
        outputPath,
        "OK만 출력해줘.",
      ],
      {
        cwd: process.cwd(),
        timeoutMs: STATUS_CHECK_TIMEOUT_MS,
        maxBuffer: 1024 * 512,
      },
    );
    return true;
  } catch {
    return false;
  } finally {
    await rm(outputPath, { force: true });
  }
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
      return process.env.DEV_COPILOT_CODEX_BIN?.trim() || "codex";
    }

    const envCandidate = available.find((candidate) => candidate.source === "env");

    if (envCandidate) {
      return envCandidate.command;
    }

    for (const candidate of available) {
      if (await canRunCodexExec(candidate.command)) {
        return candidate.command;
      }
    }

    return available[0].command;
  })();

  return codexCommandPromise;
};
