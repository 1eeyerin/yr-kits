import type { CopilotAgent, CopilotMode } from "../../../shared/contracts/copilot";

export interface AgentBridgeRequest {
  selectedText: string;
  prompt: string;
  mode: CopilotMode;
  route?: string;
  fileHints?: string[];
  projectContext?: string;
  previousResponse?: string;
  cwd: string;
}

export interface AgentBridgeResponse {
  message: string;
  patchPreview?: string;
  changes?: Array<{
    path: string;
    oldText: string;
    newText: string;
  }>;
  warnings: string[];
}

export interface AgentStatus {
  available: boolean;
  authenticated: boolean;
  agent: CopilotAgent;
  message: string;
  model?: string;
  loginCommand?: string;
}

export interface AgentAdapter {
  agent: CopilotAgent;
  warmup?(cwd: string): Promise<void>;
  run(request: AgentBridgeRequest): Promise<AgentBridgeResponse>;
  getStatus(cwd: string): Promise<AgentStatus>;
}
