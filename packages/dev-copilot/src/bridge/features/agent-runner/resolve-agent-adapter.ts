import type { CopilotAgent } from "../../../shared/contracts/copilot";
import type { AgentAdapter } from "../../entities/agent/types";
import { claudeAdapter } from "../../internal/agents/claude-adapter";
import { codexAdapter } from "../../internal/agents/codex-adapter";

const adapters: Record<CopilotAgent, AgentAdapter> = {
  codex: codexAdapter,
  claude: claudeAdapter,
};

export const resolveAgentAdapter = (agent: CopilotAgent): AgentAdapter => {
  return adapters[agent];
};
