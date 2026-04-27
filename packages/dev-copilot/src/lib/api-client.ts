import type {
  CopilotAgent,
  CopilotApplyRequest,
  CopilotApplyResponse,
  CopilotAgentStatusResponse,
  CopilotChatRequest,
  CopilotChatResponse,
  CopilotErrorResponse,
} from "../types";

const API_BASE_URL = "http://127.0.0.1:3339";

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as T | CopilotErrorResponse;

  if (!response.ok) {
    const errorMessage =
      typeof payload === "object" && payload && "error" in payload
        ? payload.error
        : "요청 처리 중 오류가 발생했습니다.";
    throw new Error(errorMessage);
  }

  return payload as T;
};

export const createCopilotApiClient = () => {
  const post = async <T, U>(path: string, body: T): Promise<U> => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    return parseResponse<U>(response);
  };

  return {
    status: async (agent?: CopilotAgent) => {
      const query = agent ? `?agent=${agent}` : "";
      const response = await fetch(`${API_BASE_URL}/status${query}`);
      return parseResponse<CopilotAgentStatusResponse>(response);
    },
    chat: (payload: CopilotChatRequest) =>
      post<CopilotChatRequest, CopilotChatResponse>("/chat", payload),
    apply: (payload: CopilotApplyRequest) =>
      post<CopilotApplyRequest, CopilotApplyResponse>("/apply", payload),
  };
};
