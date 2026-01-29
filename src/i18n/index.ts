import type { SecludiaLanguage } from "@/config/configTypes";
import type { TranslationKey } from "./types";

import en from "./locales/en.json";
import es from "./locales/es.json";

const dictionaries: Record<SecludiaLanguage, Record<TranslationKey, string>> = {
  en,
  es,
};

export function t(
  lang: SecludiaLanguage,
  key: TranslationKey
): string {
  return dictionaries[lang]?.[key] ?? dictionaries.en[key];
}
