import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useMediaRegistry, type MediaType } from "@/context";

export interface UseMediaStreamOptions {
  /** Type of media being accessed */
  type: MediaType;
  /** Human-readable source description (e.g., "Voice Settings", "Voice Message") */
  source: string;
  /**
   * MediaStream constraints - can be static or a function that returns constraints.
   * Using a function allows reading fresh config values each time start() is called.
   */
  constraints: MediaStreamConstraints | (() => MediaStreamConstraints);
  /** Whether to start the stream immediately on mount (default: false) */
  autoStart?: boolean;
}

export interface UseMediaStreamResult {
  /** The active MediaStream, or null if not streaming */
  stream: MediaStream | null;
  /** Whether the stream is currently active */
  isActive: boolean;
  /** Whether the stream is being acquired */
  isLoading: boolean;
  /** Error if stream acquisition failed */
  error: Error | null;
  /** Start the media stream */
  start: () => Promise<MediaStream | null>;
  /** Stop the media stream and release resources */
  stop: () => void;
}

/**
 * Centralized hook for accessing media streams (microphone, camera, screen).
 *
 * **This is the ONLY approved way to access media in the app.**
 *
 * Using this hook ensures:
 * - Automatic registration with MediaRegistry (privacy indicator)
 * - Proper cleanup of tracks on unmount
 * - Consistent error handling
 *
 * @example
 * ```tsx
 * // For microphone access
 * const { stream, isActive, start, stop } = useMediaStream({
 *   type: "microphone",
 *   source: "Voice Message",
 *   constraints: { audio: { deviceId: "default" } },
 * });
 *
 * // Start when needed
 * const handleRecord = async () => {
 *   const stream = await start();
 *   if (stream) {
 *     // Use the stream
 *   }
 * };
 *
 * // Stop when done
 * const handleStop = () => stop();
 * ```
 */
export function useMediaStream({
  type,
  source,
  constraints,
  autoStart = false,
}: UseMediaStreamOptions): UseMediaStreamResult {
  const id = useId();
  const { registerMedia, unregisterMedia } = useMediaRegistry();

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to track if component is mounted (for async operations)
  const mountedRef = useRef(true);
  // Track the stream in a ref too for cleanup
  const streamRef = useRef<MediaStream | null>(null);
  // Track if a start operation is in progress to prevent race conditions
  const startingRef = useRef(false);
  // Store unregisterMedia in ref to avoid stale closure in cleanup
  const unregisterMediaRef = useRef(unregisterMedia);
  unregisterMediaRef.current = unregisterMedia;

  // Stop stream and cleanup
  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    unregisterMedia(id);
  }, [id, unregisterMedia]);

  // Start stream
  const start = useCallback(async (): Promise<MediaStream | null> => {
    // Already have a stream
    if (streamRef.current) {
      return streamRef.current;
    }

    // Prevent concurrent start operations (race condition in Strict Mode)
    if (startingRef.current) {
      return null;
    }
    startingRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      // Evaluate constraints if it's a function (allows reading fresh config)
      const resolvedConstraints = typeof constraints === "function" ? constraints() : constraints;
      const mediaStream = await navigator.mediaDevices.getUserMedia(resolvedConstraints);

      // Check if component unmounted while waiting
      if (!mountedRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return null;
      }

      // Check if another stream was acquired while we were waiting (race condition)
      if (streamRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return streamRef.current;
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);

      // Register with MediaRegistry - this makes the privacy indicator show
      registerMedia(id, type, source);

      // Listen for track ended events (e.g., user revokes permission)
      mediaStream.getTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (mountedRef.current) {
            stop();
          }
        });
      });

      return mediaStream;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to access media");
      if (mountedRef.current) {
        setError(error);
      }
      return null;
    } finally {
      startingRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [constraints, id, type, source, registerMedia, stop]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart, start]);

  // Cleanup on unmount only - use refs to avoid dependency changes triggering cleanup
  useEffect(() => {
    mountedRef.current = true;
    startingRef.current = false;

    return () => {
      mountedRef.current = false;
      startingRef.current = false;

      // Stop all tracks and unregister
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      unregisterMediaRef.current(id);
    };
  }, [id]);

  return {
    stream,
    isActive: stream !== null,
    isLoading,
    error,
    start,
    stop,
  };
}
