import { createContext } from "react";
import type { SecludiaTheme, SecludiaLanguage } from "@/config/configTypes";
import type { TranslationKey } from "@/i18n/types";
import type { InterpolationValues } from "@/i18n";

export interface SelectedRoom {
  id: string | number;
  name: string;
}

export interface AppContextValue {
  t: (key: TranslationKey, values?: InterpolationValues) => string;
  language: SecludiaLanguage;
  theme: SecludiaTheme;
  setTheme: (theme: SecludiaTheme) => void;
  setLanguage: (language: SecludiaLanguage) => void;
  selectedRoom: SelectedRoom | null;
  setSelectedRoom: (room: SelectedRoom | null) => void;
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);
