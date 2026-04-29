import type {
  CopilotAgent,
  CopilotApplyRequest,
  CopilotApplyResponse,
  CopilotAgentStatusResponse,
  CopilotChatRequest,
  CopilotChatResponse,
  CopilotErrorResponse,
} from "../contracts/copilot";

interface CreateCopilotApiClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

const DEFAULT_BASE_URL = "http://127.0.0.1:3339";
const BRIDGE_CONNECTION_ERROR_MESSAGE =
  "브릿지 서버에 연결하지 못했습니다. 브릿지 서버를 켜주세요.";

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

const normalizeNetworkError = (error: unknown): Error => {
  if (
    error instanceof TypeError &&
    error.message.toLowerCase().includes("failed to fetch")
  ) {
    return new Error(BRIDGE_CONNECTION_ERROR_MESSAGE);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("요청 처리 중 오류가 발생했습니다.");
};

export const createCopilotApiClient = (
  options: CreateCopilotApiClientOptions = {},
) => {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const fetcher = options.fetcher ?? fetch;

  const post = async <T, U>(path: string, body: T): Promise<U> => {
    try {
      const response = await fetcher(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      return parseResponse<U>(response);
    } catch (error) {
      throw normalizeNetworkError(error);
    }
  };

  return {
    status: async (agent?: CopilotAgent) => {
      const query = agent ? `?agent=${agent}` : "";
      try {
        const response = await fetcher(`${baseUrl}/status${query}`);
        return parseResponse<CopilotAgentStatusResponse>(response);
      } catch (error) {
        throw normalizeNetworkError(error);
      }
    },
    chat: (payload: CopilotChatRequest) =>
      post<CopilotChatRequest, CopilotChatResponse>("/chat", payload),
    apply: (payload: CopilotApplyRequest) =>
      post<CopilotApplyRequest, CopilotApplyResponse>("/apply", payload),
  };
};
