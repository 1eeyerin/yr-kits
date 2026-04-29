import { useEffect, useState } from "react";

import type { CopilotAgent, CopilotAgentStatusResponse } from "../../../shared/contracts/copilot";
import { createCopilotApiClient } from "../../../shared/api/create-copilot-api-client";

export const useAgentStatusPolling = (
  open: boolean,
  selectedAgent: CopilotAgent,
  baseUrl?: string,
) => {
  const [agentStatus, setAgentStatus] =
    useState<CopilotAgentStatusResponse | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;
    const client = createCopilotApiClient({ baseUrl });

    client
      .status(selectedAgent)
      .then((status) => {
        if (!ignore) {
          setAgentStatus(status);
        }
      })
      .catch((caughtError) => {
        if (!ignore) {
          setAgentStatus({
            available: false,
            authenticated: false,
            agent: selectedAgent,
            message:
              caughtError instanceof Error
                ? caughtError.message
                : "로컬 에이전트 상태 확인에 실패했습니다.",
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [open, selectedAgent, baseUrl]);

  return {
    agentStatus,
    setAgentStatus,
  };
};
