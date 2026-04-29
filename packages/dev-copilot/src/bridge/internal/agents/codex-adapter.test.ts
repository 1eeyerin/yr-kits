import { test } from "node:test";
import assert from "node:assert/strict";

import { __internal } from "./codex-adapter";

test("toCodexErrorMessage는 MCP transport 오류에서 수동 환경변수 설정을 요구하지 않는다", () => {
  const error = new Error("Error loading config.toml: invalid transport 'streamable-http'");

  assert.equal(
    __internal.toCodexErrorMessage(error),
    [
      "현재 Codex CLI가 Codex 설정 파일의 MCP 형식을 해석하지 못했습니다.",
      "Dev Copilot이 호환되는 Codex 실행 파일을 자동으로 찾지 못했습니다.",
      "Codex CLI를 업데이트한 뒤 다시 시도해 주세요.",
    ].join(" "),
  );
});

test("isCodexLoginRequiredError는 MCP transport 오류를 로그인 오류로 취급하지 않는다", () => {
  const error = new Error("Error loading config.toml: invalid transport 'streamable-http'");

  assert.equal(__internal.isCodexLoginRequiredError(error), false);
});
