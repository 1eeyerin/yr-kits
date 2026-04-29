import { useCallback, useState } from "react";

import type { CopilotAgent, CopilotChatResponse } from "../../../shared/contracts/copilot";

export const useCopilotSession = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatResult, setChatResult] = useState<CopilotChatResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<CopilotAgent>("codex");
  const [showResponsePanel, setShowResponsePanel] = useState(false);

  const closePanel = useCallback(() => {
    setOpen(false);
    setShowResponsePanel(false);
  }, []);

  const togglePanel = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const openPanel = useCallback(() => {
    setOpen(true);
  }, []);

  const toggleResponsePanel = useCallback(() => {
    setShowResponsePanel((prev) => !prev);
  }, []);

  const startRequest = useCallback(() => {
    setBusy(true);
    setError(null);
    setShowResponsePanel(true);
  }, []);

  const finishRequest = useCallback((result: CopilotChatResponse) => {
    setChatResult(result);
    setBusy(false);
  }, []);

  const failRequest = useCallback((message: string) => {
    setError(message);
    setBusy(false);
  }, []);

  const startApply = useCallback(() => {
    setApplying(true);
    setError(null);
  }, []);

  const finishApply = useCallback(() => {
    setApplying(false);
  }, []);

  const failApply = useCallback((message: string) => {
    setError(message);
    setApplying(false);
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return {
    open,
    prompt,
    setPrompt,
    busy,
    applying,
    error,
    chatResult,
    toastMessage,
    selectedAgent,
    setSelectedAgent,
    showResponsePanel,
    setError,
    closePanel,
    openPanel,
    togglePanel,
    toggleResponsePanel,
    startRequest,
    finishRequest,
    failRequest,
    startApply,
    finishApply,
    failApply,
    showToast,
    clearToast,
  };
};
