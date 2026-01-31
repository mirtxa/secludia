import type { HTMLAttributes, ReactNode } from "react";

export interface ScrollbarProps extends Pick<HTMLAttributes<HTMLElement>, "role" | "aria-label"> {
  children?: ReactNode;
  className?: string;
}
