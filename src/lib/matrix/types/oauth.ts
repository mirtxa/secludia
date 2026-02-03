/**
 * OAuth 2.0 type definitions for Matrix authentication
 */

// ============================================================================
// OAuth 2.0 Authorization Server Metadata (Matrix spec)
// ============================================================================

/**
 * OAuth 2.0 Authorization Server Metadata from /_matrix/client/v1/auth_metadata
 * Per Matrix spec, these fields are required for OAuth support.
 */
export interface AuthMetadata {
  /** Required: The authorization server's issuer identifier (URL) */
  issuer: string;
  /** Required: URL of the authorization endpoint */
  authorization_endpoint: string;
  /** Required: URL of the token endpoint */
  token_endpoint: string;
  /** Required: URL of the client registration endpoint */
  registration_endpoint: string;
  /** Required: URL of the revocation endpoint */
  revocation_endpoint: string;
  /** Required: List of supported response types (must include "code") */
  response_types_supported: string[];
  /** Required: List of supported response modes (must include "query" and "fragment") */
  response_modes_supported: string[];
  /** Required: List of supported grant types (must include "authorization_code" and "refresh_token") */
  grant_types_supported: string[];
  /** Required: List of supported PKCE code challenge methods (must include "S256") */
  code_challenge_methods_supported: string[];
  /** Optional: List of supported prompt values (e.g., "create" for registration) */
  prompt_values_supported?: string[];
  /** Optional: Account management URL */
  account_management_uri?: string;
  /** Optional: Supported account management actions */
  account_management_actions_supported?: string[];
}

// ============================================================================
// OAuth 2.0 Client Registration (RFC 7591 / Matrix spec)
// ============================================================================

/**
 * OAuth 2.0 Client Metadata for dynamic client registration.
 * Per Matrix spec: https://spec.matrix.org/v1.17/client-server-api/#client-registration
 */
export interface OAuthClientMetadata {
  /** Human-readable name of the client */
  client_name: string;
  /** Required: URL to a valid web page with client information */
  client_uri: string;
  /** Array of redirection URIs for redirect-based flows */
  redirect_uris: string[];
  /** OAuth 2.0 grant types (must include "authorization_code" and "refresh_token") */
  grant_types?: string[];
  /** OAuth 2.0 response types (must include "code") */
  response_types?: string[];
  /** Authentication method for token endpoint (use "none" for public clients) */
  token_endpoint_auth_method?: string;
  /** Kind of application: "web" or "native" */
  application_type?: "native" | "web";
  /** Contact emails for the client developer */
  contacts?: string[];
  /** URL that references a logo for the client */
  logo_uri?: string;
  /** URL to human-readable privacy policy */
  policy_uri?: string;
  /** URL to human-readable terms of service */
  tos_uri?: string;
}

/**
 * Response from client registration endpoint.
 * Includes the assigned client_id plus echoed metadata.
 */
export interface OAuthClientRegistrationResponse {
  /** Assigned client identifier */
  client_id: string;
  /** Client secret (if confidential client) */
  client_secret?: string;
  /** Unix timestamp when client_id was issued */
  client_id_issued_at?: number;
  /** Unix timestamp when client_secret expires (0 = never) */
  client_secret_expires_at?: number;
  /** Echoed redirect URIs */
  redirect_uris?: string[];
  /** Echoed grant types */
  grant_types?: string[];
  /** Echoed response types */
  response_types?: string[];
  /** Echoed token endpoint auth method */
  token_endpoint_auth_method?: string;
  /** Echoed client name */
  client_name?: string;
}

// ============================================================================
// PKCE (RFC 7636)
// ============================================================================

/** PKCE challenge data */
export interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

// ============================================================================
// OAuth 2.0 Tokens
// ============================================================================

/** Token response from token endpoint */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

/** Tokens stored in secure storage (sensitive) */
export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  /** Unix timestamp in milliseconds when access token expires */
  expiresAt: number;
}

// ============================================================================
// OAuth Error Response
// ============================================================================

/** OAuth error response format */
export interface OAuthError {
  error: string;
  error_description?: string;
  error_uri?: string;
}
