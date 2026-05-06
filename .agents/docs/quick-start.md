---
title: 빠른 시작
description: yr-kits에서 작업할 때 문서 읽기 순서와 기본 판단 기준을 빠르게 정리한 가이드.
when_to_read: 레포에 처음 진입했을 때, 작업 시작 전.
scope: "**/*"
tags: [quick-start, onboarding]
---

# 빠른 시작

## 1) 이 프로젝트 구조 한눈에 보기

- `packages/cli`: `yr-kits` CLI, 설치 템플릿, 설정 초기화 로직
- `packages/dev-copilot`: React 오버레이, 로컬 브리지 서버, 에이전트 실행 어댑터
- `website`: Docusaurus 문서 사이트
- 루트: 워크스페이스, 공통 TypeScript 설정, Husky 훅

## 2) 30초 배치 판단표

| 질문 | 위치 |
| --- | --- |
| CLI 명령, 템플릿 복사, 설정 초기화인가? | `packages/cli/src` |
| 설치 대상 파일 템플릿인가? | `packages/cli/src/templates` |
| Dev Copilot 공개 React API인가? | `packages/dev-copilot/src/app`, `src/widgets`, `src/features` |
| Dev Copilot 브리지 서버/HTTP route/에이전트 실행인가? | `packages/dev-copilot/src/bridge` |
| Dev Copilot 도메인 타입인가? | `packages/dev-copilot/src/entities` 또는 `src/bridge/entities` |
| 사용자 문서인가? | `website/docs` |
| 문서 사이트 설정/홈 화면인가? | `website/docusaurus.config.ts`, `website/src` |

## 3) 작업 종류별 추천 읽기 순서

### CLI 기능/템플릿 수정
1. `architecture.md`
2. `conventions.md`
3. `tech-stack.md`

### Dev Copilot 수정
1. `architecture.md`
2. `layer-checklist.md`
3. `review-checklist.md`

### 문서 사이트 수정
1. `tech-stack.md`
2. `conventions.md`
3. `workflow.md`

### 커밋/푸시 전
1. `workflow.md`
2. `review-checklist.md`

## 4) 자주 하는 실수

- `dist`, `website/build`, `website/.docusaurus` 같은 생성물을 직접 수정하는 경우
- `packages/dev-copilot/src/shared`에서 feature/widget/entity를 import하는 경우
- 브리지 서버 내부 코드를 공개 React API와 같은 레이어처럼 섞는 경우
- CLI 템플릿을 추가하고 `TEMPLATE_MAP`, 문서, 테스트 중 하나를 빠뜨리는 경우
- 루트에 패키지 전용 구현을 두는 경우
