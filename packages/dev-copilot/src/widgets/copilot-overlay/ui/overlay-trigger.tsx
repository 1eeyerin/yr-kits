import type { PointerEvent } from "react";

import { SparklesIcon } from "./icons";
import { triggerButtonStyle } from "./styles";

interface OverlayTriggerProps {
  onClick: () => void;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerEnd: (event: PointerEvent<HTMLButtonElement>) => void;
}

export function OverlayTrigger({
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerEnd,
}: OverlayTriggerProps) {
  return (
    <button
      type="button"
      className="yrdc-trigger"
      style={triggerButtonStyle}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      aria-label="Dev Copilot 열기"
      title="Dev Copilot 열기/닫기 / 드래그해서 이동"
    >
      <SparklesIcon aria-hidden style={{ width: 16, height: 16 }} />
    </button>
  );
}
