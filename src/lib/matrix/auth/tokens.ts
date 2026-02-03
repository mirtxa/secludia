/**
 * OAuth token operations: exchange, refresh, revoke
 */

import type { TokenResponse, TokenSet } from "../types";
import { OAuthFlowError } from "../types";
import { OAUTH_GRANT_TYPES } from "../constants";

/** Default token expiry (1 hour) if server doesn't provide expires_in */
const DEFAULT_TOKEN_EXPIRY_MS = 3600 * 1000;

/**
 * Calculate token expiration timestamp from expires_in seconds.
 */
function calculateExpiresAt(expiresIn: number | undefined): number {
  return Date.now() + (expiresIn ? expiresIn * 1000 : DEFAULT_TOKEN_EXPIRY_MS);
}

/**
 * Handle OAuth error response and throw appropriate OAuthFlowError.
 * Exported for use in other auth modules (e.g., registration).
 */
export async function handleOAuthError(
  response: Response,
  fallbackMessage: string
): Promise<never> {
  const httpStatus = response.status;
  const retryAfter = response.headers.get("Retry-After") ?? undefined;
  let errorMessage = fallbackMessage;

  try {
    const errorData = await response.json();
    if (errorData.error_description) {
      errorMessage = errorData.error_description;
    }
    throw new OAuthFlowError(
      errorMessage,
      errorData.error,
      errorData.error_description,
      httpStatus,
      retryAfter
    );
  } catch (e) {
    if (e instanceof OAuthFlowError) throw e;
    throw new OAuthFlowError(errorMessage, undefined, undefined, httpStatus, retryAfter);
  }
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  tokenEndpoint: string,
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string
): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: OAUTH_GRANT_TYPES.AUTHORIZATION_CODE,
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    await handleOAuthError(response, `Token exchange failed: ${response.status}`);
  }

  const data = (await response.json()) as TokenResponse;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: calculateExpiresAt(data.expires_in),
  };
}

/**
 * Refresh an access token using a refresh token.
 */
export async function refreshAccessToken(
  tokenEndpoint: string,
  refreshToken: string,
  clientId: string
): Promise<TokenSet> {
  const body = new URLSearchParams({
    grant_type: OAUTH_GRANT_TYPES.REFRESH_TOKEN,
    refresh_token: refreshToken,
    client_id: clientId,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    await handleOAuthError(response, `Token refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as TokenResponse;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken, // Keep old refresh token if new one not provided
    expiresAt: calculateExpiresAt(data.expires_in),
  };
}

/**
 * Revoke a token (access or refresh token).
 * Per Matrix spec:
 * - 200 OK: token revoked or was already invalid
 * - 401 Unauthorized: client not authorized to revoke
 * - 400 Bad Request: other errors
 */
export async function revokeToken(
  revocationEndpoint: string,
  token: string,
  clientId: string,
  tokenTypeHint?: "access_token" | "refresh_token"
): Promise<void> {
  const body = new URLSearchParams({
    token,
    client_id: clientId,
  });

  if (tokenTypeHint) {
    body.set("token_type_hint", tokenTypeHint);
  }

  const response = await fetch(revocationEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  // Per spec: 200 means success (even if token was already invalid)
  // 401 means not authorized to revoke, 400 means other error
  if (!response.ok) {
    await handleOAuthError(response, `Token revocation failed: ${response.status}`);
  }
}

/**
 * Check if a token is expired or about to expire.
 */
export function isTokenExpired(expiresAt: number, bufferMs = 0): boolean {
  return Date.now() + bufferMs >= expiresAt;
}
