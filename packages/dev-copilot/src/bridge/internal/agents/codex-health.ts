import { readFile, rm, writeFile } from "node:fs/promises";

import { extractCliErrorDetails, isCliCommandMissing, isCliTimeout } from "./cli-error";
import {
  MODEL_STATUS_CHECK_TIMEOUT_MS,
  STATUS_CHECK_TIMEOUT_MS,
} from "./constants";
import { resolveCodexCommand } from "./codex-command";
import { getCodexExecutionEnv } from "./codex-home";
import { agentEditResponseSchema } from "./edit-response-schema";
import { runCli } from "./run-cli";
import { createTempPath } from "../../shared/lib/temp-path";

const CODEX_MODEL = process.env.DEV_COPILOT_CODEX_MODEL ?? "gpt-5.3-codex";

export type CodexHealthStatus =
  | "ready"
  | "unavailable"
  | "login_required"
  | "exec_failed"
  | "schema_failed"
  | "timeout";

export interface CodexHealthCheck {
  status: CodexHealthStatus;
  message: string;
  command?: string;
  model?: string;
  loginCommand?: string;
}

let codexHealthPromise: Promise<CodexHealthCheck> | null = null;

const isAuthenticatedFromStatus = (statusOutput: string) => {
  const normalized = statusOutput.toLowerCase();

  if (/not logged in|login required|로그인 필요/.test(normalized)) {
    return false;
  }

  return /logged in|로그인됨|로그인되어/.test(normalized);
};

const createSchemaSmokePayload = () =>
  JSON.stringify({
    message: "ok",
    warnings: [],
    changes: [
      {
        path: "src/App.tsx",
        oldText: "before",
        newText: "after",
      },
    ],
  });

const runExecSmokeTest = async (command: string, cwd: string, env: NodeJS.ProcessEnv) => {
  const outputPath = createTempPath("dev-copilot-codex-answer-smoke", ".txt");

  try {
    await runCli(
      command,
      [
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
        env,
      },
    );

    const output = await readFile(outputPath, "utf-8");
    if (!output.trim()) {
      throw new Error("Codex CLI smoke test output이 비어 있습니다.");
    }
  } finally {
    await rm(outputPath, { force: true });
  }
};

const runEditSchemaSmokeTest = async (command: string, cwd: string, env: NodeJS.ProcessEnv) => {
  const outputPath = createTempPath("dev-copilot-codex-edit-smoke", ".json");
  const schemaPath = createTempPath("dev-copilot-codex-edit-schema", ".json");

  try {
    await writeFile(schemaPath, JSON.stringify(agentEditResponseSchema), "utf-8");

    await runCli(
      command,
      [
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
        "--output-schema",
        schemaPath,
        "message에 ok, warnings에 빈 배열, changes에 한 개의 수정 항목만 담아 JSON으로 응답해줘.",
      ],
      {
        cwd,
        timeoutMs: MODEL_STATUS_CHECK_TIMEOUT_MS,
        maxBuffer: 1024 * 512,
        env,
      },
    );

    const output = await readFile(outputPath, "utf-8");
    if (output.trim() !== createSchemaSmokePayload()) {
      JSON.parse(output);
    }
  } finally {
    await rm(outputPath, { force: true });
    await rm(schemaPath, { force: true });
  }
};

export const getCodexHealthCheck = async (cwd: string): Promise<CodexHealthCheck> => {
  if (codexHealthPromise) {
    return codexHealthPromise;
  }

  codexHealthPromise = (async () => {
    let command: string;
    try {
      command = await resolveCodexCommand();
    } catch (error) {
      return {
        status: "unavailable",
        message:
          error instanceof Error
            ? error.message
            : "내장 Codex CLI를 찾을 수 없습니다.",
      } satisfies CodexHealthCheck;
    }

    const env = await getCodexExecutionEnv();

    try {
      const { stdout, stderr } = await runCli(command, ["login", "status"], {
        cwd,
        timeoutMs: STATUS_CHECK_TIMEOUT_MS,
        maxBuffer: 1024 * 128,
        env,
      });
      const statusText = stdout.trim() || stderr.trim();

      if (!isAuthenticatedFromStatus(statusText)) {
        return {
          status: "login_required",
          message: statusText || "Codex CLI 로그인이 필요합니다.",
          loginCommand: "codex login",
          command,
        } satisfies CodexHealthCheck;
      }
    } catch (error) {
      const details = extractCliErrorDetails(error);

      if (isCliTimeout(details)) {
        return {
          status: "timeout",
          message: "Codex CLI 상태 확인 중 시간이 초과되었습니다.",
          command,
        } satisfies CodexHealthCheck;
      }

      if (isCliCommandMissing(details)) {
        return {
          status: "unavailable",
          message: "내장 Codex CLI를 실행할 수 없습니다.",
        } satisfies CodexHealthCheck;
      }

      return {
        status: "login_required",
        message: details.message,
        loginCommand: "codex login",
        command,
      } satisfies CodexHealthCheck;
    }

    try {
      await runExecSmokeTest(command, cwd, env);
    } catch (error) {
      const details = extractCliErrorDetails(error);
      return {
        status: isCliTimeout(details) ? "timeout" : "exec_failed",
        message: isCliTimeout(details)
          ? "Codex CLI 답변 smoke test 중 시간이 초과되었습니다."
          : "Codex CLI 답변 smoke test에 실패했습니다.",
        command,
      } satisfies CodexHealthCheck;
    }

    try {
      await runEditSchemaSmokeTest(command, cwd, env);
    } catch (error) {
      const details = extractCliErrorDetails(error);
      return {
        status: isCliTimeout(details) ? "timeout" : "schema_failed",
        message: isCliTimeout(details)
          ? "Codex CLI edit schema smoke test 중 시간이 초과되었습니다."
          : "Codex CLI edit 응답 스키마 smoke test에 실패했습니다.",
        command,
      } satisfies CodexHealthCheck;
    }

    return {
      status: "ready",
      message: "Codex CLI가 응답 준비를 마쳤습니다.",
      command,
      model: CODEX_MODEL,
    } satisfies CodexHealthCheck;
  })();

  return codexHealthPromise;
};

export const __internal = {
  resetCodexHealthCheckCacheForTests: () => {
    codexHealthPromise = null;
  },
};
