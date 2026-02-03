/**
 * PKCE (Proof Key for Code Exchange) implementation per RFC 7636
 */

import type { PKCEChallenge } from "../types";
import {
  PKCE_CODE_CHALLENGE_METHOD,
  MATRIX_SCOPE_API,
  MATRIX_SCOPE_DEVICE_PREFIX,
} from "../constants";

/**
 * Convert standard base64 to base64url (RFC 4648 §5).
 * URL-safe alphabet, no padding.
 */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate a base64url-encoded random string from the specified number of bytes.
 */
function generateRandomBase64Url(byteLength: number): string {
  const array = new Uint8Array(byteLength);
  crypto.getRandomValues(array);
  return toBase64Url(btoa(String.fromCharCode(...array)));
}

/**
 * Generate a URL-safe base64 encoded SHA-256 hash of the input string.
 */
async function sha256Base64Url(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  return toBase64Url(btoa(String.fromCharCode(...hashArray)));
}

/**
 * Generate a device ID for Matrix OAuth.
 * Per spec: Should be random, use unreserved URI characters, at least 10 chars.
 * Uses base64url encoding (unreserved chars: a-z A-Z 0-9 - _)
 */
export function generateDeviceId(): string {
  // Generate 12 random bytes → 16 base64url chars (well above 10 char minimum)
  return generateRandomBase64Url(12);
}

/**
 * Build the OAuth scope string including device ID.
 */
export function buildScope(deviceId: string): string {
  return `${MATRIX_SCOPE_API} ${MATRIX_SCOPE_DEVICE_PREFIX}${deviceId}`;
}

/**
 * Generate PKCE challenge for OAuth authorization.
 * Per RFC 7636: 32 random octets → base64url → 43-char code_verifier
 */
export async function generatePKCE(): Promise<PKCEChallenge> {
  // Generate 32 random bytes → 43 base64url chars (per RFC 7636 §4.1)
  const codeVerifier = generateRandomBase64Url(32);

  // Generate code challenge: BASE64URL(SHA256(ASCII(code_verifier)))
  const codeChallenge = await sha256Base64Url(codeVerifier);

  // Generate random state for CSRF protection (16 bytes → 22 chars)
  const state = generateRandomBase64Url(16);

  return {
    codeVerifier,
    codeChallenge,
    state,
  };
}

/** PKCE code challenge method (always S256) */
export { PKCE_CODE_CHALLENGE_METHOD };
