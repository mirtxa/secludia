import { useState, useEffect } from "react";

/**
 * Hook that returns true if the media query matches
 * @param query - CSS media query string (e.g., "(min-width: 640px)")
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Tailwind breakpoints
export const BREAKPOINTS = {
  sm: "(min-width: 640px)",
  md: "(min-width: 768px)",
  lg: "(min-width: 1024px)",
  xl: "(min-width: 1280px)",
  "2xl": "(min-width: 1536px)",
} as const;

/**
 * Hook that returns true if viewport is at or above the specified breakpoint
 */
export function useBreakpoint(
  breakpoint: keyof typeof BREAKPOINTS
): boolean {
  return useMediaQuery(BREAKPOINTS[breakpoint]);
}
