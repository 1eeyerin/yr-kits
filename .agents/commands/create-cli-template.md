---
description: yr-kits CLI 설치 템플릿을 추가한다. 템플릿 파일, TEMPLATE_MAP, 기본 alias, 테스트, 문서를 함께 맞춘다.
argument-hint: "[템플릿 이름] [종류: utils/hooks/types/configs] [설치 대상 경로]"
---

# CLI 템플릿 생성

이 명령은 `yr-kits add <name>` 또는 설정 초기화 명령으로 배포할 파일 템플릿을 추가할 때 사용한다.

## 먼저 읽을 문서

- `AGENTS.md`
- `.agents/docs/architecture.md`
- `.agents/docs/conventions.md`
- `.agents/docs/tech-stack.md`

## 작업 순서

1. 템플릿 이름과 설치 대상 기본 경로를 정한다.
2. `packages/cli/src/templates`에 템플릿 파일을 추가한다.
3. `packages/cli/src/cli.ts`의 `TEMPLATE_MAP`과 alias 판단을 갱신한다.
4. 필요한 테스트를 `packages/cli/src/**/*.test.ts`에 추가/수정한다.
5. `website/docs`와 필요 시 `packages/cli` README 성격 문서를 갱신한다.
6. CLI 테스트를 실행한다.

## 강제 규칙

- 템플릿 파일명과 CLI 이름은 기존 패턴을 따른다.
- 기본 설치 위치는 `DEFAULT_CONFIG.aliases`와 일관되어야 한다.
- 설정 파일 템플릿은 기존 백업/설치 흐름을 깨지 않아야 한다.
- 템플릿만 추가하고 문서/테스트/명령 매핑을 빠뜨리지 않는다.

## 출력 형식

- 추가한 템플릿 경로
- CLI 노출 이름
- 기본 설치 경로
- 테스트/문서 수정 여부

요청: $ARGUMENTS
