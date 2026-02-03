/**
 * Platform loader
 * Dynamically loads the appropriate platform implementation
 */

import type { Platform } from "./types";

/**
 * Detect if running in Tauri environment
 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Load the platform implementation for the current environment
 */
export async function loadPlatform(): Promise<Platform> {
  if (isTauri()) {
    const module = await import("./tauri");
    return module.default;
  } else {
    const module = await import("./web");
    return module.default;
  }
}
