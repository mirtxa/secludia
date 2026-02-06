/**
 * Matrix module - OAuth 2.0 authentication and SDK wrapper
 *
 * Structure:
 * - types/     - Type definitions (OAuth, session, errors)
 * - auth/      - Authentication (PKCE, tokens, registration, refresh)
 * - storage/   - localStorage operations (session, PKCE state)
 * - discovery/ - Homeserver and OAuth metadata discovery
 * - presence/  - Presence management and support detection
 * - client     - Matrix SDK wrapper
 * - constants  - Configuration constants
 */

// Types
export type {
  RtcFocus,
  AuthMetadata,
  OAuthClientMetadata,
  OAuthClientRegistrationResponse,
  PKCEChallenge,
  TokenResponse,
  TokenSet,
  StoredSession,
  MatrixSession,
  DiscoveryResult,
  MatrixError,
  OAuthError,
} from "./types";
export { MatrixAuthError, DiscoveryError, OAuthFlowError } from "./types";

// Constants
export {
  MATRIX_SCOPE_API,
  MATRIX_SCOPE_DEVICE_PREFIX,
  OAUTH_GRANT_TYPES,
  OAUTH_RESPONSE_TYPES,
  PKCE_CODE_CHALLENGE_METHOD,
  MATRIX_ERROR_CODES,
  OAUTH_ERROR_CODES,
  MATRIX_ENDPOINTS,
  TAURI_REDIRECT_URI,
  WEB_REDIRECT_PATH,
  CLIENT_REGISTRATION,
  TOKEN_REFRESH_BUFFER_MS,
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
  STORAGE_KEYS,
} from "./constants";

// Discovery
export { fetchAuthMetadata, discoverHomeserver, refreshAuthMetadata } from "./discovery";

// Auth
export {
  generateDeviceId,
  buildScope,
  generatePKCE,
  buildAuthorizationUrl,
  parseCallbackUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeToken,
  isTokenExpired,
  registerClient,
  refreshManager,
} from "./auth";
export type {
  AuthorizationUrlParams,
  OAuthResponseMode,
  RefreshManagerConfig,
  OnTokensRefreshed,
} from "./auth";

// Storage
export {
  storeSessionMetadata,
  getSessionMetadata,
  clearSessionMetadata,
  storePKCEState,
  getPKCEState,
  clearPKCEState,
  clearLocalStorageAuthData,
} from "./storage";
export type { StoredPKCE } from "./storage";

// Client
export {
  createMatrixClient,
  getMatrixClient,
  updateClientAccessToken,
  updateClientRefreshToken,
  stopMatrixClient,
  startMatrixClient,
  restartMatrixClient,
  restartMatrixClientAndWaitForSync,
  createMinimalSyncFilter,
  getProfile,
} from "./client";
export { buildMinimalSyncOpts } from "./client";
export type { CreateMatrixClientOptions } from "./client";

// Presence
export type { Presence, SetPresenceResult } from "./presence";
export { getPresence, setPresenceWithVerification } from "./presence";

// Devices
export type { Device, DeviceType, VerificationStatus } from "./devices";
export { toDevice, inferDeviceType, getDevices, updateDeviceDisplayName } from "./devices";

// Crypto
export type { CryptoError, BootstrapResult, CryptoInitResult, CrossSigningStatus } from "./crypto";
export {
  CRYPTO_DB_PREFIX,
  clearCryptoDatabase,
  decodeUserRecoveryKey,
  initializeClientCrypto,
  ensureCrypto,
  verifyWithRecoveryKey,
  validateRecoveryKey,
  checkCrossSigningStatus,
  waitForCrossSigningKeys,
} from "./crypto";
