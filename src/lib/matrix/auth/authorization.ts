/**
 * OAuth authorization URL building and callback parsing
 */

import { OAuthFlowError } from "../types";
import { OAUTH_RESPONSE_TYPES, PKCE_CODE_CHALLENGE_METHOD } from "../constants";

/**
 * OAuth response mode - determines where callback params are placed
 * - "fragment": params in URL hash (#code=...&state=...) - recommended for HTTPS
 * - "query": params in query string (?code=...&state=...) - for native/localhost
 */
export type OAuthResponseMode = "fragment" | "query";

/**
 * Parameters for building the authorization URL
 */
export interface AuthorizationUrlParams {
  authorizationEndpoint: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  /** OAuth scope - use buildScope(deviceId) to generate the required scope */
  scope: string;
  /** Response mode - "fragment" for HTTPS, "query" for localhost/native */
  responseMode: OAuthResponseMode;
}

/**
 * Build the OAuth authorization URL.
 */
export function buildAuthorizationUrl(params: AuthorizationUrlParams): string {
  const {
    authorizationEndpoint,
    clientId,
    redirectUri,
    codeChallenge,
    state,
    scope,
    responseMode,
  } = params;

  if (!scope) {
    throw new OAuthFlowError("OAUTH_ERROR_SCOPE_REQUIRED");
  }

  const url = new URL(authorizationEndpoint);

  url.searchParams.set("response_type", OAUTH_RESPONSE_TYPES.CODE);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scope);
  url.searchParams.set("state", state);
  url.searchParams.set("response_mode", responseMode);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", PKCE_CODE_CHALLENGE_METHOD);

  return url.toString();
}

/**
 * Parse the authorization callback URL and extract the code and state.
 * Handles both fragment (#) and query (?) response modes.
 */
export function parseCallbackUrl(url: string): { code: string; state: string } {
  const parsed = new URL(url);

  // Try query params first, then fragment
  // Fragment params look like: #code=xxx&state=yyy
  let params = parsed.searchParams;

  if (!params.get("code") && !params.get("error") && parsed.hash) {
    // Parse fragment as URLSearchParams (remove leading #)
    params = new URLSearchParams(parsed.hash.slice(1));
  }

  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");
  const errorDescription = params.get("error_description");

  if (error) {
    throw new OAuthFlowError(
      errorDescription ?? `Authorization failed: ${error}`,
      error,
      errorDescription ?? undefined
    );
  }

  if (!code) {
    throw new OAuthFlowError("OAUTH_ERROR_MISSING_CODE");
  }

  if (!state) {
    throw new OAuthFlowError("OAUTH_ERROR_MISSING_STATE");
  }

  return { code, state };
}
