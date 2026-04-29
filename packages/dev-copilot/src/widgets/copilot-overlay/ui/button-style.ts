import type { CSSProperties } from "react";

import { buttonStyle } from "./styles";

type ButtonVariant = "primary" | "secondary" | "success";

const BUTTON_COLORS: Record<ButtonVariant, { background: string; color: string }> = {
  primary: { background: "#2563eb", color: "#ffffff" },
  secondary: { background: "#111827", color: "#ffffff" },
  success: { background: "#15803d", color: "#ffffff" },
};

export const createActionButtonStyle = (
  variant: ButtonVariant,
  disabled = false,
  overrides: CSSProperties = {},
): CSSProperties => ({
  ...buttonStyle,
  ...BUTTON_COLORS[variant],
  opacity: disabled ? 0.55 : 1,
  ...overrides,
});
