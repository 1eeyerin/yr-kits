"use client";

import { useEffect, useRef } from "react";

import { applyCopilotPatch } from "../../../features/apply-copilot-patch/model/apply-copilot-patch";
import { useCopilotSession } from "../../../features/copilot-session/model/use-copilot-session";
import { useAgentStatusPolling } from "../../../features/select-agent/model/use-agent-status-polling";
import { submitCopilotRequest } from "../../../features/submit-copilot-request/model/submit-copilot-request";
import { isAgentReady } from "../../../entities/agent/model";
import { hasApplicablePatch } from "../../../entities/patch/model";
import { toPreviousResponse } from "../../../entities/session/model";
import { useDevCopilotConfig } from "../../../shared/lib/dev-copilot-context";
import { toErrorMessage } from "../../../shared/lib/error";
import { OVERLAY_ATTRIBUTE, useSelectionCapture } from "../../../shared/ui/use-selection-capture";
import { useDraggableFab } from "../model/use-draggable-fab";
import { CopilotRequestForm } from "./copilot-request-form";
import { CopilotResponsePanel } from "./copilot-response-panel";
import { TOAST_DURATION_MS } from "./constants";
import { OverlayToast } from "./overlay-toast";
import { OverlayTrigger } from "./overlay-trigger";
import { ResponsePanelRail } from "./response-panel-rail";
import { createPanelStyle } from "./styles";
import { OVERLAY_STYLE_TEXT } from "./tokens";
import type { CopilotMode } from "../../../shared/contracts/copilot";

export function CopilotOverlayWidget() {
  const config = useDevCopilotConfig();
  const { selectedText, setSelectedText } = useSelectionCapture();
  const session = useCopilotSession();
  const { agentStatus } = useAgentStatusPolling(
    session.open,
    session.selectedAgent,
    config.bridgeBaseUrl,
  );
  const draggable = useDraggableFab();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!session.open) {
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

      session.closePanel();
      draggable.resetDragState();
    };

    document.addEventListener("pointerdown", onPointerDownOutside);
    return () => document.removeEventListener("pointerdown", onPointerDownOutside);
  }, [session.open, session.closePanel, draggable.resetDragState]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isFindShortcut = event.key.toLowerCase() === "f" && (event.metaKey || event.ctrlKey);

      if (!isFindShortcut) {
        return;
      }

      const target = event.target;
      if (target instanceof Element && target.closest(`[${OVERLAY_ATTRIBUTE}]`)) {
        return;
      }

      const currentSelection = window.getSelection()?.toString().trim() ?? "";
      const nextSelectedText = currentSelection || selectedText.trim();

      if (!nextSelectedText) {
        return;
      }

      event.preventDefault();
      setSelectedText(nextSelectedText);
      session.openPanel();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedText, setSelectedText, session.openPanel]);

  if (!config.enabled) {
    return null;
  }

  const onSubmit = async (mode: CopilotMode) => {
    if (!isAgentReady(agentStatus)) {
      session.setError(agentStatus?.message ?? "에이전트 상태를 확인할 수 없습니다.");
      return;
    }

    if (!session.prompt.trim()) {
      session.setError("프롬프트를 입력해 주세요.");
      return;
    }

    session.startRequest();

    try {
      const route = typeof window !== "undefined" ? window.location.pathname : undefined;
      const result = await submitCopilotRequest({
        selectedText,
        prompt: session.prompt,
        mode,
        allowedPaths: config.allowedPaths,
        previousResponse: toPreviousResponse(session.chatResult),
        selectedAgent: session.selectedAgent,
        route,
        baseUrl: config.bridgeBaseUrl,
      });
      session.finishRequest(result);
    } catch (error) {
      session.failRequest(toErrorMessage(error, "요청 처리 중 오류가 발생했습니다."));
    }
  };

  const onApply = async () => {
    if (!hasApplicablePatch(session.chatResult)) {
      session.setError("적용 가능한 패치가 없습니다.");
      return;
    }

    session.startApply();

    try {
      const result = await applyCopilotPatch(session.chatResult.patchId, config.bridgeBaseUrl);
      if (result.applied) {
        session.showToast(result.summary);
        window.setTimeout(session.clearToast, TOAST_DURATION_MS);
      }
      session.finishApply();
    } catch (error) {
      session.failApply(toErrorMessage(error, "패치 적용 중 오류가 발생했습니다."));
    }
  };

  const onMainToggleClick = () => {
    if (draggable.consumeToggleSuppression()) {
      return;
    }

    if (session.open) {
      draggable.resetDragState();
    }
    session.togglePanel();
  };

  return (
    <>
      <style>{OVERLAY_STYLE_TEXT}</style>
      <OverlayToast message={session.toastMessage} />

      <div ref={containerRef} style={draggable.floatingWrapperStyle} {...{ [OVERLAY_ATTRIBUTE]: "" }}>
        <OverlayTrigger
          onClick={onMainToggleClick}
          onPointerDown={(event) => {
            const wrapperRect = containerRef.current?.getBoundingClientRect();
            const originX = draggable.position?.x ?? wrapperRect?.left ?? 0;
            const originY = draggable.position?.y ?? wrapperRect?.top ?? 0;
            draggable.onPointerDown(event, { x: originX, y: originY });
          }}
          onPointerMove={draggable.onPointerMove}
          onPointerEnd={draggable.onPointerEnd}
        />

        {session.open ? (
          <section style={createPanelStyle(session.showResponsePanel)}>
            <CopilotRequestForm
              selectedText={selectedText}
              prompt={session.prompt}
              busy={session.busy || session.applying}
              selectedAgent={session.selectedAgent}
              agentStatus={agentStatus}
              onSelectedTextChange={setSelectedText}
              onPromptChange={session.setPrompt}
              onAgentChange={session.setSelectedAgent}
              onSubmit={onSubmit}
            />
            <ResponsePanelRail
              showResponsePanel={session.showResponsePanel}
              onToggle={session.toggleResponsePanel}
            />
            {session.showResponsePanel ? (
              <CopilotResponsePanel
                busy={session.busy}
                applying={session.applying}
                error={session.error}
                chatResult={session.chatResult}
                selectedAgent={session.selectedAgent}
                onApply={onApply}
              />
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}
