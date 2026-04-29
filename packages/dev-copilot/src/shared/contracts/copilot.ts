export type CopilotMode = "answer" | "edit";
export type CopilotAgent = "codex" | "claude";

export interface CopilotChatRequest {
  selectedText: string;
  prompt: string;
  mode: CopilotMode;
  context?: {
    route?: string;
    fileHints?: string[];
    previousResponse?: string;
    agent?: CopilotAgent;
  };
}

export interface CopilotApplyRequest {
  patchId: string;
  approvalToken: string;
}

export interface CopilotChatResponse {
  message: string;
  patchPreview?: string;
  patchId?: string;
  warnings: string[];
}

export interface CopilotApplyResponse {
  applied: boolean;
  changedFiles: string[];
  summary: string;
}

export interface CopilotAgentStatusResponse {
  available: boolean;
  authenticated: boolean;
  agent: CopilotAgent;
  message: string;
  model?: string;
  loginCommand?: string;
}

export interface CopilotErrorResponse {
  error: string;
}
