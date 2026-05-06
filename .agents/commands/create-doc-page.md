---
description: yr-kits Docusaurus 문서 페이지를 만든다. docs 경로, 사이드바, 실제 CLI/패키지 동작과의 일치 여부를 확인한다.
argument-hint: "[문서 경로 또는 주제] [설명할 기능] [필요한 예시]"
---

# 문서 페이지 생성

새 문서는 `website/docs`에 둔다.
문서가 실제 명령, export 경로, 패키지 버전과 어긋나지 않도록 소스와 `package.json`을 함께 확인한다.

## 먼저 읽을 문서

- `AGENTS.md`
- `.agents/docs/tech-stack.md`
- `.agents/docs/conventions.md`
- 필요하면 `.agents/docs/workflow.md`

## 작업 순서

1. 문서 대상 기능과 독자를 정한다.
2. `website/docs` 아래 경로를 정한다.
3. 실제 코드와 `package.json` 스크립트를 확인해 예시 명령을 작성한다.
4. 사이드바 노출이 필요하면 `website/sidebars.ts`를 수정한다.
5. 문서 빌드를 검증한다.

## 강제 규칙

- 문서는 한국어로 짧고 실행 가능하게 작성한다.
- 존재하지 않는 명령이나 import 경로를 예시로 쓰지 않는다.
- 빌드 생성물인 `website/build`, `website/.docusaurus`는 직접 수정하지 않는다.

## 출력 형식

- 생성/수정한 문서 경로
- 사이드바 수정 여부
- 검증 명령

요청: $ARGUMENTS
