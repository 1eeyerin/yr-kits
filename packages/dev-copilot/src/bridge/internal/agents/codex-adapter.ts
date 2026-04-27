import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { buildAgentPrompt } from "../prompts";
import type {
  AgentAdapter,
  AgentBridgeRequest,
  AgentBridgeResponse,
  AgentStatus,
} from "./types";

const execFileAsync = promisify(execFile);
const codexBridgeConfigArgs = [
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
const codexDiffResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
    changes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          oldText: { type: "string" },
          newText: { type: "string" },
        },
        required: ["path", "oldText", "newText"],
        additionalProperties: false,
      },
    },
  },
  required: ["message", "warnings", "changes"],
  additionalProperties: false,
} as const;

const parseAnswerResponse = (rawOutput: string): AgentBridgeResponse => {
  return {
    message: rawOutput.trim(),
    warnings: [],
  };
};

const parseEditResponse = async (outputPath: string) => {
  const content = await fs.readFile(outputPath, "utf-8");
  const parsed = JSON.parse(content) as AgentBridgeResponse;

  return {
    message: parsed.message,
    patchPreview: parsed.patchPreview,
    changes: parsed.changes,
    warnings: parsed.warnings ?? [],
  };
};

const isCodexAuthenticatedFromStatus = (statusOutput: string) => {
  const normalized = statusOutput.toLowerCase();

  if (/not logged in|login required|로그인 필요/.test(normalized)) {
    return false;
  }

  return /logged in|로그인됨|로그인되어/.test(normalized);
};

const toCodexErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  if (/not logged in|login required|authentication|unauthorized/i.test(message)) {
    return "Codex CLI 로그인이 필요합니다. 터미널에서 `codex login`을 실행해 주세요.";
  }

  if (/ENOENT/.test(message)) {
    return "Codex CLI를 찾을 수 없습니다. Codex CLI 설치 상태를 확인해 주세요.";
  }

  return message;
};

const getCodexModelName = async (cwd: string) => {
  const outputPath = path.join(
    os.tmpdir(),
    `dev-copilot-codex-status-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`,
  );

  try {
    const { stdout, stderr } = await execFileAsync(
      "codex",
      [
        ...codexBridgeConfigArgs,
        "exec",
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
        timeout: 30_000,
        maxBuffer: 1024 * 512,
        env: {
          ...process.env,
          NO_COLOR: "1",
        },
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
      JSON.stringify(codexDiffResponseSchema),
      "utf-8",
    );

    const prompt = buildAgentPrompt(request);
    const args = [
      ...codexBridgeConfigArgs,
      "exec",
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
      const { stdout } = await execFileAsync("codex", args, {
        cwd: request.cwd,
        maxBuffer: 1024 * 1024 * 5,
        timeout: Number(process.env.DEV_COPILOT_AGENT_TIMEOUT_MS ?? 120_000),
        env: {
          ...process.env,
          NO_COLOR: "1",
        },
      });

      if (request.mode === "answer") {
        try {
          const output = await fs.readFile(outputPath, "utf-8");
          return parseAnswerResponse(output);
        } catch {
          return parseAnswerResponse(stdout);
        }
      }

      return await parseEditResponse(outputPath);
    } catch (error) {
      throw new Error(toCodexErrorMessage(error));
    } finally {
      await fs.rm(outputPath, { force: true });
      await fs.rm(schemaPath, { force: true });
    }
  },
  async getStatus(cwd: string): Promise<AgentStatus> {
    try {
      const { stdout, stderr } = await execFileAsync("codex", ["login", "status"], {
        cwd,
        timeout: 10_000,
        maxBuffer: 1024 * 128,
      });
      const output = `${stdout}\n${stderr}`.trim();
      const authenticated = isCodexAuthenticatedFromStatus(output);
      const model = authenticated ? await getCodexModelName(cwd) : undefined;

      return {
        available: true,
        authenticated,
        agent: "codex",
        message: authenticated
          ? output || "Codex CLI에 로그인되어 있습니다."
          : output || "Codex CLI 로그인이 필요합니다.",
        model,
        loginCommand: authenticated ? undefined : "codex login",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Codex CLI 상태 확인에 실패했습니다.";

      return {
        available: !message.includes("ENOENT"),
        authenticated: false,
        agent: "codex",
        message: message.includes("ENOENT")
          ? "Codex CLI를 찾을 수 없습니다."
          : message,
        loginCommand: message.includes("ENOENT") ? undefined : "codex login",
      };
    }
  },
};

export const __internal = {
  toCodexErrorMessage,
};
