import type { ReactNode } from "react";
import { useState, useCallback, useMemo, useRef } from "react";
import type { CryptoApi } from "matrix-js-sdk/lib/crypto-api";
import { CryptoContext, type CryptoContextValue, type CryptoStatus } from "./CryptoContext.types";
import type { CryptoError } from "@/lib/matrix/crypto/types";
import { useCryptoInit } from "./useCryptoInit";
import { useCryptoActions } from "./useCryptoActions";

export function CryptoProvider({ children }: { children: ReactNode }) {
  const [status, setStatusInternal] = useState<CryptoStatus>("idle");
  const [error, setError] = useState<CryptoError | null>(null);
  const [cryptoApi, setCryptoApi] = useState<CryptoApi | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track current status for comparison (avoids unnecessary updates)
  const statusRef = useRef<CryptoStatus>(status);

  // Wrapper that logs in dev mode and prevents duplicate updates
  const setStatus = useCallback((newStatus: CryptoStatus) => {
    if (statusRef.current === newStatus) {
      return; // Skip if already in this status
    }
    if (import.meta.env.DEV) {
      console.log(`[crypto] Status: ${statusRef.current} → ${newStatus}`);
    }
    statusRef.current = newStatus;
    setStatusInternal(newStatus);
  }, []);

  // Track if we've already tried to initialize for this auth session
  const initAttemptedRef = useRef(false);

  // Abort controller for the reset approval polling loop
  const resetAbortRef = useRef<AbortController | null>(null);

  // Track whether we've upgraded from minimal to full sync
  const fullSyncStartedRef = useRef(false);

  // Initialization effect + phase 2 sync upgrade
  useCryptoInit({
    setStatus,
    setError,
    setCryptoApi,
    setIsSyncing,
    initAttemptedRef,
    fullSyncStartedRef,
    status,
  });

  // Action callbacks
  const actions = useCryptoActions({
    setStatus,
    setError,
    cryptoApi,
    setCryptoApi,
    resetAbortRef,
    fullSyncStartedRef,
  });

  const value = useMemo<CryptoContextValue>(
    () => ({
      status,
      error,
      crypto: cryptoApi,
      isSyncing,
      ...actions,
    }),
    [status, error, cryptoApi, isSyncing, actions]
  );

  return <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>;
}
