import { useCallback, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";

interface Attachment {
  id: string;
  url: string;
}

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  largeBody?: string;
  attachments?: Attachment[];
  silent?: boolean;
}

interface TauriNotificationAPI {
  isPermissionGranted: () => Promise<boolean>;
  requestPermission: () => Promise<"granted" | "denied" | "default">;
  sendNotification: (options: NotificationOptions) => void;
}

export const playNotificationSound = async () => {
  try {
    const audio = new Audio("/notification.wav");
    audio.volume = 0.5;
    await audio.play();
  } catch (error) {
    if (import.meta.env.DEV) console.error("Failed to play notification sound:", error);
  }
};

export function useNotification() {
  const apiRef = useRef<TauriNotificationAPI | null>(null);

  const getAPI = useCallback(async (): Promise<TauriNotificationAPI | null> => {
    if (isTauri()) {
      if (!apiRef.current) {
        const notification = await import("@tauri-apps/plugin-notification");
        apiRef.current = {
          isPermissionGranted: notification.isPermissionGranted,
          requestPermission: notification.requestPermission,
          sendNotification: notification.sendNotification,
        };
      }
      return apiRef.current;
    }
    return null;
  }, []);

  const isPermissionGranted = useCallback(async (): Promise<boolean> => {
    try {
      if (isTauri()) {
        const api = await getAPI();
        if (!api) return false;
        return await api.isPermissionGranted();
      }

      // Web fallback
      if ("Notification" in window) {
        return Notification.permission === "granted";
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to check notification permission:", error);
      return false;
    }
  }, [getAPI]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (isTauri()) {
        const api = await getAPI();
        if (!api) return false;
        const permission = await api.requestPermission();
        return permission === "granted";
      }

      // Web fallback
      if ("Notification" in window) {
        const result = await Notification.requestPermission();
        return result === "granted";
      }
      return false;
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to request notification permission:", error);
      return false;
    }
  }, [getAPI]);

  const sendNotification = useCallback(
    async (options: NotificationOptions): Promise<boolean> => {
      try {
        if (isTauri()) {
          const api = await getAPI();
          if (!api) return false;

          let hasPermission = await api.isPermissionGranted();
          if (!hasPermission) {
            const permission = await api.requestPermission();
            hasPermission = permission === "granted";
          }

          if (hasPermission) {
            api.sendNotification({ ...options });
            if (!options.silent) {
              await playNotificationSound();
            }
            return true;
          }
          return false;
        }

        // Web fallback
        if ("Notification" in window) {
          let hasPermission = Notification.permission === "granted";
          if (!hasPermission) {
            const result = await Notification.requestPermission();
            hasPermission = result === "granted";
          }

          if (hasPermission) {
            new Notification(options.title, {
              body: options.body ?? undefined,
              icon: options.icon ?? undefined,
              silent: options.silent ?? undefined,
            });
            if (!options.silent) {
              await playNotificationSound();
            }
            return true;
          }
        }
        return false;
      } catch (error) {
        if (import.meta.env.DEV) console.error("Failed to send notification:", error);
        return false;
      }
    },
    [getAPI]
  );

  const isSupported = useCallback(async (): Promise<boolean> => {
    if (isTauri()) return true;
    return "Notification" in window;
  }, []);

  return {
    isSupported,
    isPermissionGranted,
    requestPermission,
    sendNotification,
  };
}
