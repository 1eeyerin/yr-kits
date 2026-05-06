---
title: 리뷰 체크리스트
description: 구현 후/PR 전 점검 항목.
when_to_read: 작업 마무리 시, 커밋 전.
scope: "**/*"
tags: [review, checklist]
---

# 리뷰 체크리스트

## 1) 배치와 의존성

- 수정 파일이 올바른 패키지에 있는가
- Dev Copilot 공개 React 레이어의 역의존 import가 없는가
- 브리지 서버 내부 구현이 공개 React API와 불필요하게 섞이지 않았는가
- 워크스페이스 패키지 간 새 의존이 `package.json`에 반영됐는가

## 2) 공개 API와 배포 영향

- 새 공개 API가 필요하면 `src/index.ts`, `package.json` `exports`, 타입 export가 맞는가
- 내부 API를 실수로 외부 문서에 안내하지 않았는가
- `dist` 생성물을 직접 수정하지 않았는가

## 3) 동작/회귀

- CLI 명령의 성공/실패 메시지와 exit code가 기존 흐름과 일치하는가
- 템플릿 복사 경로와 기본 alias가 의도대로 동작하는가
- Dev Copilot 브리지 route가 JSON 응답/에러 매핑을 일관되게 처리하는가
- Overlay UI 상태 전이가 기존 사용성을 깨지 않는가

## 4) 문서

- 기능 추가/명령 변경이 `website/docs` 또는 패키지 README에 반영됐는가
- 문서 예시 명령이 실제 스크립트와 맞는가
- 사이드바 노출이 필요하면 `website/sidebars.ts`를 갱신했는가

## 5) 검증

- CLI 변경: `pnpm --dir packages/cli test`
- Dev Copilot 변경: `pnpm --dir packages/dev-copilot test`와 필요 시 `pnpm --dir packages/dev-copilot lint:architecture`
- 문서 변경: `pnpm --dir website build`
- 공통 영향: `pnpm test`, `pnpm build`
