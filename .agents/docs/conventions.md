---
title: 코딩 컨벤션
description: 네이밍, 파일 구조, export/import 규칙.
when_to_read: 새 파일 생성, 구조/네이밍 결정 시.
scope:
  - "**/*.{ts,tsx,css,md}"
tags: [conventions, naming, structure]
---

# 코딩 컨벤션

## 파일/디렉토리 네이밍

- 파일명: `kebab-case`
  - 예: `copy-template.ts`, `create-bridge-server.ts`, `copilot-overlay.tsx`
- 컴포넌트/타입 이름: `PascalCase`
- 훅 이름: `useXxx` (`camelCase`)
- 패키지 내부 폴더는 기존 구조를 우선 따른다.

## export 규칙

- 기본은 named export
- 패키지 공개 API는 `src/index.ts`와 `package.json` `exports`를 기준으로 관리한다.
- Docusaurus 규약 파일이나 CLI 엔트리처럼 도구가 요구하는 경우만 default export를 허용한다.
- 과도한 barrel export를 만들지 말고, 외부에 공개할 항목만 노출한다.

## import 규칙

- 패키지 내부 기존 상대 import 스타일을 유지한다.
- `packages/dev-copilot/src`의 공개 React 영역은 FSD Lite 의존 방향을 지킨다.
- 브리지 서버 내부 import와 공개 React 레이어 import를 불필요하게 교차시키지 않는다.
- 워크스페이스 패키지 간 의존은 `package.json`에 명시한다.

## CLI 템플릿 규칙

- 새 템플릿은 `packages/cli/src/templates`에 둔다.
- `yr-kits add <name>`에 노출하려면 `packages/cli/src/cli.ts`의 `TEMPLATE_MAP`과 기본 alias 판단을 함께 수정한다.
- 템플릿 추가/변경 시 `website/docs` 문서와 테스트를 확인한다.

## 문서 규칙

- 사용자-facing 문서는 한국어로 짧고 실행 가능하게 작성한다.
- 명령 예시는 실제 `package.json` 스크립트와 맞아야 한다.
- 패키지 기능 추가 시 `website/docs`와 패키지 README 중 필요한 곳을 함께 갱신한다.

## 주석/문서화

- 복잡한 의도를 설명하는 주석만 최소로 작성한다.
- 코드 자체가 설명 가능한 경우 불필요한 주석을 추가하지 않는다.
