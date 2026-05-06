---
title: 개발 워크플로
description: 브랜치, 커밋, 훅, 검증 흐름.
when_to_read: 커밋/푸시/PR 준비 시.
scope: "**/*"
tags: [workflow, git, husky]
---

# 개발 워크플로

## 브랜치

- 기본 작업 브랜치: `feature/*`
- 버그 수정: `fix/*`

## 커밋 메시지 규칙 (강제)

`.husky/commit-msg` 기준:

- 형식: `<type>(<scope>): <한글 포함 메시지>`
- 허용 type: `feat|fix|docs|style|refactor|test|chore`
- `scope` 필수
- 메시지 본문에 한글 1글자 이상 필수

예시:
- `feat(cli): 템플릿 설치 명령 추가`
- `fix(dev-copilot): 브리지 응답 파싱 오류 수정`
- `docs(website): 빠른 시작 문서 보강`

## 기본 검증 순서

작업 범위에 맞춰 좁게 먼저 검증하고, 공통 영향이 있으면 전체 명령을 실행한다.

1. CLI 변경: `pnpm --dir packages/cli test`
2. Dev Copilot 변경: `pnpm --dir packages/dev-copilot test`
3. Dev Copilot 레이어 변경: `pnpm --dir packages/dev-copilot lint:architecture`
4. 문서 사이트 변경: `pnpm --dir website build`
5. 전체 영향: `pnpm test`, `pnpm build`

## 생성물

- `dist`, `website/build`, `website/.docusaurus`는 빌드 결과다.
- 리뷰용으로 빌드가 생성물을 바꿔도, 소스 변경이 목적이면 생성물 diff는 별도로 확인한다.
