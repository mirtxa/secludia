/**
 * Safely stops all tracks on a MediaStream and cleans up the reference.
 * @param stream - The MediaStream to stop, or null
 * @returns null for easy assignment back to the ref
 */
export function stopMediaStream(stream: MediaStream | null): null {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
  return null;
}

/**
 * Safely closes an AudioContext and cleans up the reference.
 * @param audioContext - The AudioContext to close, or null
 * @returns null for easy assignment back to the ref
 */
export function closeAudioContext(audioContext: AudioContext | null): null {
  if (audioContext) {
    audioContext.close().catch(() => {});
  }
  return null;
}

/**
 * Convert pixel height to resolution label (e.g., 720 -> "720p", 2160 -> "4K")
 */
export function heightToResolutionLabel(height: number): string {
  if (height >= 2160) return "4K";
  if (height >= 1440) return "1440p";
  if (height >= 1080) return "1080p";
  if (height >= 720) return "720p";
  if (height >= 480) return "480p";
  return `${height}p`;
}

/**
 * Get actual resolution and frame rate from a MediaStream's video track.
 * Returns null if stream is null or has no video track.
 */
export function getStreamInfo(
  stream: MediaStream | null
): { resolution: string; fps: number | null } | null {
  if (!stream) return null;
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) return null;
  const settings = videoTrack.getSettings();
  if (settings.height) {
    return {
      resolution: heightToResolutionLabel(settings.height),
      fps: settings.frameRate ? Math.round(settings.frameRate) : null,
    };
  }
  return null;
}
