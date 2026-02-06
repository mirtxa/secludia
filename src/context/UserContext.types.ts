import { createContext } from "react";
import type { Presence } from "@/lib/matrix";

export type { Presence };

export interface UserProfile {
  /** Display name from Matrix profile, falls back to userId */
  displayName: string;
  /** Full Matrix user ID (e.g., @mirtxa:matrix.org) */
  userId: string;
  avatarUrl: string | null;
  homeserverUrl: string;
  accountManagementUrl?: string;
}

export interface UserContextValue {
  user: UserProfile | null;
  presence: Presence;
  /** Set presence and verify with server. Returns true if successful. */
  setPresence: (presence: Presence) => Promise<boolean>;
  setUser: (user: UserProfile | null) => void;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);
