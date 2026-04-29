export interface DevCopilotConfig {
  enabled: boolean;
  allowedPaths: string[];
  bridgeBaseUrl: string;
}

const DEFAULT_CONFIG: DevCopilotConfig = {
  enabled: process.env.NODE_ENV === "development",
  allowedPaths: ["."],
  bridgeBaseUrl: "http://127.0.0.1:3339",
};

export const resolveDevCopilotConfig = (
  config?: Partial<DevCopilotConfig>,
): DevCopilotConfig => {
  return {
    ...DEFAULT_CONFIG,
    ...(config ?? {}),
  };
};
