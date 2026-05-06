---
title: 배치 체크리스트
description: 새 코드가 어느 패키지와 레이어에 들어가야 하는지 판단 기준.
when_to_read: 파일 생성 직전.
scope:
  - packages/**
  - website/**
tags: [layer, checklist]
---

# 배치 체크리스트

## 1. 패키지 선택

아래 중 하나면 `packages/cli`:
- `yr-kits` 명령 추가/수정
- 설치 템플릿 추가/수정
- ESLint, Prettier, Husky 같은 설정 초기화
- 패키지 매니저 감지, 파일 복사, `package.json` 수정

아래 중 하나면 `packages/dev-copilot`:
- React Provider/Overlay
- 선택 텍스트 캡처와 요청 제출
- 로컬 브리지 서버
- Claude/Codex 실행 어댑터
- Copilot 응답 patch 적용 흐름

아래 중 하나면 `website`:
- 사용자 문서
- 문서 사이트 라우팅/사이드바
- 홈 화면이나 문서 스타일

## 2. Dev Copilot 공개 React 레이어 선택

- `app`: Provider, 앱 조립, 외부 앱에 붙는 엔트리
- `widgets`: 완성된 화면 블록 또는 오버레이 조합
- `features`: 사용자 행동, 상태 전이, 요청 제출/적용
- `entities`: 도메인 모델과 타입
- `shared`: API client, 공통 lib, 공통 UI hook, 계약 타입

## 3. Dev Copilot bridge 내부 선택

- `bridge/app`: 서버 생성, route 조립, CLI 실행 시작점
- `bridge/features`: HTTP route별 기능 흐름
- `bridge/entities`: 브리지 도메인 타입과 상태
- `bridge/internal`: 외부 에이전트 실행 세부 구현
- `bridge/shared`: config, HTTP 응답, 공통 유틸
- `bridge/lib`: bridge 내부 범용 유틸

## 빠른 금지 규칙

- 루트에 패키지 전용 구현 파일을 만들지 않는다.
- `dist`나 `website/build`를 직접 수정하지 않는다.
- Dev Copilot의 `shared`에서 상위 레이어를 import하지 않는다.
- CLI 템플릿만 추가하고 문서/테스트/명령 매핑을 빠뜨리지 않는다.
