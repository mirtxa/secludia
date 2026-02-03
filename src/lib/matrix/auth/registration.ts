/**
 * OAuth 2.0 Dynamic Client Registration (RFC 7591)
 */

import type { AuthMetadata, OAuthClientMetadata, OAuthClientRegistrationResponse } from "../types";
import { OAuthFlowError } from "../types";
import { CLIENT_REGISTRATION, OAUTH_GRANT_TYPES, OAUTH_RESPONSE_TYPES } from "../constants";
import { handleOAuthError } from "./tokens";

/**
 * Register an OAuth client with the authorization server.
 * Called on each login - registration is idempotent (server may return same or new client_id).
 */
export async function registerClient(
  authMetadata: AuthMetadata,
  redirectUri: string
): Promise<OAuthClientRegistrationResponse> {
  const registrationEndpoint = authMetadata.registration_endpoint;

  if (!registrationEndpoint) {
    throw new OAuthFlowError("OAUTH_ERROR_NO_REGISTRATION_ENDPOINT");
  }

  const request: OAuthClientMetadata = {
    client_name: CLIENT_REGISTRATION.CLIENT_NAME,
    client_uri: CLIENT_REGISTRATION.CLIENT_URI,
    redirect_uris: [redirectUri],
    grant_types: [OAUTH_GRANT_TYPES.AUTHORIZATION_CODE, OAUTH_GRANT_TYPES.REFRESH_TOKEN],
    response_types: [OAUTH_RESPONSE_TYPES.CODE],
    token_endpoint_auth_method: "none", // Public client (no client secret)
    application_type: CLIENT_REGISTRATION.APPLICATION_TYPE,
  };

  const response = await fetch(registrationEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    await handleOAuthError(response, `Client registration failed: ${response.status}`);
  }

  const data = (await response.json()) as OAuthClientRegistrationResponse;

  if (!data.client_id) {
    throw new OAuthFlowError("OAUTH_ERROR_REGISTRATION_INVALID");
  }

  return data;
}
