import { AvailableLanguage } from "@/i18n";

export type SecludiaTheme =
  | "ocean"
  | "ocean-dark"
  | "forest"
  | "forest-dark"
  | "familiar";

export type SecludiaLanguage = AvailableLanguage;

export interface SecludiaConfig {
  theme: SecludiaTheme;
  language: SecludiaLanguage;
}
