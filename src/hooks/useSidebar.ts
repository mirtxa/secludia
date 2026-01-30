import { useState, useCallback, useEffect } from "react";
import { BREAKPOINTS } from "./useMediaQuery";

interface UseSidebarReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Hook for managing sidebar state with automatic close on breakpoint change.
 * Closes sidebar when viewport crosses the `sm` breakpoint (640px).
 */
export function useSidebar(): UseSidebarReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const mediaQuery = window.matchMedia(BREAKPOINTS.sm);

    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsOpen(false);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return { isOpen, open, close };
}
