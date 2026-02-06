/**
 * Matrix SDK client wrapper
 */

import {
  ClientEvent,
  createClient,
  Filter,
  SyncState,
  type MatrixClient,
  type ICreateClientOpts,
  type IStartClientOpts,
  type TokenRefreshFunction,
} from "matrix-js-sdk";
import type { CryptoCallbacks } from "matrix-js-sdk/lib/crypto-api";
import type { MatrixSession } from "./types";
import { getDefaultCryptoCallbacks } from "./crypto/callbacks";

// Global client instance
let matrixClient: MatrixClient | null = null;

export interface CreateMatrixClientOptions {
  session: MatrixSession;
  /** Token refresh function from refreshManager.getTokenRefreshFunction() */
  tokenRefreshFunction?: TokenRefreshFunction;
  /** Current refresh token (needed for SDK to attempt refresh) */
  refreshToken?: string;
  /** Crypto callbacks for secret storage key management */
  cryptoCallbacks?: CryptoCallbacks;
}

/**
 * Create and initialize a Matrix client from a session.
 */
export function createMatrixClient(options: CreateMatrixClientOptions): MatrixClient {
  const { session, tokenRefreshFunction, refreshToken, cryptoCallbacks } = options;

  const opts: ICreateClientOpts = {
    baseUrl: session.homeserverUrl,
    accessToken: session.accessToken,
    userId: session.userId,
    deviceId: session.deviceId,
    useAuthorizationHeader: true,
    // SDK handles M_UNKNOWN_TOKEN with retry/backoff/mutex
    tokenRefreshFunction,
    refreshToken,
    // Crypto callbacks for secret storage.
    // Default callbacks use the module-level pending key from setPendingSecretStorageKey().
    cryptoCallbacks: cryptoCallbacks ?? getDefaultCryptoCallbacks(),
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

/** Default options shared by both phases of sync. */
const DEFAULT_SYNC_OPTS: IStartClientOpts = {
  initialSyncLimit: 10,
  // Defer loading full member lists until needed (huge win for large rooms)
  lazyLoadMembers: true,
  // Organize events into threads when thread relations exist
  threadSupport: true,
};

/**
 * Start the Matrix client (begins syncing).
 * Pass opts to override default sync options (e.g. a minimal filter for pre-verification).
 */
export async function startMatrixClient(opts?: IStartClientOpts): Promise<void> {
  if (matrixClient) {
    await matrixClient.startClient({
      ...DEFAULT_SYNC_OPTS,
      ...opts,
    });
  }
}

/**
 * Restart the sync loop with new options, preserving the crypto backend.
 *
 * `client.stopClient()` calls `cryptoBackend.stop()` → `olmMachine.close()`
 * which permanently destroys the WASM crypto (pointer set to 0, Rust objects freed).
 * To avoid this, we stop only the sync machinery via the internal syncApi,
 * then call `startClient()` which creates a fresh sync loop.
 */
export async function restartMatrixClient(opts?: IStartClientOpts): Promise<void> {
  if (!matrixClient) return;

  // Access internal sync API to stop just the sync loop.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = matrixClient as any;

  // Stop sync loop without touching crypto
  client.syncApi?.stop();
  client.syncApi = undefined;

  // Stop ancillary services that stopClient() normally cleans up
  client.peekSync?.stopPeeking();
  client.callEventHandler?.stop();
  client.groupCallEventHandler?.stop();
  client.callEventHandler = undefined;
  client.groupCallEventHandler = undefined;
  globalThis.clearInterval(client.checkTurnServersIntervalID);
  client.checkTurnServersIntervalID = undefined;
  if (client.clientWellKnownIntervalID !== undefined) {
    globalThis.clearInterval(client.clientWellKnownIntervalID);
  }
  client.toDeviceMessageQueue?.stop();
  client.matrixRTC?.stop();
  client.serverCapabilitiesService?.stop();

  // Mark as not running so startClient() will proceed
  client.clientRunning = false;

  await matrixClient.startClient({
    ...DEFAULT_SYNC_OPTS,
    ...opts,
  });
}

/**
 * Restart the sync loop and wait for it to reach Prepared/Syncing state.
 *
 * Used after on-demand crypto initialization: the fresh OlmMachine needs to
 * process a sync response (including /keys/query) before it has the user's
 * cross-signing public keys. Restarting the sync with crypto active ensures
 * the crypto backend processes key queries during sync.
 */
export function restartMatrixClientAndWaitForSync(opts?: IStartClientOpts): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!matrixClient) {
      resolve();
      return;
    }

    const client = matrixClient;

    const onSync = (syncState: SyncState) => {
      if (syncState === SyncState.Prepared || syncState === SyncState.Syncing) {
        client.off(ClientEvent.Sync, onSync);
        resolve();
      } else if (syncState === SyncState.Error) {
        client.off(ClientEvent.Sync, onSync);
        reject(new Error("Sync failed after restart"));
      }
    };

    client.on(ClientEvent.Sync, onSync);
    restartMatrixClient(opts).catch(reject);
  });
}

/**
 * Create a minimal sync filter that skips room timelines, presence, and ephemeral events.
 * Used for pre-verification sync where we only need account data and key queries.
 *
 * IMPORTANT: When using this filter, also pass `initialSyncLimit: 0` to startMatrixClient.
 * The SDK overrides the filter's timeline.limit with initialSyncLimit on the initial sync.
 */
export function createMinimalSyncFilter(userId: string): Filter {
  const filter = new Filter(userId);
  filter.setDefinition({
    presence: { not_types: ["*"] },
    room: {
      timeline: { limit: 0 },
      ephemeral: { not_types: ["*"] },
    },
  });
  return filter;
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
