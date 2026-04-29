import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { buildAgentPrompt } from "../prompts";
import type {
  AgentAdapter,
  AgentBridgeRequest,
  AgentBridgeResponse,
  AgentStatus,
} from "./types";

const execFileAsync = promisify(execFile);

type ClaudePrintJsonResponse = {
  result?: unknown;
  message?: unknown;
  output?: unknown;
  content?: unknown;
};

const AUTH_ERROR_PATTERN =
  /401|authentication|invalid authentication credentials|please run \/login|claude\s*\/login|로그인/i;

const extractErrorDetails = (error: unknown) => {
  const unknownRecord = error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const message = error instanceof Error ? error.message : String(error);
  const stderr = typeof unknownRecord?.stderr === "string" ? unknownRecord.stderr : "";
  const stdout = typeof unknownRecord?.stdout === "string" ? unknownRecord.stdout : "";
  const merged = [message, stderr, stdout]
    .map((part) => part.trim())
    .filter(Boolean)
    .join("\n");

  return {
    message,
    stderr,
    stdout,
    merged,
  };
};

const toClaudeErrorMessage = (error: unknown) => {
  const { message, merged } = extractErrorDetails(error);

  if (AUTH_ERROR_PATTERN.test(merged)) {
    return "Claude Code 로그인이 필요합니다. 터미널에서 `claude /login`을 실행해 주세요.";
  }

  if (/ENOENT/.test(merged)) {
    return "Claude CLI를 찾을 수 없습니다. Claude Code CLI 설치 상태를 확인해 주세요.";
  }

  return message;
};

const findFirstString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const text = value.trim();
    return text ? text : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstString(item);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferredKeys = ["result", "message", "output", "text", "content"];

    for (const key of preferredKeys) {
      if (key in record) {
        const found = findFirstString(record[key]);
        if (found) {
          return found;
        }
      }
    }

    for (const nestedValue of Object.values(record)) {
      const found = findFirstString(nestedValue);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

const parseClaudeJsonOutput = (raw: string) => {
  const parsed = JSON.parse(raw) as ClaudePrintJsonResponse;
  const text = findFirstString(parsed) ?? "";

  return {
    parsed,
    text,
  };
};

const parseClaudeEditResponse = (raw: string): AgentBridgeResponse => {
  const { text } = parseClaudeJsonOutput(raw);
  const parsed = JSON.parse(text) as AgentBridgeResponse;

  return {
    message: parsed.message,
    patchPreview: parsed.patchPreview,
    changes: parsed.changes,
    warnings: parsed.warnings ?? [],
  };
};

export const claudeAdapter: AgentAdapter = {
  agent: "claude",
  async run(request: AgentBridgeRequest): Promise<AgentBridgeResponse> {
    const prompt = buildAgentPrompt(request);
    const args = [
      "-p",
      "--output-format",
      "json",
      ...(request.mode === "edit"
        ? [
            "--json-schema",
            '{"type":"object","properties":{"message":{"type":"string"},"patchPreview":{"type":"string"},"warnings":{"type":"array","items":{"type":"string"}},"changes":{"type":"array","items":{"type":"object","properties":{"path":{"type":"string"},"oldText":{"type":"string"},"newText":{"type":"string"}},"required":["path","oldText","newText"],"additionalProperties":false}}},"required":["message"],"additionalProperties":false}',
          ]
        : []),
      prompt,
    ];

    try {
      const { stdout } = await execFileAsync("claude", args, {
        cwd: request.cwd,
        maxBuffer: 1024 * 1024 * 5,
        timeout: Number(process.env.DEV_COPILOT_AGENT_TIMEOUT_MS ?? 120_000),
        env: {
          ...process.env,
          NO_COLOR: "1",
        },
      });

      if (request.mode === "answer") {
        const { text } = parseClaudeJsonOutput(stdout);

        return {
          message: text,
          warnings: [],
        };
      }

      return parseClaudeEditResponse(stdout);
    } catch (error) {
      throw new Error(toClaudeErrorMessage(error));
    }
  },
  async getStatus(cwd: string): Promise<AgentStatus> {
    try {
      await execFileAsync("claude", ["-p", "--output-format", "json", "OK"], {
        cwd,
        timeout: 15_000,
        maxBuffer: 1024 * 512,
      });

      return {
        available: true,
        authenticated: true,
        agent: "claude",
        message: "Claude Code CLI에 로그인되어 있습니다.",
      };
    } catch (error) {
      const { merged, message } = extractErrorDetails(error);
      const unavailable = /ENOENT/.test(merged);
      const authError = AUTH_ERROR_PATTERN.test(merged);

      return {
        available: !unavailable,
        authenticated: false,
        agent: "claude",
        message: unavailable
          ? "Claude CLI를 찾을 수 없습니다."
          : authError
            ? "Claude Code 로그인이 필요합니다."
            : "Claude Code 상태 확인에 실패했습니다. 터미널에서 `claude /login` 실행 후 다시 시도해 주세요.",
        loginCommand: unavailable ? undefined : "claude /login",
      };
    }
  },
};

export const __internal = {
  findFirstString,
  parseClaudeJsonOutput,
  parseClaudeEditResponse,
  toClaudeErrorMessage,
};
