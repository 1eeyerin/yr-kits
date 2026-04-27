# useBodyScrollLock

`useBodyScrollLock`은 모달이 열렸을 때 배경 스크롤을 막아주는 React 훅입니다.
`locked` 값을 `true`로 주면 `body` 스크롤을 잠그고, `false`가 되면 원래 상태로 안전하게 되돌립니다.
모달, 바텀시트처럼 화면 위에 레이어가 뜨는 UI에서 의도치 않은 배경 스크롤을 방지할 때 사용합니다.

## Install

```bash
pnpm dlx @yr-kits/cli add use-body-scroll-lock
```

기본 경로는 `src/hooks/use-body-scroll-lock.ts`입니다.

## API Reference

- `useBodyScrollLock(locked: boolean): void`

## Example

```tsx
"use client";

import { useState } from "react";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";

export function ModalExample() {
  const [open, setOpen] = useState(false);

  useBodyScrollLock(open);

  return (
    <>
      <button onClick={() => setOpen(true)}>열기</button>

      {open ? (
        <div>
          <button onClick={() => setOpen(false)}>닫기</button>
        </div>
      ) : null}
    </>
  );
}
```

## Notes

- 여러 컴포넌트가 동시에 잠금을 걸어도 안전하게 동작합니다.
- 마지막 잠금이 해제될 때만 body 스타일을 복구합니다.
- 잠금 시 `overflow: hidden`, `touch-action: none`을 적용합니다.
