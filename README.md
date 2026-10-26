`@yr-kits`는 프론트엔드 개발에 필요한 CLI, 유틸리티, 컴포넌트, 패키지를 함께 제공하는 도구 모음입니다.

<a href="https://yr-kits.vercel.app" target="_blank">https://yr-kits.vercel.app</a>

## 에이전트 스킬

Claude Code에서 사용할 수 있는 Git 작업 스킬을 제공합니다. 원본은 [`.agents/skills`](.agents/skills/README.md)에서 관리합니다.

| 스킬 | 기능 |
| --- | --- |
| `smart-commit` | 변경사항을 의미 단위로 나누어 커밋 |
| `create-pr` | 템플릿을 적용해 PR 생성, 담당자·기존 라벨 지정 |
| `update-pr` | 브랜치·push 상태를 검증하고 기존 PR 설명 갱신 |

Node.js와 Git이 설치된 환경에서 필요한 스킬만 선택할 수 있습니다.

```bash
# 설치 가능한 스킬 확인
npx skills add 1eeyerin/yr-kits --list

# Claude Code에 smart-commit만 전역 설치
npx skills add 1eeyerin/yr-kits --skill smart-commit -a claude-code -g

# Git 작업 스킬 3개를 전역 설치
npx skills add 1eeyerin/yr-kits \
  --skill smart-commit create-pr update-pr -a claude-code -g
```

`-g`를 빼면 현재 프로젝트에 설치합니다. 설치 후 Claude Code에서 `/smart-commit`, `/create-pr`, `/update-pr`로 호출합니다. PR 관련 스킬에는 별도로 GitHub CLI 설치와 본인 계정 인증이 필요합니다.

스킬별 준비 사항, 로컬 설치, 업데이트와 기존 설치본 통합 기준은 [스킬 안내](.agents/skills/README.md)를 확인하세요. 기존 `karpathy-guidelines`도 목록에 표시되므로 원하는 스킬 이름을 지정해 설치하세요.

문서 사이트용 설치·사용 가이드는 [Git 작업 스킬](website/docs/skills/overview.md)에 있습니다.
