# yr-kits

유틸/컴포넌트를 프로젝트에 추가하는 CLI입니다.

## 설치

```bash
pnpm add -D yr-kits
# 또는
npm install -D yr-kits
```

## 사용법

```bash
# 템플릿 추가 (설정 또는 기본 경로에 설치)
npx yr-kits add strict-props-with-children

# 대상 디렉터리 직접 지정
npx yr-kits add strict-props-with-children -d ./src/utils
```

## 설정 파일

프로젝트 루트에 **`yr-kits.json`** 또는 **`.yr-kits.json`** 이 있으면 그 경로를 사용하고, 없으면 기본값을 씁니다.

```json
{
  "aliases": {
    "utils": "src/utils",
    "types": "src/types",
    "components": "src/components",
    "ui": "src/shared/ui",
    "lib": "src/shared/lib",
    "hooks": "src/hooks"
  }
}
```

- `--dest` 옵션이 있으면 설정·기본값보다 우선합니다.
