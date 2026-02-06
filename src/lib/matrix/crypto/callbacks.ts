/**
 * Crypto callbacks for Matrix SDK
 *
 * Provides a module-level "pending key" mechanism so that
 * `bootstrapSecretStorage` can retrieve the recovery key
 * the user just entered via the SDK's `getSecretStorageKey` callback.
 */

import type { CryptoCallbacks } from "matrix-js-sdk/lib/crypto-api";
import { decodeRecoveryKey } from "matrix-js-sdk/lib/crypto-api";

// ---------------------------------------------------------------------------
// Module-level pending key for getSecretStorageKey callback
// ---------------------------------------------------------------------------

/** Holds the decoded recovery key while a verification attempt is in progress. */
let pendingSecretStorageKey: Uint8Array | null = null;

/**
 * Set (or clear) the pending secret storage key.
 * Call with the decoded key before `bootstrapSecretStorage`, clear in `finally`.
 */
export function setPendingSecretStorageKey(key: Uint8Array | null): void {
  pendingSecretStorageKey = key;
}

/**
 * Return default `CryptoCallbacks` for the Matrix client.
 *
 * `getSecretStorageKey` resolves from the module-level pending key
 * (set via `setPendingSecretStorageKey`) so that verification flows
 * can provide the key without coupling AuthContext to crypto state.
 */
export function getDefaultCryptoCallbacks(): CryptoCallbacks {
  return {
    getSecretStorageKey: async ({ keys }) => {
      if (!pendingSecretStorageKey) {
        return null;
      }
      const keyId = Object.keys(keys ?? {})[0];
      if (!keyId) {
        return null;
      }
      return [keyId, pendingSecretStorageKey];
    },
  };
}

/**
 * Decode a user-entered recovery key with whitespace normalization.
 * Returns null if the key is invalid.
 */
export function decodeUserRecoveryKey(input: string): Uint8Array | null {
  // Normalize: trim and collapse whitespace/dashes to single space.
  // Recovery keys are base58 (case-sensitive) so we must NOT change case.
  const normalized = input.trim().replace(/[\s-]+/g, " ");

  if (!normalized) {
    return null;
  }

  try {
    return decodeRecoveryKey(normalized);
  } catch {
    return null;
  }
}
