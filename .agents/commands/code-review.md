---
description: yr-kits 코드 리뷰를 수행한다. 버그, 회귀, 패키지 경계, 공개 API, 테스트/문서 누락을 우선 점검한다.
argument-hint: "[파일 경로, 브랜치 범위, 또는 리뷰 대상 설명]"
---

# 코드 리뷰

다음 순서로 코드 리뷰를 수행한다.

## 먼저 읽을 문서

- `AGENTS.md`
- `.agents/docs/architecture.md`
- `.agents/docs/conventions.md`
- `.agents/docs/review-checklist.md`
- 필요하면 `.agents/docs/tech-stack.md`

## 리뷰 원칙

- 요약보다 문제점을 먼저 제시한다.
- 버그, 회귀 가능성, 패키지 경계 위반, 공개 API 누락, 문서/테스트 누락을 우선 본다.
- `packages/cli`, `packages/dev-copilot`, `website`의 책임이 섞였는지 확인한다.
- Dev Copilot 공개 React 영역은 FSD Lite 경계를 기준으로 판단한다.
- `dist`, `website/build`, `website/.docusaurus` 생성물 직접 수정 여부를 확인한다.

## 출력 형식

1. 문제점
2. 열린 질문 또는 가정
3. 짧은 요약

## 문제점 작성 규칙

- 심각도 높은 순서로 정렬한다.
- 파일 경로와 문제 위치를 함께 적는다.
- 가능한 경우 왜 문제가 되는지, 어떤 회귀가 생기는지 짧게 설명한다.
- 문제가 없으면 `문제점 없음`을 명시하고, 남은 리스크만 적는다.

## 리뷰 체크리스트

- 파일 위치가 패키지 책임과 맞는가
- Dev Copilot 레이어 의존 방향이 올바른가
- 새 공개 API가 `src/index.ts`, `package.json` `exports`, 문서에 반영됐는가
- CLI 템플릿 추가 시 `TEMPLATE_MAP`, 테스트, 문서를 함께 갱신했는가
- 실제 검증 명령이 작업 범위에 맞게 실행됐는가

리뷰 대상: $ARGUMENTS
