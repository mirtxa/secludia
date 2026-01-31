import type { ReactNode } from "react";
import { useState, useCallback, useMemo } from "react";
import { MOCK_USER } from "@/mocks";
import {
  UserContext,
  type UserContextValue,
  type UserProfile,
  type Presence,
} from "./UserContext.types";

export function UserContextProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(MOCK_USER);
  const [presence, setPresenceState] = useState<Presence>("online");

  const setUser = useCallback((newUser: UserProfile | null) => {
    setUserState(newUser);
  }, []);

  const setPresence = useCallback((newPresence: Presence) => {
    // TODO: Update presence on Matrix server
    setPresenceState(newPresence);
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({
      user,
      presence,
      setPresence,
      setUser,
    }),
    [user, presence, setPresence, setUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
