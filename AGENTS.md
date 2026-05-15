# yr-kits AI 가이드

이 레포는 프론트엔드 프로젝트에 유틸리티, 훅, 타입, 설정 파일과 Dev Copilot 오버레이를 제공하는 pnpm 모노레포다.
상세 규칙은 `.agents/docs`를 따른다.
`.agents` 구조나 지침 문서 추가/수정 기준은 `.agents/README.md`와 `.agents/docs/agents-maintenance.md`를 따른다.

## 먼저 읽을 문서

- 코드 작성/리뷰/리팩터링 전 판단 기준: `.agents/skills/karpathy-guidelines/SKILL.md`
- 저장소 구조와 배치 판단: `.agents/docs/architecture.md`, `.agents/docs/layer-checklist.md`
- 네이밍/export/패키지 컨벤션: `.agents/docs/conventions.md`
- 스택/스크립트/검증 명령: `.agents/docs/tech-stack.md`, `.agents/docs/workflow.md`
- 리뷰/마무리 점검: `.agents/docs/review-checklist.md`
- 프로젝트 지침/구조/문서 변경: `.agents/docs/agents-maintenance.md`

## 핵심 규칙

- 패키지 매니저는 `pnpm@10.0.0`, Node는 `22.x` 기준이다.
- 루트는 워크스페이스 조합만 담당하고 실제 구현은 `packages/*` 또는 `website`에 둔다.
- `packages/cli`는 `yr-kits` CLI와 설치 템플릿을 담당한다.
- `packages/dev-copilot`은 React 오버레이, 로컬 브리지 서버, 에이전트 어댑터를 담당한다.
- `website`는 Docusaurus 기반 문서 사이트다.
- `packages/dev-copilot/src`는 FSD Lite 경계를 따른다: `app -> widgets -> features -> entities -> shared`.
- `packages/dev-copilot/src/bridge`는 브리지 서버 내부 구조로 보고, 공개 UI 레이어와 섞지 않는다.
- 공개 API는 각 패키지의 `exports`와 `src/index.ts`를 기준으로 최소화한다.
- `dist`, `website/build`, `website/.docusaurus`, `node_modules`는 생성물로 보고 직접 수정하지 않는다.
- Zeplin 링크가 있으면 Zeplin MCP 응답값만 사용하고 추측하지 않는다.
- 워크스페이스, 패키지, 레이어 구조나 핵심 폴더 구성이 달라지면 관련 `.agents/docs` 문서도 함께 업데이트한다.
- 요청 범위 밖 리팩터링이나 임의 revert를 하지 않는다.
