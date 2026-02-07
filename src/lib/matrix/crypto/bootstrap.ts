/**
 * Crypto bootstrap operations for cross-signing and secret storage
 */

import type { MatrixClient } from "matrix-js-sdk";
import type { CryptoApi } from "matrix-js-sdk/lib/crypto-api";
import type { BootstrapResult, CryptoError } from "./types";
import { decodeUserRecoveryKey, setPendingSecretStorageKey } from "./callbacks";

/**
 * Result of the lightweight HTTP-only cross-signing status check.
 */
export interface CrossSigningStatus {
  /** Whether the user has uploaded cross-signing master keys */
  hasKeys: boolean;
  /** Whether this device is signed by the user's self-signing key */
  isDeviceVerified: boolean;
}

/**
 * Check cross-signing status using a pure HTTP call (keys/query endpoint).
 * Does NOT require crypto initialization — works with a bare MatrixClient.
 *
 * Uses `downloadKeysForUsers` which hits `POST /_matrix/client/v3/keys/query`.
 * The response tells us:
 * - `master_keys[userId]` — whether the user has set up cross-signing
 * - `self_signing_keys[userId].keys` — the key ID that signs verified devices
 * - `device_keys[userId][deviceId].signatures[userId]` — whether our device is signed
 *
 * @param client - The Matrix client (no crypto needed)
 * @param userId - The current user's ID
 * @param deviceId - The current device's ID
 */
export async function checkCrossSigningStatus(
  client: MatrixClient,
  userId: string,
  deviceId: string
): Promise<CrossSigningStatus> {
  const result = await client.downloadKeysForUsers([userId]);

  // Check for master key existence
  const masterKey = result.master_keys?.[userId];
  if (!masterKey || Object.keys(masterKey.keys).length === 0) {
    return { hasKeys: false, isDeviceVerified: false };
  }

  // Get self-signing key ID (used to sign devices)
  const selfSigningKey = result.self_signing_keys?.[userId];
  if (!selfSigningKey) {
    // Has master key but no self-signing key — unusual, treat as has keys but unverified
    return { hasKeys: true, isDeviceVerified: false };
  }

  // Extract the self-signing key ID (e.g., "ed25519:ABCDEF")
  const selfSigningKeyIds = Object.keys(selfSigningKey.keys);

  // Check if our device has a signature from the self-signing key
  const deviceData = result.device_keys?.[userId]?.[deviceId];
  if (!deviceData?.signatures?.[userId]) {
    return { hasKeys: true, isDeviceVerified: false };
  }

  const deviceSignatures = deviceData.signatures[userId];
  const isDeviceVerified = selfSigningKeyIds.some((keyId) => keyId in deviceSignatures);

  return { hasKeys: true, isDeviceVerified };
}

/**
 * Validate a recovery key against secret storage WITHOUT initializing crypto.
 *
 * Uses `client.secretStorage` (pure account data + Web Crypto) to check
 * the key's MAC against the stored key info. This avoids creating IndexedDB
 * stores for wrong keys.
 *
 * @param client - The Matrix client (no crypto needed, but sync must have started)
 * @param recoveryKeyInput - The user-entered recovery key
 * @returns BootstrapResult with success=true if key is valid, error otherwise
 */
export async function validateRecoveryKey(
  client: MatrixClient,
  recoveryKeyInput: string
): Promise<BootstrapResult> {
  // Decode the recovery key (base58 → raw bytes)
  const decodedKey = decodeUserRecoveryKey(recoveryKeyInput);
  if (!decodedKey) {
    return {
      success: false,
      error: {
        code: "INVALID_RECOVERY_KEY",
        message: "Invalid recovery key format",
        recoverable: true,
      },
    };
  }

  try {
    // Get the default secret storage key info from account data
    const keyTuple = await client.secretStorage.getKey();
    if (!keyTuple) {
      return {
        success: false,
        error: {
          code: "SECRET_STORAGE_FAILED",
          message: "No secret storage key found",
          recoverable: false,
        },
      };
    }

    const [, keyInfo] = keyTuple;

    // Check the key MAC using Web Crypto (HKDF + AES-CTR + HMAC — no WASM)
    const isValid = await client.secretStorage.checkKey(decodedKey, keyInfo);

    if (!isValid) {
      return {
        success: false,
        error: {
          code: "INVALID_RECOVERY_KEY",
          message: "The recovery key is incorrect",
          recoverable: true,
        },
      };
    }

    return { success: true };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[crypto] Recovery key validation failed:", error);
    }

    return {
      success: false,
      error: {
        code: "SECRET_STORAGE_FAILED",
        message: "Failed to validate recovery key",
        recoverable: true,
      },
    };
  }
}

/**
 * Verify this device using an existing recovery key.
 *
 * The SDK's `bootstrapSecretStorage` accesses existing secret storage via the
 * `getSecretStorageKey` callback (set on client creation). We make the decoded
 * key available through the module-level pending key mechanism so the callback
 * can return it.
 *
 * IMPORTANT: Call validateRecoveryKey() first to avoid unnecessary crypto init.
 *
 * @param client - The Matrix client
 * @param recoveryKeyInput - The user-entered recovery key
 * @returns Bootstrap result
 */
export async function verifyWithRecoveryKey(
  client: MatrixClient,
  recoveryKeyInput: string
): Promise<BootstrapResult> {
  const crypto = client.getCrypto();
  if (!crypto) {
    return {
      success: false,
      error: {
        code: "CRYPTO_NOT_INITIALIZED",
        message: "Crypto module not initialized",
        recoverable: false,
      },
    };
  }

  // Decode the recovery key
  const decodedKey = decodeUserRecoveryKey(recoveryKeyInput);
  if (!decodedKey) {
    return {
      success: false,
      error: {
        code: "INVALID_RECOVERY_KEY",
        message: "Invalid recovery key format",
        recoverable: true,
      },
    };
  }

  // Make the key available to the SDK's getSecretStorageKey callback
  setPendingSecretStorageKey(decodedKey);

  try {
    // Bootstrap secret storage using the existing key.
    // The SDK will call getSecretStorageKey to retrieve it.
    await crypto.bootstrapSecretStorage({});

    // Bootstrap cross-signing to verify this device
    await crypto.bootstrapCrossSigning({});

    return { success: true };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[crypto] Verification failed:", error);
    }

    // Check if it's an invalid key error
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("wrong key") ||
      message.includes("invalid") ||
      message.includes("MAC mismatch")
    ) {
      return {
        success: false,
        error: {
          code: "INVALID_RECOVERY_KEY",
          message: "The recovery key is incorrect",
          recoverable: true,
        },
      };
    }

    return {
      success: false,
      error: classifyBootstrapError(error),
    };
  } finally {
    // Always clear the pending key
    setPendingSecretStorageKey(null);
  }
}

/**
 * Wait for the OlmMachine to have the user's cross-signing public keys.
 * After on-demand crypto init + sync restart, the crypto backend processes
 * /keys/query asynchronously via onSyncCompleted → processOutgoingRequests.
 * This waits for that processing to complete.
 */
export async function waitForCrossSigningKeys(crypto: CryptoApi, timeoutMs = 30000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await crypto.userHasCrossSigningKeys()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Timed out waiting for cross-signing keys");
}

/**
 * Classify a bootstrap error into a CryptoError.
 */
function classifyBootstrapError(error: unknown): CryptoError {
  const message = error instanceof Error ? error.message : String(error);

  // Cross-signing failures
  if (message.includes("cross-signing") || message.includes("CrossSigning")) {
    return {
      code: "CROSS_SIGNING_FAILED",
      message: "Failed to set up cross-signing",
      recoverable: true,
    };
  }

  // Secret storage failures
  if (message.includes("secret storage") || message.includes("SecretStorage")) {
    return {
      code: "SECRET_STORAGE_FAILED",
      message: "Failed to set up secret storage",
      recoverable: true,
    };
  }

  // Storage/IndexedDB errors
  if (message.includes("IndexedDB") || message.includes("storage") || message.includes("quota")) {
    return {
      code: "CRYPTO_STORAGE_ERROR",
      message: "Storage error",
      recoverable: false,
    };
  }

  // Generic error
  return {
    code: "CROSS_SIGNING_FAILED",
    message: "Failed to set up encryption",
    recoverable: true,
  };
}
