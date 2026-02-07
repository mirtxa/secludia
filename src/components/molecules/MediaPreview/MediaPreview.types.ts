import type { ReactNode } from "react";
import type { MediaType } from "@/context";

export interface MediaPreviewProps {
  /** Type of media to preview */
  type: MediaType;
  /** Label for the MediaRegistry (e.g., "Video Settings") */
  source: string;
  /** Function that returns media constraints */
  constraints: () => MediaStreamConstraints;
  /** Dependencies that should trigger stream restart when changed */
  restartDeps: unknown[];
  /** Translation key for start button */
  startLabel: string;
  /** Translation key for stop button */
  stopLabel: string;
  /** Icon to show on start button */
  startIcon: ReactNode;
  /** Whether video should cover or contain */
  objectFit?: "cover" | "contain";
  /** Whether to show fullscreen button (screen share only) */
  showFullscreenButton?: boolean;
  /** Custom handler for audio track changes (screen share only).
   *  Return true if the change was handled (skip restart), false to trigger a full restart. */
  onAudioTrackChange?: (stream: MediaStream, enabled: boolean) => boolean;
}
