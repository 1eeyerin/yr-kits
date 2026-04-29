import type { CopilotAgent, CopilotAgentStatusResponse } from "../../../shared/contracts/copilot";
import { AGENT_LABELS } from "../../../entities/agent/model";
import { statusBoxStyle, statusLineStyle } from "./styles";

interface AgentStatusCardProps {
  selectedAgent: CopilotAgent;
  agentStatus: CopilotAgentStatusResponse | null;
}

export function AgentStatusCard({ selectedAgent, agentStatus }: AgentStatusCardProps) {
  return (
    <div style={statusBoxStyle}>
      <p style={statusLineStyle}>로컬 에이전트: {AGENT_LABELS[selectedAgent]}</p>
      {agentStatus?.model ? <p style={statusLineStyle}>모델: {agentStatus.model}</p> : null}
      {agentStatus ? (
        <p
          style={{
            ...statusLineStyle,
            color: agentStatus.authenticated ? "#15803d" : "#dc2626",
          }}
        >
          {agentStatus.message}
          {agentStatus.loginCommand && !agentStatus.message.includes(agentStatus.loginCommand)
            ? ` 터미널에서 ${agentStatus.loginCommand} 실행`
            : ""}
        </p>
      ) : null}
    </div>
  );
}
