import type { CopilotAgent, CopilotChatResponse } from "../../../shared/contracts/copilot";
import { AGENT_LABELS } from "../../../entities/agent/model";
import { createActionButtonStyle } from "./button-style";
import {
  articleStyle,
  busyContainerStyle,
  errorBoxStyle,
  messageStyle,
  patchPreviewStyle,
  placeholderStyle,
  responseCardStyle,
  responsePanelStyle,
  spinnerStyle,
  titleStyle,
  warningBoxStyle,
} from "./styles";
import { OVERLAY_LABELS } from "./tokens";

interface CopilotResponsePanelProps {
  busy: boolean;
  applying: boolean;
  error: string | null;
  chatResult: CopilotChatResponse | null;
  selectedAgent: CopilotAgent;
  onApply: () => void;
}

export function CopilotResponsePanel({
  busy,
  applying,
  error,
  chatResult,
  selectedAgent,
  onApply,
}: CopilotResponsePanelProps) {
  return (
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
                      disabled={applying}
                      style={createActionButtonStyle("success", applying, { alignSelf: "flex-start" })}
                    >
                      {applying ? OVERLAY_LABELS.applyingButton : OVERLAY_LABELS.applyButton}
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
  );
}
