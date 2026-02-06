import type { ReactNode } from "react";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
  type AuthError,
} from "./AuthContext.types";
import type { MatrixSession, AuthMetadata } from "@/lib/matrix";
import { useAuthClient } from "./useAuthClient";
import { useAuthSession } from "./useAuthSession";
import { useAuthLogin } from "./useAuthLogin";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [session, setSession] = useState<MatrixSession | null>(null);
  const [error, setError] = useState<AuthError | null>(null);
  const [authMetadata, setAuthMetadata] = useState<AuthMetadata | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  // Track last login attempt for retry
  const lastLoginAttempt = useRef<string | null>(null);

  // Track if soft logout (preserve device ID for re-login)
  const softLogoutSessionRef = useRef<{
    deviceId: string;
    homeserverUrl: string;
  } | null>(null);

  // Use ref to access current session without causing dependency loops
  const sessionRef = useRef<MatrixSession | null>(null);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Client lifecycle (event listeners, refresh manager, logout handlers)
  const { initializeMatrixClient, initializeRefreshManager } = useAuthClient(
    sessionRef,
    softLogoutSessionRef,
    setSession,
    setError,
    setStatus,
    setAuthMetadata
  );

  // Session restoration on mount
  useAuthSession({
    setStatus,
    setSession,
    setAuthMetadata,
    setLoadingMessage,
    initializeMatrixClient,
    initializeRefreshManager,
  });

  // Login flow
  const login = useAuthLogin({
    setStatus,
    setSession,
    setError,
    setAuthMetadata,
    lastLoginAttempt,
    softLogoutSessionRef,
    initializeMatrixClient,
    initializeRefreshManager,
  });

  const logout = useCallback(async () => {
    // TODO: Implement proper logout with token revocation
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    softLogoutSessionRef.current = null;
    setStatus("unauthenticated");
  }, []);

  const retry = useCallback(async () => {
    if (lastLoginAttempt.current) {
      await login(lastLoginAttempt.current);
    } else if (status === "soft_logout" && softLogoutSessionRef.current) {
      await login(softLogoutSessionRef.current.homeserverUrl);
    }
  }, [login, status]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      error,
      authMetadata,
      loadingMessage,
      login,
      logout,
      clearError,
      retry,
    }),
    [status, session, error, authMetadata, loadingMessage, login, logout, clearError, retry]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
