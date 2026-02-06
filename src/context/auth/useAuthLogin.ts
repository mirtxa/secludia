import { useCallback } from "react";
import type { MatrixSession, AuthMetadata } from "@/lib/matrix";
import {
  discoverHomeserver,
  registerClient,
  generateDeviceId,
  buildScope,
  generatePKCE,
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  parseCallbackUrl,
  storeSessionMetadata,
  storePKCEState,
  getPKCEState,
  clearPKCEState,
  TOKEN_REFRESH_BUFFER_MS,
  refreshManager,
} from "@/lib/matrix";
import { usePlatform } from "@/platforms";
import type { AuthStatus, AuthError } from "./AuthContext.types";
import { getRedirectUri, buildMatrixSession, toAuthError } from "./helpers";

export interface UseAuthLoginParams {
  setStatus: (s: AuthStatus) => void;
  setSession: (s: MatrixSession | null) => void;
  setError: (e: AuthError | null) => void;
  setAuthMetadata: (m: AuthMetadata | null) => void;
  lastLoginAttempt: React.RefObject<string | null>;
  softLogoutSessionRef: React.RefObject<{ deviceId: string; homeserverUrl: string } | null>;
  initializeMatrixClient: (session: MatrixSession, refreshToken?: string | null) => () => void;
  initializeRefreshManager: (tokenEndpoint: string, clientId: string) => void;
}

export function useAuthLogin(
  params: UseAuthLoginParams
): (homeserverInput: string) => Promise<void> {
  const {
    setStatus,
    setSession,
    setError,
    setAuthMetadata,
    lastLoginAttempt,
    softLogoutSessionRef,
    initializeMatrixClient,
    initializeRefreshManager,
  } = params;

  const platform = usePlatform();

  const login = useCallback(
    async (homeserverInput: string) => {
      lastLoginAttempt.current = homeserverInput;
      setError(null);
      setStatus("discovering");

      try {
        // Step 1: Discover homeserver and OAuth endpoints
        const discovery = await discoverHomeserver(homeserverInput);
        setAuthMetadata(discovery.authMetadata);

        // Step 2: Register client with authorization server
        const redirectUri = getRedirectUri(platform.isTauri);
        const { client_id: clientId } = await registerClient(discovery.authMetadata, redirectUri);

        // Step 3: Generate PKCE challenge and device ID
        const pkce = await generatePKCE();

        // Use preserved device ID from soft logout, or generate new one
        const deviceId = softLogoutSessionRef.current?.deviceId ?? generateDeviceId();
        const scope = buildScope(deviceId);

        // Clear soft logout reference after using it
        softLogoutSessionRef.current = null;

        // Store PKCE state for callback handling
        storePKCEState({
          codeVerifier: pkce.codeVerifier,
          state: pkce.state,
          issuer: discovery.authMetadata.issuer,
          deviceId,
        });

        // Step 4: Build authorization URL with scope
        const responseMode = platform.isTauri ? "query" : "fragment";
        const authUrl = buildAuthorizationUrl({
          authorizationEndpoint: discovery.authMetadata.authorization_endpoint,
          clientId,
          redirectUri,
          codeChallenge: pkce.codeChallenge,
          state: pkce.state,
          scope,
          responseMode,
        });

        setStatus("authenticating");

        // Step 5: Open OAuth window and wait for callback (platform-specific)
        const callbackUrl = await platform.oauth.open(authUrl);

        // Step 6: Parse callback and validate state
        const { code, state } = parseCallbackUrl(callbackUrl);

        const storedPkce = getPKCEState();
        if (!storedPkce || storedPkce.state !== state) {
          throw new Error("Invalid OAuth state - possible CSRF attack");
        }

        clearPKCEState();

        // Step 7: Exchange code for tokens
        const tokens = await exchangeCodeForTokens(
          discovery.authMetadata.token_endpoint,
          code,
          storedPkce.codeVerifier,
          clientId,
          redirectUri
        );

        await platform.storage.store(tokens);

        // Step 8: Get user info from Matrix
        const whoamiResponse = await fetch(
          `${discovery.homeserverUrl}/_matrix/client/v3/account/whoami`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );

        if (!whoamiResponse.ok) {
          throw new Error("Failed to get user information");
        }

        const whoami = await whoamiResponse.json();

        // Store session metadata
        const sessionData = {
          userId: whoami.user_id,
          deviceId: whoami.device_id || deviceId,
          homeserverUrl: discovery.homeserverUrl,
          clientId,
          issuer: discovery.authMetadata.issuer,
          tokenEndpoint: discovery.authMetadata.token_endpoint,
          revocationEndpoint: discovery.authMetadata.revocation_endpoint,
          accountManagementUrl: discovery.accountManagementUrl,
        };

        storeSessionMetadata(sessionData);

        // Initialize refresh manager
        initializeRefreshManager(discovery.authMetadata.token_endpoint, clientId);

        // Set session state
        const newSession = buildMatrixSession(
          whoami.user_id,
          whoami.device_id || deviceId,
          discovery.homeserverUrl,
          tokens.accessToken
        );
        setSession(newSession);
        initializeMatrixClient(newSession, tokens.refreshToken);

        // Schedule proactive token refresh
        refreshManager.scheduleProactiveRefresh(tokens.expiresAt, TOKEN_REFRESH_BUFFER_MS);

        setStatus("authenticated");
      } catch (err) {
        clearPKCEState();

        // Check if user cancelled
        const message = err instanceof Error ? err.message : typeof err === "string" ? err : "";
        if (message === "OAUTH_CANCELLED") {
          setStatus("unauthenticated");
          return;
        }

        setError(toAuthError(err));
        setStatus("error");
      }
    },
    [
      platform,
      setStatus,
      setSession,
      setError,
      setAuthMetadata,
      lastLoginAttempt,
      softLogoutSessionRef,
      initializeRefreshManager,
      initializeMatrixClient,
    ]
  );

  return login;
}
