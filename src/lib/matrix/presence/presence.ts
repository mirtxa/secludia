/**
 * Presence management for Matrix
 */

import type { MatrixClient } from "matrix-js-sdk";

export type Presence = "online" | "offline" | "unavailable";

export interface SetPresenceResult {
  /** Whether the presence was successfully changed */
  success: boolean;
  /** The actual presence state from the server */
  actualPresence: Presence;
}

/**
 * Get current presence from the Matrix server.
 */
export async function getPresence(client: MatrixClient, userId: string): Promise<Presence> {
  try {
    const presenceState = await client.getPresence(userId);
    return presenceState.presence as Presence;
  } catch {
    return "unavailable";
  }
}

/**
 * Set presence and verify it was actually applied.
 * Some servers (like matrix.org) accept presence requests but silently ignore them.
 * Returns the actual presence state from the server.
 */
export async function setPresenceWithVerification(
  client: MatrixClient,
  userId: string,
  newPresence: Presence
): Promise<SetPresenceResult> {
  try {
    await client.setPresence({ presence: newPresence });
    const actualPresence = await getPresence(client, userId);
    return {
      success: actualPresence === newPresence,
      actualPresence,
    };
  } catch {
    // If PUT fails, get current presence
    const actualPresence = await getPresence(client, userId);
    return { success: false, actualPresence };
  }
}
