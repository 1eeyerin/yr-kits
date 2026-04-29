import type { CopilotAgent, CopilotAgentStatusResponse } from "../../shared/contracts/copilot";

export const AGENT_LABELS: Record<CopilotAgent, string> = {
  codex: "Codex CLI",
  claude: "Claude Code CLI",
};

export const isAgentReady = (status: CopilotAgentStatusResponse | null) => {
  if (!status) {
    return true;
  }

  return status.available && status.authenticated;
};
