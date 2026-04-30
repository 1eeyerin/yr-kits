import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { CopilotAgent, CopilotAgentStatusResponse, CopilotMode } from "../../../shared/contracts/copilot";
import { createEnterKeySubmitHandler } from "@yr-kits/cli/utils/ime-enter-handler";
import { isAgentReady } from "../../../entities/agent/model";
import { AgentSelector } from "./agent-selector";
import { AgentStatusCard } from "./agent-status-card";
import { createActionButtonStyle } from "./button-style";
import {
  buttonRowStyle,
  inputPanelStyle,
  labelStyle,
  subtitleStyle,
  textareaStyle,
  titleStyle,
} from "./styles";
import { OVERLAY_LABELS } from "./tokens";

interface CopilotRequestFormProps {
  selectedText: string;
  prompt: string;
  busy: boolean;
  selectedAgent: CopilotAgent;
  agentStatus: CopilotAgentStatusResponse | null;
  onSelectedTextChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onAgentChange: (agent: CopilotAgent) => void;
  onSubmit: (mode: CopilotMode) => void;
}

export function CopilotRequestForm({
  selectedText,
  prompt,
  busy,
  selectedAgent,
  agentStatus,
  onSelectedTextChange,
  onPromptChange,
  onAgentChange,
  onSubmit,
}: CopilotRequestFormProps) {
  const submitDisabled = busy || !isAgentReady(agentStatus);
  const handlePromptKeyDown = createEnterKeySubmitHandler<ReactKeyboardEvent<HTMLTextAreaElement>>(
    () => onSubmit("edit"),
  );

  return (
    <div style={inputPanelStyle}>
      <header>
        <p style={titleStyle}>{OVERLAY_LABELS.title}</p>
        <p style={subtitleStyle}>{OVERLAY_LABELS.subtitle}</p>
      </header>

      <AgentStatusCard selectedAgent={selectedAgent} agentStatus={agentStatus} />
      <AgentSelector selectedAgent={selectedAgent} disabled={busy} onSelect={onAgentChange} />

      <label style={labelStyle}>선택 텍스트</label>
      <textarea
        value={selectedText}
        onChange={(event) => onSelectedTextChange(event.target.value)}
        rows={5}
        className="yrdc-field"
        style={textareaStyle}
      />

      <label style={labelStyle}>프롬프트</label>
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        onKeyDown={handlePromptKeyDown}
        rows={4}
        placeholder={OVERLAY_LABELS.promptPlaceholder}
        className="yrdc-field"
        style={textareaStyle}
      />

      <div style={buttonRowStyle}>
        <button
          type="button"
          className="yrdc-pressable"
          onClick={() => onSubmit("answer")}
          disabled={submitDisabled}
          style={createActionButtonStyle("secondary", submitDisabled)}
        >
          {OVERLAY_LABELS.askButton}
        </button>
        <button
          type="button"
          className="yrdc-pressable"
          onClick={() => onSubmit("edit")}
          disabled={submitDisabled}
          style={createActionButtonStyle("primary", submitDisabled)}
        >
          {OVERLAY_LABELS.editButton}
        </button>
      </div>
    </div>
  );
}
