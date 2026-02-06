import { useEffect } from "react";
import type { MatrixSession } from "@/lib/matrix";
import {
  getSessionMetadata,
  refreshAuthMetadata,
  isTokenExpired,
  clearLocalStorageAuthData,
  TOKEN_REFRESH_BUFFER_MS,
  refreshManager,
  refreshAccessToken,
} from "@/lib/matrix";
import { usePlatform } from "@/platforms";
import type { AuthStatus } from "./AuthContext.types";
import type { AuthMetadata } from "@/lib/matrix";
import { buildMatrixSession } from "./helpers";

export interface UseAuthSessionParams {
  setStatus: (s: AuthStatus) => void;
  setSession: (s: MatrixSession | null) => void;
  setAuthMetadata: (m: AuthMetadata | null) => void;
  setLoadingMessage: (m: string | null) => void;
  initializeMatrixClient: (session: MatrixSession, refreshToken?: string | null) => () => void;
  initializeRefreshManager: (tokenEndpoint: string, clientId: string) => void;
}

/**
 * Session restoration on mount.
 * Checks for stored session, loads tokens, validates/refreshes, creates client.
 */
export function useAuthSession(params: UseAuthSessionParams): void {
  const {
    setStatus,
    setSession,
    setAuthMetadata,
    setLoadingMessage,
    initializeMatrixClient,
    initializeRefreshManager,
  } = params;

  const platform = usePlatform();

  useEffect(() => {
    let cancelled = false;
    let cleanupClientListeners: (() => void) | null = null;

    const initialize = async () => {
      try {
        setLoadingMessage("INIT_CHECKING_SESSION");
        const storedSession = getSessionMetadata();

        if (!storedSession) {
          setLoadingMessage(null);
          setStatus("unauthenticated");
          return;
        }

        setLoadingMessage("INIT_LOADING_VAULT");
        const tokens = await platform.storage.get();

        if (cancelled) return;

        if (!tokens) {
          setLoadingMessage(null);
          setStatus("unauthenticated");
          return;
        }

        // Get auth metadata for refresh infrastructure
        setLoadingMessage("INIT_RESTORING_SESSION");
        let tokenEndpoint: string;
        try {
          const authMeta = await refreshAuthMetadata(storedSession.homeserverUrl);
          if (cancelled) return;
          setAuthMetadata(authMeta);
          tokenEndpoint = authMeta.token_endpoint;
        } catch {
          if (cancelled) return;
          if (storedSession.tokenEndpoint) {
            tokenEndpoint = storedSession.tokenEndpoint;
          } else {
            // Can't set up refresh - continue without
            const newSession = buildMatrixSession(
              storedSession.userId,
              storedSession.deviceId,
              storedSession.homeserverUrl,
              tokens.accessToken
            );
            setSession(newSession);
            cleanupClientListeners = initializeMatrixClient(newSession, null);

            setLoadingMessage(null);
            setStatus("authenticated");
            return;
          }
        }

        // Initialize refresh manager
        initializeRefreshManager(tokenEndpoint, storedSession.clientId);

        // Check if token is expired
        if (isTokenExpired(tokens.expiresAt)) {
          if (tokens.refreshToken) {
            try {
              setLoadingMessage("INIT_REFRESHING_TOKEN");
              const newTokens = await refreshAccessToken(
                tokenEndpoint,
                tokens.refreshToken,
                storedSession.clientId
              );
              await platform.storage.store(newTokens);

              if (cancelled) return;

              const newSession = buildMatrixSession(
                storedSession.userId,
                storedSession.deviceId,
                storedSession.homeserverUrl,
                newTokens.accessToken
              );
              setSession(newSession);
              cleanupClientListeners = initializeMatrixClient(newSession, newTokens.refreshToken);

              refreshManager.scheduleProactiveRefresh(newTokens.expiresAt, TOKEN_REFRESH_BUFFER_MS);

              setLoadingMessage(null);
              setStatus("authenticated");
              return;
            } catch {
              if (cancelled) return;
              clearLocalStorageAuthData();
              await platform.storage.clear();
              if (cancelled) return;
              setLoadingMessage(null);
              setStatus("unauthenticated");
              return;
            }
          }

          // No refresh token, need to re-authenticate
          clearLocalStorageAuthData();
          await platform.storage.clear();
          if (cancelled) return;
          setLoadingMessage(null);
          setStatus("unauthenticated");
          return;
        }

        // Token is valid
        const newSession = buildMatrixSession(
          storedSession.userId,
          storedSession.deviceId,
          storedSession.homeserverUrl,
          tokens.accessToken
        );
        setSession(newSession);
        cleanupClientListeners = initializeMatrixClient(newSession, tokens.refreshToken);

        refreshManager.scheduleProactiveRefresh(tokens.expiresAt, TOKEN_REFRESH_BUFFER_MS);

        if (cancelled) return;
        setLoadingMessage(null);
        setStatus("authenticated");
      } catch (err) {
        if (cancelled) return;
        if (import.meta.env.DEV) {
          console.warn("Auth initialization error:", err);
        }
        setLoadingMessage(null);
        setStatus("unauthenticated");
      }
    };

    initialize();

    return () => {
      cancelled = true;
      refreshManager.cancelProactiveRefresh();
      cleanupClientListeners?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run once on mount only
  }, []);
}
