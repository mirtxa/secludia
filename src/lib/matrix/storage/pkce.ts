/**
 * PKCE state storage (sessionStorage)
 * Temporary storage during OAuth flow - only needs to survive page redirect
 */

import { STORAGE_KEYS } from "../constants";

/** PKCE state stored during OAuth flow */
export interface StoredPKCE {
  codeVerifier: string;
  state: string;
  issuer: string;
  /** Device ID requested in the OAuth scope */
  deviceId: string;
}

/**
 * Store PKCE state temporarily during OAuth flow.
 * Uses sessionStorage since PKCE only needs to survive the OAuth redirect.
 */
export function storePKCEState(pkce: StoredPKCE): void {
  sessionStorage.setItem(STORAGE_KEYS.PKCE, JSON.stringify(pkce));
}

/**
 * Get stored PKCE state.
 */
export function getPKCEState(): StoredPKCE | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEYS.PKCE);
    if (!stored) return null;
    return JSON.parse(stored) as StoredPKCE;
  } catch {
    return null;
  }
}

/**
 * Clear PKCE state after use.
 */
export function clearPKCEState(): void {
  sessionStorage.removeItem(STORAGE_KEYS.PKCE);
}
