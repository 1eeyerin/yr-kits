import type { CopilotAgent } from "../../../shared/contracts/copilot";

export interface DevCopilotBridgeConfig {
  rootDir: string;
  host: string;
  port: number;
  corsOrigin: string;
  agent: CopilotAgent;
  allowedPaths: string[];
}

const DEFAULT_ALLOWED_PATHS = [
  "app",
  "src",
  "widgets",
  "features",
  "entities",
  "shared",
  "components",
];

export const createDevCopilotBridgeConfig = (
  config: Partial<DevCopilotBridgeConfig> & { rootDir: string },
): DevCopilotBridgeConfig => {
  return {
    rootDir: config.rootDir,
    host: config.host ?? "127.0.0.1",
    port: config.port ?? 3339,
    corsOrigin: config.corsOrigin ?? "*",
    agent: config.agent ?? "codex",
    allowedPaths: config.allowedPaths ?? DEFAULT_ALLOWED_PATHS,
  };
};
