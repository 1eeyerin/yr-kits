# imeEnterHandler

`ime-enter-handler`는 한/중/일 입력(IME) 조합 중에 Enter가 잘못 처리되는 문제를 줄여주는 유틸입니다.
조합 중 Enter는 무시하고, 조합이 끝난 뒤 Enter만 안전하게 submit 처리할 수 있게 도와줍니다.

적용 위치/대상:
- 위치: 검색창, 채팅 입력창, 폼 입력창의 `onKeyDown`
- 대상: 키보드 이벤트의 Enter 처리 로직(조합 중 여부 확인)

## Install

```bash
npx yr-kits add ime-enter-handler
```

기본 경로는 `src/utils/ime-enter-handler.ts`입니다.

## 제공 API

- `isComposingIME(event)`

  현재 이벤트가 IME 조합 중인지 확인합니다.

- `isEnterKey(event)`

  눌린 키가 Enter인지 확인합니다.

- `isEnterKeyWithoutComposing(event)`

  Enter이면서 IME 조합 중이 아닌 경우에만 `true`를 반환합니다.

- `createEnterKeySubmitHandler(onSubmit, options?)`

  입력 핸들러에 바로 연결할 수 있는 `onKeyDown` 함수를 만들어줍니다.
  조합 중 Enter는 건너뛰고, 안전한 Enter 입력에서만 `onSubmit`을 실행합니다.

기본 옵션:

- preventDefault: true

## Example

```tsx
"use client";

import { createEnterKeySubmitHandler } from "@/utils/ime-enter-handler";

export function SearchInput({ onSubmit }: { onSubmit: () => void }) {
  const handleKeyDown = createEnterKeySubmitHandler(onSubmit);

  return <input onKeyDown={handleKeyDown} placeholder="검색어 입력" />;
}
```

## 참고

- key 또는 code가 Enter면 Enter로 판단합니다.
- 이벤트 객체에 preventDefault가 없어도 동작합니다.
- 브라우저 이벤트뿐 아니라 커스텀 이벤트 래퍼에도 적용할 수 있습니다.
