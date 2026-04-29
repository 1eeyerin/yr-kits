import { useState } from "react";

import type { CopilotAgent, CopilotChatResponse } from "../../../shared/contracts/copilot";

export const useCopilotSession = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatResult, setChatResult] = useState<CopilotChatResponse | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<CopilotAgent>("codex");
  const [showResponsePanel, setShowResponsePanel] = useState(false);

  return {
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
  };
};
