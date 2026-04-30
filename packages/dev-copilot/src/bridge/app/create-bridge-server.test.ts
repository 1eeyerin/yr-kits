import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";

import { createDevCopilotBridgeServer } from "./create-bridge-server";
import type { DevCopilotBridgeConfig } from "../shared/config/bridge-config";
import type { AgentAdapter, AgentBridgeRequest, AgentBridgeResponse, AgentStatus } from "../entities/agent/types";
import { __internal as agentResolverInternal } from "../features/agent-runner/resolve-agent-adapter";

const defaultStatus: AgentStatus = {
  available: true,
  authenticated: true,
  agent: "codex",
  message: "ready",
  model: "gpt-5.3-codex",
};

const createAdapter = (overrides?: {
  run?: (request: AgentBridgeRequest) => Promise<AgentBridgeResponse>;
  getStatus?: (cwd: string) => Promise<AgentStatus>;
}): AgentAdapter => ({
  agent: "codex",
  run: overrides?.run ?? (async () => ({ message: "ok", warnings: [] })),
  getStatus: overrides?.getStatus ?? (async () => defaultStatus),
});

const startServer = async (config: DevCopilotBridgeConfig) => {
  const server = createDevCopilotBridgeServer(config);

  await new Promise<void>((resolve) => {
    server.listen(0, config.host, () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("테스트 서버 포트를 확인하지 못했습니다.");
  }

  return {
    server,
    baseUrl: `http://${config.host}:${address.port}`,
  };
};

afterEach(() => {
  agentResolverInternal.resetAgentAdaptersForTests();
});

test("브리지는 answer 응답 계약을 유지한다", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "dev-copilot-bridge-answer-"));
  const config: DevCopilotBridgeConfig = {
    rootDir,
    host: "127.0.0.1",
    port: 0,
    corsOrigin: "*",
    agent: "codex",
    allowedPaths: ["src"],
  };

  agentResolverInternal.setAgentAdapterForTests(
    "codex",
    createAdapter({
      run: async () => ({
        message: "답변입니다.",
        warnings: ["경고"],
      }),
    }),
  );

  const { server, baseUrl } = await startServer(config);

  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedText: "hello",
        prompt: "answer",
        mode: "answer",
        context: { agent: "codex" },
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      message: "답변입니다.",
      warnings: ["경고"],
    });
  } finally {
    server.close();
  }
});

test("브리지는 edit 응답 계약을 유지한다", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "dev-copilot-bridge-edit-"));
  await mkdir(join(rootDir, "src"), { recursive: true });
  await writeFile(
    join(rootDir, "src", "App.tsx"),
    [
      "export function App() {",
      "  return <p>텍스트를 선택하고 Dev Copilot 버튼을 클릭하세요.<br/>코드 리뷰, 수정, 질문 답변을 즉시 받을 수 있습니다.</p>;",
      "}",
      "",
    ].join("\n"),
    "utf-8",
  );
  const config: DevCopilotBridgeConfig = {
    rootDir,
    host: "127.0.0.1",
    port: 0,
    corsOrigin: "*",
    agent: "codex",
    allowedPaths: ["src"],
  };

  agentResolverInternal.setAgentAdapterForTests(
    "codex",
    createAdapter({
      run: async () => ({
        message: "수정 제안입니다.",
        warnings: [],
        changes: [
          {
            path: "src/App.tsx",
            oldText: "텍스트를 선택하고 Dev Copilot 버튼을 클릭하세요.<br/>코드 리뷰, 수정, 질문 답변을 즉시 받을 수 있습니다.",
            newText: "텍스트를 선택하고 Dev Copilot 버튼을 클릭하세요. 코드 리뷰, 수정, 질문 답변을 즉시 받을 수 있습니다.",
          },
        ],
      }),
    }),
  );

  const { server, baseUrl } = await startServer(config);

  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedText: "hello",
        prompt: "edit",
        mode: "edit",
        context: { agent: "codex", fileHints: ["src"] },
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.message, "수정 제안입니다.");
    assert.equal(typeof payload.patchPreview, "string");
    assert.equal(typeof payload.patchId, "string");
    assert.deepEqual(payload.warnings, []);
  } finally {
    server.close();
  }
});

test("브리지는 인증 오류를 사용자 메시지로 반환한다", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "dev-copilot-bridge-auth-"));
  const config: DevCopilotBridgeConfig = {
    rootDir,
    host: "127.0.0.1",
    port: 0,
    corsOrigin: "*",
    agent: "codex",
    allowedPaths: ["src"],
  };

  agentResolverInternal.setAgentAdapterForTests(
    "codex",
    createAdapter({
      run: async () => {
        throw new Error("Codex CLI 로그인이 필요합니다. 터미널에서 `codex login`을 실행해 주세요.");
      },
    }),
  );

  const { server, baseUrl } = await startServer(config);

  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedText: "hello",
        prompt: "edit",
        mode: "edit",
        context: { agent: "codex" },
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.equal(payload.error, "Codex CLI 로그인이 필요합니다. 터미널에서 `codex login`을 실행해 주세요.");
  } finally {
    server.close();
  }
});

test("브리지는 timeout 오류를 사용자 메시지로 반환한다", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "dev-copilot-bridge-timeout-"));
  const config: DevCopilotBridgeConfig = {
    rootDir,
    host: "127.0.0.1",
    port: 0,
    corsOrigin: "*",
    agent: "codex",
    allowedPaths: ["src"],
  };

  agentResolverInternal.setAgentAdapterForTests(
    "codex",
    createAdapter({
      run: async () => {
        throw new Error("Codex CLI 실행 시간이 초과되었습니다.");
      },
    }),
  );

  const { server, baseUrl } = await startServer(config);

  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedText: "hello",
        prompt: "edit",
        mode: "edit",
        context: { agent: "codex" },
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.equal(payload.error, "Codex CLI 실행 시간이 초과되었습니다.");
  } finally {
    server.close();
  }
});

test("브리지는 schema 오류를 사용자 메시지로 반환한다", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "dev-copilot-bridge-schema-"));
  const config: DevCopilotBridgeConfig = {
    rootDir,
    host: "127.0.0.1",
    port: 0,
    corsOrigin: "*",
    agent: "codex",
    allowedPaths: ["src"],
  };

  agentResolverInternal.setAgentAdapterForTests(
    "codex",
    createAdapter({
      run: async () => {
        throw new Error("Codex edit 응답 스키마 검증에 실패했습니다.");
      },
    }),
  );

  const { server, baseUrl } = await startServer(config);

  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedText: "hello",
        prompt: "edit",
        mode: "edit",
        context: { agent: "codex" },
      }),
    });
    const payload = await response.json();

    assert.equal(response.status, 500);
    assert.equal(payload.error, "Codex edit 응답 스키마 검증에 실패했습니다.");
  } finally {
    server.close();
  }
});
