# eslint

React 또는 Next.js 프로젝트에 ESLint flat config 설정을 추가합니다.<br/>
프로젝트 안에 `eslint.config.mjs` 파일을 직접 생성합니다.
TypeScript 프로젝트를 기준으로 구성합니다.

## Install

```bash
# React 프로젝트
pnpm dlx @yr-kits/cli eslint --target react

# Next.js 프로젝트
pnpm dlx @yr-kits/cli eslint --target next
```

## Config

기본 생성 파일은 `eslint.config.mjs`입니다.

기존 `eslint.config.mjs`가 있으면 바로 덮어쓰지 않고, 먼저 백업 파일로 이름을 변경합니다.

```txt
eslint.config.mjs
eslint.config.original.20260514-003012.mjs
```

그 다음 새 `eslint.config.mjs`를 생성합니다.

## Options

### --target

생성할 ESLint 설정 대상을 지정합니다.<br/>
`--target`은 필수입니다.

```bash
pnpm dlx @yr-kits/cli eslint --target react
pnpm dlx @yr-kits/cli eslint --target next
```

### --skip-install

설정 파일만 생성하고 의존성 설치는 건너뜁니다.

```bash
pnpm dlx @yr-kits/cli eslint --target next --skip-install
```

## Dependencies

명령을 실행하면 target에 필요한 ESLint 관련 패키지를 devDependencies로 설치합니다.

공통으로 설치되는 패키지:

- `@eslint/js`
- `@tanstack/eslint-plugin-query`
- `eslint`
- `eslint-config-prettier`
- `eslint-plugin-import`
- `eslint-plugin-prettier`
- `eslint-plugin-unused-imports`
- `globals`
- `prettier`
- `typescript`

React target 추가 패키지:

- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint-plugin-react`
- `eslint-plugin-react-hooks`

Next target 추가 패키지:

- `eslint-config-next`

## Scripts

`package.json`에 `lint` 스크립트가 없으면 자동으로 추가합니다.

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

이미 `lint` 스크립트가 있으면 기존 값을 유지합니다.

## Notes

- lockfile이 없으면 `pnpm`을 기본값으로 사용합니다.
- Next target은 `next`, `react`, `react-dom`을 설치하지 않습니다.
