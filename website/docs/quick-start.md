---
title: Intro
---

`@yr-kits/cli` 패키지의 CLI에서 현재 사용할 수 있는 항목과 기본 사용법입니다.

## Install

```bash
# 템플릿 추가
pnpm dlx @yr-kits/cli add [템플릿-이름]

# 대상 디렉터리 직접 지정
pnpm dlx @yr-kits/cli add [템플릿-이름] -d ./src/utils

# ESLint 설정 추가
pnpm dlx @yr-kits/cli eslint --target react
pnpm dlx @yr-kits/cli eslint --target next

# Prettier 설정 추가
pnpm dlx @yr-kits/cli prettier

# Husky commit-msg 훅 추가
pnpm dlx @yr-kits/cli husky-commit-msg
```

## Templates

### configs

| 명령     | 설명                                  |
| -------- | ------------------------------------- |
| eslint   | React/Next.js ESLint flat config 생성 |
| prettier | Prettier 설정 파일 생성               |
| husky-commit-msg | Husky commit-msg 훅 생성              |

### types

| 템플릿                     | 설명                                        |
| -------------------------- | ------------------------------------------- |
| strict-props-with-children | Props에 children 포함 여부를 명시할 때 사용 |

### utils

| 템플릿                 | 설명                                |
| ---------------------- | ----------------------------------- |
| ime-enter-handler      | IME 조합 중 Enter 입력 처리 보조    |
| tooltip-viewport-clamp | 툴팁 위치를 뷰포트 범위 안으로 보정 |

### hooks

| 템플릿               | 설명                                    |
| -------------------- | --------------------------------------- |
| use-body-scroll-lock | 모달/오버레이에서 body 스크롤 잠금 제어 |
