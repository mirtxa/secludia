/**
 * Crypto module - End-to-end encryption support
 *
 * Provides:
 * - Crypto initialization (Rust backend)
 * - Cross-signing bootstrap
 * - Secret storage / recovery key management
 * - IndexedDB crypto database management
 */

// Types
export type { CryptoError, BootstrapResult } from "./types";

// Storage
export { CRYPTO_DB_PREFIX, clearCryptoDatabase } from "./storage";

// Callbacks
export {
  getDefaultCryptoCallbacks,
  setPendingSecretStorageKey,
  decodeUserRecoveryKey,
} from "./callbacks";

// Initialization
export { initializeClientCrypto } from "./init";
export type { CryptoInitResult } from "./init";

// Bootstrap
export { verifyWithRecoveryKey, validateRecoveryKey, checkCrossSigningStatus } from "./bootstrap";
export type { CrossSigningStatus } from "./bootstrap";
