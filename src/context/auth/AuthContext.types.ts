import { createContext } from "react";
import type { MatrixSession, AuthMetadata } from "@/lib/matrix";

/** Status of the authentication state machine */
export type AuthStatus =
  | "initializing" // Checking for existing session on startup
  | "unauthenticated" // No valid session
  | "discovering" // Discovering homeserver OAuth endpoints
  | "authenticating" // OAuth flow in progress
  | "authenticated" // Valid session exists
  | "soft_logout" // Session expired but can re-login with same device
  | "locked" // Account is locked by server admin
  | "suspended" // Account is suspended (limited functionality)
  | "error"; // An error occurred

/** Authentication error that can be displayed to the user */
export interface AuthError {
  message: string;
  code?: string;
  recoverable: boolean;
}

/** The value provided by AuthContext */
export interface AuthContextValue {
  /** Current authentication status */
  status: AuthStatus;

  /** Current Matrix session (when authenticated) */
  session: MatrixSession | null;

  /** Current error (when in error state) */
  error: AuthError | null;

  /** OAuth metadata for current homeserver (when discovered) */
  authMetadata: AuthMetadata | null;

  /** Loading message describing current operation (during initialization) */
  loadingMessage: string | null;

  /**
   * Begin the login flow for a homeserver.
   * Performs discovery, client registration, and opens OAuth window.
   *
   * @param homeserverInput - User input (e.g., "matrix.org")
   */
  login: (homeserverInput: string) => Promise<void>;

  /**
   * Log out the current session.
   * Revokes tokens and clears all stored data.
   */
  logout: () => Promise<void>;

  /**
   * Clear the current error and return to unauthenticated state.
   */
  clearError: () => void;

  /**
   * Retry the last failed operation.
   */
  retry: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
