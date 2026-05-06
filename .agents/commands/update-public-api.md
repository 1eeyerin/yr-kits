---
description: yr-kits 패키지의 공개 API를 변경한다. index export, package.json exports, 타입, 문서, 빌드를 함께 확인한다.
argument-hint: "[패키지명] [추가/변경할 공개 API] [사용 예시]"
---

# 공개 API 변경

패키지 외부에서 import할 수 있는 API를 추가하거나 바꿀 때 사용한다.

## 먼저 읽을 문서

- `AGENTS.md`
- `.agents/docs/architecture.md`
- `.agents/docs/conventions.md`
- `.agents/docs/review-checklist.md`

## 작업 순서

1. 공개할 API와 내부 전용으로 남길 API를 구분한다.
2. `src/index.ts` 또는 하위 엔트리 파일을 수정한다.
3. 필요하면 `package.json` `exports`, `types`, `bin`을 수정한다.
4. 문서의 import 예시를 갱신한다.
5. 패키지 테스트와 빌드를 실행한다.

## 피해야 할 것

- 내부 구현 파일 경로를 공개 사용법으로 안내하는 것
- `exports` 없이 문서에서 새 import 경로를 소개하는 것
- 타입 export 누락
- `dist`를 직접 수정하는 것

## 출력 형식

- 공개 API 변경 요약
- 수정 파일
- 검증 명령
- 남은 호환성 리스크

대상: $ARGUMENTS
