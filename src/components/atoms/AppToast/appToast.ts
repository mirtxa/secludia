import type { ToastContentValue } from "@heroui/react";

import { ToastQueue } from "@heroui/react";
import { getToastDuration } from "@/config/localStorage";
import { playNotificationSound } from "@/hooks";

export interface AppToastContent extends Omit<ToastContentValue, "variant"> {
  variant?: ToastContentValue["variant"];
  avatarUrl?: string;
  silent?: boolean;
  timeout?: number;
}

export const appToastQueue = new ToastQueue<AppToastContent>({ maxVisibleToasts: 1 });

export function appToast(title: string, options?: Omit<AppToastContent, "title">) {
  if (!options?.silent) {
    playNotificationSound();
  }
  const timeout = getToastDuration() * 1000;
  appToastQueue.clear();
  appToastQueue.add(
    {
      title,
      timeout,
      ...options,
    },
    { timeout }
  );
}

appToast.clear = () => appToastQueue.clear();
