import type { CopilotChatResponse } from "../../shared/contracts/copilot";

export const hasApplicablePatch = (chatResult: CopilotChatResponse | null) => {
  return Boolean(chatResult?.patchId);
};
