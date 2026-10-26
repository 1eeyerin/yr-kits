---
title: Git 작업 스킬
sidebar_label: 설치 및 사용
description: Claude Code에 yr-kits의 커밋·PR 생성·PR 업데이트 스킬을 설치하고 사용하는 방법입니다.
---

`yr-kits`의 Git 작업 스킬은 변경사항을 의미 단위로 커밋하고, GitHub PR을 생성하거나 후속 변경을 반영하는 절차를 제공합니다.

| 스킬 | 기능 |
| --- | --- |
| `smart-commit` | 저장소 규칙과 요청 범위에 맞춰 변경사항을 나누어 커밋 |
| `create-pr` | 템플릿을 적용해 PR 생성, 담당자와 기존 라벨 지정 |
| `update-pr` | 대상 브랜치와 push 상태를 확인하고 기존 PR 설명 갱신 |

## 준비 사항

- Claude Code와 Git이 설치되어 있어야 합니다.
- 설치 명령을 실행하려면 Node.js와 `npx`가 필요합니다.
- `create-pr`와 `update-pr`에는 GitHub CLI(`gh`)와 대상 저장소 권한이 필요합니다.

PR 관련 스킬을 사용하기 전에 본인 GitHub 계정으로 인증하세요. 스킬 설치와 GitHub 인증은 별도입니다.

```bash
gh auth login
gh auth status
```

## 설치

필요한 스킬 이름을 지정해 설치하세요.

```bash
# 설치 가능한 스킬 확인
npx skills add 1eeyerin/yr-kits --list

# smart-commit만 전역 설치
npx skills add 1eeyerin/yr-kits --skill smart-commit -a claude-code -g

# Git 작업 스킬 3개를 전역 설치
npx skills add 1eeyerin/yr-kits \
  --skill smart-commit create-pr update-pr -a claude-code -g
```

`-a claude-code`는 설치 대상을, `-g`는 모든 프로젝트에서 사용할 전역 설치를 뜻합니다. 특정 프로젝트에서만 사용하려면 해당 프로젝트 디렉터리에서 `-g`를 빼고 실행하세요.

```bash
npx skills add 1eeyerin/yr-kits \
  --skill smart-commit create-pr update-pr -a claude-code
```

저장소에는 개발 지침용 `karpathy-guidelines`도 있으므로 위와 같이 이름을 지정하면 Git 작업 스킬만 설치됩니다.

## 사용

작업할 Git 저장소에서 Claude Code를 열고 스킬을 호출하세요.

### smart-commit

```text
/smart-commit 로그인 관련 변경만 의미 단위로 나눠 커밋해줘
```

변경사항과 이미 스테이징된 내용을 확인한 뒤 관련 변경을 묶어 커밋합니다. 프로젝트의 커밋 메시지 규칙을 우선하며, 요청 범위가 섞여 있으면 처리할 부분을 확인합니다. 커밋 요청만으로 push나 PR 생성까지 진행하지 않습니다.

### create-pr

```text
/create-pr main 기준으로 현재 브랜치의 PR을 만들어줘
```

기준 브랜치와 원격 저장소를 확인하고, 저장소 PR 템플릿에 맞춰 제목과 본문을 작성합니다. 필요한 커밋을 push한 뒤 PR을 생성하고, 현재 인증 사용자를 담당자로 지정합니다. 저장소에 라벨이 있으면 적합한 기존 라벨 1개를 선택합니다.

동일한 PR이 이미 있으면 기존 URL을 안내합니다. 원격 브랜치가 앞서 있거나 로컬과 이력이 갈라져 있으면 자동으로 합치거나 강제 push하지 않고 중단합니다.

### update-pr

```text
/update-pr 현재 브랜치의 후속 변경을 기존 PR에 반영해줘
```

열린 PR의 저장소와 브랜치가 현재 작업과 일치하는지 확인합니다. 필요한 커밋을 push하고, 기존 본문의 섹션·체크리스트·링크를 보존하면서 누락된 변경을 반영합니다. 제목이나 변경 성격 라벨은 필요한 경우에만 수정합니다.

PR 번호나 URL을 함께 지정할 수 있습니다. 열린 PR이 없으면 새 PR을 만들지 않으며, push가 실패하면 PR 편집도 진행하지 않습니다.

## 업데이트

원본 저장소의 변경이 배포된 뒤 설치한 스킬을 갱신하세요.

```bash
# 특정 전역 스킬 갱신
npx skills update smart-commit -g

# Git 작업 스킬 3개 갱신
npx skills update smart-commit create-pr update-pr -g
```

프로젝트 범위에 설치했다면 해당 프로젝트에서 `-g` 대신 `-p`를 사용하세요.

## 로컬 원본에서 설치

이 저장소를 clone한 디렉터리에서 실행하면 아직 원격에 반영하지 않은 스킬도 설치할 수 있습니다.

```bash
npx skills add . --skill smart-commit create-pr update-pr -a claude-code -g
```

기존에 같은 이름의 전역 명령이나 스킬을 직접 관리했다면 먼저 백업하고 차이를 확인하세요. 이후에는 저장소 원본을 수정하고 설치본을 갱신하면 서로 다른 버전이 생기는 일을 줄일 수 있습니다.

원본과 유지보수 기준은 [저장소 스킬 안내](https://github.com/1eeyerin/yr-kits/blob/main/.agents/skills/README.md), 설치 옵션은 [skills CLI 문서](https://github.com/vercel-labs/skills/blob/main/docs/commands.md)를 참고하세요.
