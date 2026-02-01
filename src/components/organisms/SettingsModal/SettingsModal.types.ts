import type { UseOverlayStateReturn } from "@heroui/react";

export type SettingsSection =
  | "account"
  | "sessions"
  | "appearance"
  | "notifications"
  | "security"
  | "encryption";

export interface SettingsModalProps {
  state: UseOverlayStateReturn;
}
