---
title: 설치 및 업데이트
description: yr-kits의 Git 작업 스킬을 Claude Code에 설치하고 업데이트하는 방법입니다.
---

`yr-kits`의 Git 작업 스킬을 Claude Code에 설치하는 방법입니다. 모든 프로젝트에서 사용하거나 특정 프로젝트에만 설치할 수 있습니다.

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

작업할 Git 저장소에서 Claude Code를 열고 스킬을 호출하세요. 호출 예시와 동작 방식은 각 페이지에서 확인할 수 있습니다.

- [smart-commit](./smart-commit.md): 변경사항 커밋
- [create-pr](./create-pr.md): 새 PR 생성
- [update-pr](./update-pr.md): 기존 PR 업데이트

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
