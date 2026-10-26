---
name: create-pr
description: 현재 Git 브랜치의 변경사항을 분석해 GitHub PR을 생성할 때 사용합니다. 저장소 템플릿, 현재 인증 사용자 담당자 지정, 기존 라벨 선택과 REST API 검증을 포함합니다.
---

# GitHub PR 생성

현재 브랜치의 커밋과 diff를 근거로 PR을 생성하세요. Git과 인증된 GitHub CLI(`gh`)가 필요합니다. 사용자가 지정한 기준 브랜치와 추가 요청을 우선하세요.

PR 생성·조회와 담당자·라벨 처리는 `gh api`의 REST 요청으로 통일하세요. 특정 CLI 버전의 GraphQL 부가 조회에 의존하지 않도록 `gh pr create`, `gh pr view`, `gh pr edit`를 섞어 사용하지 마세요.

## 1. 대상과 범위 확인

```bash
gh --version
gh auth status
git status --short
git branch --show-current
git remote -v
```

- detached HEAD이거나 인증이 실패하면 중단하세요.
- 커밋되지 않은 변경은 PR diff에 포함하지 마세요. 이미 커밋이 승인된 범위는 처리하고, 승인 여부가 불명확한 변경만 확인하세요.
- remote URL과 사용자 요청으로 아래 값을 확인하세요. `origin`이나 현재 인증 사용자가 항상 PR 대상 또는 head 소유자라고 가정하지 마세요.

| 값 | 의미 |
| --- | --- |
| `GH_HOST` | remote URL에서 확인한 GitHub 호스트 |
| `PR_REPO` | PR을 받을 저장소의 `OWNER/REPO` |
| `BASE_REMOTE`, `BASE_BRANCH` | 기준 저장소의 remote와 기준 브랜치 |
| `HEAD_REPO`, `HEAD_OWNER` | 현재 브랜치를 push할 저장소의 `OWNER/REPO`와 소유자 |
| `PUSH_REMOTE`, `CURRENT_BRANCH` | head 저장소의 remote와 현재 로컬 브랜치 |

- 기준 브랜치는 사용자 지정, 프로젝트 규칙, 존재하는 `develop`, PR 대상 저장소의 기본 브랜치, `main`, `master` 순서로 결정하세요. 존재 여부를 검증하고 대상이 여러 개면 확인하세요.
- PR 대상 저장소 정보는 `gh api --hostname "$GH_HOST" "repos/$PR_REPO"`로 확인하세요.
- 같은 저장소의 기준 브랜치에서 작업 중이면 PR을 생성하지 마세요.
- 아래 모든 변수와 파일 경로는 확인된 실제 값으로 설정한 뒤 예시 명령을 사용하세요.

## 2. 기존 PR과 원격 상태 확인

동일 head와 base의 열린 PR이 있는지 먼저 확인하세요.

```bash
gh api --hostname "$GH_HOST" --method GET --paginate \
  "repos/$PR_REPO/pulls" \
  -f state=open -f "head=$HEAD_OWNER:$CURRENT_BRANCH" -f "base=$BASE_BRANCH"
```

반환된 `head.repo.full_name`까지 확인하세요. 같은 PR이 있으면 새로 만들지 말고 기존 URL을 알리세요. 기존 PR 갱신은 요청된 경우에만 진행하세요.

`BASE_REMOTE`와 `PUSH_REMOTE`를 fetch한 뒤, 실제 remote-tracking ref를 각각 `BASE_REF`, `REMOTE_HEAD`로 사용하세요. 둘이 같은 remote이면 한 번만 fetch하세요.

```bash
git log --reverse --oneline "$BASE_REF"..HEAD
git diff --stat "$BASE_REF"...HEAD
git diff "$BASE_REF"...HEAD
```

- diff가 없으면 생성하지 마세요. 로컬 기준 브랜치가 오래됐다는 이유로 잘못된 diff를 사용하지 마세요.
- 원격 head가 있으면 `git rev-list --left-right --count "$REMOTE_HEAD"...HEAD`로 비교하세요. 두 숫자는 원격에만 있는 커밋 수와 로컬에만 있는 커밋 수입니다.
- 원격만 앞서 있거나 양쪽이 갈라졌으면 중단하세요. 자동 merge, rebase, force-push를 하지 마세요.
- 원격 head가 없으면 조회 실패와 실제 부재를 구분한 뒤 새 브랜치 push로 처리하세요.

## 3. 제목·본문·라벨 준비

- `.github` 아래 PR 템플릿을 먼저 찾고, 없으면 GitHub가 지원하는 루트·`docs` 위치도 확인하세요. 템플릿 선택이 모호하면 확인하세요.
- 템플릿이 없으면 `요약`, `변경사항`, `테스트` 섹션을 사용하세요. 실제로 확인한 동작과 실행한 검증만 적으세요.
- 제목은 프로젝트 규칙을 우선하고, 없으면 `<type>: <summary>`로 작성하세요.
- 제목·본문·head·base를 JSON 직렬화하여 작업용 파일 `PR_CREATE_FILE`에 저장하세요. 본문의 줄바꿈·따옴표·백틱을 셸 문자열에 직접 삽입하지 마세요.
- JSON의 `head`는 같은 저장소면 브랜치명, fork면 `HEAD_OWNER:CURRENT_BRANCH`입니다. 동일 조직 소유 저장소 간 PR에는 API에서 요구하는 `head_repo`도 지정하세요. draft 여부는 사용자·프로젝트 지침을 따르세요.

```bash
gh api --hostname "$GH_HOST" --paginate \
  "repos/$PR_REPO/labels?per_page=100"
gh api --hostname "$GH_HOST" user --jq '.login'
```

- 저장소 라벨이 있으면 제목·커밋·diff에 가장 적합한 기존 라벨 1개를 정확한 이름으로 `PR_LABEL`에 선택하세요. 제목 타입과 같은 이름, 의미가 가까운 설명 순서로 판단하세요.
- 라벨이 없을 때만 라벨 첨부를 생략하세요. 조회 실패는 빈 목록으로 취급하지 마세요.
- 현재 인증 사용자 login을 `GITHUB_LOGIN`으로 사용하세요. head 소유자와 담당자는 서로 다를 수 있습니다.

## 4. Push와 PR 생성

로컬만 앞서 있거나 새 원격 브랜치가 필요한 경우, 검증한 head 저장소의 브랜치에 명시적으로 push하세요.

```bash
git push "$PUSH_REMOTE" "HEAD:refs/heads/$CURRENT_BRANCH"
```

push가 실패하면 PR을 생성하지 마세요. 원격 head와 로컬 HEAD가 일치하는지 확인한 뒤 생성 요청을 한 번 보내세요.

```bash
gh api --hostname "$GH_HOST" --method POST \
  -H "Accept: application/vnd.github+json" \
  "repos/$PR_REPO/pulls" --input "$PR_CREATE_FILE"
```

응답의 `number`를 `PR_NUMBER`, `html_url`을 결과 URL로 보관하세요. 타임아웃 등으로 성공 여부가 불명확하면 2단계 조회로 실제 생성 여부를 확인하세요. 확인 없이 POST를 반복하지 마세요.

담당자를 지정하고, 선택한 라벨이 있을 때만 기존 라벨을 첨부하세요.

```bash
gh api --hostname "$GH_HOST" --method POST \
  "repos/$PR_REPO/issues/$PR_NUMBER/assignees" \
  -f "assignees[]=$GITHUB_LOGIN"

# 라벨 조회 결과가 비어 있으면 이 요청은 생략하세요.
gh api --hostname "$GH_HOST" --method POST \
  "repos/$PR_REPO/issues/$PR_NUMBER/labels" \
  -f "labels[]=$PR_LABEL"
```

## 5. 결과 검증

```bash
gh api --hostname "$GH_HOST" "repos/$PR_REPO/pulls/$PR_NUMBER" \
  --jq '{number, title, body, base: .base.ref, baseRepo: .base.repo.full_name, head: .head.ref, headRepo: .head.repo.full_name, headSha: .head.sha, assignees: [.assignees[].login], labels: [.labels[].name], state, url: .html_url}'
```

- 제목·본문, base/head 저장소·브랜치, head SHA, 담당자, 선택한 라벨이 실제로 반영됐는지 확인하세요.
- 담당자나 라벨 요청만 실패했다면 PR을 다시 생성하지 마세요. 생성된 URL과 미완료 항목을 보고하세요.
- 새 라벨을 만들거나 Projects 권한을 추가하지 마세요. 자동화가 붙인 다른 라벨을 제거하지 마세요.
- 최종 응답에 PR URL, push 여부, 검증 결과와 실제 실행한 테스트를 간결하게 보고하세요.

API 세부 사항은 [GitHub Pull Requests REST API](https://docs.github.com/en/rest/pulls/pulls)와 [gh api](https://cli.github.com/manual/gh_api)를 참고하세요.
