import { promises as fs } from "node:fs";

import { buildAgentPrompt } from "../prompts";
import {
  parseCodexEditResponse,
  parseAnswerResponse,
} from "./agent-response";
import {
  extractCliErrorDetails,
  isCliCommandMissing,
} from "./cli-error";
import { agentEditResponseSchema } from "./edit-response-schema";
import { getCodexHealthCheck } from "./codex-health";
import { runCli } from "./run-cli";
import { getCodexExecutionEnv } from "./codex-home";
import {
  DEFAULT_AGENT_MAX_BUFFER_BYTES,
  DEFAULT_AGENT_TIMEOUT_MS,
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

export const codexAdapter: AgentAdapter = {
  agent: "codex",
  async warmup(cwd: string) {
    await getCodexHealthCheck(cwd);
  },
  async run(request: AgentBridgeRequest): Promise<AgentBridgeResponse> {
    const health = await getCodexHealthCheck(request.cwd);
    if (health.status !== "ready" || !health.command) {
      throw new Error(health.message);
    }

    const codexCommand = health.command;
    const outputPath = createTempPath("dev-copilot-codex", ".json");
    const schemaPath = createTempPath("dev-copilot-codex-schema", ".json");

    await fs.writeFile(
      schemaPath,
      JSON.stringify(agentEditResponseSchema),
      "utf-8",
    );

    const prompt = buildAgentPrompt(request);
    const env = await getCodexExecutionEnv();
    const args = [
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
      await runCli(codexCommand, args, {
        cwd: request.cwd,
        maxBuffer: DEFAULT_AGENT_MAX_BUFFER_BYTES,
        timeoutMs: Number(process.env.DEV_COPILOT_AGENT_TIMEOUT_MS ?? CODEX_TIMEOUT_MS),
        env,
      });

      if (request.mode === "answer") {
        const output = await fs.readFile(outputPath, "utf-8");
        return parseAnswerResponse(output);
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
    const health = await getCodexHealthCheck(cwd);

    if (health.status === "ready") {
      return createAuthenticatedStatus({
        agent: "codex",
        message: "Codex CLI에 로그인되어 있습니다.",
        model: health.model ?? CODEX_MODEL,
      });
    }

    if (health.status === "login_required") {
      return createLoginRequiredStatus({
        agent: "codex",
        message: health.message,
        loginCommand: health.loginCommand ?? "codex login",
      });
    }

    if (health.status === "unavailable") {
      return createUnavailableStatus({
        agent: "codex",
        message: health.message,
      });
    }

    return createUnauthenticatedStatus({
      agent: "codex",
      message: health.message,
    });
  },
};

export const __internal = {
  isCodexLoginRequiredError,
  toCodexErrorMessage,
};
