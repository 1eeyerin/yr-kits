# dev-copilot

`@yr-kits/dev-copilot`은 웹 화면에서 텍스트를 직접 입력하거나, 마우스로 원하는 텍스트 구간을 드래그해 선택하면 그 내용을 기준으로 로컬 Codex CLI와 연결해 답변과 코드 수정 제안을 받는 개발 보조 도구입니다.

## Install

```bash
npx @yr-kits/dev-copilot init
pnpm run dev-copilot-bridge

# 포트 변경시
pnpm run dev-copilot-bridge -p 3000
```

## Requirements

- Node.js 20+
- React 18.2+ 또는 React 19
- Git 저장소 환경

### Codex

- `codex` CLI 설치 및 로그인
- 패치 적용 범위는 `allowedPaths` 안에서만 동작

로그인 확인:

```bash
codex login status
```

- 로그인 필요 시 `codex login`

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

## Troubleshooting

| 증상                          | 확인/해결                                                         |
| ----------------------------- | ----------------------------------------------------------------- |
| Codex CLI를 찾을 수 없습니다  | which codex로 확인 후 CLI 설치/PATH 점검                          |
| Codex CLI 로그인이 필요합니다 | codex login status 확인 후 codex login                            |
| 허용되지 않은 파일 경로입니다 | allowedPaths와 브리지 실행 위치(프로젝트 루트) 확인               |
| 패치 적용 버튼이 없음         | 요청 범위를 좁히고 oldText가 실제 파일과 정확히 일치하도록 재요청 |
