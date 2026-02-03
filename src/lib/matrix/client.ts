/**
 * Matrix SDK client wrapper
 */

import {
  createClient,
  type MatrixClient,
  type ICreateClientOpts,
  type TokenRefreshFunction,
} from "matrix-js-sdk";
import type { MatrixSession } from "./types";

// Global client instance
let matrixClient: MatrixClient | null = null;

export interface CreateMatrixClientOptions {
  session: MatrixSession;
  /** Token refresh function from refreshManager.getTokenRefreshFunction() */
  tokenRefreshFunction?: TokenRefreshFunction;
  /** Current refresh token (needed for SDK to attempt refresh) */
  refreshToken?: string;
}

/**
 * Create and initialize a Matrix client from a session.
 */
export function createMatrixClient(options: CreateMatrixClientOptions): MatrixClient {
  const { session, tokenRefreshFunction, refreshToken } = options;

  const opts: ICreateClientOpts = {
    baseUrl: session.homeserverUrl,
    accessToken: session.accessToken,
    userId: session.userId,
    deviceId: session.deviceId,
    useAuthorizationHeader: true,
    // SDK handles M_UNKNOWN_TOKEN with retry/backoff/mutex
    tokenRefreshFunction,
    refreshToken,
  };

  const client = createClient(opts);

  // Store globally
  matrixClient = client;

  return client;
}

/**
 * Get the current Matrix client instance.
 */
export function getMatrixClient(): MatrixClient | null {
  return matrixClient;
}

/**
 * Update the access token on the existing client.
 */
export function updateClientAccessToken(accessToken: string): void {
  if (matrixClient) {
    matrixClient.http.opts.accessToken = accessToken;
  }
}

/**
 * Update the refresh token on the existing client.
 */
export function updateClientRefreshToken(refreshToken: string): void {
  if (matrixClient) {
    matrixClient.http.opts.refreshToken = refreshToken;
  }
}

/**
 * Stop and clear the Matrix client.
 */
export async function stopMatrixClient(): Promise<void> {
  if (matrixClient) {
    try {
      matrixClient.stopClient();
    } catch {
      // Ignore errors during stop
    }
    matrixClient = null;
  }
}

/**
 * Start the Matrix client (begins syncing).
 */
export async function startMatrixClient(): Promise<void> {
  if (matrixClient) {
    await matrixClient.startClient({
      // Initial sync is limited to improve performance
      initialSyncLimit: 20,
    });
  }
}

/**
 * Get user profile from the Matrix server.
 */
export async function getProfile(
  client: MatrixClient,
  userId: string
): Promise<{ displayname?: string; avatar_url?: string }> {
  try {
    return await client.getProfileInfo(userId);
  } catch {
    return {};
  }
}
