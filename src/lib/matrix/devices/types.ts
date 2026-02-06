/**
 * Device management types
 */

import type { IMyDevice } from "matrix-js-sdk";

/**
 * Verification status for a device.
 */
export type VerificationStatus = "verified" | "unverified" | "unknown";

/**
 * Normalized device info for UI consumption.
 */
export interface Device {
  /** Device ID */
  deviceId: string;
  /** Display name (may be undefined) */
  displayName?: string;
  /** Last seen IP address */
  lastSeenIp?: string;
  /** Last seen timestamp (ms since epoch) */
  lastSeenTs?: number;
  /** User agent string */
  userAgent?: string;
  /** Whether this is the current device */
  isCurrent: boolean;
  /** Verification status (requires crypto to be initialized) */
  verificationStatus: VerificationStatus;
}

/**
 * Device type inferred from user agent or display name.
 */
export type DeviceType = "mobile" | "desktop" | "web" | "unknown";

/**
 * Convert SDK device to our normalized format.
 * Verification status defaults to "unknown" and should be populated separately.
 */
export function toDevice(
  device: IMyDevice,
  currentDeviceId: string,
  verificationStatus: VerificationStatus = "unknown"
): Device {
  return {
    deviceId: device.device_id,
    displayName: device.display_name,
    lastSeenIp: device.last_seen_ip,
    lastSeenTs: device.last_seen_ts,
    userAgent: device.last_seen_user_agent || device["org.matrix.msc3852.last_seen_user_agent"],
    isCurrent: device.device_id === currentDeviceId,
    verificationStatus,
  };
}

/**
 * Infer device type from user agent or display name.
 */
export function inferDeviceType(device: Device): DeviceType {
  const ua = device.userAgent?.toLowerCase() || "";
  const name = device.displayName?.toLowerCase() || "";

  // Check user agent first (more reliable)
  if (ua) {
    if (
      ua.includes("android") ||
      ua.includes("iphone") ||
      ua.includes("ipad") ||
      ua.includes("mobile")
    ) {
      return "mobile";
    }
    if (ua.includes("electron") || ua.includes("tauri") || ua.includes("desktop")) {
      return "desktop";
    }
    if (
      ua.includes("mozilla") ||
      ua.includes("chrome") ||
      ua.includes("firefox") ||
      ua.includes("safari")
    ) {
      return "web";
    }
  }

  // Fall back to display name
  if (name) {
    if (
      name.includes("android") ||
      name.includes("iphone") ||
      name.includes("ipad") ||
      name.includes("ios") ||
      name.includes("mobile")
    ) {
      return "mobile";
    }
    if (name.includes("desktop") || name.includes("electron") || name.includes("secludia")) {
      return "desktop";
    }
    if (
      name.includes("web") ||
      name.includes("browser") ||
      name.includes("chrome") ||
      name.includes("firefox")
    ) {
      return "web";
    }
  }

  return "unknown";
}
