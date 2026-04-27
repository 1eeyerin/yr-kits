---
title: Intro
---

`yr-kits` CLI에서 현재 사용할 수 있는 항목과 기본 사용법입니다.

## Install

```bash
# 템플릿 추가
pnpm dlx yr-kits add [템플릿-이름]

# 대상 디렉터리 직접 지정
pnpm dlx yr-kits add [템플릿-이름] -d ./src/utils
```

## Templates

### types

```bash
# Props에 children 포함 여부를 명시할 때 사용
strict-props-with-children
```

### utils

```bash
# IME 조합 중 Enter 입력 처리 보조
ime-enter-handler

# 툴팁 위치를 뷰포트 범위 안으로 보정
tooltip-viewport-clamp
```

### hooks

```bash
# 모달/오버레이에서 body 스크롤 잠금 제어
use-body-scroll-lock
```
