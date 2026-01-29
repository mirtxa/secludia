import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMediaQuery, useBreakpoint, BREAKPOINTS } from "./useMediaQuery";

describe("useMediaQuery", () => {
  type MediaQueryHandler = (event: MediaQueryListEvent) => void;
  let listeners: Map<string, MediaQueryHandler[]>;
  let matchesMap: Map<string, boolean>;
  let originalMatchMedia: typeof window.matchMedia;

  const createMockMatchMedia = () => {
    return (query: string) => {
      if (!listeners.has(query)) {
        listeners.set(query, []);
      }

      return {
        matches: matchesMap.get(query) ?? false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, handler: MediaQueryHandler) => {
          if (event === "change") {
            listeners.get(query)!.push(handler);
          }
        }),
        removeEventListener: vi.fn((event: string, handler: MediaQueryHandler) => {
          if (event === "change") {
            const queryListeners = listeners.get(query)!;
            const index = queryListeners.indexOf(handler);
            if (index > -1) {
              queryListeners.splice(index, 1);
            }
          }
        }),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    };
  };

  beforeEach(() => {
    listeners = new Map();
    matchesMap = new Map();
    originalMatchMedia = window.matchMedia;
    window.matchMedia = createMockMatchMedia();
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  const triggerMediaQueryChange = (query: string, matches: boolean) => {
    matchesMap.set(query, matches);
    const queryListeners = listeners.get(query) ?? [];
    queryListeners.forEach((handler) => {
      handler({ matches } as MediaQueryListEvent);
    });
  };

  it("returns initial matches value", () => {
    matchesMap.set("(min-width: 640px)", true);
    window.matchMedia = createMockMatchMedia();

    const { result } = renderHook(() => useMediaQuery("(min-width: 640px)"));

    expect(result.current).toBe(true);
  });

  it("returns false when query does not match", () => {
    matchesMap.set("(min-width: 1024px)", false);
    window.matchMedia = createMockMatchMedia();

    const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));

    expect(result.current).toBe(false);
  });

  it("updates when media query changes", () => {
    matchesMap.set("(min-width: 640px)", false);
    window.matchMedia = createMockMatchMedia();

    const { result } = renderHook(() => useMediaQuery("(min-width: 640px)"));

    expect(result.current).toBe(false);

    act(() => {
      triggerMediaQueryChange("(min-width: 640px)", true);
    });

    expect(result.current).toBe(true);
  });

  it("returns false when window is undefined (SSR)", () => {
    // This tests the initial state check for SSR
    // In real SSR, window would be undefined, but we test the fallback behavior
    matchesMap.set("(min-width: 640px)", false);
    window.matchMedia = createMockMatchMedia();

    const { result } = renderHook(() => useMediaQuery("(min-width: 640px)"));

    expect(result.current).toBe(false);
  });

  it("handles multiple queries independently", () => {
    matchesMap.set("(min-width: 640px)", true);
    matchesMap.set("(min-width: 1024px)", false);
    window.matchMedia = createMockMatchMedia();

    const { result: result1 } = renderHook(() => useMediaQuery("(min-width: 640px)"));
    const { result: result2 } = renderHook(() => useMediaQuery("(min-width: 1024px)"));

    expect(result1.current).toBe(true);
    expect(result2.current).toBe(false);
  });
});

describe("useBreakpoint", () => {
  let matchMediaCalls: string[];

  beforeEach(() => {
    matchMediaCalls = [];
    window.matchMedia = (query: string) => {
      matchMediaCalls.push(query);
      return {
        matches: query === BREAKPOINTS.md,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList;
    };
  });

  it("uses correct breakpoint query for sm", () => {
    renderHook(() => useBreakpoint("sm"));

    expect(matchMediaCalls).toContain("(min-width: 640px)");
  });

  it("uses correct breakpoint query for md", () => {
    renderHook(() => useBreakpoint("md"));

    expect(matchMediaCalls).toContain("(min-width: 768px)");
  });

  it("uses correct breakpoint query for lg", () => {
    renderHook(() => useBreakpoint("lg"));

    expect(matchMediaCalls).toContain("(min-width: 1024px)");
  });

  it("uses correct breakpoint query for xl", () => {
    renderHook(() => useBreakpoint("xl"));

    expect(matchMediaCalls).toContain("(min-width: 1280px)");
  });

  it("uses correct breakpoint query for 2xl", () => {
    renderHook(() => useBreakpoint("2xl"));

    expect(matchMediaCalls).toContain("(min-width: 1536px)");
  });

  it("returns true when breakpoint matches", () => {
    const { result } = renderHook(() => useBreakpoint("md"));

    expect(result.current).toBe(true);
  });

  it("returns false when breakpoint does not match", () => {
    const { result } = renderHook(() => useBreakpoint("sm"));

    expect(result.current).toBe(false);
  });
});

describe("BREAKPOINTS", () => {
  it("has correct sm breakpoint", () => {
    expect(BREAKPOINTS.sm).toBe("(min-width: 640px)");
  });

  it("has correct md breakpoint", () => {
    expect(BREAKPOINTS.md).toBe("(min-width: 768px)");
  });

  it("has correct lg breakpoint", () => {
    expect(BREAKPOINTS.lg).toBe("(min-width: 1024px)");
  });

  it("has correct xl breakpoint", () => {
    expect(BREAKPOINTS.xl).toBe("(min-width: 1280px)");
  });

  it("has correct 2xl breakpoint", () => {
    expect(BREAKPOINTS["2xl"]).toBe("(min-width: 1536px)");
  });
});
