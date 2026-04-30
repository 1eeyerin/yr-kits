import type { CopilotAgent } from "../../shared/contracts/copilot";
import { resolveAgentAdapter } from "../features/agent-runner/resolve-agent-adapter";
import { createDevCopilotBridgeConfig } from "../shared/config/bridge-config";
import { createDevCopilotBridgeServer } from "./create-bridge-server";

const resolveAgent = (value: string | undefined): CopilotAgent => {
  if (value === "claude") {
    return "claude";
  }

  return "codex";
};

export const runDevCopilotBridgeCli = async (argv: string[]) => {
  const portFlagIndex = argv.findIndex((value) => value === "-p");
  const portFlagValue = portFlagIndex >= 0 ? argv[portFlagIndex + 1] : undefined;
  const positionalPort = argv.find((value) => /^\d+$/.test(value));
  const resolvedPort = portFlagValue
    ? Number(portFlagValue)
    : positionalPort
      ? Number(positionalPort)
      : Number(process.env.DEV_COPILOT_BRIDGE_PORT ?? 3339);
  const positionalAgent = argv.find((value) => value === "codex" || value === "claude");

  const config = createDevCopilotBridgeConfig({
    rootDir: process.cwd(),
    host: process.env.DEV_COPILOT_BRIDGE_HOST,
    port: Number.isFinite(resolvedPort) ? resolvedPort : 3339,
    corsOrigin: process.env.DEV_COPILOT_BRIDGE_CORS_ORIGIN ?? "*",
    agent: resolveAgent(positionalAgent),
    allowedPaths: (process.env.DEV_COPILOT_ALLOWED_PATHS ??
      "app,src,widgets,features,entities,shared,components")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  });

  const server = createDevCopilotBridgeServer(config);

  await new Promise<void>((resolve, reject) => {
    server.once("error", (error) => {
      reject(error);
    });

    server.listen(config.port, config.host, () => {
      process.stdout.write(
        `[dev-copilot-bridge] listening on http://${config.host}:${config.port}\n`,
      );
      resolve();
    });
  });

  void resolveAgentAdapter(config.agent)
    .warmup?.(config.rootDir)
    .catch((error) => {
      process.stderr.write(
        `[dev-copilot-bridge] startup health check failed: ${
          error instanceof Error ? error.message : String(error)
        }\n`,
      );
    });
};
