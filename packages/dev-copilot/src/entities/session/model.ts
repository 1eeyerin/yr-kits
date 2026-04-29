import type { CopilotChatResponse } from "../../shared/contracts/copilot";

export const toPreviousResponse = (chatResult: CopilotChatResponse | null) => {
  if (!chatResult) {
    return undefined;
  }

  return [
    `message:\n${chatResult.message}`,
    chatResult.patchPreview ? `patchPreview:\n${chatResult.patchPreview}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
};
