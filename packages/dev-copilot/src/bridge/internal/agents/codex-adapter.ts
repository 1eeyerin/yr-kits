import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildAgentPrompt } from "../prompts";
import {
  parseAnswerResponse,
  parseCodexEditResponse,
} from "./agent-response";
import {
  extractCliErrorDetails,
  isCliCommandMissing,
} from "./cli-error";
import { agentEditResponseSchema } from "./edit-response-schema";
import { runCli } from "./run-cli";
import {
  createAuthenticatedStatus,
  createLoginRequiredStatus,
  createUnauthenticatedStatus,
  createUnavailableStatus,
} from "../../entities/agent/status";
import type {
  AgentAdapter,
  AgentBridgeRequest,
  AgentBridgeResponse,
  AgentStatus,
} from "../../entities/agent/types";

const CODEX_MODEL = process.env.DEV_COPILOT_CODEX_MODEL ?? "gpt-5.3-codex";
const CODEX_TIMEOUT_MS = Number(process.env.DEV_COPILOT_CODEX_TIMEOUT_MS ?? 120_000);
const fallbackDisableMcpArgs = [
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

interface CodexMcpServer {
  name: string;
}

let disableAllMcpArgsPromise: Promise<string[]> | null = null;

const getDisableAllMcpArgs = async () => {
  if (process.env.DEV_COPILOT_DISABLE_ALL_MCP === "false") {
    return [] as string[];
  }

  if (disableAllMcpArgsPromise) {
    return disableAllMcpArgsPromise;
  }

  disableAllMcpArgsPromise = (async () => {
    try {
      const { stdout } = await runCli("codex", ["mcp", "list", "--json"], {
        cwd: process.cwd(),
        timeoutMs: 10_000,
        maxBuffer: 1024 * 1024,
      });

      const parsed = JSON.parse(stdout) as CodexMcpServer[];
      const names = parsed
        .map((server) => server?.name?.trim())
        .filter((name): name is string => Boolean(name));

      if (!names.length) {
        return [...fallbackDisableMcpArgs];
      }

      return names.flatMap((name) => ["-c", `mcp_servers.${name}.enabled=false`]);
    } catch {
      return [...fallbackDisableMcpArgs];
    }
  })();

  return disableAllMcpArgsPromise;
};

const isCodexAuthenticatedFromStatus = (statusOutput: string) => {
  const normalized = statusOutput.toLowerCase();

  if (/not logged in|login required|로그인 필요/.test(normalized)) {
    return false;
  }

  return /logged in|로그인됨|로그인되어/.test(normalized);
};

const toCodexErrorMessage = (error: unknown) => {
  const details = extractCliErrorDetails(error);

  if (/requires a newer version of Codex/i.test(details.merged)) {
    return [
      "현재 설치된 Codex CLI 버전과 모델 조합이 호환되지 않습니다.",
      "Codex CLI를 업데이트하거나 DEV_COPILOT_CODEX_MODEL 값을 호환 가능한 모델로 지정해 주세요.",
    ].join(" ");
  }

  if (/migration .* is missing in the resolved migrations/i.test(details.merged)) {
    return [
      "Codex 로컬 상태 DB 마이그레이션 오류가 발생했습니다.",
      "Codex CLI를 최신 버전으로 업데이트한 뒤 다시 시도해 주세요.",
    ].join(" ");
  }

  if (/not logged in|login required|authentication|unauthorized/i.test(details.merged)) {
    return "Codex CLI 로그인이 필요합니다. 터미널에서 `codex login`을 실행해 주세요.";
  }

  if (isCliCommandMissing(details)) {
    return "Codex CLI를 찾을 수 없습니다. Codex CLI 설치 상태를 확인해 주세요.";
  }

  return details.message;
};

const getCodexModelName = async (cwd: string) => {
  const outputPath = path.join(
    os.tmpdir(),
    `dev-copilot-codex-status-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`,
  );

  try {
    const disableAllMcpArgs = await getDisableAllMcpArgs();
    const { stdout, stderr } = await runCli(
      "codex",
      [
        ...disableAllMcpArgs,
        "exec",
        "--model",
        CODEX_MODEL,
        "--cd",
        cwd,
        "--sandbox",
        "read-only",
        "--skip-git-repo-check",
        "--output-last-message",
        outputPath,
        "OK만 출력해줘.",
      ],
      {
        cwd,
        timeoutMs: 30_000,
        maxBuffer: 1024 * 512,
      },
    );
    const output = `${stdout}\n${stderr}`;
    const match = output.match(/^model:\s*(.+)$/m);

    return match?.[1]?.trim();
  } catch {
    return undefined;
  } finally {
    await fs.rm(outputPath, { force: true });
  }
};

export const codexAdapter: AgentAdapter = {
  agent: "codex",
  async run(request: AgentBridgeRequest): Promise<AgentBridgeResponse> {
    const disableAllMcpArgs = await getDisableAllMcpArgs();
    const outputPath = path.join(
      os.tmpdir(),
      `dev-copilot-codex-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
    );
    const schemaPath = path.join(
      os.tmpdir(),
      `dev-copilot-codex-schema-${Date.now()}-${Math.random().toString(16).slice(2)}.json`,
    );

    await fs.writeFile(
      schemaPath,
      JSON.stringify(agentEditResponseSchema),
      "utf-8",
    );

    const prompt = buildAgentPrompt(request);
    const args = [
      ...disableAllMcpArgs,
      "exec",
      "--model",
      CODEX_MODEL,
      "--cd",
      request.cwd,
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
      "--output-last-message",
      outputPath,
      ...(request.mode === "edit" ? ["--output-schema", schemaPath] : []),
      prompt,
    ];

    try {
      const { stdout } = await runCli("codex", args, {
        cwd: request.cwd,
        maxBuffer: 1024 * 1024 * 5,
        timeoutMs: Number(process.env.DEV_COPILOT_AGENT_TIMEOUT_MS ?? CODEX_TIMEOUT_MS),
      });

      if (request.mode === "answer") {
        try {
          const output = await fs.readFile(outputPath, "utf-8");
          return parseAnswerResponse(output);
        } catch {
          return parseAnswerResponse(stdout);
        }
      }

      return parseCodexEditResponse(await fs.readFile(outputPath, "utf-8"));
    } catch (error) {
      throw new Error(toCodexErrorMessage(error));
    } finally {
      await fs.rm(outputPath, { force: true });
      await fs.rm(schemaPath, { force: true });
    }
  },
  async getStatus(cwd: string): Promise<AgentStatus> {
    try {
      const { stdout, stderr } = await runCli("codex", ["login", "status"], {
        cwd,
        timeoutMs: 10_000,
        maxBuffer: 1024 * 128,
      });
      const output = `${stdout}\n${stderr}`.trim();
      const authenticated = isCodexAuthenticatedFromStatus(output);
      const model = authenticated ? await getCodexModelName(cwd) : undefined;

      if (authenticated) {
        return createAuthenticatedStatus({
          agent: "codex",
          message: "Codex CLI에 로그인되어 있습니다.",
          model,
        });
      }

      return createLoginRequiredStatus({
        agent: "codex",
        message: output || "Codex CLI 로그인이 필요합니다.",
        loginCommand: "codex login",
      });
    } catch (error) {
      const details = extractCliErrorDetails(error);

      if (isCliCommandMissing(details)) {
        return createUnavailableStatus({
          agent: "codex",
          message: "Codex CLI를 찾을 수 없습니다.",
        });
      }

      return createUnauthenticatedStatus({
        agent: "codex",
        message: details.message,
        loginCommand: "codex login",
      });
    }
  },
};

export const __internal = {
  toCodexErrorMessage,
};
