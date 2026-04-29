"use client";

import { useEffect, useRef } from "react";

import { applyCopilotPatch } from "../../../features/apply-copilot-patch/model/apply-copilot-patch";
import { useCopilotSession } from "../../../features/copilot-session/model/use-copilot-session";
import { useAgentStatusPolling } from "../../../features/select-agent/model/use-agent-status-polling";
import { submitCopilotRequest } from "../../../features/submit-copilot-request/model/submit-copilot-request";
import { AGENT_LABELS, isAgentReady } from "../../../entities/agent/model";
import { hasApplicablePatch } from "../../../entities/patch/model";
import { toPreviousResponse } from "../../../entities/session/model";
import { OVERLAY_ATTRIBUTE, useSelectionCapture } from "../../../shared/ui/use-selection-capture";
import { useDevCopilotConfig } from "../../../shared/lib/dev-copilot-context";
import { useDraggableFab } from "../model/use-draggable-fab";
import {
  agentToggleButtonStyle,
  agentToggleRowStyle,
  articleStyle,
  busyContainerStyle,
  buttonRowStyle,
  buttonStyle,
  createPanelStyle,
  errorBoxStyle,
  inputPanelStyle,
  labelStyle,
  messageStyle,
  patchPreviewStyle,
  placeholderStyle,
  railStyle,
  railToggleStyle,
  responseCardStyle,
  responsePanelStyle,
  spinnerStyle,
  statusBoxStyle,
  statusLineStyle,
  subtitleStyle,
  textareaStyle,
  titleStyle,
  toastStyle,
  triggerButtonStyle,
  warningBoxStyle,
} from "./styles";
import { PanelRightCloseIcon, PanelRightOpenIcon, SparklesIcon } from "./icons";
import { OVERLAY_LABELS, OVERLAY_STYLE_TEXT } from "./tokens";

export function CopilotOverlayWidget() {
  const config = useDevCopilotConfig();
  const { selectedText, setSelectedText } = useSelectionCapture();
  const {
    open,
    setOpen,
    prompt,
    setPrompt,
    busy,
    setBusy,
    error,
    setError,
    chatResult,
    setChatResult,
    toastMessage,
    setToastMessage,
    selectedAgent,
    setSelectedAgent,
    showResponsePanel,
    setShowResponsePanel,
  } = useCopilotSession();
  const { agentStatus } = useAgentStatusPolling(open, selectedAgent, config.bridgeBaseUrl);
  const {
    position,
    floatingWrapperStyle,
    onPointerDown,
    onPointerMove,
    onPointerEnd,
    consumeToggleSuppression,
    resetDragState,
  } = useDraggableFab();

  const containerRef = useRef<HTMLDivElement>(null);

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
      resetDragState();
    };

    document.addEventListener("pointerdown", onPointerDownOutside);
    return () => document.removeEventListener("pointerdown", onPointerDownOutside);
  }, [open, setOpen, setShowResponsePanel, resetDragState]);

  if (!config.enabled) {
    return null;
  }

  const previousResponse = toPreviousResponse(chatResult);

  const onSubmit = async (mode: "answer" | "edit") => {
    if (!isAgentReady(agentStatus)) {
      setError(agentStatus?.message ?? "에이전트 상태를 확인할 수 없습니다.");
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
      const route = typeof window !== "undefined" ? window.location.pathname : undefined;
      const result = await submitCopilotRequest({
        selectedText,
        prompt,
        mode,
        allowedPaths: config.allowedPaths,
        previousResponse,
        selectedAgent,
        route,
        baseUrl: config.bridgeBaseUrl,
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
    if (!hasApplicablePatch(chatResult)) {
      setError("적용 가능한 패치가 없습니다.");
      return;
    }

    setBusy(true);
    setError(null);
    setShowResponsePanel(true);

    try {
      const result = await applyCopilotPatch(chatResult!.patchId!, config.bridgeBaseUrl);
      if (result.applied) {
        setToastMessage(result.summary);
        window.setTimeout(() => setToastMessage(null), 3000);
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

  const onMainToggleClick = () => {
    if (consumeToggleSuppression()) {
      return;
    }

    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        resetDragState();
      }
      return next;
    });
  };

  const panelStyle = createPanelStyle(showResponsePanel);

  return (
    <>
      <style>{OVERLAY_STYLE_TEXT}</style>

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
            onPointerDown={(event) => {
              const wrapperRect = containerRef.current?.getBoundingClientRect();
              const originX = position?.x ?? wrapperRect?.left ?? 0;
              const originY = position?.y ?? wrapperRect?.top ?? 0;
              onPointerDown(event, { x: originX, y: originY });
            }}
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
            <div style={inputPanelStyle}>
              <header>
                <p style={titleStyle}>{OVERLAY_LABELS.title}</p>
                <p style={subtitleStyle}>{OVERLAY_LABELS.subtitle}</p>
              </header>

              <div style={statusBoxStyle}>
                <p style={statusLineStyle}>로컬 에이전트: {AGENT_LABELS[selectedAgent]}</p>
                {agentStatus?.model ? <p style={statusLineStyle}>모델: {agentStatus.model}</p> : null}
                {agentStatus ? (
                  <p
                    style={{
                      ...statusLineStyle,
                      color: agentStatus.authenticated ? "#15803d" : "#dc2626",
                    }}
                  >
                    {agentStatus.message}
                    {agentStatus.loginCommand && !agentStatus.message.includes(agentStatus.loginCommand)
                      ? ` 터미널에서 ${agentStatus.loginCommand} 실행`
                      : ""}
                  </p>
                ) : null}
              </div>

              <label style={labelStyle}>에이전트</label>
              <div style={agentToggleRowStyle}>
                {(["codex", "claude"] as const).map((agent) => {
                  const active = selectedAgent === agent;
                  return (
                    <button
                      key={agent}
                      type="button"
                      className="yrdc-pressable"
                      onClick={() => setSelectedAgent(agent)}
                      disabled={busy}
                      style={{
                        ...agentToggleButtonStyle,
                        background: active ? "#111827" : "#e2e8f0",
                        color: active ? "#ffffff" : "#1e293b",
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      {AGENT_LABELS[agent]}
                    </button>
                  );
                })}
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
                placeholder={OVERLAY_LABELS.promptPlaceholder}
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
                  {OVERLAY_LABELS.askButton}
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
                  {OVERLAY_LABELS.editButton}
                </button>
              </div>
            </div>

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
                        <span>{AGENT_LABELS[selectedAgent]} 응답을 기다리는 중입니다.</span>
                      </div>
                    ) : chatResult ? (
                      <article style={articleStyle}>
                        {error ? <p style={errorBoxStyle}>{error}</p> : null}
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
                                {OVERLAY_LABELS.applyButton}
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
