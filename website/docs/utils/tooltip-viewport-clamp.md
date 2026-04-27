# tooltipViewportClamp

`tooltip-viewport-clamp`는 툴팁이 화면 밖으로 잘리는 문제를 줄여주는 유틸입니다.
툴팁이 좌우 경계를 넘으면, 지정한 여백(`safeGap`) 안으로 들어오도록 X축 위치를 자동 보정합니다.

## Install

```bash
pnpm dlx @yr-kits/cli add tooltip-viewport-clamp
```

기본 경로는 `src/utils/tooltip-viewport-clamp.ts`입니다.

## API Reference

- `setTooltipViewportClampDefaults(options)`

  앱 상위에서 기본 옵션(safeGap, cssVarName)을 한 번 설정합니다.
  하위 컴포넌트에서는 같은 옵션을 반복해서 넘길 필요가 없습니다.
  이 설정 없이 다른 API를 호출하면 에러가 발생합니다.

- `bindTooltipViewportClamp({ tooltipEl, triggerEl?, safeGap?, cssVarName? })`

  툴팁 열림, 리사이즈, 스크롤 때마다 위치 보정이 다시 적용되도록 이벤트를 연결합니다.
  보정 해제를 위해 `destroy()`를 함께 반환합니다.

- `getTooltipViewportClampAlignClass(align, options?)`

  align(left/center/right)에 맞는 기본 정렬 + clamp 보정 클래스 문자열을 반환합니다.

기본 옵션:

- safeGap: 16
- cssVarName: --tooltip-shift-x

## Example

```tsx
"use client";

import { useEffect, useRef } from "react";
import {
  bindTooltipViewportClamp,
  getTooltipViewportClampAlignClass,
  setTooltipViewportClampDefaults,
} from "@/utils/tooltip-viewport-clamp";

setTooltipViewportClampDefaults({
  safeGap: 16,
  cssVarName: "--tooltip-shift-x",
});

export function TooltipContent({
  children,
  align = "right",
}: {
  children: string;
  align?: "left" | "center" | "right";
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const binding = bindTooltipViewportClamp({
      tooltipEl: el,
    });

    return () => binding.destroy();
  }, []);

  const alignClass = getTooltipViewportClampAlignClass(align);

  return (
    <span
      ref={ref}
      role="tooltip"
      className={`absolute w-[min(280px,calc(100vw-32px))] ${alignClass}`}
    >
      {children}
    </span>
  );
}
```

## Notes

- 폭 제한은 스타일에서 별도로 지정하세요. 예: `w-[min(280px,calc(100vw-32px))]`
- 정렬(`left/center/right`)은 기존 CSS 전략을 유지하고, 이 유틸은 x축 보정만 담당합니다.
