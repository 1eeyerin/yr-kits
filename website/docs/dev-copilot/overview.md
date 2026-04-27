# dev-copilot

`@yr-kits/dev-copilot`은 웹 화면에서 텍스트를 직접 입력하거나, 마우스로 원하는 텍스트 구간을 드래그해 선택하면 그 내용을 기준으로 로컬 CLI 에이전트(`Codex`, `Claude Code`)와 연결해 답변을 받고, 제안된 코드 수정을 즉시 코드에 반영할 수 있는 개발 보조 도구입니다.

## Install

CLI 에이전트와 연결하려면 로컬 브리지가 켜져 있어야 오버레이가 동작합니다.

```bash
pnpm dlx @yr-kits/dev-copilot init
pnpm run dev-copilot-bridge
```

### 기본값

- 기본 에이전트: `codex`
- 에이전트 선택 옵션: `CLI 인자(codex/claude)`

```bash
# 포트 변경시
pnpm run dev-copilot-bridge -p 3000

# 에이전트 지정
pnpm run dev-copilot-bridge claude
pnpm run dev-copilot-bridge claude -p 3000
```

## Requirements

- Node.js 20+
- React 18.2+ 또는 React 19
- Git 저장소 환경

### Codex

- `codex` CLI 설치 및 로그인
- 로그인 확인: `codex login status`
- 로그인 필요 시: `codex login`

### Claude Code

- `claude` CLI 설치 및 로그인
- 로그인 필요 시: `claude /login`

## Examples

```tsx
"use client";

import { DevCopilotOverlay, DevCopilotProvider } from "@yr-kits/dev-copilot";

const config = {
  enabled: process.env.NODE_ENV === "development",
  allowedPaths: ["src", "app", "components", "features", "shared"],
};

export function AppDevCopilot() {
  return (
    <DevCopilotProvider config={config}>
      <DevCopilotOverlay />
    </DevCopilotProvider>
  );
}
```

## Config

| 속성         | 타입     | 기본값                                 |
| ------------ | -------- | -------------------------------------- |
| enabled      | boolean  | process.env.NODE_ENV === "development" |
| allowedPaths | string[] | ["."]                                  |

## 동작 방식

- 오버레이에서 `Codex CLI` / `Claude Code CLI`를 요청 단위로 선택할 수 있습니다.
- 브리지 실행 시 `CLI 인자(codex/claude)`를 주면 해당 에이전트로 동작하고, 인자가 없으면 `codex`로 동작합니다.
- 패치 적용 범위는 항상 `allowedPaths` 안에서만 동작합니다.

## Troubleshooting

| 증상                            | 확인/해결                                                         |
| ------------------------------- | ----------------------------------------------------------------- |
| Codex CLI를 찾을 수 없습니다    | `which codex`로 확인 후 CLI 설치/PATH 점검                        |
| Codex CLI 로그인이 필요합니다   | `codex login status` 확인 후 `codex login`                        |
| Claude CLI를 찾을 수 없습니다   | `which claude`로 확인 후 CLI 설치/PATH 점검                       |
| Claude Code 로그인이 필요합니다 | `claude /login` 실행                                              |
| 허용되지 않은 파일 경로입니다   | `allowedPaths`와 브리지 실행 위치(프로젝트 루트) 확인             |
| 패치 적용 버튼이 없음           | 요청 범위를 좁히고 oldText가 실제 파일과 정확히 일치하도록 재요청 |
