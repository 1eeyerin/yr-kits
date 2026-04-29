"use client";

import type { ReactNode } from "react";

import { InternalDevCopilotProvider } from "../shared/lib/dev-copilot-context";
import type { DevCopilotConfig } from "../shared/lib/config";

interface DevCopilotProviderProps {
  config?: Partial<DevCopilotConfig>;
  children: ReactNode;
}

export function DevCopilotProvider({ config, children }: DevCopilotProviderProps) {
  return <InternalDevCopilotProvider config={config}>{children}</InternalDevCopilotProvider>;
}
