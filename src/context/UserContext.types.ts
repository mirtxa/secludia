import { createContext } from "react";

export type Presence = "online" | "offline" | "unavailable";

export interface UserProfile {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  homeserverUrl: string;
}

export interface UserContextValue {
  user: UserProfile | null;
  presence: Presence;
  setPresence: (presence: Presence) => void;
  setUser: (user: UserProfile | null) => void;
}

export const UserContext = createContext<UserContextValue | undefined>(undefined);
