import type { ReactNode } from "react";

export interface SelectorOption<T extends string> {
  key: T;
  label: string;
}

export interface SelectorDropdownProps<T extends string> {
  icon: ReactNode;
  title: string;
  options: SelectorOption<T>[];
  value: T;
  displayValue: string;
  onChange: (value: T) => void;
}
