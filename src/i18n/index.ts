import type { TranslationKey } from "./types";

// Auto-detect all locale files from src/locales/
const localeModules = import.meta.glob<{ default: Record<string, string> }>(
  "@/locales/*.json",
  { eager: true }
);

// Build dictionaries and extract available languages
const dictionaries: Record<string, Record<string, string>> = {};
const availableLanguages: string[] = [];

for (const path in localeModules) {
  const langCode = path.match(/\/locales\/(.+)\.json$/)?.[1];
  if (langCode) {
    dictionaries[langCode] = localeModules[path].default;
    availableLanguages.push(langCode);
  }
}

// Export available languages for use in config
export const AVAILABLE_LANGUAGES = availableLanguages as readonly string[];
export type AvailableLanguage = (typeof availableLanguages)[number];

// Default language (must exist)
const DEFAULT_LANG = "en";

export type InterpolationValues = Record<string, string | number>;

function interpolate(text: string, values?: InterpolationValues): string {
  if (!values) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = values[key];
    if (value === undefined) {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing interpolation value for key: "${key}"`);
      }
      return `{{${key}}}`;
    }
    return String(value);
  });
}

export function t(
  lang: string,
  key: TranslationKey,
  values?: InterpolationValues
): string {
  const translation = dictionaries[lang]?.[key];

  if (translation === undefined) {
    if (import.meta.env.DEV) {
      console.warn(
        `[i18n] Missing translation for key: "${key}" in locale: "${lang}"`
      );
    }
    return interpolate(dictionaries[DEFAULT_LANG]?.[key] ?? key, values);
  }

  return interpolate(translation, values);
}

export function isValidLanguage(lang: string): lang is AvailableLanguage {
  return availableLanguages.includes(lang);
}

export function getLanguageDisplayName(lang: string): string {
  return dictionaries[lang]?.LANGUAGE_DISPLAY_NAME ?? lang;
}
