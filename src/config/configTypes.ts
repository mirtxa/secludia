import type { AvailableLanguage } from "@/i18n";

export type SecludiaTheme =
  | "default"
  | "default-dark"
  | "familiar"
  | "midnight"
  | "sunset"
  | "mint";

export type SecludiaLanguage = AvailableLanguage;

export interface SecludiaConfig {
  theme: SecludiaTheme;
  language: SecludiaLanguage;
}
