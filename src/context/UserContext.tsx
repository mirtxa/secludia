import type { ReactNode } from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  UserContext,
  type UserContextValue,
  type UserProfile,
  type Presence,
} from "./UserContext.types";
import { useAuthContext } from "./useAuthContext";
import { useCryptoContext } from "./useCryptoContext";
import {
  getMatrixClient,
  getProfile,
  getSessionMetadata,
  getPresence,
  setPresenceWithVerification,
} from "@/lib/matrix";

export function UserContextProvider({ children }: { children: ReactNode }) {
  const { status, session } = useAuthContext();
  const { status: cryptoStatus } = useCryptoContext();
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [presence, setPresenceState] = useState<Presence>("offline");

  // Fetch user profile and presence only after crypto is ready.
  // This avoids premature REST calls during the pre-verification phase
  // (SecuritySetupGate blocks the main app until crypto is "ready" anyway).
  useEffect(() => {
    const syncUserProfile = async () => {
      if (status === "authenticated" && session && cryptoStatus === "ready") {
        const client = getMatrixClient();

        // Get current presence from server (don't set it without user consent)
        if (client) {
          const currentPresence = await getPresence(client, session.userId);
          setPresenceState(currentPresence);
        }

        // Fetch user profile
        try {
          let displayName = session.userId;
          let avatarUrl: string | null = null;

          if (client) {
            const profile = await getProfile(client, session.userId);
            if (profile.displayname) {
              displayName = profile.displayname;
            }
            if (profile.avatar_url) {
              // Convert mxc:// URL to http URL
              avatarUrl = client.mxcUrlToHttp(profile.avatar_url, 128, 128, "crop") ?? null;
            }
          }

          // Get account management URL from stored session
          const storedSession = getSessionMetadata();

          setUserState({
            displayName,
            userId: session.userId,
            avatarUrl,
            homeserverUrl: session.homeserverUrl,
            accountManagementUrl: storedSession?.accountManagementUrl,
          });
        } catch {
          // If profile fetch fails, use basic info from session
          const storedSession = getSessionMetadata();
          setUserState({
            displayName: session.userId,
            userId: session.userId,
            avatarUrl: null,
            homeserverUrl: session.homeserverUrl,
            accountManagementUrl: storedSession?.accountManagementUrl,
          });
        }
      } else if (status === "unauthenticated") {
        setUserState(null);
        setPresenceState("offline");
      }
    };

    syncUserProfile();
  }, [status, session, cryptoStatus]);

  const setUser = useCallback((newUser: UserProfile | null) => {
    setUserState(newUser);
  }, []);

  const setPresence = useCallback(
    async (newPresence: Presence): Promise<boolean> => {
      const client = getMatrixClient();
      if (!client || !session) {
        return false;
      }
      setPresenceState(newPresence);

      const result = await setPresenceWithVerification(client, session.userId, newPresence);

      if (!result.success) {
        setPresenceState(result.actualPresence);
        return false;
      }

      return true;
    },
    [session]
  );

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
