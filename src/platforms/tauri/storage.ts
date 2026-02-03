/**
 * Tauri Stronghold token storage
 * Encrypted at rest using argon2 key derivation
 */

import type { TokenSet } from "@/lib/matrix";
import type { TokenStorage } from "../types";
import type { Client, Stronghold } from "@tauri-apps/plugin-stronghold";

// Stronghold configuration
const STRONGHOLD_STORE = "matrix_tokens";
const STRONGHOLD_TOKENS_KEY = "tokens";
const STRONGHOLD_VAULT_PATH = "secludia.stronghold";

// Type aliases for Stronghold
type StrongholdType = Stronghold;
type StrongholdClientType = Client;

// Cached Stronghold instances (loaded once, reused for performance)
let cachedVaultPath: string | null = null;
let cachedStronghold: StrongholdType | null = null;
let cachedClient: StrongholdClientType | null = null;
let initializationPromise: Promise<{
  stronghold: StrongholdType;
  client: StrongholdClientType;
  vaultPath: string;
}> | null = null;

/**
 * Get or create a cached Stronghold client.
 * Loads the vault once and reuses it for subsequent operations.
 * Uses a mutex pattern to prevent race conditions during initialization.
 */
async function getStrongholdClient() {
  // Return cached client if available
  if (cachedStronghold && cachedClient && cachedVaultPath) {
    return {
      stronghold: cachedStronghold,
      client: cachedClient,
      vaultPath: cachedVaultPath,
    };
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = (async () => {
    try {
      const strongholdModule = await import("@tauri-apps/plugin-stronghold");
      const pathModule = await import("@tauri-apps/api/path");

      // Get the vault path
      const dataDir = await pathModule.appLocalDataDir();
      const vaultPath = await pathModule.join(dataDir, STRONGHOLD_VAULT_PATH);
      cachedVaultPath = vaultPath;

      // Load the stronghold instance
      const stronghold = await strongholdModule.Stronghold.load(
        vaultPath,
        "secludia-default-password"
      );
      cachedStronghold = stronghold;

      // Load or create the client
      let client: Awaited<ReturnType<typeof stronghold.loadClient>>;
      try {
        client = await stronghold.loadClient(STRONGHOLD_STORE);
      } catch {
        client = await stronghold.createClient(STRONGHOLD_STORE);
      }
      cachedClient = client;

      return { stronghold, client, vaultPath };
    } catch (error) {
      // Clear initialization promise on error so we can retry
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Clear the cached Stronghold instances.
 * Called on logout to ensure clean state.
 */
function clearStrongholdCache(): void {
  cachedStronghold = null;
  cachedClient = null;
  initializationPromise = null;
  // Keep cachedVaultPath - it doesn't change
}

/**
 * Stronghold token storage implementation
 */
export const storage: TokenStorage = {
  async store(tokens: TokenSet): Promise<void> {
    const { stronghold, client } = await getStrongholdClient();
    const store = client.getStore();
    await store.insert(
      STRONGHOLD_TOKENS_KEY,
      Array.from(new TextEncoder().encode(JSON.stringify(tokens)))
    );
    await stronghold.save();
  },

  async get(): Promise<TokenSet | null> {
    const { client } = await getStrongholdClient();
    const store = client.getStore();

    const data = await store.get(STRONGHOLD_TOKENS_KEY);
    if (!data || data.length === 0) return null;

    const jsonStr = new TextDecoder().decode(new Uint8Array(data));
    return JSON.parse(jsonStr) as TokenSet;
  },

  async clear(): Promise<void> {
    try {
      const { stronghold, client } = await getStrongholdClient();
      const store = client.getStore();

      await store.remove(STRONGHOLD_TOKENS_KEY);
      await stronghold.save();
    } finally {
      // Clear cache on logout to ensure clean state
      clearStrongholdCache();
    }
  },
};
