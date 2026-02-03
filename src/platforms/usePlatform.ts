/**
 * Hook to access the platform context
 */

import { useContext } from "react";
import { PlatformContext } from "./PlatformContext.types";
import type { Platform } from "./types";

export function usePlatform(): Platform {
  const platform = useContext(PlatformContext);
  if (!platform) {
    throw new Error("usePlatform must be used within PlatformProvider");
  }
  return platform;
}
