import type { CopilotAgent } from "../../../shared/contracts/copilot";
import type { AgentStatus } from "./types";

export const createAuthenticatedStatus = (params: {
  agent: CopilotAgent;
  message: string;
  model?: string;
}): AgentStatus => ({
  available: true,
  authenticated: true,
  agent: params.agent,
  message: params.message,
  model: params.model,
});

export const createLoginRequiredStatus = (params: {
  agent: CopilotAgent;
  message: string;
  loginCommand: string;
  available?: boolean;
}): AgentStatus => ({
  available: params.available ?? true,
  authenticated: false,
  agent: params.agent,
  message: params.message,
  loginCommand: params.loginCommand,
});

export const createUnavailableStatus = (params: {
  agent: CopilotAgent;
  message: string;
}): AgentStatus => ({
  available: false,
  authenticated: false,
  agent: params.agent,
  message: params.message,
});

export const createUnauthenticatedStatus = (params: {
  agent: CopilotAgent;
  message: string;
  loginCommand?: string;
  available?: boolean;
}): AgentStatus => ({
  available: params.available ?? true,
  authenticated: false,
  agent: params.agent,
  message: params.message,
  loginCommand: params.loginCommand,
});
