/**
 * Session metadata storage (localStorage)
 * Non-sensitive data only - tokens are stored in platform-specific secure storage
 */

import type { StoredSession } from "../types";
import { STORAGE_KEYS } from "../constants";

/**
 * Store session metadata (non-sensitive info) in localStorage.
 */
export function storeSessionMetadata(session: StoredSession): void {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/**
 * Get session metadata from localStorage.
 */
export function getSessionMetadata(): StoredSession | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!stored) return null;
    return JSON.parse(stored) as StoredSession;
  } catch {
    return null;
  }
}

/**
 * Clear session metadata from localStorage.
 */
export function clearSessionMetadata(): void {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Clear all auth-related data from storage.
 * Note: Token storage is handled by platform, call platform.storage.clear() separately.
 */
export function clearLocalStorageAuthData(): void {
  clearSessionMetadata();
  sessionStorage.removeItem(STORAGE_KEYS.PKCE);
  localStorage.removeItem(STORAGE_KEYS.VERIFICATION_SKIPPED);

  // Clear matrix-js-sdk MemoryStore entries (cached sync filters, etc.)
  const sdkKeys = Object.keys(localStorage).filter((k) => k.startsWith("mxjssdk_"));
  for (const key of sdkKeys) {
    localStorage.removeItem(key);
  }
}
