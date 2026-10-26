# yr-kits 스킬

반복하는 Git 작업을 위한 Claude Code 스킬 모음입니다. 각 폴더의 `SKILL.md`를 설치합니다.

## 목록과 준비 사항

| 스킬 | 사용 예시 | 필요한 도구 |
| --- | --- | --- |
| [smart-commit](smart-commit/SKILL.md) | `/smart-commit 로그인 관련 변경만 커밋해줘` | Git |
| [create-pr](create-pr/SKILL.md) | `/create-pr main 기준으로 PR 만들어줘` | Git, 인증된 GitHub CLI |
| [update-pr](update-pr/SKILL.md) | `/update-pr 현재 브랜치의 변경을 기존 PR에 반영해줘` | Git, 인증된 GitHub CLI |

기존 [karpathy-guidelines](karpathy-guidelines/SKILL.md)는 별도로 유지합니다. 저장소 전체 스킬을 설치하는 옵션 대신 필요한 이름을 지정하면 함께 설치되지 않습니다.

## GitHub에서 설치

Node.js와 Git이 필요합니다. 아래 명령은 스킬이 저장소 기본 브랜치에 반영된 뒤 사용할 수 있습니다.

```bash
# 목록만 확인
npx skills add 1eeyerin/yr-kits --list

# 필요한 스킬 1개 설치
npx skills add 1eeyerin/yr-kits --skill smart-commit -a claude-code -g

# Git 작업 스킬 3개 설치
npx skills add 1eeyerin/yr-kits \
  --skill smart-commit create-pr update-pr -a claude-code -g

```

- `-a claude-code`: Claude Code를 설치 대상으로 지정합니다.
- `-g`: 사용자 전역 설치입니다. 빼면 현재 프로젝트에 설치합니다.
- 설치 후 Claude Code에서 `/스킬이름`으로 호출합니다.
- PR 스킬 사용 전 `gh auth login`으로 본인 계정을 인증하고 대상 저장소 권한을 확인합니다.

## 로컬 원본에서 설치

이 저장소를 clone한 디렉터리에서 실행하세요. 아직 GitHub에 반영하지 않은 변경도 설치할 수 있습니다.

```bash
npx skills add . --list
npx skills add . --skill smart-commit create-pr update-pr -a claude-code -g
```

기존 전역 명령이나 같은 이름의 스킬을 사용 중이라면 먼저 백업하고 내용을 비교하세요. 전역 `commands`·`skills`와 다른 설치 위치에 같은 이름의 원본을 따로 수정하지 않도록 정리하세요. 이 저장소를 추가하는 작업 자체는 기존 전역 설치본을 변경하지 않습니다.

## 업데이트

GitHub에서 설치한 스킬은 저장소 변경이 배포된 뒤 갱신할 수 있습니다.

```bash
# 특정 전역 스킬 갱신
npx skills update smart-commit -g

# Git 작업 스킬 3개 갱신
npx skills update smart-commit create-pr update-pr -g
```

로컬 경로에서 설치했다면 원본 checkout을 갱신한 뒤 같은 `skills add .` 명령으로 다시 설치하세요.

## 설치본 통합 기준

| 스킬 | 통합한 내용 |
| --- | --- |
| `smart-commit` | Claude 전역 명령과 공용 스킬의 의미 단위 커밋 규칙을 통합했습니다. 저장소 커밋 규칙, 기존 staged 변경과 요청 범위를 확인합니다. |
| `create-pr` | 설치본마다 달랐던 생성 방식을 REST API로 통일했습니다. 안전한 본문 파일 전달, PR 템플릿, 현재 인증 사용자 담당자 지정, 기존 라벨 1개 선택과 결과 검증을 유지합니다. |
| `update-pr` | Codex 설치본의 REST API, 대상 브랜치 검증, 원격 선행·분기 시 중단 규칙을 반영했습니다. fork 저장소까지 확인하고 기존 본문과 다른 목적의 라벨을 보존합니다. |

각 스킬은 다른 스킬 설치를 요구하지 않습니다. 개인 절대경로나 플러그인 캐시는 포함하지 않습니다.

## 유지보수와 검증

1. 이 저장소의 해당 스킬을 수정합니다. 같은 디렉터리에 `-kor.md` 번역본이 있으면 함께 갱신합니다.
2. YAML의 `name`·`description`, 폴더명, 상대 링크, 필요한 도구와 실제 명령을 확인합니다.
3. `npx skills add . --list`로 검색되는지 확인합니다. 설치 검증은 별도 테스트 디렉터리에서 프로젝트 범위로 수행합니다.
4. 외부 작업이 없는 시나리오부터 검토하고, 실제 PR 생성·수정은 승인된 테스트 저장소에서만 실행합니다.

형식 검증이나 설치 성공만으로 실제 PR 작업까지 검증됐다고 판단하지 마세요.

설치 옵션은 [skills CLI 문서](https://github.com/vercel-labs/skills/blob/main/docs/commands.md), 스킬 인식과 호출 방식은 [Claude Code 문서](https://code.claude.com/docs/en/skills)를 참고하세요.
