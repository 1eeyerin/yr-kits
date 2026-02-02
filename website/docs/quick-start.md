# 🔨 Quick Start

## Install

```bash
# 템플릿 추가
npx yr-kits add [템플릿-이름]

# 대상 디렉터리 직접 지정
npx yr-kits add [템플릿-이름] -d ./src/utils
```

## Config

프로젝트 루트에 **`yr-kits.json`** 또는 **`.yr-kits.json`** 이 있으면 그 경로를 사용하고, 없으면 기본값을 사용합니다.

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
