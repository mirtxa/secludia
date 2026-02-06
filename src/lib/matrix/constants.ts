/**
 * Matrix OAuth 2.0 constants
 */

/**
 * OAuth 2.0 scope for full Matrix client API access.
 */
export const MATRIX_SCOPE_API = "urn:matrix:client:api:*";

/**
 * OAuth 2.0 scope prefix for device ID allocation.
 * The full scope is: urn:matrix:client:device:<device_id>
 */
export const MATRIX_SCOPE_DEVICE_PREFIX = "urn:matrix:client:device:";

/**
 * OAuth grant types used by the application
 */
export const OAUTH_GRANT_TYPES = {
  AUTHORIZATION_CODE: "authorization_code",
  REFRESH_TOKEN: "refresh_token",
} as const;

/**
 * OAuth response types
 */
export const OAUTH_RESPONSE_TYPES = {
  CODE: "code",
} as const;

/**
 * PKCE code challenge method
 */
export const PKCE_CODE_CHALLENGE_METHOD = "S256" as const;

/**
 * Matrix error codes
 */
export const MATRIX_ERROR_CODES = {
  // Authentication errors
  M_UNKNOWN_TOKEN: "M_UNKNOWN_TOKEN",
  M_MISSING_TOKEN: "M_MISSING_TOKEN",
  M_FORBIDDEN: "M_FORBIDDEN",
  M_USER_DEACTIVATED: "M_USER_DEACTIVATED",

  // Rate limiting
  M_LIMIT_EXCEEDED: "M_LIMIT_EXCEEDED",

  // Server errors
  M_UNKNOWN: "M_UNKNOWN",
  M_NOT_FOUND: "M_NOT_FOUND",
  M_BAD_JSON: "M_BAD_JSON",
  M_NOT_JSON: "M_NOT_JSON",

  // Session errors
  M_SOFT_LOGOUT: "M_SOFT_LOGOUT",
} as const;

/**
 * OAuth error codes
 */
export const OAUTH_ERROR_CODES = {
  INVALID_REQUEST: "invalid_request",
  INVALID_CLIENT: "invalid_client",
  INVALID_GRANT: "invalid_grant",
  UNAUTHORIZED_CLIENT: "unauthorized_client",
  UNSUPPORTED_GRANT_TYPE: "unsupported_grant_type",
  INVALID_SCOPE: "invalid_scope",
  ACCESS_DENIED: "access_denied",
  SERVER_ERROR: "server_error",
  TEMPORARILY_UNAVAILABLE: "temporarily_unavailable",
} as const;

/**
 * Matrix endpoints (only OAuth-specific, SDK handles well-known/versions)
 */
export const MATRIX_ENDPOINTS = {
  AUTH_METADATA: "/_matrix/client/v1/auth_metadata",
} as const;

/**
 * Redirect URI for Tauri (localhost, navigation intercepted before actual load)
 */
export const TAURI_REDIRECT_URI = "http://localhost/oauth/callback" as const;

/**
 * Redirect path for web (relative path, actual page)
 */
export const WEB_REDIRECT_PATH = "/oauth/callback" as const;

/**
 * Client registration details
 */
export const CLIENT_REGISTRATION = {
  CLIENT_NAME: "Secludia",
  CLIENT_URI: "https://secludia.com",
  APPLICATION_TYPE: "native" as const,
} as const;

/**
 * Token refresh buffer - refresh tokens this many milliseconds before expiry
 */
export const TOKEN_REFRESH_BUFFER_MS = 60_000; // 1 minute

/**
 * Maximum number of retry attempts for network operations
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay for exponential backoff (milliseconds)
 */
export const RETRY_BASE_DELAY_MS = 1000;

// Note: Matrix spec version validation is handled by matrix-js-sdk AutoDiscovery

/**
 * Storage keys for persisted data
 */
export const STORAGE_KEYS = {
  SESSION: "secludia.matrix.session",
  PKCE: "secludia.matrix.pkce",
  VERIFICATION_SKIPPED: "secludia.crypto.verification_skipped",
} as const;
