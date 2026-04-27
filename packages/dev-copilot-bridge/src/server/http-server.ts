import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import type {
  CopilotApplyRequest,
  CopilotApplyResponse,
  CopilotChatRequest,
  CopilotChatResponse,
} from "../types";
import type { DevCopilotBridgeConfig } from "../lib/config";
import { resolveAndValidatePath } from "../lib/guards";
import {
  getCodexAgentStatus,
  runCodexBridge,
} from "../internal/codex-bridge";
import { buildCopilotProjectContext } from "../internal/project-context";
import {
  applyUnifiedPatch,
  checkUnifiedPatch,
  createPatchFromTextReplacements,
  normalizeUnifiedPatch,
  validatePatchPaths,
} from "../lib/patch";
import {
  createProposedPatch,
  deleteProposedPatch,
  getProposedPatch,
} from "../lib/store";

type ParsedEditPayload = {
  message?: string;
  patchPreview?: string;
  changes?: Array<{
    path: string;
    oldText: string;
    newText: string;
  }>;
  warnings?: string[];
};

const toEditPayload = (rawText: string): ParsedEditPayload => {
  try {
    return JSON.parse(rawText) as ParsedEditPayload;
  } catch {
    return {
      message: "응답을 JSON으로 해석하지 못했습니다. 원문을 표시합니다.",
      patchPreview: rawText,
      warnings: ["모델 응답이 JSON 스키마를 따르지 않았습니다."],
    };
  }
};

const createCorsHeaders = (config: DevCopilotBridgeConfig) => ({
  "Access-Control-Allow-Origin": config.corsOrigin,
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
});

const sendJson = (
  response: ServerResponse,
  config: DevCopilotBridgeConfig,
  statusCode: number,
  payload: unknown,
) => {
  response.writeHead(statusCode, createCorsHeaders(config));
  response.end(JSON.stringify(payload));
};

const readJsonBody = async <T>(request: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf-8");
  return JSON.parse(raw) as T;
};

const createProjectContext = async (
  config: DevCopilotBridgeConfig,
  payload: CopilotChatRequest,
  allowedPaths: string[],
) => {
  return buildCopilotProjectContext(
    config.rootDir,
    allowedPaths,
    {
      selectedText: payload.selectedText,
      route: payload.context?.route,
      fileHints: payload.context?.fileHints,
    },
  );
};

const sanitizeAllowedPaths = (fileHints?: string[]) => {
  if (!fileHints?.length) {
    return null;
  }

  const sanitized = fileHints
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value) => value === "." || value === "*" || /^[A-Za-z0-9._-]+$/.test(value));

  return sanitized.length ? Array.from(new Set(sanitized)) : null;
};

const toPatchSummary = (changedFiles: string[]) => {
  return changedFiles.length === 1
    ? "1개 파일에 수정이 반영되었습니다."
    : `${changedFiles.length}개 파일에 수정이 반영되었습니다.`;
};

export const createDevCopilotBridgeServer = (config: DevCopilotBridgeConfig) => {
  const server = createServer(async (request, response) => {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", `http://${config.host}:${config.port}`);

    if (method === "OPTIONS") {
      response.writeHead(204, createCorsHeaders(config));
      response.end();
      return;
    }

    try {
      if (method === "GET" && url.pathname === "/status") {
        if (config.agent !== "codex") {
          sendJson(response, config, 200, {
            available: false,
            authenticated: false,
            agent: config.agent,
            message: "현재 지원되는 로컬 에이전트는 codex입니다.",
          });
          return;
        }

        sendJson(response, config, 200, await getCodexAgentStatus(config.rootDir));
        return;
      }

      if (method === "POST" && url.pathname === "/chat") {
        const payload = await readJsonBody<CopilotChatRequest>(request);
        const effectiveAllowedPaths =
          sanitizeAllowedPaths(payload.context?.fileHints) ?? config.allowedPaths;

        if (!payload.prompt?.trim()) {
          sendJson(response, config, 400, { error: "프롬프트를 입력해 주세요." });
          return;
        }

        const agentResponse = await runCodexBridge({
          selectedText: payload.selectedText ?? "",
          prompt: payload.prompt,
          mode: payload.mode,
          route: payload.context?.route,
          fileHints: payload.context?.fileHints,
          previousResponse: payload.context?.previousResponse,
          projectContext: await createProjectContext(config, payload, effectiveAllowedPaths),
          cwd: config.rootDir,
        });

        if (payload.mode === "answer") {
          const answerResponse: CopilotChatResponse = {
            message: agentResponse.message,
            warnings: [],
          };

          sendJson(response, config, 200, answerResponse);
          return;
        }

        const parsed = toEditPayload(JSON.stringify(agentResponse));
        let patchPreview = "";

        try {
          if (parsed.changes?.length) {
            patchPreview = await createPatchFromTextReplacements(
              parsed.changes,
              config.rootDir,
              (filePath) =>
                resolveAndValidatePath(filePath, effectiveAllowedPaths, config.rootDir),
            );
          } else if (parsed.patchPreview) {
            patchPreview = normalizeUnifiedPatch(parsed.patchPreview);
          }
        } catch (error) {
          const failedResponse: CopilotChatResponse = {
            message:
              parsed.message ??
              "Codex가 수정안을 만들었지만 실제 파일 내용과 매칭하지 못했습니다.",
            warnings: [
              ...(parsed.warnings ?? []),
              error instanceof Error ? error.message : "수정안 생성에 실패했습니다.",
            ],
          };

          sendJson(response, config, 200, failedResponse);
          return;
        }

        if (!patchPreview) {
          const emptyPatchResponse: CopilotChatResponse = {
            message: parsed.message ?? "패치 제안을 생성하지 못했습니다.",
            warnings: [
              ...(parsed.warnings ?? []),
              "적용 가능한 변경 목록이 없어 패치 미리보기와 적용 버튼을 만들 수 없습니다.",
            ],
          };

          sendJson(response, config, 200, emptyPatchResponse);
          return;
        }

        try {
          validatePatchPaths(patchPreview, (filePath) =>
            resolveAndValidatePath(filePath, effectiveAllowedPaths, config.rootDir),
          );
          await checkUnifiedPatch(patchPreview, config.rootDir);
        } catch (error) {
          const invalidPatchResponse: CopilotChatResponse = {
            message:
              parsed.message ??
              "Codex가 수정안을 만들었지만 적용 가능한 diff 형식이 아닙니다.",
            patchPreview,
            warnings: [
              ...(parsed.warnings ?? []),
              error instanceof Error ? error.message : "patch 검증에 실패했습니다.",
            ],
          };

          sendJson(response, config, 200, invalidPatchResponse);
          return;
        }

        const patch = createProposedPatch(patchPreview, effectiveAllowedPaths);
        const chatResponse: CopilotChatResponse = {
          message: parsed.message ?? "Codex가 패치 미리보기를 생성했습니다.",
          patchPreview,
          patchId: patch.patchId,
          warnings: parsed.warnings ?? [],
        };

        sendJson(response, config, 200, chatResponse);
        return;
      }

      if (method === "POST" && url.pathname === "/apply") {
        const payload = await readJsonBody<CopilotApplyRequest>(request);

        if (!payload.patchId || !payload.approvalToken) {
          sendJson(response, config, 400, {
            error: "patchId와 approvalToken이 필요합니다.",
          });
          return;
        }

        const proposedPatch = getProposedPatch(payload.patchId, payload.approvalToken);

        if (!proposedPatch) {
          sendJson(response, config, 400, {
            error: "유효하지 않거나 만료된 patchId입니다.",
          });
          return;
        }

        validatePatchPaths(proposedPatch.patchPreview, (filePath) =>
          resolveAndValidatePath(
            filePath,
            proposedPatch.allowedPaths?.length
              ? proposedPatch.allowedPaths
              : config.allowedPaths,
            config.rootDir,
          ),
        );

        const result = await applyUnifiedPatch(
          proposedPatch.patchPreview,
          config.rootDir,
          "local-codex-bridge",
        );
        deleteProposedPatch(payload.patchId);

        const applyResponse: CopilotApplyResponse = {
          applied: true,
          changedFiles: result.changedFiles,
          summary: toPatchSummary(result.changedFiles),
        };

        sendJson(response, config, 200, applyResponse);
        return;
      }

      sendJson(response, config, 404, { error: "지원하지 않는 경로입니다." });
    } catch (error) {
      sendJson(response, config, 500, {
        error:
          error instanceof Error
            ? error.message
            : "브리지 서버 처리 중 오류가 발생했습니다.",
      });
    }
  });

  return server;
};
