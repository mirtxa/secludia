/**
 * Crypto initialization for Matrix client
 */

import type { MatrixClient } from "matrix-js-sdk";
import type { CryptoApi } from "matrix-js-sdk/lib/crypto-api";
import { CRYPTO_DB_PREFIX } from "./storage";

export interface CryptoInitResult {
  success: boolean;
  error?: Error;
}

/**
 * Initialize the Rust crypto backend for a Matrix client.
 * This must be called before starting the client sync.
 */
export async function initializeClientCrypto(client: MatrixClient): Promise<CryptoInitResult> {
  try {
    await client.initRustCrypto({
      useIndexedDB: true,
      cryptoDatabasePrefix: CRYPTO_DB_PREFIX,
    });

    if (import.meta.env.DEV) {
      console.log("[crypto] Rust crypto initialized successfully");
    }

    return { success: true };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[crypto] Failed to initialize Rust crypto:", error);
    }

    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Initialize crypto on demand (for action handlers that need it).
 * Returns the CryptoApi or null on failure.
 */
export async function ensureCrypto(
  client: MatrixClient,
  currentCrypto: CryptoApi | null
): Promise<CryptoApi | null> {
  if (currentCrypto) return currentCrypto;

  const existing = client.getCrypto();
  if (existing) return existing;

  const initResult = await initializeClientCrypto(client);
  if (!initResult.success) return null;

  return client.getCrypto() ?? null;
}
