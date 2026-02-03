/**
 * Session and discovery type definitions
 */

import type { AuthMetadata } from "./oauth";

// ============================================================================
// MSC Extension Types (not in matrix-js-sdk yet)
// ============================================================================

/** RTC focus server configuration (MSC4143 - for MatrixRTC calls) */
export interface RtcFocus {
  type: string;
  /** LiveKit JWT service URL (for type: "livekit") */
  livekit_service_url?: string;
  /** Allow additional properties for future focus types */
  [key: string]: unknown;
}

// ============================================================================
// Session Types
// ============================================================================

/** Session metadata stored in localStorage (non-sensitive) */
export interface StoredSession {
  userId: string;
  deviceId: string;
  homeserverUrl: string;
  clientId: string;
  /** OAuth issuer URL for the homeserver */
  issuer: string;
  /** OAuth token endpoint URL (needed for token refresh) */
  tokenEndpoint: string;
  /** OAuth revocation endpoint URL (needed for logout) */
  revocationEndpoint: string;
  /** Account management URL (from well-known or auth metadata) */
  accountManagementUrl?: string;
}

/** Full runtime session (combination of stored + tokens) */
export interface MatrixSession {
  userId: string;
  deviceId: string;
  homeserverUrl: string;
  accessToken: string;
}

// ============================================================================
// Discovery Result
// ============================================================================

/** Result of homeserver discovery */
export interface DiscoveryResult {
  homeserverUrl: string;
  authMetadata: AuthMetadata;
  /** Account management URL (from well-known authentication block) */
  accountManagementUrl?: string;
  /** RTC focus servers for MatrixRTC calls (from well-known) */
  rtcFoci?: RtcFocus[];
}

// ============================================================================
// Matrix Error Response
// ============================================================================

/** Matrix error response format */
export interface MatrixError {
  errcode: string;
  error: string;
  retry_after_ms?: number;
}
