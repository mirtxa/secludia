import type { ReactNode } from "react";

export interface StatusMessageScreenProps {
  /** Icon to display */
  icon: ReactNode;
  /** Tailwind color class for the icon (e.g., "text-danger", "text-warning") */
  iconColor: string;
  /** Main title */
  title: string;
  /** Description message */
  message: string;
  /** Additional hint text */
  hint: string;
}
