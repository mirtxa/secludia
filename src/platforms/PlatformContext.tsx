/**
 * Platform context provider
 * Provides platform-specific implementations to the app
 */

import type { ReactNode } from "react";
import type { Platform } from "./types";
import { PlatformContext } from "./PlatformContext.types";

interface PlatformProviderProps {
  platform: Platform;
  children: ReactNode;
}

export function PlatformProvider({ platform, children }: PlatformProviderProps) {
  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>;
}
