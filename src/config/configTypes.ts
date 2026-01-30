import type { AvailableLanguage } from "@/i18n";
import type { TranslationKey } from "@/i18n/types";

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

export const THEME_OPTIONS: { key: SecludiaTheme; labelKey: TranslationKey }[] = [
  { key: "default", labelKey: "SETTINGS_THEME_DEFAULT" },
  { key: "default-dark", labelKey: "SETTINGS_THEME_DEFAULT_DARK" },
  { key: "familiar", labelKey: "SETTINGS_THEME_FAMILIAR" },
  { key: "midnight", labelKey: "SETTINGS_THEME_MIDNIGHT" },
  { key: "sunset", labelKey: "SETTINGS_THEME_SUNSET" },
  { key: "mint", labelKey: "SETTINGS_THEME_MINT" },
];
