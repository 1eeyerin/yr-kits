---
title: 아키텍처 원칙
description: yr-kits 패키지 역할과 의존 방향 규칙.
when_to_read: 새 파일 위치를 결정할 때, 리팩터링 시.
scope:
  - packages/**
  - website/**
tags: [architecture, monorepo, dependencies]
---

# 아키텍처 원칙

## 워크스페이스 구조

```text
yr-kits
  packages/
    cli/           # 설치 CLI와 템플릿
    dev-copilot/   # React 오버레이와 로컬 브리지
  website/         # Docusaurus 문서 사이트
```

## 패키지별 책임

### 1. `packages/cli`
- `yr-kits` 실행 파일과 하위 명령
- 유틸/훅/타입/설정 템플릿 복사
- ESLint, Prettier, Husky 초기화
- 패키지 매니저 감지와 `package.json` 수정 유틸

### 2. `packages/dev-copilot`
- 앱에서 사용하는 `DevCopilotProvider`, `DevCopilotOverlay`
- 선택 텍스트 기반 요청/응답 UI
- 로컬 브리지 서버와 에이전트 어댑터
- CLI 패키지와 연동되는 설치 흐름

### 3. `website`
- `yr-kits` 사용 문서
- Docusaurus 설정, 사이드바, 홈 화면
- 패키지 기능 추가 시 사용자 문서 업데이트

## Dev Copilot 레이어

`packages/dev-copilot/src`의 공개 React 영역은 FSD Lite 구조를 따른다.

```text
app -> widgets -> features -> entities -> shared
```

허용:
- `app -> widgets/features/entities/shared`
- `widgets -> features/entities/shared`
- `features -> entities/shared`
- `entities -> shared`
- 같은 레이어 내부 import

금지:
- `shared -> entities/features/widgets/app`
- `entities -> features/widgets/app`
- `features -> widgets/app`
- `widgets -> app`

`packages/dev-copilot/src/bridge`는 브리지 서버 내부 모듈이다. 내부에서도 `app/features/entities/shared/internal/lib` 역할을 유지하되, 공개 React 레이어와 직접 섞지 않는다.

## 공개 API 규칙

- 외부 사용자는 각 패키지의 `exports`와 `src/index.ts`를 통해 접근한다.
- 새 공개 API를 추가하면 `package.json` `exports`, 타입 export, 문서를 함께 확인한다.
- 내부 구현 파일을 문서에서 직접 import 경로로 안내하지 않는다.

## 생성물 규칙

- `dist`, `website/build`, `website/.docusaurus`, `node_modules`는 생성물이다.
- 생성물 수정으로 문제를 해결하지 않는다.
- 필요한 경우 소스 수정 후 `pnpm build` 또는 패키지별 build로 재생성한다.
