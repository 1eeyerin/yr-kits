import type { IncomingMessage, ServerResponse } from "node:http";

import type { CopilotAgent } from "../../../shared/contracts/copilot";
import { resolveAgentAdapter } from "../agent-runner/resolve-agent-adapter";
import type { DevCopilotBridgeConfig } from "../../shared/config/bridge-config";
import { sendJson } from "../../shared/http/respond";

const isCopilotAgent = (value: string | null): value is CopilotAgent => {
  return value === "codex" || value === "claude";
};

export const handleStatusRoute = async (
  _request: IncomingMessage,
  response: ServerResponse,
  config: DevCopilotBridgeConfig,
  url: URL,
) => {
  const queryAgent = url.searchParams.get("agent");
  const agent = isCopilotAgent(queryAgent) ? queryAgent : config.agent;
  const adapter = resolveAgentAdapter(agent);

  sendJson(response, config, 200, await adapter.getStatus(config.rootDir));
};
