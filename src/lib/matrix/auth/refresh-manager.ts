/**
 * Token Refresh Manager
 * Provides a tokenRefreshFunction for matrix-js-sdk and handles proactive refresh scheduling.
 *
 * Note: Retry/backoff/mutex logic is handled by matrix-js-sdk's HTTP layer.
 * This module only handles:
 * - Token storage interaction (platform abstraction)
 * - Proactive refresh scheduling (optimization - SDK only does eager pre-request refresh)
 */

import type { TokenSet } from "../types";
import type { TokenStorage } from "@/platforms/types";
import type { AccessTokens } from "matrix-js-sdk";
import { refreshAccessToken } from "./tokens";

/** Callback when tokens are refreshed (for UI updates) */
export type OnTokensRefreshed = (tokens: TokenSet) => void;

/** Configuration for the refresh manager */
export interface RefreshManagerConfig {
  /** OAuth token endpoint */
  tokenEndpoint: string;
  /** Client ID for OAuth */
  clientId: string;
  /** Token storage implementation */
  storage: TokenStorage;
  /** Callback when tokens are refreshed successfully (optional, for UI updates) */
  onTokensRefreshed?: OnTokensRefreshed;
}

/**
 * Refresh manager for token lifecycle.
 * Provides tokenRefreshFunction for SDK and proactive refresh scheduling.
 */
class RefreshManager {
  private config: RefreshManagerConfig | null = null;
  private proactiveTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initialize the refresh manager with configuration.
   */
  initialize(config: RefreshManagerConfig): void {
    this.config = config;
  }

  /**
   * Check if the manager is initialized.
   */
  isInitialized(): boolean {
    return this.config !== null;
  }

  /**
   * Clear configuration and cancel any pending refresh.
   */
  clear(): void {
    this.cancelProactiveRefresh();
    this.config = null;
  }

  /**
   * Get the token refresh function for matrix-js-sdk.
   * This is passed to createClient({ tokenRefreshFunction: ... })
   *
   * Note: SDK handles retry/backoff/mutex - this just does the OAuth call.
   */
  getTokenRefreshFunction(): ((refreshToken: string) => Promise<AccessTokens>) | undefined {
    if (!this.config) {
      return undefined;
    }

    const { tokenEndpoint, clientId, storage, onTokensRefreshed } = this.config;

    return async (refreshToken: string): Promise<AccessTokens> => {
      // Perform the OAuth token refresh
      const tokens = await refreshAccessToken(tokenEndpoint, refreshToken, clientId);

      // Store new tokens in platform storage
      await storage.store(tokens);

      // Notify listeners (for UI updates)
      onTokensRefreshed?.(tokens);

      // Schedule next proactive refresh
      this.scheduleProactiveRefresh(tokens.expiresAt);

      // Return in SDK's expected format
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? undefined,
        expiry: new Date(tokens.expiresAt),
      };
    };
  }

  /**
   * Schedule a proactive refresh before token expiry.
   * This is an optimization - SDK does eager pre-request refresh,
   * but proactive refresh prevents any delay on the first request after expiry.
   *
   * @param expiresAt - Token expiration timestamp
   * @param bufferMs - How many ms before expiry to refresh (default 60000 = 1 min)
   */
  scheduleProactiveRefresh(expiresAt: number, bufferMs = 60_000): void {
    this.cancelProactiveRefresh();

    if (!this.config) return;

    const refreshTime = expiresAt - Date.now() - bufferMs;

    if (refreshTime <= 0) {
      // Token already expired or about to - SDK will handle refresh on next request
      return;
    }

    const { tokenEndpoint, clientId, storage, onTokensRefreshed } = this.config;

    this.proactiveTimer = setTimeout(async () => {
      try {
        // Get current refresh token from storage
        const currentTokens = await storage.get();
        if (!currentTokens?.refreshToken) {
          return;
        }

        // Perform refresh
        const newTokens = await refreshAccessToken(
          tokenEndpoint,
          currentTokens.refreshToken,
          clientId
        );

        // Store new tokens
        await storage.store(newTokens);

        // Notify listeners
        onTokensRefreshed?.(newTokens);

        // Schedule next refresh
        this.scheduleProactiveRefresh(newTokens.expiresAt, bufferMs);
      } catch (error) {
        // Proactive refresh failed - SDK will handle on next request
        if (import.meta.env.DEV) {
          console.warn("Proactive token refresh failed:", error);
        }
      }
    }, refreshTime);
  }

  /**
   * Cancel any scheduled proactive refresh.
   */
  cancelProactiveRefresh(): void {
    if (this.proactiveTimer !== null) {
      clearTimeout(this.proactiveTimer);
      this.proactiveTimer = null;
    }
  }
}

// Export singleton instance
export const refreshManager = new RefreshManager();
