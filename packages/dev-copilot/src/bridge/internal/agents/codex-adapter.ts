import { promises as fs } from "node:fs";

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
import { resolveCodexCommand } from "./codex-command";
import {
  DEFAULT_AGENT_MAX_BUFFER_BYTES,
  DEFAULT_AGENT_TIMEOUT_MS,
  MODEL_STATUS_CHECK_TIMEOUT_MS,
  STATUS_CHECK_TIMEOUT_MS,
} from "./constants";
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
import { createTempPath } from "../../shared/lib/temp-path";

const CODEX_MODEL = process.env.DEV_COPILOT_CODEX_MODEL ?? "gpt-5.3-codex";
const CODEX_TIMEOUT_MS = Number(process.env.DEV_COPILOT_CODEX_TIMEOUT_MS ?? DEFAULT_AGENT_TIMEOUT_MS);
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

  const codexCommand = await resolveCodexCommand();

  if (disableAllMcpArgsPromise) {
    return disableAllMcpArgsPromise;
  }

  disableAllMcpArgsPromise = (async () => {
    try {
      const { stdout } = await runCli(codexCommand, ["mcp", "list", "--json"], {
        cwd: process.cwd(),
        timeoutMs: STATUS_CHECK_TIMEOUT_MS,
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

const isCodexLoginRequiredError = (error: unknown) => {
  const details = extractCliErrorDetails(error);

  return /not logged in|login required|authentication|unauthorized/i.test(details.merged);
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

  if (/Error loading config\.toml: invalid transport/i.test(details.merged)) {
    return [
      "현재 Codex CLI가 Codex 설정 파일의 MCP 형식을 해석하지 못했습니다.",
      "Dev Copilot이 호환되는 Codex 실행 파일을 자동으로 찾지 못했습니다.",
      "Codex CLI를 업데이트한 뒤 다시 시도해 주세요.",
    ].join(" ");
  }

  if (isCodexLoginRequiredError(error)) {
    return "Codex CLI 로그인이 필요합니다. 터미널에서 `codex login`을 실행해 주세요.";
  }

  if (isCliCommandMissing(details)) {
    return "Codex CLI를 찾을 수 없습니다. Codex CLI 설치 상태를 확인해 주세요.";
  }

  return details.message;
};

const getCodexModelName = async (cwd: string) => {
  const outputPath = createTempPath("dev-copilot-codex-status", ".txt");

  try {
    const codexCommand = await resolveCodexCommand();
    const disableAllMcpArgs = await getDisableAllMcpArgs();
    const { stdout, stderr } = await runCli(
      codexCommand,
      [
        ...disableAllMcpArgs,
        "exec",
        "--ephemeral",
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
        timeoutMs: MODEL_STATUS_CHECK_TIMEOUT_MS,
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
    const codexCommand = await resolveCodexCommand();
    const disableAllMcpArgs = await getDisableAllMcpArgs();
    const outputPath = createTempPath("dev-copilot-codex", ".json");
    const schemaPath = createTempPath("dev-copilot-codex-schema", ".json");

    await fs.writeFile(
      schemaPath,
      JSON.stringify(agentEditResponseSchema),
      "utf-8",
    );

    const prompt = buildAgentPrompt(request);
    const args = [
      ...disableAllMcpArgs,
      "exec",
      "--ephemeral",
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
      const { stdout } = await runCli(codexCommand, args, {
        cwd: request.cwd,
        maxBuffer: DEFAULT_AGENT_MAX_BUFFER_BYTES,
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
      const codexCommand = await resolveCodexCommand();
      const { stdout, stderr } = await runCli(codexCommand, ["login", "status"], {
        cwd,
        timeoutMs: STATUS_CHECK_TIMEOUT_MS,
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
        message: toCodexErrorMessage(error),
        loginCommand: isCodexLoginRequiredError(error) ? "codex login" : undefined,
      });
    }
  },
};

export const __internal = {
  isCodexLoginRequiredError,
  toCodexErrorMessage,
};
