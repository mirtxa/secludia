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
    const window = await getWindow();
    await window?.minimize();
  }, [getWindow]);

  const toggleMaximize = useCallback(async () => {
    const window = await getWindow();
    await window?.toggleMaximize();
  }, [getWindow]);

  const close = useCallback(async () => {
    const window = await getWindow();
    await window?.close();
  }, [getWindow]);

  return { minimize, toggleMaximize, close };
}
