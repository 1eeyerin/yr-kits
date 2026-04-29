import type { CopilotMode } from "../../shared/contracts/copilot";

export interface AgentPromptRequest {
  selectedText: string;
  prompt: string;
  mode: CopilotMode;
  route?: string;
  fileHints?: string[];
  projectContext?: string;
  previousResponse?: string;
}

export const buildAgentPrompt = (request: AgentPromptRequest) => {
  if (request.mode === "answer") {
    return [
      "Answer the user's web overlay request.",
      "Do not modify files.",
      "Use the provided project context when it is relevant.",
      "Respond in Korean.",
      "Keep the answer concise and actionable.",
      "",
      `Current route: ${request.route ?? "unknown"}`,
      `Selected text:\n${request.selectedText || "(none)"}`,
      `User prompt:\n${request.prompt}`,
      `Previous AI response:\n${request.previousResponse ?? "(none)"}`,
      `Project context:\n${request.projectContext ?? "(none)"}`,
    ].join("\n");
  }

  return [
    "You are a local code-edit proposal generator called from a web overlay.",
    "Do not modify files directly.",
    "Return JSON only.",
    "Do not generate unified diff directly.",
    "Put repository-relative file path(path), exact old text(oldText), and replacement text(newText) into the changes array.",
    "Never use absolute paths. The path must be relative to the repository root, for example src/features/article/model/data.ts.",
    "oldText must exactly match the file content and must not use ellipsis.",
    "Ground the proposal in the selected text, user prompt, and provided project context.",
    "Write the message field in Korean.",
    "",
    `Current route: ${request.route ?? "unknown"}`,
    `Allowed path hints: ${(request.fileHints ?? []).join(", ") || "(none)"}`,
    `Selected text:\n${request.selectedText || "(none)"}`,
    `User prompt:\n${request.prompt}`,
    `Previous AI response:\n${request.previousResponse ?? "(none)"}`,
    `Project context:\n${request.projectContext ?? "(none)"}`,
  ].join("\n");
};
