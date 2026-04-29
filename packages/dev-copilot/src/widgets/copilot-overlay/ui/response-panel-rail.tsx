import { PanelRightCloseIcon, PanelRightOpenIcon } from "./icons";
import { railStyle, railToggleStyle } from "./styles";

interface ResponsePanelRailProps {
  showResponsePanel: boolean;
  onToggle: () => void;
}

export function ResponsePanelRail({ showResponsePanel, onToggle }: ResponsePanelRailProps) {
  return (
    <div style={railStyle}>
      <button
        type="button"
        className="yrdc-pressable"
        style={railToggleStyle}
        onClick={onToggle}
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
  );
}
