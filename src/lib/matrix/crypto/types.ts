/**
 * Shared types for crypto operations.
 *
 * These live in the library layer so both lib/matrix/crypto and
 * context/CryptoContext can use them without circular imports.
 */

/**
 * Crypto error structure.
 * SDK throws generic errors, we categorize them for UI display.
 */
export interface CryptoError {
  /** Translation key (e.g., "INVALID_RECOVERY_KEY") */
  code: string;
  /** Human-readable message (fallback if translation missing) */
  message: string;
  /** Whether the error can be recovered from (retry vs logout) */
  recoverable: boolean;
}

/**
 * Result of a bootstrap or verification operation.
 * SDK methods are void/throw, we wrap with result type.
 */
export interface BootstrapResult {
  success: boolean;
  /** Recovery key (only on successful bootstrap of new keys) */
  recoveryKey?: string;
  error?: CryptoError;
}
