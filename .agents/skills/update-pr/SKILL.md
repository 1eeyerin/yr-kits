---
name: update-pr
description: 현재 Git 브랜치의 열린 GitHub PR에 후속 변경을 반영할 때 사용합니다. 대상 브랜치와 push 상태를 검증하고 기존 본문을 보존하면서 제목·본문·기존 라벨을 REST API로 갱신합니다. 새 PR 생성에는 사용하지 않습니다.
---

# GitHub PR 업데이트

이미 열린 PR을 현재 브랜치의 최신 변경사항에 맞게 갱신하세요. Git과 인증된 GitHub CLI(`gh`)가 필요합니다. 사용자 입력에 PR 번호·URL과 추가 요청이 있으면 우선 적용하세요.

PR 조회·수정은 `gh api`의 REST 요청으로 통일하세요. 특정 CLI 버전의 GraphQL 부가 조회에 의존하지 않도록 `gh pr view`, `gh pr edit`를 사용하지 마세요.

## 1. 대상 확인

```bash
gh --version
gh auth status
git status --short
git branch --show-current
git remote -v
```

- detached HEAD이거나 인증이 실패하면 중단하세요.
- 커밋되지 않은 변경은 PR에 반영된 것으로 취급하지 마세요. 이미 커밋이 승인된 범위는 처리하고, 승인 여부가 불명확한 변경만 확인하세요.
- remote URL과 사용자 입력에서 `GH_HOST`(GitHub 호스트), `PR_REPO`(PR을 받을 `OWNER/REPO`), `HEAD_REPO`·`HEAD_OWNER`(push 대상 저장소와 소유자), `CURRENT_BRANCH`를 확인하세요. fork의 head 소유자를 PR 대상 저장소 소유자로 대체하지 마세요.
- PR URL을 받으면 호스트·저장소·`/pull/<number>`를 검증하세요. 로컬 remote와의 관계가 확인되지 않으면 다른 저장소를 추정해서 수정하지 마세요.
- 아래 변수와 파일 경로는 확인된 실제 값으로 설정한 뒤 예시 명령을 사용하세요.

사용자가 번호·URL을 지정했으면 해당 PR을 조회하세요.

```bash
gh api --hostname "$GH_HOST" "repos/$PR_REPO/pulls/$PR_NUMBER"
```

지정하지 않았으면 현재 head의 열린 PR을 조회하세요.

```bash
gh api --hostname "$GH_HOST" --method GET --paginate \
  "repos/$PR_REPO/pulls" -f state=open -f "head=$HEAD_OWNER:$CURRENT_BRANCH"
```

- 결과의 `head.repo.full_name`까지 대조하세요. 후보가 0개면 기존 PR이 없다고 알리고, 2개 이상이면 대상 선택을 확인하세요. 새 PR을 생성하지 마세요.
- `state`가 `open`이고 `base.repo.full_name`이 `PR_REPO`인지 확인하세요.
- `head.ref`와 `head.repo.full_name`이 현재 브랜치와 검증한 push 대상 저장소에 각각 일치해야 합니다. 브랜치명이 같다는 이유만으로 다른 fork를 수정하지 마세요.
- PR 번호, `base.ref`, `head.ref`, `head.sha`, 제목, 본문, 라벨을 보관하세요. head 저장소가 삭제됐으면 중단하세요.

## 2. 변경사항과 push 상태 확인

`base.repo`에 대응하는 `BASE_REMOTE`와 `head.repo`에 대응하는 `PUSH_REMOTE`를 확인하고 fetch하세요. 같은 remote이면 한 번만 fetch하세요. 실제 remote-tracking ref를 `BASE_REF`, `REMOTE_HEAD`로 사용하세요.

```bash
git log --reverse --oneline "$BASE_REF"..HEAD
git diff --stat "$BASE_REF"...HEAD
git diff "$BASE_REF"...HEAD
git rev-list --left-right --count "$REMOTE_HEAD"...HEAD
```

- `origin`이 항상 기준 저장소라고 가정하지 마세요. PR의 `base.ref`와 실제 기준 remote를 조합하세요.
- 업스트림을 사용한다면 해당 remote·브랜치가 PR의 head 저장소·브랜치와 일치하는지 먼저 확인하세요. 업스트림이 없으면 검증한 PR head의 remote-tracking ref로 비교하세요.
- 원격 head가 사라졌거나 fetch가 실패하면 중단하세요. 자동으로 브랜치를 복구하지 마세요.
- 비교 결과의 왼쪽은 원격에만, 오른쪽은 로컬에만 있는 커밋 수입니다. `0 0`이면 push를 생략하고, `0 N`이면 push할 커밋을 확인하세요. 왼쪽이 1 이상이면 원격 선행 또는 분기 상태이므로 중단하세요.
- 승인된 로컬 커밋만 앞서 있으면 PR head 브랜치에 명시적으로 push하세요.

```bash
git push "$PUSH_REMOTE" "HEAD:refs/heads/$CURRENT_BRANCH"
```

push가 실패하면 PR을 편집하지 마세요. PR을 다시 조회해 여전히 열려 있고 head SHA가 로컬 HEAD와 일치하는지 확인하세요. 자동 merge, rebase, force-push는 하지 마세요.

## 3. 기존 본문에 변경 반영

최신 PR 본문과 전체 커밋·diff를 의미상 비교하세요. 기준 브랜치 이후 커밋이 있다는 사실만으로 본문이 오래됐다고 판단하지 마세요. push할 커밋이 없어도 본문에 누락된 설명은 보완할 수 있습니다.

- 기존 섹션 제목·순서, 사용자가 다듬은 문장, 체크리스트, 링크, 스크린샷 영역을 보존하세요.
- 기존 본문에 없는 변경만 관련 섹션에 추가하세요. 같은 의미를 문구만 바꿔 중복해서 넣지 마세요.
- 부정확해진 설명만 최소 범위로 수정하세요. 마지막 본문 수정 시점을 추정하거나 숨김 마커·커밋 SHA를 본문에 추가하지 마세요.
- 본문이 비었거나 구조가 없으면 저장소 PR 템플릿을 사용하세요. 템플릿이 없을 때만 `요약`, `변경사항`, `테스트` 섹션을 사용하세요.
- 실제로 확인하지 않은 동작이나 실행하지 않은 테스트를 성공했다고 작성하지 마세요.
- 제목이 최신 전체 범위를 정확히 설명하면 유지하세요. 바꿔야 하면 프로젝트 규칙을 우선하고, 없으면 `<type>: <summary>`를 사용하세요.

## 4. 라벨 검토

```bash
gh api --hostname "$GH_HOST" --paginate "repos/$PR_REPO/labels?per_page=100"
```

- 현재 라벨이 적합하면 유지하세요. 성격 라벨을 바꿔야 하면 기존 라벨 중 제목 타입과 같은 이름, 의미가 가까운 설명 순서로 선택하세요.
- 영역·팀·상태 등 다른 목적의 라벨은 보존하세요. 분류가 모호하면 임의로 삭제하지 말고 확인하세요.
- 새 라벨을 생성하지 마세요. 조회 실패는 빈 목록이 아니며, 이 경우 라벨 수정만 생략하고 제목·본문 갱신은 계속할 수 있습니다.

## 5. REST API 반영과 검증

편집 직전에 PR을 다시 조회하세요. 준비 중 제목·본문·라벨이 달라졌으면 최신 값을 기준으로 다시 병합하세요. 대상과 open 상태, head SHA도 재확인하세요. 원하는 제목·본문·라벨이 이미 같으면 쓰기 요청을 생략하세요.

변경할 제목·본문만 JSON 직렬화해 작업용 파일 `PR_UPDATE_FILE`에 저장하세요. 줄바꿈·따옴표·백틱을 포함한 본문을 셸 문자열에 직접 삽입하지 마세요.

```bash
gh api --hostname "$GH_HOST" --method PATCH \
  -H "Accept: application/vnd.github+json" \
  "repos/$PR_REPO/pulls/$PR_NUMBER" --input "$PR_UPDATE_FILE"
```

제목·본문 PATCH가 실패하면 현재 상태를 조회해 부분 반영 여부를 알리고 후속 라벨 요청은 진행하지 마세요.

라벨 교체가 필요할 때만 보존할 라벨까지 모두 포함한 최종 목록을 `PR_LABELS_FILE`에 JSON으로 저장하세요. 예: `{"labels":["fix","frontend"]}`. PUT은 전체 라벨을 교체하므로, 직전 조회 이후 라벨이 바뀌지 않았는지 다시 확인하세요.

```bash
gh api --hostname "$GH_HOST" --method PUT \
  "repos/$PR_REPO/issues/$PR_NUMBER/labels" --input "$PR_LABELS_FILE"
```

라벨 요청만 실패하면 제목·본문이 이미 반영됐을 수 있습니다. 현재 상태를 재조회하고 성공한 부분과 실패한 부분을 구분하세요. 확인 없이 쓰기 요청을 반복하지 마세요.

```bash
gh api --hostname "$GH_HOST" "repos/$PR_REPO/pulls/$PR_NUMBER" \
  --jq '{number, title, body, base: .base.ref, baseRepo: .base.repo.full_name, head: .head.ref, headRepo: .head.repo.full_name, headSha: .head.sha, labels: [.labels[].name], state, url: .html_url}'
```

최종 응답에 PR URL, push 여부, 본문에 반영한 내용, 제목·라벨 변경 여부, 검증 결과를 간결하게 보고하세요. 권한 부족을 해결하려고 불필요한 Projects 권한을 추가하지 마세요.

API 세부 사항은 [GitHub Pull Requests REST API](https://docs.github.com/en/rest/pulls/pulls)와 [gh api](https://cli.github.com/manual/gh_api)를 참고하세요.
