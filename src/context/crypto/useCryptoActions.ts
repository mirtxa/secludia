import { useCallback } from "react";
import type { CryptoApi } from "matrix-js-sdk/lib/crypto-api";
import { encodeRecoveryKey } from "matrix-js-sdk/lib/crypto-api";
import type { CryptoStatus } from "./CryptoContext.types";
import type { CryptoError, BootstrapResult } from "@/lib/matrix/crypto/types";
import {
  getMatrixClient,
  restartMatrixClientAndWaitForSync,
  buildMinimalSyncOpts,
  validateRecoveryKey,
  verifyWithRecoveryKey as verifyWithKey,
  ensureCrypto,
  waitForCrossSigningKeys,
  STORAGE_KEYS,
} from "@/lib/matrix";
import { setPendingSecretStorageKey } from "@/lib/matrix/crypto";

export interface UseCryptoActionsParams {
  setStatus: (s: CryptoStatus) => void;
  setError: (e: CryptoError | null) => void;
  cryptoApi: CryptoApi | null;
  setCryptoApi: (c: CryptoApi | null) => void;
  resetAbortRef: React.RefObject<AbortController | null>;
  fullSyncStartedRef: React.RefObject<boolean>;
}

export interface CryptoActions {
  bootstrapSecurity: () => Promise<BootstrapResult>;
  verifyWithRecoveryKey: (key: string) => Promise<BootstrapResult>;
  resetIdentity: () => Promise<BootstrapResult>;
  skipVerification: () => void;
  cancelReset: () => void;
  clearError: () => void;
}

export function useCryptoActions(params: UseCryptoActionsParams): CryptoActions {
  const { setStatus, setError, cryptoApi, setCryptoApi, resetAbortRef } = params;

  /**
   * Shared bootstrap/reset logic. Both bootstrapSecurity and resetIdentity
   * perform identical steps: cross-signing + secret storage bootstrap.
   * Initializes crypto on demand if not already initialized.
   */
  const performBootstrap = useCallback(
    async (
      errorLabel: string,
      initialStatus: CryptoStatus = "bootstrapping"
    ): Promise<BootstrapResult> => {
      const client = getMatrixClient();
      if (!client) {
        return {
          success: false,
          error: {
            code: "CRYPTO_NOT_INITIALIZED",
            message: "Client not available",
            recoverable: false,
          },
        };
      }

      setStatus(initialStatus);
      setError(null);

      // Initialize crypto on demand
      const crypto = await ensureCrypto(client, cryptoApi);
      if (!crypto) {
        const cryptoError: CryptoError = {
          code: "CRYPTO_INIT_FAILED",
          message: "Failed to initialize encryption",
          recoverable: false,
        };
        setError(cryptoError);
        setStatus("error");
        return { success: false, error: cryptoError };
      }
      setCryptoApi(crypto);

      let generatedRecoveryKey: string | undefined;

      try {
        // Secret storage MUST be created before cross-signing so the SDK can
        // persist the new cross-signing keys into secret storage.
        await crypto.bootstrapSecretStorage({
          createSecretStorageKey: async () => {
            const key = globalThis.crypto.getRandomValues(new Uint8Array(32));
            generatedRecoveryKey = encodeRecoveryKey(key);
            // Make the key available to getSecretStorageKey callback so the SDK
            // can encrypt cross-signing keys into secret storage.
            setPendingSecretStorageKey(key);
            return {
              privateKey: key,
              encodedPrivateKey: generatedRecoveryKey,
            };
          },
          setupNewSecretStorage: true,
          setupNewKeyBackup: true,
        });

        await crypto.bootstrapCrossSigning({
          setupNewCrossSigning: true,
          // First-time uploads succeed without auth. Replacing existing keys
          // requires UIA — the server returns a 401 with an approval URL.
          authUploadDeviceSigningKeys: async (makeRequest) => {
            try {
              await makeRequest(null);
            } catch (e: unknown) {
              // Extract UIA challenge from the 401 error
              const data =
                e && typeof e === "object" && "data" in e
                  ? ((e as Record<string, unknown>).data as Record<string, unknown> | undefined)
                  : undefined;

              if (!data) throw e;

              const params = data.params as Record<string, Record<string, string>> | undefined;
              const approvalUrl = params?.["m.oauth"]?.url;

              if (!approvalUrl) throw e;

              if (import.meta.env.DEV) {
                console.log("[crypto] Cross-signing reset requires approval:", approvalUrl);
              }

              // Signal the UI to show a "waiting for approval" state
              setStatus("awaiting_approval");

              const abort = new AbortController();
              resetAbortRef.current = abort;

              // Open the server-provided approval URL for the user to approve.
              window.open(approvalUrl, "_blank", "noopener,noreferrer");

              // Cancellable sleep helper — rejects immediately on abort.
              const sleep = (ms: number) =>
                new Promise<void>((resolve, reject) => {
                  const timer = setTimeout(resolve, ms);
                  abort.signal.addEventListener(
                    "abort",
                    () => {
                      clearTimeout(timer);
                      reject(new Error("RESET_CANCELLED"));
                    },
                    { once: true }
                  );
                });

              // Poll until the server accepts the request (user approved).
              const POLL_MS = 3000;
              const DEADLINE = Date.now() + 120_000;

              try {
                while (Date.now() < DEADLINE) {
                  await sleep(POLL_MS);
                  try {
                    await makeRequest(null);
                    return; // Approved — upload succeeded
                  } catch {
                    // Not yet approved, keep polling
                  }
                }
              } finally {
                resetAbortRef.current = null;
              }

              throw new Error("RESET_NOT_APPROVED");
            }
          },
        });

        // Clear any previous skip flag — user is now properly setting up
        localStorage.removeItem(STORAGE_KEYS.VERIFICATION_SKIPPED);

        return {
          success: true,
          recoveryKey: generatedRecoveryKey,
        };
      } catch (err) {
        // User cancelled the reset approval — return to verification screen silently
        if (err instanceof Error && err.message === "RESET_CANCELLED") {
          setStatus("needs_verification");
          return { success: false };
        }

        if (import.meta.env.DEV) {
          console.error(`[crypto] ${errorLabel}:`, err);
        }

        const cryptoError: CryptoError = {
          code: "CROSS_SIGNING_FAILED",
          message: err instanceof Error ? err.message : `Failed to ${errorLabel.toLowerCase()}`,
          recoverable: true,
        };

        setError(cryptoError);
        setStatus("error");

        return {
          success: false,
          error: cryptoError,
        };
      } finally {
        setPendingSecretStorageKey(null);
      }
    },
    [setStatus, setError, cryptoApi, setCryptoApi, resetAbortRef]
  );

  const bootstrapSecurity = useCallback(() => performBootstrap("Bootstrap"), [performBootstrap]);

  /**
   * Verify with recovery key.
   * Validates the key against secret storage first (pure Web Crypto, no IndexedDB),
   * then initializes crypto on demand, waits for the OlmMachine to process
   * key queries, and performs full verification.
   */
  const verifyWithRecoveryKey = useCallback(
    async (key: string): Promise<BootstrapResult> => {
      const client = getMatrixClient();
      if (!client) {
        return {
          success: false,
          error: {
            code: "CRYPTO_NOT_INITIALIZED",
            message: "Client not available",
            recoverable: false,
          },
        };
      }

      const userId = client.getUserId();
      if (!userId) {
        return {
          success: false,
          error: {
            code: "CRYPTO_NOT_INITIALIZED",
            message: "User ID not available",
            recoverable: false,
          },
        };
      }

      setStatus("verifying");
      setError(null);

      // Step 1: Validate the key against secret storage (pure Web Crypto, no WASM).
      const validation = await validateRecoveryKey(client, key);
      if (!validation.success) {
        if (validation.error) {
          setError(validation.error);
        }
        setStatus("needs_verification");
        return validation;
      }

      // Step 2: Initialize crypto on demand (creates IndexedDB stores).
      const crypto = await ensureCrypto(client, cryptoApi);
      if (!crypto) {
        const cryptoError: CryptoError = {
          code: "CRYPTO_INIT_FAILED",
          message: "Failed to initialize encryption",
          recoverable: false,
        };
        setError(cryptoError);
        setStatus("error");
        return { success: false, error: cryptoError };
      }
      setCryptoApi(crypto);

      // Step 3: Restart sync with crypto active.
      try {
        await restartMatrixClientAndWaitForSync(buildMinimalSyncOpts(userId));
      } catch {
        const syncError: CryptoError = {
          code: "SYNC_NOT_READY",
          message: "Failed to sync after crypto initialization",
          recoverable: true,
        };
        setError(syncError);
        setStatus("needs_verification");
        return { success: false, error: syncError };
      }

      // Step 4: Wait for the OlmMachine to process /keys/query.
      try {
        await waitForCrossSigningKeys(crypto);
      } catch {
        const keyError: CryptoError = {
          code: "CROSS_SIGNING_FAILED",
          message: "Timed out waiting for encryption keys",
          recoverable: true,
        };
        setError(keyError);
        setStatus("needs_verification");
        return { success: false, error: keyError };
      }

      // Step 5: Perform full verification using the recovery key.
      const result = await verifyWithKey(client, key);

      if (result.success) {
        localStorage.removeItem(STORAGE_KEYS.VERIFICATION_SKIPPED);
        setStatus("ready");
      } else if (result.error) {
        setError(result.error);
        if (result.error.recoverable) {
          setStatus("needs_verification");
        } else {
          setStatus("error");
        }
      }

      return result;
    },
    [setStatus, setError, cryptoApi, setCryptoApi]
  );

  const resetIdentity = useCallback(
    () => performBootstrap("Identity reset", "awaiting_approval"),
    [performBootstrap]
  );

  const skipVerification = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.VERIFICATION_SKIPPED, "true");
    setStatus("ready");
  }, [setStatus]);

  const cancelReset = useCallback(() => {
    resetAbortRef.current?.abort();
  }, [resetAbortRef]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    bootstrapSecurity,
    verifyWithRecoveryKey,
    resetIdentity,
    skipVerification,
    cancelReset,
    clearError,
  };
}
