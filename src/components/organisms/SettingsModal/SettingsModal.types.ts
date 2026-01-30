export type SettingsSection =
  | "account"
  | "sessions"
  | "appearance"
  | "notifications"
  | "security"
  | "encryption";

export interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}
