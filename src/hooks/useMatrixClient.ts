import { useState, useEffect, useCallback, useRef } from "react";
import type { MatrixClient, IStartClientOpts } from "matrix-js-sdk";
import { useAuthContext } from "@/context";
import { getMatrixClient, stopMatrixClient, startMatrixClient } from "@/lib/matrix";

export interface UseMatrixClientResult {
  /** The Matrix client instance (null if not authenticated) */
  client: MatrixClient | null;
  /** Whether the client is currently syncing */
  isSyncing: boolean;
  /** Any error that occurred during client initialization */
  error: Error | null;
  /** Start the client (begin syncing). Pass opts to override default sync options. */
  start: (opts?: IStartClientOpts) => Promise<void>;
  /** Stop the client (stop syncing) */
  stop: () => Promise<void>;
}

/**
 * Hook to access the Matrix client.
 * The client is created by AuthContext when authenticated.
 * This hook provides access to the client and syncing controls.
 */
export function useMatrixClient(): UseMatrixClientResult {
  const { status, session } = useAuthContext();
  const [client, setClient] = useState<MatrixClient | null>(() => getMatrixClient());
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track session to detect changes
  const prevSessionRef = useRef<typeof session>(null);

  // Sync client state with AuthContext
  useEffect(() => {
    const prevSession = prevSessionRef.current;
    prevSessionRef.current = session;

    if (status === "authenticated" && session) {
      // Client is created by AuthContext before session is set
      // Defer state update to avoid cascading renders within effect
      const timeoutId = setTimeout(() => {
        const existingClient = getMatrixClient();
        if (existingClient) {
          setClient(existingClient);
          setError(null);
        }
      }, 0);

      return () => clearTimeout(timeoutId);
    } else if (status === "unauthenticated" && prevSession !== null) {
      // Clean up when logged out - defer to avoid cascading renders
      const timeoutId = setTimeout(() => {
        stopMatrixClient();
        setClient(null);
        setIsSyncing(false);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [status, session]);

  // Start syncing
  const start = useCallback(
    async (opts?: IStartClientOpts) => {
      if (!client) return;

      try {
        await startMatrixClient(opts);
        setIsSyncing(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to start Matrix client"));
      }
    },
    [client]
  );

  // Stop syncing
  const stop = useCallback(async () => {
    if (!client) return;

    try {
      await stopMatrixClient();
      setIsSyncing(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to stop Matrix client"));
    }
  }, [client]);

  return {
    client,
    isSyncing,
    error,
    start,
    stop,
  };
}
