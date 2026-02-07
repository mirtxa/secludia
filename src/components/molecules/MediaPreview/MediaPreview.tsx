import { memo, useCallback, useEffect, useRef } from "react";
import { ArrowsExpand, CirclePlay, Display } from "@gravity-ui/icons";
import { Button, Card, Chip } from "@heroui/react";
import { useAppContext } from "@/context";
import { useMediaStream } from "@/hooks";
import { cn } from "@/utils";
import { getStreamInfo } from "@/utils/media";
import type { MediaPreviewProps } from "./MediaPreview.types";

/**
 * Reusable media preview component for camera and screen sharing.
 * Handles stream management, preview display, resolution/FPS chips, and error states.
 */
export const MediaPreview = memo(function MediaPreview({
  type,
  source,
  constraints,
  restartDeps,
  startLabel,
  stopLabel,
  startIcon,
  objectFit = "cover",
  showFullscreenButton = false,
  onAudioTrackChange,
}: MediaPreviewProps) {
  const { t } = useAppContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Use centralized media access hook - registers with MediaRegistry for privacy indicator
  const { stream, isActive, error, start, stop } = useMediaStream({
    type,
    source,
    constraints,
  });

  // Sync stream to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Derive actual resolution and frame rate from stream
  const streamInfo = getStreamInfo(stream);

  // Track whether stream was active to know if we need to restart
  const wasActiveRef = useRef(false);
  useEffect(() => {
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Track previous deps to detect changes
  const prevDepsRef = useRef(restartDeps);

  // Restart stream when deps change (only if currently active)
  useEffect(() => {
    const prev = prevDepsRef.current;
    const changed = restartDeps.some((dep, i) => dep !== prev[i]);

    prevDepsRef.current = restartDeps;

    if (changed && wasActiveRef.current) {
      // For screen share with audio track change callback, handle specially
      if (onAudioTrackChange && stream) {
        // Check if only audio changed (last dep is typically captureAudio)
        const audioIndex = restartDeps.length - 1;
        const audioChanged = restartDeps[audioIndex] !== prev[audioIndex];
        const otherChanged = restartDeps.slice(0, -1).some((dep, i) => dep !== prev[i]);

        if (audioChanged && !otherChanged) {
          const handled = onAudioTrackChange(stream, Boolean(restartDeps[audioIndex]));
          if (handled) return;
        }
      }

      stop();
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, restartDeps);

  const handleClick = useCallback(() => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  }, [isActive, start, stop]);

  const handleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  }, []);

  return (
    <Card className="overflow-hidden p-0" variant="secondary">
      <Card.Content className="relative aspect-video p-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "h-full w-full",
            objectFit === "contain" ? "object-contain" : "object-cover"
          )}
        />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary">
            <Button variant="primary" onPress={handleClick}>
              {startIcon}
              {t(startLabel as Parameters<typeof t>[0])}
            </Button>
          </div>
        )}
        {isActive && (
          <>
            {streamInfo && (
              <div className="absolute top-2 left-2 flex gap-2">
                <Chip size="sm" className="px-2">
                  <Display className="size-3" />
                  {streamInfo.resolution}
                </Chip>
                {streamInfo.fps && (
                  <Chip size="sm" className="px-2">
                    <CirclePlay className="size-3" />
                    {streamInfo.fps} fps
                  </Chip>
                )}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <Button variant="tertiary" size="sm" onPress={handleClick}>
                {t(stopLabel as Parameters<typeof t>[0])}
              </Button>
            </div>
            {showFullscreenButton && (
              <div className="absolute right-2 bottom-2">
                <Button variant="tertiary" size="sm" isIconOnly onPress={handleFullscreen}>
                  <ArrowsExpand className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary/90">
            <span className="text-sm text-danger">{error.message}</span>
          </div>
        )}
      </Card.Content>
    </Card>
  );
});
