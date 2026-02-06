import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  MediaRegistryContext,
  type MediaType,
  type MediaUsage,
  type MediaRegistryContextValue,
} from "./MediaRegistryContext.types";

export function MediaRegistryProvider({ children }: { children: ReactNode }) {
  const [activeMedia, setActiveMedia] = useState<MediaUsage[]>([]);

  const registerMedia = useCallback((id: string, type: MediaType, source: string) => {
    setActiveMedia((prev) => {
      // Avoid duplicates
      if (prev.some((m) => m.id === id)) {
        return prev;
      }
      return [...prev, { id, type, source }];
    });

    // Return unregister function
    return () => {
      setActiveMedia((prev) => prev.filter((m) => m.id !== id));
    };
  }, []);

  const unregisterMedia = useCallback((id: string) => {
    setActiveMedia((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const isMediaTypeActive = useCallback(
    (type: MediaType) => activeMedia.some((m) => m.type === type),
    [activeMedia]
  );

  const value = useMemo(
    (): MediaRegistryContextValue => ({
      activeMedia,
      registerMedia,
      unregisterMedia,
      hasActiveMedia: activeMedia.length > 0,
      isMediaTypeActive,
    }),
    [activeMedia, registerMedia, unregisterMedia, isMediaTypeActive]
  );

  return <MediaRegistryContext.Provider value={value}>{children}</MediaRegistryContext.Provider>;
}
