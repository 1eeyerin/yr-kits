---
title: 기술 스택 & 사용 규칙
description: yr-kits에서 실제 사용하는 기술과 권장 사용 규칙.
when_to_read: 라이브러리 사용 방식이 헷갈릴 때, 신규 코드 작성 전.
scope:
  - "**/*.{ts,tsx,css,md}"
tags: [tech-stack, pnpm, typescript, react, docusaurus]
---

# 기술 스택 & 사용 규칙

## 스택

| 영역 | 기술 | 기준 |
| --- | --- | --- |
| 워크스페이스 | pnpm | 10.0.0 |
| 런타임 | Node.js | 22.x |
| 언어 | TypeScript | 5.x |
| 번들러 | tsdown | 패키지별 설정 |
| CLI | commander | `packages/cli` |
| UI | React | `dev-copilot` peer `^18.2.0 || ^19.0.0` |
| 문서 | Docusaurus | 3.9.2 |
| 테스트 | Node test runner | 패키지별 `test` 스크립트 |

## 기본 명령

- 전체 빌드: `pnpm build`
- 전체 테스트: `pnpm test`
- 문서 개발 서버: `pnpm website`
- CLI 테스트: `pnpm --dir packages/cli test`
- Dev Copilot 테스트: `pnpm --dir packages/dev-copilot test`
- Dev Copilot 경계 검사: `pnpm --dir packages/dev-copilot lint:architecture`
- 문서 빌드: `pnpm --dir website build`

## TypeScript

- `strict` 유지
- `any` 지양, 불가피하면 경계를 좁게 둔다.
- 공개 함수와 공개 컴포넌트는 타입을 명확히 export한다.
- 테스트는 `*.test.ts`로 두고 패키지별 `test` 스크립트 흐름을 따른다.

## 패키지 빌드

- 소스는 `src`를 기준으로 수정한다.
- `dist`는 배포 생성물이므로 직접 수정하지 않는다.
- 새 엔트리포인트가 필요하면 `src/index.ts`, 패키지 `exports`, 빌드 결과, 문서를 함께 확인한다.

## React

- `packages/dev-copilot`은 React 18/19를 peer dependency로 지원한다.
- React 19 전용 API를 사용할 때는 React 18 호환성을 먼저 확인한다.
- 브라우저 API 접근은 client 환경에서만 실행되도록 guard를 둔다.

## Docusaurus

- 사용자 문서는 `website/docs`에 둔다.
- 사이드바 노출이 필요하면 `website/sidebars.ts`를 함께 수정한다.
- 빌드 산출물인 `website/build`, `website/.docusaurus`는 직접 수정하지 않는다.
