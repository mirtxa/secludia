/**
 * Validates a homeserver hostname/URL
 * Returns the sanitized hostname or null if invalid
 */
export function validateHomeserver(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Remove protocol if provided (we'll add https:// ourselves)
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, ""); // Remove trailing slashes

  if (!withoutProtocol) return null;

  // Hostname regex: valid domain with optional port
  // Allows: matrix.org, my-server.com, localhost:8008, 192.168.1.1:8448
  // Requires at least one dot for domains (except localhost and IP addresses)
  const hostnameRegex =
    /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost|(?:\d{1,3}\.){3}\d{1,3})(?::\d{1,5})?$/;

  if (!hostnameRegex.test(withoutProtocol)) {
    return null;
  }

  // Additional security checks
  // Block obviously malicious patterns
  const suspicious = [/javascript:/i, /data:/i, /<script/i, /\.\./, /[<>"'`]/];

  for (const pattern of suspicious) {
    if (pattern.test(withoutProtocol)) {
      return null;
    }
  }

  return withoutProtocol;
}

/**
 * Builds a full homeserver URL from a validated hostname
 */
export function buildHomeserverUrl(hostname: string): string {
  return `https://${hostname}`;
}
