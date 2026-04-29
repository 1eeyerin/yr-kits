export const agentEditResponseSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    patchPreview: { type: "string" },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
    changes: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          oldText: { type: "string" },
          newText: { type: "string" },
        },
        required: ["path", "oldText", "newText"],
        additionalProperties: false,
      },
    },
  },
  required: ["message", "changes"],
  additionalProperties: false,
} as const;

export const agentEditResponseSchemaJson = JSON.stringify(agentEditResponseSchema);
