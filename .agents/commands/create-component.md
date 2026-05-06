---
description: yr-kits의 새 React 컴포넌트를 만든다. Dev Copilot 레이어, 파일명, export 방식, props 구조를 프로젝트 컨벤션에 맞춘다.
argument-hint: "[컴포넌트 이름] [사용 위치/도메인] [역할]"
---

# 컴포넌트 생성

새 컴포넌트를 만들기 전에 이 컴포넌트가 `packages/dev-copilot/src/app`, `widgets`, `features`, `entities`, `shared` 중 어디에 속하는지 판단한다.
문서 사이트 컴포넌트라면 `website/src` 기존 구조를 따른다.

## 먼저 읽을 문서

- `AGENTS.md`
- `.agents/docs/architecture.md`
- `.agents/docs/conventions.md`
- 필요하면 `.agents/docs/layer-checklist.md`

## 작업 순서

1. 요청한 컴포넌트의 책임을 한 문장으로 요약한다.
2. 대상 패키지와 레이어를 결정한다.
3. 파일 경로와 파일명을 컨벤션에 맞게 정한다.
4. props interface와 named export를 사용해 컴포넌트를 만든다.
5. 필요한 연결 지점만 수정한다.
6. 생성 후 왜 그 위치에 뒀는지 짧게 설명한다.

## 강제 규칙

- 컴포넌트 파일명은 `kebab-case.tsx`
- 기본은 named export
- Props는 `interface XxxProps`
- 완성된 오버레이 조합이면 `widgets/<domain>/ui`
- 사용자 행동/상태 전이면 `features/<domain>/model` 또는 `features/<domain>/ui`
- 도메인 타입은 `entities/<domain>`
- 공통 hook/lib/API client는 `shared`
- 공개 API가 필요하면 `src/index.ts`와 패키지 `exports`를 확인한다.

## 출력 형식

- 생성한 파일 경로
- 배치 이유
- 추가로 수정한 연결 파일

요청: $ARGUMENTS
