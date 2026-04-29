import type { AgentBridgeResponse } from "../../entities/agent/types";

type ClaudePrintJsonResponse = {
  result?: unknown;
  structured_output?: unknown;
  message?: unknown;
  output?: unknown;
  content?: unknown;
};

export const findFirstString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const text = value.trim();
    return text ? text : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstString(item);
      if (found) {
        return found;
      }
    }
    return null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferredKeys = ["result", "message", "output", "text", "content"];

    for (const key of preferredKeys) {
      if (key in record) {
        const found = findFirstString(record[key]);
        if (found) {
          return found;
        }
      }
    }

    for (const nestedValue of Object.values(record)) {
      const found = findFirstString(nestedValue);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

export const normalizeAgentBridgeResponse = (
  value: Partial<AgentBridgeResponse>,
): AgentBridgeResponse => {
  return {
    message: typeof value.message === "string" ? value.message : "",
    patchPreview: value.patchPreview,
    changes: value.changes,
    warnings: Array.isArray(value.warnings) ? value.warnings : [],
  };
};

export const parseJsonLikeText = (text: string) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(jsonText) as Partial<AgentBridgeResponse>;
};

export const parseClaudeJsonOutput = (raw: string) => {
  const parsed = JSON.parse(raw) as ClaudePrintJsonResponse;
  const text = findFirstString(parsed) ?? "";

  return {
    parsed,
    text,
  };
};

export const parseClaudeEditResponse = (raw: string): AgentBridgeResponse => {
  const { parsed, text } = parseClaudeJsonOutput(raw);
  const response =
    parsed.structured_output && typeof parsed.structured_output === "object"
      ? (parsed.structured_output as Partial<AgentBridgeResponse>)
      : parseJsonLikeText(text);

  return normalizeAgentBridgeResponse(response);
};

export const parseCodexEditResponse = (raw: string): AgentBridgeResponse => {
  return normalizeAgentBridgeResponse(JSON.parse(raw) as Partial<AgentBridgeResponse>);
};

export const parseAnswerResponse = (rawOutput: string): AgentBridgeResponse => {
  return {
    message: rawOutput.trim(),
    warnings: [],
  };
};
