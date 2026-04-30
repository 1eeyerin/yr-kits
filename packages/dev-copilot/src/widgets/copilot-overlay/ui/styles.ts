import type { CSSProperties } from "react";

import { OVERLAY_COLOR, OVERLAY_FONT, OVERLAY_TOKENS } from "./tokens";

export const createPanelStyle = (
  showResponsePanel: boolean,
): CSSProperties => ({
  position: "relative",
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: showResponsePanel
    ? `${OVERLAY_TOKENS.inputPanelWidth}px ${OVERLAY_TOKENS.railWidth}px minmax(0, 1fr)`
    : `${OVERLAY_TOKENS.inputPanelWidth}px ${OVERLAY_TOKENS.railWidth}px`,
  width: showResponsePanel
    ? OVERLAY_TOKENS.panelWidth
    : OVERLAY_TOKENS.inputPanelWidth + OVERLAY_TOKENS.railWidth,
  maxHeight: "calc(100vh - 96px)",
  overflow: "hidden",
  border: `1px solid ${OVERLAY_COLOR.border}`,
  borderRadius: 24,
  background: OVERLAY_COLOR.backgroundBase,
  boxShadow: "0 18px 60px rgba(15, 23, 42, 0.16)",
  color: OVERLAY_COLOR.textDark,
  fontFamily: OVERLAY_FONT.sans,
  textAlign: "left",
});

export const triggerButtonStyle: CSSProperties = {
  display: "flex",
  width: OVERLAY_TOKENS.floatingButtonSize,
  height: OVERLAY_TOKENS.floatingButtonSize,
  borderRadius: 9999,
  border: `1px solid ${OVERLAY_COLOR.brandButtonBorder}`,
  background: OVERLAY_COLOR.brandButtonBg,
  color: OVERLAY_COLOR.brandButtonText,
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.18)",
  cursor: "grab",
};

export const railStyle: CSSProperties = {
  display: "flex",
  minHeight: 320,
  alignItems: "center",
  justifyContent: "center",
  borderLeft: `1px solid ${OVERLAY_COLOR.border}`,
  background: OVERLAY_COLOR.backgroundBase,
};

export const railToggleStyle: CSSProperties = {
  display: "flex",
  width: 24,
  height: 24,
  border: "0",
  background: "transparent",
  color: OVERLAY_COLOR.textMuted,
  cursor: "pointer",
  alignItems: "center",
  justifyContent: "center",
};

export const inputPanelStyle: CSSProperties = {
  padding: 16,
  minHeight: 0,
  overflowY: "auto",
  background: OVERLAY_COLOR.backgroundWhite,
};

export const responsePanelStyle: CSSProperties = {
  minHeight: 0,
  overflow: "hidden",
  padding: 16,
  borderLeft: `1px solid ${OVERLAY_COLOR.border}`,
  background: OVERLAY_COLOR.backgroundBase,
};

export const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1.4,
  color: OVERLAY_COLOR.textPrimary,
};

export const subtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 14,
  lineHeight: 1.5,
  color: OVERLAY_COLOR.textSecondary,
  wordBreak: "keep-all",
};

export const statusBoxStyle: CSSProperties = {
  marginTop: 12,
  border: `1px solid ${OVERLAY_COLOR.border}`,
  borderRadius: 16,
  background: OVERLAY_COLOR.backgroundWhite,
  padding: "12px 14px",
  fontSize: 14,
  lineHeight: 1.6,
  color: OVERLAY_COLOR.textSecondary,
};

export const statusLineStyle: CSSProperties = { margin: 0 };

export const labelStyle: CSSProperties = {
  display: "block",
  marginTop: 16,
  fontSize: 14,
  lineHeight: 1.5,
  color: OVERLAY_COLOR.textSecondary,
};

export const textareaStyle: CSSProperties = {
  width: "100%",
  resize: "vertical",
  borderRadius: 16,
  border: `1px solid ${OVERLAY_COLOR.border}`,
  background: OVERLAY_COLOR.backgroundWhite,
  padding: "12px 14px",
  marginTop: 6,
  fontSize: 15,
  lineHeight: 1.7,
  color: OVERLAY_COLOR.textPrimary,
  boxSizing: "border-box",
  minHeight: 132,
};

export const agentToggleRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 6,
};

export const agentToggleButtonStyle: CSSProperties = {
  border: 0,
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1.2,
  cursor: "pointer",
};

export const buttonRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 16,
};

export const buttonStyle: CSSProperties = {
  border: 0,
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1,
  cursor: "pointer",
};

export const responseCardStyle: CSSProperties = {
  marginTop: 12,
  minHeight: 0,
  flex: 1,
  overflowY: "auto",
  borderRadius: 18,
  border: `1px solid ${OVERLAY_COLOR.border}`,
  background: OVERLAY_COLOR.backgroundWhite,
  padding: 16,
};

export const busyContainerStyle: CSSProperties = {
  display: "flex",
  height: "100%",
  minHeight: 192,
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  color: OVERLAY_COLOR.textSecondary,
  fontSize: 14,
};

export const spinnerStyle: CSSProperties = {
  display: "inline-block",
  width: 18,
  height: 18,
  borderRadius: 9999,
  border: `2px solid ${OVERLAY_COLOR.borderSoft}`,
  borderTopColor: OVERLAY_COLOR.spinnerTop,
};

export const articleStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

export const errorBoxStyle: CSSProperties = {
  margin: 0,
  border: `1px solid ${OVERLAY_COLOR.dangerBorder}`,
  borderRadius: 12,
  background: OVERLAY_COLOR.dangerBackground,
  padding: "10px 12px",
  fontSize: 14,
  lineHeight: 1.6,
  color: OVERLAY_COLOR.dangerText,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

export const warningBoxStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  border: `1px solid ${OVERLAY_COLOR.dangerBorder}`,
  borderRadius: 12,
  background: OVERLAY_COLOR.dangerBackground,
  padding: "10px 12px",
  fontSize: 14,
  lineHeight: 1.6,
  color: OVERLAY_COLOR.dangerText,
  wordBreak: "break-word",
  overflowWrap: "anywhere",
};

export const messageStyle: CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflowWrap: "anywhere",
  fontSize: 15,
  lineHeight: 1.7,
  color: OVERLAY_COLOR.textPrimary,
};

export const patchPreviewStyle: CSSProperties = {
  margin: 0,
  maxHeight: 288,
  overflow: "auto",
  borderRadius: 12,
  border: `1px solid ${OVERLAY_COLOR.border}`,
  background: OVERLAY_COLOR.backgroundBase,
  padding: 12,
  fontSize: 13,
  lineHeight: 1.6,
  color: OVERLAY_COLOR.textPrimary,
  fontFamily: OVERLAY_FONT.mono,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

export const placeholderStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.6,
  color: OVERLAY_COLOR.textSecondary,
};

export const toastStyle: CSSProperties = {
  position: "fixed",
  top: 16,
  right: 16,
  zIndex: 2147483600,
  maxWidth: 360,
  borderRadius: 16,
  border: `1px solid ${OVERLAY_COLOR.successBorder}`,
  background: OVERLAY_COLOR.successBackground,
  color: OVERLAY_COLOR.successText,
  padding: "12px 14px",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
  fontFamily: OVERLAY_FONT.sans,
  fontSize: 14,
  lineHeight: 1.6,
};
