import type { ReactNode } from "react";

export interface NavBarButtonProps {
  label: string;
  selected?: boolean;
  showIndicator?: boolean;
  children: ReactNode;
  onPress?: () => void;
}
