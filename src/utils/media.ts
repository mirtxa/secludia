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
