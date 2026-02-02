import { createContext } from "react";

export type MediaType = "microphone" | "camera" | "screen";

export interface MediaUsage {
  id: string;
  type: MediaType;
  /** Human-readable source description (e.g., "Voice Settings", "Voice Message") */
  source: string;
}

export interface MediaRegistryContextValue {
  /** Currently active media usages */
  activeMedia: MediaUsage[];
  /** Register a media usage - returns an unregister function */
  registerMedia: (id: string, type: MediaType, source: string) => () => void;
  /** Unregister a media usage by ID */
  unregisterMedia: (id: string) => void;
  /** Check if any media is active */
  hasActiveMedia: boolean;
  /** Check if a specific media type is active */
  isMediaTypeActive: (type: MediaType) => boolean;
}

export const MediaRegistryContext = createContext<MediaRegistryContextValue | null>(null);
