import {
  DiscoveryError,
  OAuthFlowError,
  TAURI_REDIRECT_URI,
  WEB_REDIRECT_PATH,
} from "@/lib/matrix";
import type { MatrixSession } from "@/lib/matrix";
import type { AuthError } from "./AuthContext.types";

/**
 * Get the appropriate redirect URI for the current platform.
 */
export function getRedirectUri(isTauri: boolean): string {
  if (isTauri) {
    return TAURI_REDIRECT_URI;
  }
  return `${window.location.origin}${WEB_REDIRECT_PATH}`;
}

/**
 * Build a MatrixSession object from components.
 */
export function buildMatrixSession(
  userId: string,
  deviceId: string,
  homeserverUrl: string,
  accessToken: string
): MatrixSession {
  return { userId, deviceId, homeserverUrl, accessToken };
}

/** Convert various error types to AuthError */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof DiscoveryError) {
    return {
      message: error.message,
      code: error.stage,
      recoverable: true,
    };
  }

  if (error instanceof OAuthFlowError) {
    // Invalid grant typically means session is truly invalid
    const isInvalidGrant = error.oauthError === "invalid_grant";
    return {
      message: error.message,
      code: error.oauthError,
      recoverable: !isInvalidGrant,
    };
  }

  // Get error message from Error object or string
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : null;

  if (message) {
    // Check for OAuth cancellation (machine-readable code from Rust)
    if (message === "OAUTH_CANCELLED") {
      return {
        message: "AUTH_ERROR_CANCELLED",
        code: "cancelled",
        recoverable: true,
      };
    }

    // Check for OAuth timeout (machine-readable code from Rust)
    if (message === "OAUTH_TIMEOUT") {
      return {
        message: "AUTH_ERROR_TIMEOUT",
        code: "timeout",
        recoverable: true,
      };
    }

    return {
      message,
      recoverable: true,
    };
  }

  return {
    message: "AUTH_ERROR_UNKNOWN",
    recoverable: true,
  };
}
