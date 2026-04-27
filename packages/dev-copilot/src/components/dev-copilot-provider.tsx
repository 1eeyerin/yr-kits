"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  resolveDevCopilotConfig,
  type DevCopilotConfig,
} from "../lib/config";

const DevCopilotContext = createContext<DevCopilotConfig | null>(null);

interface DevCopilotProviderProps {
  config?: Partial<DevCopilotConfig>;
  children: ReactNode;
}

export function DevCopilotProvider({
  config,
  children,
}: DevCopilotProviderProps) {
  const resolvedConfig = resolveDevCopilotConfig(config);

  return (
    <DevCopilotContext.Provider value={resolvedConfig}>
      {children}
    </DevCopilotContext.Provider>
  );
}

export const useDevCopilotConfig = () => {
  const context = useContext(DevCopilotContext);

  if (!context) {
    throw new Error("DevCopilotProvider 내부에서만 사용할 수 있습니다.");
  }

  return context;
};
