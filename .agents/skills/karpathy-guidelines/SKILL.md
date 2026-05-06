---
name: karpathy-guidelines
description: 코드 작성, 리뷰, 리팩터링 시 과한 추상화와 추측을 줄이고 작은 변경, 명확한 검증 기준, 사용자 변경 보호가 필요할 때 사용한다.
license: MIT
---

# Karpathy Guidelines

LLM 코딩에서 자주 생기는 실수를 줄이기 위한 기본 판단 기준이다.

## 1. 먼저 확인하기

- 모르는 구조를 추측하지 않는다.
- 파일을 읽고 현재 패턴을 확인한 뒤 수정한다.
- 여러 해석이 가능하면 가정과 선택 이유를 짧게 밝힌다.
- 불명확해서 위험한 결정은 질문한다.

## 2. 단순하게 변경하기

- 요청받은 범위만 해결한다.
- 한 번만 쓰는 추상화를 만들지 않는다.
- 기존 스타일을 우선 따른다.
- 새 설정이나 유연성은 실제 필요가 있을 때만 추가한다.

## 3. 외과적으로 수정하기

- 관련 없는 리팩터링, 포맷 변경, 정리를 하지 않는다.
- 사용자가 만든 변경을 되돌리지 않는다.
- 내 변경으로 생긴 미사용 import, 변수, 파일만 정리한다.
- 모든 변경 라인은 요청과 직접 연결되어야 한다.

## 4. 검증 기준을 정하기

작업 전후로 무엇을 확인할지 정한다.

- CLI 변경: `pnpm --dir packages/cli test`
- Dev Copilot 변경: `pnpm --dir packages/dev-copilot test`
- Dev Copilot 레이어 변경: `pnpm --dir packages/dev-copilot lint:architecture`
- 문서 사이트 변경: `pnpm --dir website build`
- 공통 영향: `pnpm test`, `pnpm build`

검증하지 못한 경우에는 완료처럼 말하지 말고, 실행하지 못한 이유와 남은 리스크를 적는다.
