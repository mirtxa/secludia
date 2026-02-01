import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("focus", callback);
  window.addEventListener("blur", callback);
  return () => {
    window.removeEventListener("focus", callback);
    window.removeEventListener("blur", callback);
  };
}

function getSnapshot() {
  return document.hasFocus();
}

function getServerSnapshot() {
  return true;
}

export function useWindowFocus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function isWindowFocused(): boolean {
  return document.hasFocus();
}
