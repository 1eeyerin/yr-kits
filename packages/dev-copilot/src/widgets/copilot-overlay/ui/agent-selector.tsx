import type { CopilotAgent } from "../../../shared/contracts/copilot";
import { AGENT_LABELS } from "../../../entities/agent/model";
import { agentToggleButtonStyle, agentToggleRowStyle, labelStyle } from "./styles";

interface AgentSelectorProps {
  selectedAgent: CopilotAgent;
  disabled: boolean;
  onSelect: (agent: CopilotAgent) => void;
}

export function AgentSelector({ selectedAgent, disabled, onSelect }: AgentSelectorProps) {
  return (
    <>
      <label style={labelStyle}>에이전트</label>
      <div style={agentToggleRowStyle}>
        {(["codex", "claude"] as const).map((agent) => {
          const active = selectedAgent === agent;
          return (
            <button
              key={agent}
              type="button"
              className="yrdc-pressable"
              onClick={() => onSelect(agent)}
              disabled={disabled}
              style={{
                ...agentToggleButtonStyle,
                background: active ? "#111827" : "#e2e8f0",
                color: active ? "#ffffff" : "#1e293b",
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {AGENT_LABELS[agent]}
            </button>
          );
        })}
      </div>
    </>
  );
}
