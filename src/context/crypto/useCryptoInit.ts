import { useEffect } from "react";
import { ClientEvent, SyncState } from "matrix-js-sdk";
import type { CryptoApi } from "matrix-js-sdk/lib/crypto-api";
import type { CryptoStatus } from "./CryptoContext.types";
import type { CryptoError } from "@/lib/matrix/crypto/types";
import { useAuthContext } from "../auth";
import {
  getMatrixClient,
  startMatrixClient,
  restartMatrixClient,
  buildMinimalSyncOpts,
  initializeClientCrypto,
  checkCrossSigningStatus,
  STORAGE_KEYS,
} from "@/lib/matrix";

export interface UseCryptoInitParams {
  setStatus: (s: CryptoStatus) => void;
  setError: (e: CryptoError | null) => void;
  setCryptoApi: (c: CryptoApi | null) => void;
  setIsSyncing: (b: boolean) => void;
  initAttemptedRef: React.RefObject<boolean>;
  fullSyncStartedRef: React.RefObject<boolean>;
  status: CryptoStatus;
}

/**
 * Crypto initialization effect + phase 2 sync upgrade.
 *
 * Architecture:
 * 1. Skip flag in localStorage → start full sync → ready (NO crypto)
 * 2. HTTP-only checkCrossSigningStatus() (no crypto init):
 *    a. No master key     → start minimal sync (no crypto) → needs_setup
 *    b. Verified device   → init crypto → start full sync → ready
 *    c. Unverified device → start minimal sync (no crypto) → needs_verification
 */
export function useCryptoInit(params: UseCryptoInitParams): void {
  const {
    setStatus,
    setError,
    setCryptoApi,
    setIsSyncing,
    initAttemptedRef,
    fullSyncStartedRef,
    status,
  } = params;

  const { status: authStatus } = useAuthContext();

  // Main initialization effect
  useEffect(() => {
    let cancelled = false;
    let syncListener: (() => void) | null = null;

    const initialize = async () => {
      if (authStatus !== "authenticated") {
        // Reset to idle when not authenticated
        setStatus("idle");
        setError(null);
        setCryptoApi(null);
        setIsSyncing(false);
        initAttemptedRef.current = false;
        fullSyncStartedRef.current = false;
        return;
      }

      // Don't re-attempt if we already tried (prevents infinite loop on error)
      if (initAttemptedRef.current) {
        return;
      }
      initAttemptedRef.current = true;

      const client = getMatrixClient();
      if (!client) {
        setError({
          code: "CRYPTO_INIT_FAILED",
          message: "Matrix client not available",
          recoverable: false,
        });
        setStatus("error");
        return;
      }

      const userId = client.getUserId();
      const deviceId = client.getDeviceId();

      if (!userId || !deviceId) {
        setError({
          code: "CRYPTO_INIT_FAILED",
          message: "Missing user or device ID",
          recoverable: false,
        });
        setStatus("error");
        return;
      }

      // Fast path: user previously chose to skip verification
      const skipped = localStorage.getItem(STORAGE_KEYS.VERIFICATION_SKIPPED);
      if (skipped === "true") {
        if (import.meta.env.DEV) {
          console.log("[crypto] Skip flag found — starting full sync without crypto");
        }
        fullSyncStartedRef.current = true;
        setIsSyncing(true);
        try {
          await startMatrixClient();
        } catch (err) {
          if (cancelled) return;
          if (import.meta.env.DEV) {
            console.error("[crypto] Failed to start client:", err);
          }
          setError({
            code: "SYNC_NOT_READY",
            message: "Failed to connect to server",
            recoverable: true,
          });
          setStatus("error");
          return;
        }
        if (!cancelled) {
          setStatus("ready");
        }
        return;
      }

      // HTTP-only cross-signing check (no crypto initialization)
      setStatus("checking_status");

      try {
        const crossSigningStatus = await checkCrossSigningStatus(client, userId, deviceId);
        if (cancelled) return;

        if (crossSigningStatus.isDeviceVerified) {
          // Device is already verified — init crypto and start full sync
          if (import.meta.env.DEV) {
            console.log("[crypto] Device verified on server — initializing crypto");
          }

          setStatus("initializing");
          const initResult = await initializeClientCrypto(client);
          if (cancelled) return;

          if (!initResult.success) {
            setError({
              code: "CRYPTO_INIT_FAILED",
              message: initResult.error?.message ?? "Failed to initialize encryption",
              recoverable: false,
            });
            setStatus("error");
            return;
          }

          const crypto = client.getCrypto() ?? null;
          setCryptoApi(crypto);

          // Start full sync directly (already verified)
          fullSyncStartedRef.current = true;
          setIsSyncing(true);
          await startMatrixClient();
          if (!cancelled) {
            setStatus("ready");
          }
        } else if (crossSigningStatus.hasKeys) {
          // User has keys but this device isn't verified.
          // Start minimal sync without crypto — crypto initialization is deferred
          // to when the user enters a valid recovery key.
          if (import.meta.env.DEV) {
            console.log("[crypto] Has keys, device not verified — needs verification");
          }

          // Wait for sync to reach Prepared so account data (secret storage keys)
          // is available for recovery key validation.
          const onSync = (syncState: SyncState) => {
            if (syncState === SyncState.Prepared || syncState === SyncState.Syncing) {
              setIsSyncing(true);
              client.off(ClientEvent.Sync, onSync);
              syncListener = null;
              if (!cancelled) {
                setStatus("needs_verification");
              }
            } else if (syncState === SyncState.Error) {
              client.off(ClientEvent.Sync, onSync);
              syncListener = null;
              if (!cancelled) {
                setError({
                  code: "SYNC_NOT_READY",
                  message: "Connection failed",
                  recoverable: true,
                });
                setStatus("error");
              }
            }
          };

          client.on(ClientEvent.Sync, onSync);
          syncListener = () => client.off(ClientEvent.Sync, onSync);

          try {
            await startMatrixClient(buildMinimalSyncOpts(userId));
          } catch (err) {
            if (cancelled) return;
            if (import.meta.env.DEV) {
              console.error("[crypto] Failed to start client:", err);
            }
            setError({
              code: "SYNC_NOT_READY",
              message: "Failed to connect to server",
              recoverable: true,
            });
            setStatus("error");
          }
        } else {
          // No cross-signing keys — new user needs setup
          if (import.meta.env.DEV) {
            console.log("[crypto] No cross-signing keys — needs setup");
          }

          setIsSyncing(true);
          await startMatrixClient(buildMinimalSyncOpts(userId));
          if (!cancelled) {
            setStatus("needs_setup");
          }
        }
      } catch (err) {
        if (cancelled) return;

        if (import.meta.env.DEV) {
          console.error("[crypto] Failed to check cross-signing status:", err);
        }

        // Fall back to needs_setup on error (safer — user can bootstrap from scratch)
        setIsSyncing(true);
        try {
          await startMatrixClient(buildMinimalSyncOpts(userId));
        } catch {
          // Ignore sync start error in fallback
        }
        if (!cancelled) {
          setStatus("needs_setup");
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      syncListener?.();
    };
    // Only re-run when auth status changes, not on our internal status changes
    // setStatus is stable (from useCallback) so won't cause re-runs
  }, [
    authStatus,
    setStatus,
    setError,
    setCryptoApi,
    setIsSyncing,
    initAttemptedRef,
    fullSyncStartedRef,
  ]);

  // Phase 2: Upgrade to full sync once crypto is ready.
  // For the skip and verified fast paths, fullSyncStartedRef is already true
  // so this won't trigger a redundant restart.
  useEffect(() => {
    if (status === "ready" && !fullSyncStartedRef.current) {
      fullSyncStartedRef.current = true;
      restartMatrixClient();
    }
    if (status === "idle") {
      fullSyncStartedRef.current = false;
    }
  }, [status, fullSyncStartedRef]);
}
