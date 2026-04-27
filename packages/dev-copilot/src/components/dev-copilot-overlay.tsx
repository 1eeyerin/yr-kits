"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { createCopilotApiClient } from "../lib/api-client";
import type {
  CopilotAgentStatusResponse,
  CopilotChatResponse,
  CopilotMode,
} from "../types";
import {
  OVERLAY_ATTRIBUTE,
  useSelectionCapture,
} from "../hooks/use-selection-capture";
import {
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  SparklesIcon,
} from "./icons";
import { useDevCopilotConfig } from "./dev-copilot-provider";

const FLOATING_BUTTON_SIZE = 48;
const DRAG_CLICK_THRESHOLD = 4;
const PANEL_WIDTH = "min(1028px, calc(100vw - 48px))";
const INPUT_PANEL_WIDTH = 420;
const RAIL_WIDTH = 36;
const AGENT_LABEL = "Codex CLI";
const UI_LABELS = {
  title: "Dev Copilot",
  subtitle: "텍스트를 선택한 뒤 프롬프트를 입력하세요.",
  promptPlaceholder: "무엇을 도와드릴까요?",
  askButton: "질문",
  editButton: "코드 수정 제안",
  applyButton: "미리보기 적용",
} as const;

const styleText = `
.yrdc-trigger{transition:transform 150ms ease-out, box-shadow 150ms ease-out}
.yrdc-trigger:hover{transform:scale(1.05)}
.yrdc-pressable{transition:transform 150ms ease-out, background-color 150ms ease-out, opacity 150ms ease-out}
.yrdc-pressable:hover{transform:translateY(-1px)}
.yrdc-spinner{animation:yrdc-spin 1s linear infinite}
.yrdc-field:focus{outline:none;box-shadow:0 0 0 3px rgba(59,130,246,.14);border-color:#93c5fd}
@keyframes yrdc-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export function DevCopilotOverlay() {
  const config = useDevCopilotConfig();
  const apiClient = useMemo(() => createCopilotApiClient(), []);
  const { selectedText, setSelectedText } = useSelectionCapture();

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatResult, setChatResult] = useState<CopilotChatResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] =
    useState<CopilotAgentStatusResponse | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [showResponsePanel, setShowResponsePanel] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const suppressMainToggleClickRef = useRef(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => {
        if (!prev) {
          return prev;
        }

        return {
          x: Math.min(
            Math.max(prev.x, 0),
            Math.max(0, window.innerWidth - FLOATING_BUTTON_SIZE),
          ),
          y: Math.min(
            Math.max(prev.y, 0),
            Math.max(0, window.innerHeight - FLOATING_BUTTON_SIZE),
          ),
        };
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    let ignore = false;

    apiClient
      .status()
      .then((status) => {
        if (!ignore) {
          setAgentStatus(status);
        }
      })
      .catch((caughtError) => {
        if (!ignore) {
          setAgentStatus({
            available: false,
            authenticated: false,
            agent: AGENT_LABEL,
            message:
              caughtError instanceof Error
                ? caughtError.message
                : "로컬 에이전트 상태 확인에 실패했습니다.",
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [apiClient, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDownOutside = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (containerRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
      setShowResponsePanel(false);
      dragStateRef.current = null;
      suppressMainToggleClickRef.current = false;
    };

    document.addEventListener("pointerdown", onPointerDownOutside);

    return () => {
      document.removeEventListener("pointerdown", onPointerDownOutside);
    };
  }, [open]);

  if (!config.enabled) {
    return null;
  }

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    const wrapperRect = containerRef.current?.getBoundingClientRect();
    const originX = position?.x ?? wrapperRect?.left ?? 0;
    const originY = position?.y ?? wrapperRect?.top ?? 0;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX,
      originY,
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    const moved =
      Math.abs(deltaX) > DRAG_CLICK_THRESHOLD ||
      Math.abs(deltaY) > DRAG_CLICK_THRESHOLD;

    if (!moved && !dragState.moved) {
      return;
    }

    dragState.moved = true;

    setPosition({
      x: Math.min(
        Math.max(dragState.originX + deltaX, 0),
        Math.max(0, window.innerWidth - FLOATING_BUTTON_SIZE),
      ),
      y: Math.min(
        Math.max(dragState.originY + deltaY, 0),
        Math.max(0, window.innerHeight - FLOATING_BUTTON_SIZE),
      ),
    });
  };

  const onPointerEnd = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    suppressMainToggleClickRef.current = dragStateRef.current.moved;
    dragStateRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onMainToggleClick = () => {
    if (suppressMainToggleClickRef.current) {
      suppressMainToggleClickRef.current = false;
      return;
    }

    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        setPosition(null);
        dragStateRef.current = null;
        suppressMainToggleClickRef.current = false;
      }
      return next;
    });
  };

  const previousResponse = chatResult
    ? [
        `message:\n${chatResult.message}`,
        chatResult.patchPreview
          ? `patchPreview:\n${chatResult.patchPreview}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    : undefined;

  const onSubmit = async (mode: CopilotMode) => {
    if (agentStatus && (!agentStatus.available || !agentStatus.authenticated)) {
      setError(agentStatus.message);
      return;
    }

    if (!prompt.trim()) {
      setError("프롬프트를 입력해 주세요.");
      return;
    }

    setBusy(true);
    setError(null);
    setShowResponsePanel(true);

    try {
      const currentRoute =
        typeof window !== "undefined" ? window.location.pathname : undefined;
      const result = await apiClient.chat({
        selectedText,
        prompt,
        mode,
        context: {
          route: currentRoute,
          fileHints: config.allowedPaths,
          previousResponse,
        },
      });

      setChatResult(result);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "요청 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setBusy(false);
    }
  };

  const onApply = async () => {
    if (!chatResult?.patchId) {
      setError("적용 가능한 패치가 없습니다.");
      return;
    }

    setBusy(true);
    setError(null);
    setShowResponsePanel(true);

    try {
      const result = await apiClient.apply({
        patchId: chatResult.patchId,
        approvalToken: `approve:${chatResult.patchId}`,
      });

      if (result.applied) {
        setToastMessage(result.summary);
        window.setTimeout(() => {
          setToastMessage(null);
        }, 3000);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "패치 적용 중 오류가 발생했습니다.",
      );
    } finally {
      setBusy(false);
    }
  };

  const floatingWrapperStyle: CSSProperties = position
    ? {
        position: "fixed",
        zIndex: 2147483000,
        left: `${position.x}px`,
        top: `${position.y}px`,
      }
    : {
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 2147483000,
      };

  const panelStyle: CSSProperties = {
    position: "relative",
    marginTop: 12,
    display: "grid",
    gridTemplateColumns: showResponsePanel
      ? `${INPUT_PANEL_WIDTH}px ${RAIL_WIDTH}px minmax(0, 1fr)`
      : `${INPUT_PANEL_WIDTH}px ${RAIL_WIDTH}px`,
    width: showResponsePanel ? PANEL_WIDTH : INPUT_PANEL_WIDTH + RAIL_WIDTH,
    maxHeight: "calc(100vh - 96px)",
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    background: "#f8fafc",
    boxShadow: "0 18px 60px rgba(15, 23, 42, 0.16)",
    color: "#0f172a",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  return (
    <>
      <style>{styleText}</style>

      {toastMessage ? (
        <div style={toastStyle}>
          <p aria-live="polite" style={{ margin: 0 }}>
            {toastMessage}
          </p>
        </div>
      ) : null}

      <div ref={containerRef} style={floatingWrapperStyle} {...{ [OVERLAY_ATTRIBUTE]: "" }}>
        <div>
          <button
            type="button"
            className="yrdc-trigger"
            style={triggerButtonStyle}
            onClick={onMainToggleClick}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            aria-label="Dev Copilot 열기"
            title="Dev Copilot 열기/닫기 / 드래그해서 이동"
          >
            <SparklesIcon aria-hidden style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {open ? (
          <section style={panelStyle}>
            <div style={railStyle}>
              <button
                type="button"
                className="yrdc-pressable"
                style={railToggleStyle}
                onClick={() => setShowResponsePanel((prev) => !prev)}
                aria-label={showResponsePanel ? "응답 패널 닫기" : "응답 패널 열기"}
                title={showResponsePanel ? "응답 패널 닫기" : "응답 패널 열기"}
              >
                {showResponsePanel ? (
                  <PanelRightCloseIcon aria-hidden style={{ width: 14, height: 14 }} />
                ) : (
                  <PanelRightOpenIcon aria-hidden style={{ width: 14, height: 14 }} />
                )}
              </button>
            </div>

            <div style={inputPanelStyle}>
              <header>
                <p style={titleStyle}>{UI_LABELS.title}</p>
                <p style={subtitleStyle}>{UI_LABELS.subtitle}</p>
              </header>

              <div style={statusBoxStyle}>
                <p style={statusLineStyle}>로컬 에이전트: {AGENT_LABEL}</p>
                {agentStatus?.model ? (
                  <p style={statusLineStyle}>모델: {agentStatus.model}</p>
                ) : null}
                {agentStatus ? (
                  <p
                    style={{
                      ...statusLineStyle,
                      color: agentStatus.authenticated ? "#15803d" : "#dc2626",
                    }}
                  >
                    {agentStatus.message}
                    {agentStatus.loginCommand
                      ? ` 터미널에서 ${agentStatus.loginCommand} 실행`
                      : ""}
                  </p>
                ) : null}
              </div>

              <label style={labelStyle}>선택 텍스트</label>
              <textarea
                value={selectedText}
                onChange={(event) => setSelectedText(event.target.value)}
                rows={5}
                className="yrdc-field"
                style={textareaStyle}
              />

              <label style={labelStyle}>프롬프트</label>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                placeholder={UI_LABELS.promptPlaceholder}
                className="yrdc-field"
                style={textareaStyle}
              />

              <div style={buttonRowStyle}>
                <button
                  type="button"
                  className="yrdc-pressable"
                  onClick={() => onSubmit("answer")}
                  disabled={busy || Boolean(agentStatus && !agentStatus.authenticated)}
                  style={{
                    ...buttonStyle,
                    background: "#111827",
                    color: "#ffffff",
                    opacity: busy || Boolean(agentStatus && !agentStatus.authenticated) ? 0.55 : 1,
                  }}
                >
                  {UI_LABELS.askButton}
                </button>
                <button
                  type="button"
                  className="yrdc-pressable"
                  onClick={() => onSubmit("edit")}
                  disabled={busy || Boolean(agentStatus && !agentStatus.authenticated)}
                  style={{
                    ...buttonStyle,
                    background: "#2563eb",
                    color: "#ffffff",
                    opacity: busy || Boolean(agentStatus && !agentStatus.authenticated) ? 0.55 : 1,
                  }}
                >
                  {UI_LABELS.editButton}
                </button>
              </div>
            </div>

            {showResponsePanel ? (
              <aside style={responsePanelStyle}>
                <div style={{ display: "flex", flexDirection: "column", minHeight: 320, height: "100%" }}>
                  <div>
                    <p style={titleStyle}>응답</p>
                  </div>

                  <div style={responseCardStyle}>
                    {busy ? (
                      <div style={busyContainerStyle}>
                        <span className="yrdc-spinner" style={spinnerStyle} />
                        <span>Codex 응답을 기다리는 중입니다.</span>
                      </div>
                    ) : chatResult ? (
                      <article style={articleStyle}>
                        {error ? (
                          <p style={errorBoxStyle}>{error}</p>
                        ) : null}
                        {chatResult.warnings.length ? (
                          <div style={warningBoxStyle}>
                            {chatResult.warnings.map((warning) => (
                              <p key={warning} style={{ margin: 0 }}>
                                {warning}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        <p style={messageStyle}>{chatResult.message}</p>

                        {chatResult.patchPreview ? (
                          <>
                            <pre style={patchPreviewStyle}>{chatResult.patchPreview}</pre>
                            {chatResult.patchId ? (
                              <button
                                type="button"
                                className="yrdc-pressable"
                                onClick={onApply}
                                disabled={busy}
                                style={{
                                  ...buttonStyle,
                                  alignSelf: "flex-start",
                                  background: "#15803d",
                                  color: "#ffffff",
                                  opacity: busy ? 0.55 : 1,
                                }}
                              >
                                {UI_LABELS.applyButton}
                              </button>
                            ) : null}
                          </>
                        ) : null}
                      </article>
                    ) : error ? (
                      <p style={errorBoxStyle}>{error}</p>
                    ) : (
                      <p style={placeholderStyle}>
                        질문 또는 코드 수정 제안을 실행하면 이 영역에 결과가 표시됩니다.
                      </p>
                    )}
                  </div>
                </div>
              </aside>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}

const triggerButtonStyle: CSSProperties = {
  display: "flex",
  width: FLOATING_BUTTON_SIZE,
  height: FLOATING_BUTTON_SIZE,
  borderRadius: 9999,
  border: "1px solid #f2d675",
  background: "#fff4b8",
  color: "#ffb03d",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.18)",
  cursor: "grab",
};

const railStyle: CSSProperties = {
  display: "flex",
  minHeight: 320,
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const railToggleStyle: CSSProperties = {
  display: "flex",
  width: 24,
  height: 24,
  border: "0",
  background: "transparent",
  color: "#64748b",
  cursor: "pointer",
  alignItems: "center",
  justifyContent: "center",
};

const inputPanelStyle: CSSProperties = {
  padding: 16,
  minHeight: 0,
  overflowY: "auto",
  background: "#ffffff",
};

const responsePanelStyle: CSSProperties = {
  minHeight: 0,
  overflow: "hidden",
  padding: 16,
  borderLeft: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 700,
  lineHeight: 1.4,
  color: "#111827",
};

const subtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: 14,
  lineHeight: 1.5,
  color: "#6b7280",
};

const statusBoxStyle: CSSProperties = {
  marginTop: 12,
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  background: "#ffffff",
  padding: "12px 14px",
  fontSize: 14,
  lineHeight: 1.6,
  color: "#6b7280",
};

const statusLineStyle: CSSProperties = {
  margin: 0,
};

const labelStyle: CSSProperties = {
  display: "block",
  marginTop: 16,
  fontSize: 14,
  lineHeight: 1.5,
  color: "#6b7280",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  resize: "vertical",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  padding: "12px 14px",
  marginTop: 6,
  fontSize: 15,
  lineHeight: 1.7,
  color: "#111827",
  boxSizing: "border-box",
  minHeight: 132,
};

const buttonRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 16,
};

const buttonStyle: CSSProperties = {
  border: 0,
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1,
  cursor: "pointer",
};

const responseCardStyle: CSSProperties = {
  marginTop: 12,
  minHeight: 0,
  flex: 1,
  overflowY: "auto",
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  background: "#ffffff",
  padding: 16,
};

const busyContainerStyle: CSSProperties = {
  display: "flex",
  height: "100%",
  minHeight: 192,
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  color: "#6b7280",
  fontSize: 14,
};

const spinnerStyle: CSSProperties = {
  display: "inline-block",
  width: 18,
  height: 18,
  borderRadius: 9999,
  border: "2px solid #d1d5db",
  borderTopColor: "#2563eb",
};

const articleStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const errorBoxStyle: CSSProperties = {
  margin: 0,
  border: "1px solid #fca5a5",
  borderRadius: 12,
  background: "#fef2f2",
  padding: "10px 12px",
  fontSize: 14,
  lineHeight: 1.6,
  color: "#dc2626",
  whiteSpace: "pre-wrap",
};

const warningBoxStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  border: "1px solid #fca5a5",
  borderRadius: 12,
  background: "#fef2f2",
  padding: "10px 12px",
  fontSize: 14,
  lineHeight: 1.6,
  color: "#dc2626",
};

const messageStyle: CSSProperties = {
  margin: 0,
  whiteSpace: "pre-wrap",
  fontSize: 15,
  lineHeight: 1.7,
  color: "#111827",
};

const patchPreviewStyle: CSSProperties = {
  margin: 0,
  maxHeight: 288,
  overflow: "auto",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  padding: 12,
  fontSize: 13,
  lineHeight: 1.6,
  color: "#111827",
  fontFamily:
    "ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Consolas, monospace",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const placeholderStyle: CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.6,
  color: "#6b7280",
};

const toastStyle: CSSProperties = {
  position: "fixed",
  top: 16,
  right: 16,
  zIndex: 2147483600,
  maxWidth: 360,
  borderRadius: 16,
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  color: "#15803d",
  padding: "12px 14px",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: 14,
  lineHeight: 1.6,
};
