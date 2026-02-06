import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { HttpApiEvent, type MatrixClient } from "matrix-js-sdk";
import type { MatrixSession, TokenSet, AuthMetadata } from "@/lib/matrix";
import {
  createMatrixClient,
  updateClientAccessToken,
  updateClientRefreshToken,
  stopMatrixClient,
  clearCryptoDatabase,
  clearLocalStorageAuthData,
  refreshManager,
} from "@/lib/matrix";
import { usePlatform } from "@/platforms";
import type { AuthStatus, AuthError } from "./AuthContext.types";

export interface AuthHandlersRef {
  onSoftLogout: () => void;
  onHardLogout: () => void;
  onTokensRefreshed: (tokens: TokenSet) => void;
}

export interface UseAuthClientReturn {
  matrixClientRef: React.RefObject<MatrixClient | null>;
  initializeMatrixClient: (session: MatrixSession, refreshToken?: string | null) => () => void;
  initializeRefreshManager: (tokenEndpoint: string, clientId: string) => void;
  handleSoftLogout: () => void;
  handleHardLogout: () => Promise<void>;
  handleTokensRefreshed: (tokens: TokenSet) => void;
  handlersRef: React.RefObject<AuthHandlersRef>;
}

export function useAuthClient(
  sessionRef: React.RefObject<MatrixSession | null>,
  softLogoutSessionRef: React.RefObject<{ deviceId: string; homeserverUrl: string } | null>,
  setSession: Dispatch<SetStateAction<MatrixSession | null>>,
  setError: (e: AuthError | null) => void,
  setStatus: (s: AuthStatus) => void,
  setAuthMetadata: (m: AuthMetadata | null) => void
): UseAuthClientReturn {
  const platform = usePlatform();
  const matrixClientRef = useRef<MatrixClient | null>(null);

  /**
   * Handle soft logout - preserve device ID for re-login.
   */
  const handleSoftLogout = useCallback(() => {
    const currentSession = sessionRef.current;
    if (currentSession) {
      softLogoutSessionRef.current = {
        deviceId: currentSession.deviceId,
        homeserverUrl: currentSession.homeserverUrl,
      };
    }

    setSession(null);
    setError({
      message: "AUTH_ERROR_SESSION_EXPIRED",
      code: "soft_logout",
      recoverable: true,
    });
    setStatus("soft_logout");

    refreshManager.clear();
  }, [sessionRef, softLogoutSessionRef, setSession, setError, setStatus]);

  /**
   * Handle hard logout - clear everything including encryption state.
   */
  const handleHardLogout = useCallback(async () => {
    await stopMatrixClient();

    try {
      await clearCryptoDatabase();
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("Failed to clear crypto database:", err);
      }
    }

    softLogoutSessionRef.current = null;

    clearLocalStorageAuthData();
    await platform.storage.clear();

    refreshManager.clear();

    setSession(null);
    setAuthMetadata(null);
    setError(null);
    setStatus("unauthenticated");
  }, [platform.storage, softLogoutSessionRef, setSession, setAuthMetadata, setError, setStatus]);

  /**
   * Handle tokens refreshed - update session and client.
   */
  const handleTokensRefreshed = useCallback(
    (tokens: TokenSet) => {
      setSession((prev) => (prev ? { ...prev, accessToken: tokens.accessToken } : null));

      updateClientAccessToken(tokens.accessToken);
      if (tokens.refreshToken) {
        updateClientRefreshToken(tokens.refreshToken);
      }
    },
    [setSession]
  );

  // Store handlers in refs so initialization can use latest versions
  const handlersRef = useRef<AuthHandlersRef>({
    onSoftLogout: handleSoftLogout,
    onHardLogout: handleHardLogout,
    onTokensRefreshed: handleTokensRefreshed,
  });
  useEffect(() => {
    handlersRef.current = {
      onSoftLogout: handleSoftLogout,
      onHardLogout: handleHardLogout,
      onTokensRefreshed: handleTokensRefreshed,
    };
  }, [handleSoftLogout, handleHardLogout, handleTokensRefreshed]);

  /**
   * Initialize refresh manager.
   */
  const initializeRefreshManager = useCallback(
    (tokenEndpoint: string, clientId: string) => {
      refreshManager.initialize({
        tokenEndpoint,
        clientId,
        storage: platform.storage,
        onTokensRefreshed: (tokens) => handlersRef.current.onTokensRefreshed(tokens),
      });
    },
    [platform.storage]
  );

  /**
   * Set up SDK event listeners on the Matrix client.
   */
  const setupClientEventListeners = useCallback((client: MatrixClient) => {
    const handleSessionLoggedOut = (err: unknown) => {
      if (import.meta.env.DEV) {
        console.warn("SDK SessionLoggedOut event:", err);
      }

      const isSoftLogout =
        err &&
        typeof err === "object" &&
        "data" in err &&
        err.data &&
        typeof err.data === "object" &&
        "soft_logout" in err.data &&
        err.data.soft_logout === true;

      if (isSoftLogout) {
        handlersRef.current.onSoftLogout();
      } else {
        handlersRef.current.onHardLogout();
      }
    };

    client.on(HttpApiEvent.SessionLoggedOut, handleSessionLoggedOut);

    return () => {
      client.off(HttpApiEvent.SessionLoggedOut, handleSessionLoggedOut);
    };
  }, []);

  /**
   * Create Matrix client, store in ref, and set up event listeners.
   * Returns cleanup function for the event listeners.
   */
  const initializeMatrixClient = useCallback(
    (session: MatrixSession, refreshToken?: string | null): (() => void) => {
      const client = createMatrixClient({
        session,
        tokenRefreshFunction: refreshManager.getTokenRefreshFunction(),
        refreshToken: refreshToken ?? undefined,
      });
      matrixClientRef.current = client;
      return setupClientEventListeners(client);
    },
    [setupClientEventListeners]
  );

  return {
    matrixClientRef,
    initializeMatrixClient,
    initializeRefreshManager,
    handleSoftLogout,
    handleHardLogout,
    handleTokensRefreshed,
    handlersRef,
  };
}
