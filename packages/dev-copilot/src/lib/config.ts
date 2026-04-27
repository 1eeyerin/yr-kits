export interface DevCopilotConfig {
  enabled: boolean;
  allowedPaths: string[];
}

const defaultConfig: DevCopilotConfig = {
  enabled: process.env.NODE_ENV === "development",
  allowedPaths: ["."],
};

export const resolveDevCopilotConfig = (
  config?: Partial<DevCopilotConfig>,
): DevCopilotConfig => {
  const nextConfig = config ?? {};

  return {
    ...defaultConfig,
    ...nextConfig,
  };
};
