import { createContext } from "react";
import type { CryptoApi } from "matrix-js-sdk/lib/crypto-api";

// Re-export shared types from lib layer (canonical source)
export type { CryptoError, BootstrapResult } from "@/lib/matrix/crypto/types";
import type { CryptoError, BootstrapResult } from "@/lib/matrix/crypto/types";

/**
 * State machine for crypto initialization and verification flow.
 * SDK doesn't track UI state - we manage this ourselves.
 */
export type CryptoStatus =
  | "idle" // Not authenticated
  | "checking_status" // Checking cross-signing status (HTTP-only)
  | "initializing" // Calling initRustCrypto() (on-demand)
  | "needs_setup" // New user - no cross-signing keys
  | "needs_verification" // Has keys - needs recovery key
  | "bootstrapping" // Creating keys
  | "verifying" // Verifying with recovery key
  | "awaiting_approval" // Waiting for user to approve reset on homeserver
  | "ready" // Fully operational
  | "error"; // An error occurred

/**
 * The value provided by CryptoContext.
 */
export interface CryptoContextValue {
  /** Current crypto status */
  status: CryptoStatus;

  /** Current error (when status is "error") */
  error: CryptoError | null;

  /** CryptoApi instance from SDK (when initialized) */
  crypto: CryptoApi | null;

  /** Whether sync loop is running */
  isSyncing: boolean;

  /**
   * Bootstrap security for a new user.
   * Creates cross-signing keys and secret storage.
   * Returns the generated recovery key.
   */
  bootstrapSecurity: () => Promise<BootstrapResult>;

  /**
   * Verify this device using an existing recovery key.
   */
  verifyWithRecoveryKey: (key: string) => Promise<BootstrapResult>;

  /**
   * Reset cryptographic identity.
   * WARNING: Destructive - user loses access to old messages.
   */
  resetIdentity: () => Promise<BootstrapResult>;

  /**
   * Skip verification and continue with unverified device.
   */
  skipVerification: () => void;

  /**
   * Cancel a pending reset approval (stops the polling loop).
   */
  cancelReset: () => void;

  /**
   * Clear current error and allow retry.
   */
  clearError: () => void;
}

export const CryptoContext = createContext<CryptoContextValue | undefined>(undefined);
