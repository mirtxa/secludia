/**
 * Platform abstraction layer
 * Defines interfaces that each platform (Tauri, Web) must implement
 */

import type { TokenSet } from "@/lib/matrix";

/**
 * Token storage interface
 * Tauri: Stronghold (encrypted)
 * Web: Memory only (cleared on refresh)
 */
export interface TokenStorage {
  store(tokens: TokenSet): Promise<void>;
  get(): Promise<TokenSet | null>;
  clear(): Promise<void>;
}

/**
 * OAuth window interface
 * Tauri: WebView window with navigation interception
 * Web: Popup window with postMessage
 */
export interface OAuthWindow {
  /**
   * Open OAuth authorization URL and wait for callback
   * @param url - Authorization URL to open
   * @returns Callback URL with authorization code
   * @throws Error with code "OAUTH_CANCELLED" if user closes window
   * @throws Error with code "OAUTH_TIMEOUT" if timeout elapsed
   */
  open(url: string): Promise<string>;
}

/**
 * Permissions interface
 * Platform-specific permission management
 */
export interface PlatformPermissions {
  /**
   * Reset WebView permissions (Tauri only)
   * On web, this is a no-op
   */
  resetWebViewPermissions(): Promise<void>;
}

/**
 * Platform interface
 * Each platform exports a default implementation of this interface
 */
export interface Platform {
  /** Whether running in Tauri desktop app */
  isTauri: boolean;

  /** Whether running in web browser */
  isWeb: boolean;

  /** Token storage implementation */
  storage: TokenStorage;

  /** OAuth window implementation */
  oauth: OAuthWindow;

  /** Permission management */
  permissions: PlatformPermissions;
}
