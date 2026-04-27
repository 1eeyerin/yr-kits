import { createDevCopilotBridgeConfig } from "../lib/config";
import { createDevCopilotBridgeServer } from "../server/http-server";

export const runDevCopilotBridgeCli = async (argv: string[]) => {
  const portFlagIndex = argv.findIndex((value) => value === "-p");
  const portFlagValue =
    portFlagIndex >= 0 ? argv[portFlagIndex + 1] : undefined;
  const positionalPort = argv.find((value) => /^\d+$/.test(value));
  const resolvedPort = portFlagValue
    ? Number(portFlagValue)
    : positionalPort
      ? Number(positionalPort)
      : Number(process.env.DEV_COPILOT_BRIDGE_PORT ?? 3339);

  const config = createDevCopilotBridgeConfig({
    rootDir: process.cwd(),
    host: process.env.DEV_COPILOT_BRIDGE_HOST,
    port: Number.isFinite(resolvedPort) ? resolvedPort : 3339,
    corsOrigin: process.env.DEV_COPILOT_BRIDGE_CORS_ORIGIN ?? "*",
    agent: process.env.DEV_COPILOT_AGENT ?? "codex",
    allowedPaths: (process.env.DEV_COPILOT_ALLOWED_PATHS ??
      "app,src,widgets,features,entities,shared,components")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  });

  const server = createDevCopilotBridgeServer(config);

  await new Promise<void>((resolve) => {
    server.listen(config.port, config.host, () => {
      process.stdout.write(
        `[dev-copilot-bridge] listening on http://${config.host}:${config.port}\n`,
      );
      resolve();
    });
  });
};
