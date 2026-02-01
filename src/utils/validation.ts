/** Suspicious patterns to block in URLs */
const SUSPICIOUS_PATTERNS = [/javascript:/i, /data:/i, /<script/i, /\.\./, /[<>"'`]/];

/**
 * Validates an IP address (each octet must be 0-255)
 */
function isValidIpAddress(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Validates a port number (1-65535)
 */
function isValidPort(port: string): boolean {
  const num = parseInt(port, 10);
  return !isNaN(num) && num >= 1 && num <= 65535;
}

/**
 * Validates a homeserver hostname/URL
 * Returns the sanitized hostname or null if invalid
 */
export function validateHomeserver(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Remove protocol if provided (we'll add https:// ourselves)
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  if (!withoutProtocol) return null;

  // Block suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(withoutProtocol)) {
      return null;
    }
  }

  // Split host and port
  const [host, port] = withoutProtocol.split(":");

  // Validate port if present
  if (port !== undefined && !isValidPort(port)) {
    return null;
  }

  // Check if it's an IP address
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    if (!isValidIpAddress(host)) {
      return null;
    }
    return withoutProtocol;
  }

  // Check if it's localhost
  if (host === "localhost") {
    return withoutProtocol;
  }

  // Validate domain name
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(host)) {
    return null;
  }

  return withoutProtocol;
}

/**
 * Builds a full homeserver URL from a validated hostname
 */
export function buildHomeserverUrl(hostname: string): string {
  return `https://${hostname}`;
}

/**
 * Validates an image URL (only allows http/https protocols)
 * Returns true if the URL is safe to use as an image source
 */
export function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    // Block suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(url)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely opens a URL in a new tab with security measures
 * Only opens http/https URLs and adds noopener/noreferrer
 */
export function safeOpenUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    // Block suspicious patterns
    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(url)) {
        return false;
      }
    }
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  } catch {
    return false;
  }
}
