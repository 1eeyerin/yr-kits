export const OVERLAY_TOKENS = {
  floatingButtonSize: 48,
  panelWidth: "min(1028px, calc(100vw - 48px))",
  inputPanelWidth: 420,
  railWidth: 36,
} as const;

export const OVERLAY_FONT = {
  sans: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

export const OVERLAY_COLOR = {
  textPrimary: "#111827",
  textSecondary: "#6b7280",
  textMuted: "#64748b",
  textDark: "#0f172a",
  border: "#e5e7eb",
  borderSoft: "#d1d5db",
  backgroundBase: "#f8fafc",
  backgroundWhite: "#ffffff",
  brandButtonBg: "#fff4b8",
  brandButtonBorder: "#f2d675",
  brandButtonText: "#ffb03d",
  primaryActionBg: "#111827",
  secondaryActionBg: "#2563eb",
  successText: "#15803d",
  successBorder: "#bbf7d0",
  successBackground: "#f0fdf4",
  dangerText: "#dc2626",
  dangerBorder: "#fca5a5",
  dangerBackground: "#fef2f2",
  spinnerTop: "#2563eb",
} as const;

export const OVERLAY_LABELS = {
  title: "Dev Copilot",
  subtitle: "텍스트를 드래그한 뒤 Command+F(또는 Ctrl+F)로 Copilot을 열어 주세요.",
  promptPlaceholder: "무엇을 도와드릴까요?",
  askButton: "질문",
  editButton: "코드 수정 제안",
  applyButton: "미리보기 적용",
  applyingButton: "적용 중...",
} as const;

export const OVERLAY_STYLE_TEXT = `
.yrdc-trigger{transition:transform 150ms ease-out, box-shadow 150ms ease-out}
.yrdc-trigger:hover{transform:scale(1.05)}
.yrdc-pressable{transition:transform 150ms ease-out, background-color 150ms ease-out, opacity 150ms ease-out}
.yrdc-pressable:hover{transform:translateY(-1px)}
.yrdc-spinner{animation:yrdc-spin 1s linear infinite}
.yrdc-field:focus{outline:none;box-shadow:0 0 0 3px rgba(59,130,246,.14);border-color:#93c5fd}
@keyframes yrdc-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;
