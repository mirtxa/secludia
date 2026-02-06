/**
 * Device management for Matrix
 *
 * Note: Device deletion is not supported when using OAuth 2.0 authentication.
 * The Matrix spec states: "When this endpoint requires User-Interactive Authentication,
 * it cannot be used when the access token was obtained via the OAuth 2.0 API."
 * Users should use the account management URL to manage their sessions.
 */

import type { MatrixClient } from "matrix-js-sdk";
import { DeviceVerification } from "matrix-js-sdk/lib/models/device";
import type { Device, VerificationStatus } from "./types";
import { toDevice } from "./types";

/**
 * Convert DeviceVerification enum to VerificationStatus.
 * DeviceVerification: Blocked=-1, Unverified=0, Verified=1
 */
function toVerificationStatus(verification: DeviceVerification): VerificationStatus {
  switch (verification) {
    case DeviceVerification.Verified:
      return "verified";
    case DeviceVerification.Unverified:
    case DeviceVerification.Blocked:
      return "unverified";
    default:
      return "unknown";
  }
}

/**
 * Get all devices for the current user.
 * Uses getUserDeviceInfo() to batch-fetch verification status in a single query.
 */
export async function getDevices(client: MatrixClient, currentDeviceId: string): Promise<Device[]> {
  const response = await client.getDevices();
  const userId = client.getUserId();

  // Build a map of deviceId -> verification status using batch query
  const verificationMap = new Map<string, VerificationStatus>();

  if (userId) {
    const crypto = client.getCrypto();
    if (crypto) {
      try {
        // getUserDeviceInfo returns DeviceMap: Map<userId, Map<deviceId, Device>>
        const deviceMap = await crypto.getUserDeviceInfo([userId]);
        const userDevices = deviceMap.get(userId);

        if (userDevices) {
          for (const [deviceId, cryptoDevice] of userDevices) {
            verificationMap.set(deviceId, toVerificationStatus(cryptoDevice.verified));
          }
        }
      } catch {
        // Crypto not initialized or query failed - all devices will be "unknown"
      }
    }
  }

  // Map API devices to our Device type, looking up verification from batch result
  const devices = response.devices.map((d) => {
    const verificationStatus = verificationMap.get(d.device_id) ?? "unknown";
    return toDevice(d, currentDeviceId, verificationStatus);
  });

  return devices;
}

/**
 * Update a device's display name.
 */
export async function updateDeviceDisplayName(
  client: MatrixClient,
  deviceId: string,
  displayName: string
): Promise<void> {
  await client.setDeviceDetails(deviceId, { display_name: displayName });
}
