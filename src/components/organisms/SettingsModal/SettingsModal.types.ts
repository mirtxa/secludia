import type { UseOverlayStateReturn } from "@heroui/react";

export type SettingsSection =
  | "account"
  | "sessions"
  | "appearance"
  | "notifications"
  | "audio"
  | "voice"
  | "video"
  | "screenSharing"
  | "security"
  | "encryption";

export interface SettingsModalProps {
  state: UseOverlayStateReturn;
}
