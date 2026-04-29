import { createCopilotApiClient } from "../../../shared/api/create-copilot-api-client";
import type { CopilotAgent, CopilotChatResponse, CopilotMode } from "../../../shared/contracts/copilot";

interface SubmitCopilotRequestInput {
  selectedText: string;
  prompt: string;
  mode: CopilotMode;
  allowedPaths: string[];
  previousResponse?: string;
  selectedAgent: CopilotAgent;
  route?: string;
  baseUrl?: string;
}

export const submitCopilotRequest = async (
  input: SubmitCopilotRequestInput,
): Promise<CopilotChatResponse> => {
  const client = createCopilotApiClient({ baseUrl: input.baseUrl });

  return client.chat({
    selectedText: input.selectedText,
    prompt: input.prompt,
    mode: input.mode,
    context: {
      route: input.route,
      fileHints: input.allowedPaths,
      previousResponse: input.previousResponse,
      agent: input.selectedAgent,
    },
  });
};
