import { useCallback, useRef } from "react";
import { isTauri } from "@tauri-apps/api/core";
import type { Window } from "@tauri-apps/api/window";

export function useTauriWindow() {
  const windowRef = useRef<Window | null>(null);

  const getWindow = useCallback(async (): Promise<Window | null> => {
    if (!isTauri()) return null;
    if (!windowRef.current) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      windowRef.current = getCurrentWindow();
    }
    return windowRef.current;
  }, []);

  const minimize = useCallback(async () => {
    try {
      const window = await getWindow();
      await window?.minimize();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to minimize window:", error);
    }
  }, [getWindow]);

  const toggleMaximize = useCallback(async () => {
    try {
      const window = await getWindow();
      await window?.toggleMaximize();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to toggle maximize:", error);
    }
  }, [getWindow]);

  const close = useCallback(async () => {
    try {
      const window = await getWindow();
      await window?.close();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Failed to close window:", error);
    }
  }, [getWindow]);

  return { minimize, toggleMaximize, close };
}
