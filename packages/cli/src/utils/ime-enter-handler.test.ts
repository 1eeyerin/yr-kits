import assert from "node:assert/strict";
import { test } from "node:test";

import { createEnterKeySubmitHandler, isEnterKeyWithoutComposing } from "./ime-enter-handler";

test("isEnterKeyWithoutComposing는 IME 조합 중 Enter를 무시한다", () => {
  assert.equal(
    isEnterKeyWithoutComposing({
      key: "Enter",
      nativeEvent: { isComposing: true },
    }),
    false,
  );
});

test("isEnterKeyWithoutComposing는 Shift+Enter를 무시한다", () => {
  assert.equal(
    isEnterKeyWithoutComposing({
      key: "Enter",
      shiftKey: true,
    }),
    false,
  );
});

test("createEnterKeySubmitHandler는 일반 Enter에서 submit과 preventDefault를 호출한다", () => {
  let submitCount = 0;
  let prevented = false;

  const handler = createEnterKeySubmitHandler(() => {
    submitCount += 1;
  });

  handler({
    key: "Enter",
    preventDefault: () => {
      prevented = true;
    },
  });

  assert.equal(submitCount, 1);
  assert.equal(prevented, true);
});
