/**
 * Matrix homeserver discovery
 * Uses matrix-js-sdk AutoDiscovery for well-known/version checks
 * Adds OAuth 2.0 auth_metadata discovery (not yet in SDK)
 */

import { AutoDiscovery, AutoDiscoveryAction } from "matrix-js-sdk";
import type { AuthMetadata, DiscoveryResult, RtcFocus } from "../types";
import { DiscoveryError } from "../types";
import { MATRIX_ENDPOINTS, MAX_RETRY_ATTEMPTS, RETRY_BASE_DELAY_MS } from "../constants";

/** Required endpoint fields per Matrix spec */
const REQUIRED_AUTH_ENDPOINTS: (keyof AuthMetadata)[] = [
  "issuer",
  "authorization_endpoint",
  "token_endpoint",
  "registration_endpoint",
  "revocation_endpoint",
];

/** Required OAuth capabilities per Matrix spec */
const REQUIRED_AUTH_CAPABILITIES = {
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  response_modes_supported: ["query", "fragment"],
  code_challenge_methods_supported: ["S256"],
} satisfies Partial<Record<keyof AuthMetadata, string[]>>;

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(attempt: number): number {
  return RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
}

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxAttempts = MAX_RETRY_ATTEMPTS
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : getBackoffDelay(attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Exponential backoff for network errors
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, getBackoffDelay(attempt)));
      }
    }
  }

  throw lastError ?? new Error("Max retry attempts exceeded");
}

/**
 * Validate auth metadata has all required fields per Matrix spec
 */
function isValidAuthMetadata(metadata: AuthMetadata): boolean {
  const hasEndpoints = REQUIRED_AUTH_ENDPOINTS.every((field) => metadata[field]);

  const hasCapabilities = Object.entries(REQUIRED_AUTH_CAPABILITIES).every(([field, required]) => {
    const supported = metadata[field as keyof AuthMetadata] as string[] | undefined;
    return required.every((value) => supported?.includes(value));
  });

  return hasEndpoints && hasCapabilities;
}

/**
 * Fetch OAuth 2.0 Authorization Server Metadata from the homeserver.
 * Uses the stable /_matrix/client/v1/auth_metadata endpoint.
 *
 * Note: This is NOT in matrix-js-sdk yet since OAuth 2.0 support is pending.
 */
export async function fetchAuthMetadata(baseUrl: string): Promise<AuthMetadata> {
  const url = `${baseUrl}${MATRIX_ENDPOINTS.AUTH_METADATA}`;

  try {
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      // Check if server doesn't support OAuth 2.0 (404 + M_UNRECOGNIZED)
      if (response.status === 404) {
        const errorData = await response.json().catch(() => null);
        if (errorData?.errcode === "M_UNRECOGNIZED") {
          throw new DiscoveryError("DISCOVERY_ERROR_NO_OAUTH_SUPPORT", "auth_metadata");
        }
      }
      throw new DiscoveryError("DISCOVERY_ERROR_AUTH_METADATA_FAILED", "auth_metadata");
    }

    const metadata = (await response.json()) as AuthMetadata;

    if (!isValidAuthMetadata(metadata)) {
      throw new DiscoveryError("DISCOVERY_ERROR_INVALID_AUTH_CONFIG", "auth_metadata");
    }

    return metadata;
  } catch (error) {
    if (error instanceof DiscoveryError) throw error;
    throw new DiscoveryError("DISCOVERY_ERROR_FETCH_FAILED", "auth_metadata");
  }
}

/**
 * Perform full homeserver discovery.
 * Uses matrix-js-sdk AutoDiscovery for well-known lookup and version validation.
 * Adds OAuth 2.0 auth_metadata discovery (not in SDK yet).
 *
 * @param input - User input (e.g., "matrix.org", "https://matrix.example.com")
 * @returns Discovery result with homeserver URL, OAuth metadata, and optional RTC/account info
 */
export async function discoverHomeserver(input: string): Promise<DiscoveryResult> {
  // Step 1: Use SDK's AutoDiscovery for well-known + version check
  const config = await AutoDiscovery.findClientConfig(input);

  const homeserver = config["m.homeserver"];
  const msc2965 = config["org.matrix.msc2965.authentication"] as
    | { issuer?: string; account?: string }
    | undefined;
  const rtcFoci = config["org.matrix.msc4143.rtc_foci"] as RtcFocus[] | undefined;

  // Validate homeserver discovery
  if (homeserver.state === AutoDiscoveryAction.FAIL_ERROR) {
    throw new DiscoveryError("DISCOVERY_ERROR_HOMESERVER_FAILED", "wellknown");
  }

  if (homeserver.state === AutoDiscoveryAction.FAIL_PROMPT) {
    throw new DiscoveryError("DISCOVERY_ERROR_HOMESERVER_UNVERIFIED", "wellknown");
  }

  if (!homeserver.base_url) {
    throw new DiscoveryError("DISCOVERY_ERROR_NO_HOMESERVER_URL", "wellknown");
  }

  // Step 2: Fetch OAuth 2.0 authorization server metadata
  const authMetadata = await fetchAuthMetadata(homeserver.base_url);

  return {
    homeserverUrl: homeserver.base_url,
    authMetadata,
    accountManagementUrl: msc2965?.account ?? authMetadata.account_management_uri,
    rtcFoci,
  };
}

/**
 * Refresh auth metadata for an existing session.
 * Skips well-known lookup since we already have the homeserver URL.
 * Use this for session restoration, not initial login.
 *
 * @param homeserverUrl - Known homeserver URL from stored session
 * @returns Auth metadata for token refresh
 */
export async function refreshAuthMetadata(homeserverUrl: string): Promise<AuthMetadata> {
  return fetchAuthMetadata(homeserverUrl);
}
