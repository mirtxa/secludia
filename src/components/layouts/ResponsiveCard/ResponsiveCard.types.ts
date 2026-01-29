import type { ReactNode } from "react";

export interface ResponsiveCardProps {
  header: ReactNode;
  content: ReactNode;
  footer: ReactNode;
  /** Only shown on mobile, positioned above footer */
  bottomBar?: ReactNode;
}
