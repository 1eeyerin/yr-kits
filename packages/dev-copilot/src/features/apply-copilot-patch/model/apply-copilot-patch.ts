import { createCopilotApiClient } from "../../../shared/api/create-copilot-api-client";
import type { CopilotApplyResponse } from "../../../shared/contracts/copilot";

export const applyCopilotPatch = async (
  patchId: string,
  baseUrl?: string,
): Promise<CopilotApplyResponse> => {
  const client = createCopilotApiClient({ baseUrl });

  return client.apply({
    patchId,
    approvalToken: `approve:${patchId}`,
  });
};
