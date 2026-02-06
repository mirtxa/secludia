/**
 * Crypto database storage utilities
 *
 * The Rust crypto WASM module creates two IndexedDB databases using the naming
 * convention: `{prefix}::matrix-sdk-crypto` and `{prefix}::matrix-sdk-crypto-meta`.
 * See matrix-js-sdk client.ts clearStores() for the canonical name list.
 */

export const CRYPTO_DB_PREFIX = "secludia-crypto";

/** The actual database names created by the WASM module for a given prefix. */
const CRYPTO_DB_NAMES = [
  `${CRYPTO_DB_PREFIX}::matrix-sdk-crypto`,
  `${CRYPTO_DB_PREFIX}::matrix-sdk-crypto-meta`,
] as const;

/**
 * Delete a single IndexedDB database by name.
 * Resolves when the database is deleted or if the deletion is blocked
 * (the browser will queue the deletion for when connections close).
 */
function deleteIndexedDB(dbName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName);

    request.onsuccess = () => {
      if (import.meta.env.DEV) {
        console.log(`[crypto] Deleted database: ${dbName}`);
      }
      resolve();
    };

    request.onerror = () => {
      if (import.meta.env.DEV) {
        console.error(`[crypto] Failed to delete database: ${dbName}`, request.error);
      }
      reject(request.error);
    };

    request.onblocked = () => {
      if (import.meta.env.DEV) {
        console.warn(`[crypto] Database deletion blocked: ${dbName}`);
      }
      // Still resolve - the database will be deleted when connections close
      resolve();
    };
  });
}

/**
 * Clear all crypto databases.
 * Should be called on logout to remove encryption keys.
 *
 * The WASM module creates databases named:
 *   - `secludia-crypto::matrix-sdk-crypto`
 *   - `secludia-crypto::matrix-sdk-crypto-meta`
 */
export async function clearCryptoDatabase(): Promise<void> {
  await Promise.all(CRYPTO_DB_NAMES.map(deleteIndexedDB));
}
