import { useContext, useEffect, useId } from "react";
import {
  MediaRegistryContext,
  type MediaType,
  type MediaRegistryContextValue,
} from "./MediaRegistryContext.types";

/**
 * Hook to access the MediaRegistry context.
 * Provides methods to register/unregister media usage and check active media.
 */
export function useMediaRegistryContext(): MediaRegistryContextValue {
  const context = useContext(MediaRegistryContext);
  if (!context) {
    throw new Error("useMediaRegistryContext must be used within a MediaRegistryProvider");
  }
  return context;
}

/**
 * Hook to register a media usage that automatically unregisters on unmount.
 *
 * @param type - The type of media (microphone, camera, screen)
 * @param source - Human-readable description of where the media is being used
 * @param isActive - Whether the media is currently active (controls registration)
 *
 * @example
 * ```tsx
 * // Register when recording is active
 * useMediaRegistration("microphone", "Voice Message", isRecording);
 *
 * // Register when component mounts (always active)
 * useMediaRegistration("microphone", "Voice Settings", true);
 * ```
 */
export function useMediaRegistration(type: MediaType, source: string, isActive: boolean): void {
  const { registerMedia, unregisterMedia } = useMediaRegistryContext();
  const id = useId();

  useEffect(() => {
    if (isActive) {
      const unregister = registerMedia(id, type, source);
      return unregister;
    } else {
      unregisterMedia(id);
    }
  }, [id, type, source, isActive, registerMedia, unregisterMedia]);

  // Cleanup on unmount
  useEffect(() => {
    return () => unregisterMedia(id);
  }, [id, unregisterMedia]);
}
