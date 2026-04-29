import type { IncomingMessage, ServerResponse } from "node:http";

import type { CopilotApplyRequest, CopilotApplyResponse } from "../../../shared/contracts/copilot";
import { applySavedPatch } from "../patch-flow/patch-flow-service";
import type { DevCopilotBridgeConfig } from "../../shared/config/bridge-config";
import { readJsonBody } from "../../shared/http/read-json-body";
import { sendJson } from "../../shared/http/respond";

const toPatchSummary = (changedFiles: string[]) => {
  return changedFiles.length === 1
    ? "1개 파일에 수정이 반영되었습니다."
    : `${changedFiles.length}개 파일에 수정이 반영되었습니다.`;
};

export const handleApplyRoute = async (
  request: IncomingMessage,
  response: ServerResponse,
  config: DevCopilotBridgeConfig,
) => {
  const payload = await readJsonBody<CopilotApplyRequest>(request);

  if (!payload.patchId || !payload.approvalToken) {
    sendJson(response, config, 400, {
      error: "patchId와 approvalToken이 필요합니다.",
    });
    return;
  }

  const result = await applySavedPatch(config, payload.patchId, payload.approvalToken);

  const applyResponse: CopilotApplyResponse = {
    applied: true,
    changedFiles: result.changedFiles,
    summary: toPatchSummary(result.changedFiles),
  };

  sendJson(response, config, 200, applyResponse);
};
