/**
 * Custom error classes for Matrix operations
 */

/** Custom error class for Matrix operations */
export class MatrixAuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = "MatrixAuthError";
  }
}

/** Custom error class for discovery failures */
export class DiscoveryError extends Error {
  constructor(
    message: string,
    public readonly stage: "wellknown" | "versions" | "auth_metadata"
  ) {
    super(message);
    this.name = "DiscoveryError";
  }
}

/** Custom error class for OAuth failures */
export class OAuthFlowError extends Error {
  constructor(
    message: string,
    public readonly oauthError?: string,
    public readonly oauthDescription?: string,
    /** HTTP status code (for retry logic) */
    public readonly httpStatus?: number,
    /** Retry-After header value (for 429 responses) */
    public readonly retryAfter?: string
  ) {
    super(message);
    this.name = "OAuthFlowError";
  }
}
