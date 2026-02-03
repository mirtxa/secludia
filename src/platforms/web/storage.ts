/**
 * Web memory-only token storage
 * Tokens are cleared on page refresh (secure default)
 */

import type { TokenSet } from "@/lib/matrix";
import type { TokenStorage } from "../types";

// In-memory storage (tokens cleared on page refresh)
let memoryTokens: TokenSet | null = null;

/**
 * Memory-only token storage implementation
 */
export const storage: TokenStorage = {
  async store(tokens: TokenSet): Promise<void> {
    memoryTokens = tokens;
  },

  async get(): Promise<TokenSet | null> {
    return memoryTokens;
  },

  async clear(): Promise<void> {
    memoryTokens = null;
  },
};
