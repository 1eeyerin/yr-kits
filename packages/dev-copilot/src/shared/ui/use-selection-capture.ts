"use client";

import { useCallback, useEffect, useState } from "react";

export const OVERLAY_ATTRIBUTE = "data-dev-copilot-overlay";

const toSelectionText = () => {
  const selection = window.getSelection();
  return selection?.toString().trim() ?? "";
};

const isNodeInsideOverlay = (node: Node | null) => {
  if (!node) {
    return false;
  }

  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(element?.closest(`[${OVERLAY_ATTRIBUTE}]`));
};

const isInsideOverlay = (target: EventTarget | null) => {
  return (
    target instanceof Element &&
    Boolean(target.closest(`[${OVERLAY_ATTRIBUTE}]`))
  );
};

export const useSelectionCapture = () => {
  const [selectedText, setSelectedText] = useState("");

  const syncSelection = useCallback((event: MouseEvent | KeyboardEvent) => {
    const selection = window.getSelection();
    const startedInsideOverlay = isNodeInsideOverlay(selection?.anchorNode ?? null);
    const endedInsideOverlay = isNodeInsideOverlay(selection?.focusNode ?? null);

    if (isInsideOverlay(event.target) || startedInsideOverlay || endedInsideOverlay) {
      return;
    }

    const nextSelectedText = selection?.toString().trim() ?? toSelectionText();

    if (!nextSelectedText) {
      return;
    }

    setSelectedText(nextSelectedText);
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", syncSelection);
    document.addEventListener("keyup", syncSelection);

    return () => {
      document.removeEventListener("mouseup", syncSelection);
      document.removeEventListener("keyup", syncSelection);
    };
  }, [syncSelection]);

  return {
    selectedText,
    setSelectedText,
  };
};
