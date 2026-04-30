import assert from "node:assert/strict";
import { test } from "node:test";

import { agentEditResponseSchema } from "./edit-response-schema";

test("agentEditResponseSchema는 모든 최상위 property를 required에 포함한다", () => {
  const propertyKeys = Object.keys(agentEditResponseSchema.properties).sort();
  const requiredKeys = [...agentEditResponseSchema.required].sort();

  assert.deepEqual(requiredKeys, propertyKeys);
});
