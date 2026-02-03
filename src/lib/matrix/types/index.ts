/**
 * Type exports for Matrix module
 */

// OAuth types
export type {
  AuthMetadata,
  OAuthClientMetadata,
  OAuthClientRegistrationResponse,
  PKCEChallenge,
  TokenResponse,
  TokenSet,
  OAuthError,
} from "./oauth";

// Session types
export type {
  RtcFocus,
  StoredSession,
  MatrixSession,
  DiscoveryResult,
  MatrixError,
} from "./session";

// Error classes
export { MatrixAuthError, DiscoveryError, OAuthFlowError } from "./errors";
