---
description: yr-kits 패키지 기능을 추가한다. CLI, Dev Copilot, website 중 책임을 나누고 필요한 테스트와 문서를 함께 판단한다.
argument-hint: "[대상 패키지] [기능 설명] [필요한 동작]"
---

# 패키지 기능 생성

새 기능은 먼저 패키지 책임을 결정한다.
CLI 설치 기능은 `packages/cli`, 오버레이/브리지는 `packages/dev-copilot`, 사용자 문서는 `website`를 우선한다.

## 먼저 읽을 문서

- `AGENTS.md`
- `.agents/docs/architecture.md`
- `.agents/docs/conventions.md`
- `.agents/docs/layer-checklist.md`
- `.agents/docs/tech-stack.md`

## 작업 순서

1. 기능의 책임과 외부 노출 여부를 정의한다.
2. 대상 패키지와 레이어를 결정한다.
3. 필요한 파일만 최소 단위로 생성/수정한다.
4. 공개 API 변경이 있으면 `src/index.ts`, `package.json` `exports`, 문서를 확인한다.
5. 테스트 위치와 검증 명령을 정한다.

## 패키지별 기준

- CLI 명령/템플릿: `packages/cli/src`
- Dev Copilot UI: `packages/dev-copilot/src/widgets` 또는 `src/features`
- Dev Copilot 브리지: `packages/dev-copilot/src/bridge`
- 사용자 문서: `website/docs`

## 출력 형식

- 대상 패키지와 배치 이유
- 생성/수정 파일
- 검증 명령
- 문서 반영 여부

요청: $ARGUMENTS
