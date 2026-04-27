import type { CopilotAgent } from "../../types";
import { __internal as claudeInternal, claudeAdapter } from "./claude-adapter";
import { __internal as codexInternal, codexAdapter } from "./codex-adapter";
import type { AgentAdapter } from "./types";

const adapters: Record<CopilotAgent, AgentAdapter> = {
  codex: codexAdapter,
  claude: claudeAdapter,
};

export const resolveAgentAdapter = (agent: CopilotAgent): AgentAdapter => {
  return adapters[agent];
};

export { claudeAdapter, codexAdapter };
export const agentTestInternals = {
  claude: claudeInternal,
  codex: codexInternal,
};
export type { AgentAdapter, AgentBridgeRequest, AgentBridgeResponse, AgentStatus } from "./types";
