---
description: yr-kits 패키지 내부 구조를 리팩터링한다. 패키지 책임, Dev Copilot 레이어, 공개 API 호환성을 기준으로 수행한다.
argument-hint: "[대상 경로] [문제 설명 또는 리팩터링 목표]"
---

# 패키지 리팩터링

이 명령은 이미 있는 패키지 내부 구조를 프로젝트 규칙에 맞게 정리할 때 사용한다.

## 먼저 읽을 문서

- `AGENTS.md`
- `.agents/docs/architecture.md`
- `.agents/docs/conventions.md`
- `.agents/docs/layer-checklist.md`
- `.agents/docs/review-checklist.md`

## 리팩터링 목표

- 패키지 책임 복구
- Dev Copilot 레이어 경계 복구
- 공개 API 호환성 유지
- 테스트 가능한 단위로 파일 역할 정리

## 작업 순서

1. 현재 구조와 문제를 요약한다.
2. 공개 API 영향 여부를 확인한다.
3. 파일을 새 역할에 맞는 위치로 이동한다.
4. import/export와 패키지 `exports`를 맞춘다.
5. 작업 범위에 맞는 테스트와 빌드를 실행한다.

## 체크리스트

- 루트에 패키지 전용 구현이 남지 않았는가
- `dist` 수정으로 리팩터링을 대신하지 않았는가
- Dev Copilot 레이어 역의존이 없는가
- 문서의 import 경로가 여전히 유효한가

## 출력 형식

- 현재 구조 문제 요약
- 목표 구조
- 이동/수정한 파일
- 검증 명령과 남은 리스크

대상: $ARGUMENTS
