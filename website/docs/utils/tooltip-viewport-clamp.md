# TooltipViewportClamp

`tooltip-viewport-clamp`는 툴팁이 화면 밖으로 잘리는 문제를 줄여주는 유틸입니다.
툴팁이 좌우 경계를 넘으면, 지정한 여백(`safeGap`) 안으로 들어오도록 X축 위치를 자동 보정합니다.

## Install

```bash
npx yr-kits add tooltip-viewport-clamp
```

기본 경로는 `src/utils/tooltip-viewport-clamp.ts`입니다.

## 제공 API

- `getTooltipShiftX(tooltipEl, options?)`

  툴팁 요소의 현재 위치와 너비를 기준으로,
  화면 좌우 경계를 얼마나 벗어났는지 계산합니다.
  그리고 safeGap 안쪽으로 맞추기 위한 이동값(px)을 반환합니다.

- `applyTooltipViewportClamp(tooltipEl, options?)`

  내부에서 `getTooltipShiftX`로 이동값을 구한 뒤,
  cssVarName(기본값: --tooltip-shift-x) CSS 변수에 반영합니다.
  적용된 최종 이동값(px)도 함께 반환합니다.

- `bindTooltipViewportClamp({ tooltipEl, triggerEl?, safeGap?, cssVarName? })`

  툴팁 열림, 리사이즈, 스크롤 때마다 위치 보정이 다시 적용되도록 이벤트를 연결합니다.

기본 옵션:

- safeGap: 16
- cssVarName: --tooltip-shift-x

## Example

```tsx
"use client";

import { useEffect, useRef } from "react";
import { bindTooltipViewportClamp } from "@/utils/tooltip-viewport-clamp";

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
      safeGap: 16,
      cssVarName: "--tooltip-shift-x",
    });

    return () => binding.destroy();
  }, []);

  const alignClass =
    align === "left"
      ? "left-0 translate-x-[var(--tooltip-shift-x)]"
      : align === "center"
        ? "left-1/2 translate-x-[calc(-50%_+_var(--tooltip-shift-x))]"
        : "right-0 translate-x-[var(--tooltip-shift-x)]";

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

## 참고

- 폭 제한은 스타일에서 별도로 지정하세요. 예: `w-[min(280px,calc(100vw-32px))]`
- 정렬(`left/center/right`)은 기존 CSS 전략을 유지하고, 이 유틸은 x축 보정만 담당합니다.
