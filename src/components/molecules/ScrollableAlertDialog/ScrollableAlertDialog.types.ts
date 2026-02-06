import type { ReactNode } from "react";

export type ScrollableAlertDialogVariant = "default" | "accent" | "success" | "warning" | "danger";

export interface ScrollableAlertDialogButton {
  key: string;
  label: string;
  variant?: "primary" | "secondary" | "tertiary" | "danger" | "ghost";
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export interface ScrollableAlertDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClose?: () => void;
  variant?: ScrollableAlertDialogVariant;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  buttons?: ScrollableAlertDialogButton[];
  children: ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "cover";
  isDismissable?: boolean;
  isKeyboardDismissDisabled?: boolean;
}
