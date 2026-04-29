import type { ServerResponse } from "node:http";

import type { DevCopilotBridgeConfig } from "../config/bridge-config";

export const createCorsHeaders = (config: DevCopilotBridgeConfig) => ({
  "Access-Control-Allow-Origin": config.corsOrigin,
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json; charset=utf-8",
});

export const sendJson = (
  response: ServerResponse,
  config: DevCopilotBridgeConfig,
  statusCode: number,
  payload: unknown,
) => {
  response.writeHead(statusCode, createCorsHeaders(config));
  response.end(JSON.stringify(payload));
};
