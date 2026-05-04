# husky-commit-msg

프로젝트에 Husky `commit-msg` 훅을 추가합니다.<br/>

## Install

```bash
pnpm dlx @yr-kits/cli husky-commit-msg
```

## Config

기본 생성 파일은 `.husky/commit-msg`입니다.

기존 파일이 있으면 바로 덮어쓰지 않고, 먼저 백업 파일로 이름을 변경합니다.

```txt
.husky/commit-msg
.husky/commit-msg.original.20260514-003012
```

그 다음 새 `.husky/commit-msg`를 생성합니다.

## Options

### --skip-install

훅 파일만 생성하고 의존성 설치는 건너뜁니다.

```bash
pnpm dlx @yr-kits/cli husky-commit-msg --skip-install
```

## Settings

생성되는 `commit-msg` 훅에는 아래 항목이 포함됩니다.

- 머지 커밋은 형식 검증을 건너뜁니다.
- 커밋 메시지는 `<type>(<scope>): <한글 메시지>` 형식을 사용해야 합니다.
- `type`은 `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`만 허용합니다.
- `scope`는 필수입니다.
- 메시지에는 한글이 포함되어야 합니다.

## Dependencies

명령을 실행하면 필요한 Husky 패키지를 devDependencies로 설치합니다.

- `husky`

## Notes

- `package.json`에 `prepare` 스크립트가 없으면 `husky`로 자동 추가합니다.
- 이미 `prepare` 스크립트가 있으면 기존 값을 유지합니다.
- lockfile이 없으면 `pnpm`을 기본값으로 사용합니다.
