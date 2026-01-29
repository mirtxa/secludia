import { createContext } from "react";
import type { SecludiaTheme, SecludiaLanguage } from "@/config/configTypes";
import type { TranslationKey } from "@/i18n/types";
import type { InterpolationValues } from "@/i18n";

export interface AppContextValue {
  t: (key: TranslationKey, values?: InterpolationValues) => string;
  getLanguage: () => SecludiaLanguage;
  getTheme: () => SecludiaTheme;
  setTheme: (theme: SecludiaTheme) => void;
  setLanguage: (language: SecludiaLanguage) => void;
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);
