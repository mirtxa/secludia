import type { ReactNode } from "react";

export interface SelectOption<T extends string> {
  key: T;
  label: string;
}

export interface SelectDropdownProps<T extends string> {
  /** Icon displayed in the trigger */
  icon: ReactNode;
  /** Title shown in dropdown header */
  title: string;
  /** Available options */
  options: SelectOption<T>[];
  /** Currently selected value */
  value: T;
  /** Display text for current value */
  displayValue: string;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Visual variant: "compact" for button, "row" for settings-style row */
  variant?: "compact" | "row";
}
