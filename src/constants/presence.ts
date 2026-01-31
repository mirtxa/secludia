import type { Presence } from "@/context";

export const PRESENCE_RING_COLORS: Record<Presence, string> = {
  online: "ring-[var(--presence-online)]",
  offline: "ring-[var(--presence-offline)]",
  unavailable: "ring-[var(--presence-unavailable)]",
};
