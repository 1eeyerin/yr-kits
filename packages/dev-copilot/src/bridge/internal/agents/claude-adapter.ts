import { agentEditResponseSchemaJson } from "./edit-response-schema";
import {
  parseAnswerResponse,
  parseClaudeEditResponse,
  parseClaudeJsonOutput,
} from "./agent-response";
import {
  extractCliErrorDetails,
  isCliCommandMissing,
  isCliTimeout,
} from "./cli-error";
import { runCli } from "./run-cli";
import { buildAgentPrompt } from "../prompts";
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

const CLAUDE_MODEL = process.env.DEV_COPILOT_CLAUDE_MODEL ?? "haiku";
const CLAUDE_TIMEOUT_MS = Number(process.env.DEV_COPILOT_CLAUDE_TIMEOUT_MS ?? 120_000);
const AUTH_ERROR_PATTERN =
  /401|authentication|invalid authentication credentials|please run \/login|claude\s*\/login|로그인/i;

const toClaudeErrorMessage = (error: unknown) => {
  const details = extractCliErrorDetails(error);

  if (isCliTimeout(details)) {
    return "Claude Code 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (AUTH_ERROR_PATTERN.test(details.merged)) {
    return "Claude Code 로그인이 필요합니다. 터미널에서 `claude /login`을 실행해 주세요.";
  }

  if (isCliCommandMissing(details)) {
    return "Claude CLI를 찾을 수 없습니다. Claude Code CLI 설치 상태를 확인해 주세요.";
  }

  return details.message;
};

export const claudeAdapter: AgentAdapter = {
  agent: "claude",
  async run(request: AgentBridgeRequest): Promise<AgentBridgeResponse> {
    const prompt = buildAgentPrompt(request);
    const args = [
      "-p",
      "--output-format",
      "json",
      "--model",
      CLAUDE_MODEL,
      "--tools",
      "",
      "--strict-mcp-config",
      "--mcp-config",
      '{"mcpServers":{}}',
      ...(request.mode === "edit" ? ["--json-schema", agentEditResponseSchemaJson] : []),
      "--",
      prompt,
    ];

    try {
      const { stdout } = await runCli("claude", args, {
        cwd: request.cwd,
        timeoutMs: Number(process.env.DEV_COPILOT_AGENT_TIMEOUT_MS ?? CLAUDE_TIMEOUT_MS),
      });

      if (request.mode === "answer") {
        const { text } = parseClaudeJsonOutput(stdout);
        return parseAnswerResponse(text);
      }

      return parseClaudeEditResponse(stdout);
    } catch (error) {
      throw new Error(toClaudeErrorMessage(error));
    }
  },
  async getStatus(cwd: string): Promise<AgentStatus> {
    try {
      await runCli("claude", ["--version"], {
        cwd,
        timeoutMs: 5_000,
        maxBuffer: 1024 * 32,
      });

      return createAuthenticatedStatus({
        agent: "claude",
        message: "Claude Code CLI에 로그인되어 있습니다.",
        model: CLAUDE_MODEL,
      });
    } catch (error) {
      const details = extractCliErrorDetails(error);

      if (isCliCommandMissing(details)) {
        return createUnavailableStatus({
          agent: "claude",
          message: "Claude CLI를 찾을 수 없습니다.",
        });
      }

      if (AUTH_ERROR_PATTERN.test(details.merged)) {
        return createLoginRequiredStatus({
          agent: "claude",
          message: "Claude Code 로그인이 필요합니다.",
          loginCommand: "claude /login",
        });
      }

      return createUnauthenticatedStatus({
        agent: "claude",
        message: isCliTimeout(details)
          ? "Claude Code 상태 확인 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
          : `Claude Code 상태 확인에 실패했습니다: ${details.message}`,
        loginCommand: isCliTimeout(details) ? undefined : "claude /login",
      });
    }
  },
};

export const __internal = {
  toClaudeErrorMessage,
};
