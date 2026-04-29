import type { IncomingMessage, ServerResponse } from "node:http";

import type {
  CopilotAgent,
  CopilotChatRequest,
  CopilotChatResponse,
} from "../../../shared/contracts/copilot";
import { resolveAgentAdapter } from "../agent-runner/resolve-agent-adapter";
import { buildCopilotProjectContext } from "../project-context/build-project-context";
import {
  buildPatchPreview,
  resolveAllowedPaths,
  saveProposedPatch,
  validatePatchPreview,
} from "../patch-flow/patch-flow-service";
import type { DevCopilotBridgeConfig } from "../../shared/config/bridge-config";
import { readJsonBody } from "../../shared/http/read-json-body";
import { sendJson } from "../../shared/http/respond";

const isCopilotAgent = (value: unknown): value is CopilotAgent => {
  return value === "codex" || value === "claude";
};

export const handleChatRoute = async (
  request: IncomingMessage,
  response: ServerResponse,
  config: DevCopilotBridgeConfig,
) => {
  const payload = await readJsonBody<CopilotChatRequest>(request);
  const effectiveAllowedPaths = resolveAllowedPaths(config, payload.context?.fileHints);
  const agent = isCopilotAgent(payload.context?.agent) ? payload.context.agent : config.agent;
  const adapter = resolveAgentAdapter(agent);

  if (!payload.prompt?.trim()) {
    sendJson(response, config, 400, { error: "프롬프트를 입력해 주세요." });
    return;
  }

  const projectContext = await buildCopilotProjectContext(config.rootDir, effectiveAllowedPaths, {
    selectedText: payload.selectedText,
    route: payload.context?.route,
    fileHints: payload.context?.fileHints,
  });

  const agentResponse = await adapter.run({
    selectedText: payload.selectedText ?? "",
    prompt: payload.prompt,
    mode: payload.mode,
    route: payload.context?.route,
    fileHints: payload.context?.fileHints,
    previousResponse: payload.context?.previousResponse,
    projectContext,
    cwd: config.rootDir,
  });

  if (payload.mode === "answer") {
    const answerResponse: CopilotChatResponse = {
      message: agentResponse.message,
      warnings: agentResponse.warnings,
    };

    sendJson(response, config, 200, answerResponse);
    return;
  }

  let patchPreview = "";

  try {
    patchPreview = await buildPatchPreview(agentResponse.changes, config, effectiveAllowedPaths);
  } catch (error) {
    sendJson(response, config, 200, {
      message:
        agentResponse.message ??
        "에이전트가 수정안을 만들었지만 실제 파일 내용과 매칭하지 못했습니다.",
      warnings: [
        ...(agentResponse.warnings ?? []),
        error instanceof Error ? error.message : "수정안 생성에 실패했습니다.",
      ],
    } satisfies CopilotChatResponse);
    return;
  }

  if (!patchPreview) {
    sendJson(response, config, 200, {
      message: agentResponse.message ?? "패치 제안을 생성하지 못했습니다.",
      warnings: [
        ...(agentResponse.warnings ?? []),
        "적용 가능한 변경 목록이 없어 패치 미리보기와 적용 버튼을 만들 수 없습니다.",
      ],
    } satisfies CopilotChatResponse);
    return;
  }

  try {
    await validatePatchPreview(patchPreview, config, effectiveAllowedPaths);
  } catch (error) {
    sendJson(response, config, 200, {
      message:
        agentResponse.message ??
        "에이전트가 수정안을 만들었지만 적용 가능한 diff 형식이 아닙니다.",
      patchPreview,
      warnings: [
        ...(agentResponse.warnings ?? []),
        error instanceof Error ? error.message : "patch 검증에 실패했습니다.",
      ],
    } satisfies CopilotChatResponse);
    return;
  }

  const patch = saveProposedPatch(patchPreview, effectiveAllowedPaths);
  sendJson(response, config, 200, {
    message: agentResponse.message ?? "에이전트가 패치 미리보기를 생성했습니다.",
    patchPreview,
    patchId: patch.patchId,
    warnings: agentResponse.warnings ?? [],
  } satisfies CopilotChatResponse);
};
