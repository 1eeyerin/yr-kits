import { createServer } from "node:http";

import type { DevCopilotBridgeConfig } from "../shared/config/bridge-config";
import { handleApplyRoute } from "../features/apply/apply-route";
import { handleChatRoute } from "../features/chat/chat-route";
import { handleStatusRoute } from "../features/status/status-route";
import { toBridgeErrorMessage } from "../shared/http/error-mapper";
import { createCorsHeaders, sendJson } from "../shared/http/respond";

export const createDevCopilotBridgeServer = (config: DevCopilotBridgeConfig) => {
  return createServer(async (request, response) => {
    const method = request.method ?? "GET";
    const url = new URL(request.url ?? "/", `http://${config.host}:${config.port}`);

    if (method === "OPTIONS") {
      response.writeHead(204, createCorsHeaders(config));
      response.end();
      return;
    }

    try {
      if (method === "GET" && url.pathname === "/status") {
        await handleStatusRoute(request, response, config, url);
        return;
      }

      if (method === "POST" && url.pathname === "/chat") {
        await handleChatRoute(request, response, config);
        return;
      }

      if (method === "POST" && url.pathname === "/apply") {
        await handleApplyRoute(request, response, config);
        return;
      }

      sendJson(response, config, 404, { error: "지원하지 않는 경로입니다." });
    } catch (error) {
      sendJson(response, config, 500, { error: toBridgeErrorMessage(error) });
    }
  });
};
