# prettier

프로젝트에 Prettier 설정을 추가합니다.<br/>
프로젝트 안에 `.prettierrc.js`와 `.prettierignore` 파일을 직접 생성합니다.

## Install

```bash
pnpm dlx @yr-kits/cli prettier
```

## Config

기본 생성 파일은 `.prettierrc.js`와 `.prettierignore`입니다.

기존 파일이 있으면 바로 덮어쓰지 않고, 먼저 백업 파일로 이름을 변경합니다.

```txt
.prettierrc.js
.prettierrc.original.20260514-003012.js

.prettierignore
.prettierignore.original.20260514-003012
```

그 다음 새 `.prettierrc.js`와 `.prettierignore`를 생성합니다.

## Options

### --skip-install

설정 파일만 생성하고 의존성 설치는 건너뜁니다.

```bash
pnpm dlx @yr-kits/cli prettier --skip-install
```

## Settings

생성되는 Prettier 설정에는 아래 항목이 포함됩니다.

- 문자열은 single quote를 사용합니다.
- JSX 문자열은 double quote를 유지합니다.
- trailing comma는 ES5에서 허용되는 위치까지만 사용합니다.
- print width는 100으로 설정합니다.
- tab width는 2로 설정합니다.
- end of line은 `auto`로 설정합니다.
- arrow function 인자는 항상 괄호를 사용합니다.
- 객체 중괄호 안쪽 공백을 유지합니다.
- Tailwind CSS class 정렬을 위해 `prettier-plugin-tailwindcss`를 사용합니다.

## Dependencies

명령을 실행하면 필요한 Prettier 관련 패키지를 devDependencies로 설치합니다.

- `prettier`
- `prettier-plugin-tailwindcss`

## Notes

- `package.json`에 `format` 스크립트가 없으면 자동으로 추가합니다.
- 이미 `format` 스크립트가 있으면 기존 값을 유지합니다.
- lockfile이 없으면 `pnpm`을 기본값으로 사용합니다.
