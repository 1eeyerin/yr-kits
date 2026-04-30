import type { CopilotAgent } from "../../../shared/contracts/copilot";
import type { AgentAdapter } from "../../entities/agent/types";
import { claudeAdapter } from "../../internal/agents/claude-adapter";
import { codexAdapter } from "../../internal/agents/codex-adapter";

const adapters: Record<CopilotAgent, AgentAdapter> = {
  codex: codexAdapter,
  claude: claudeAdapter,
};

const testAdapters: Partial<Record<CopilotAgent, AgentAdapter>> = {};

export const resolveAgentAdapter = (agent: CopilotAgent): AgentAdapter => {
  return testAdapters[agent] ?? adapters[agent];
};

export const __internal = {
  setAgentAdapterForTests: (agent: CopilotAgent, adapter: AgentAdapter) => {
    testAdapters[agent] = adapter;
  },
  resetAgentAdaptersForTests: () => {
    for (const agent of Object.keys(testAdapters) as CopilotAgent[]) {
      delete testAdapters[agent];
    }
  },
};
