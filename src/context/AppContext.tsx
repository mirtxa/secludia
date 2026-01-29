import type { ReactNode } from "react";
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { SecludiaConfig, SecludiaTheme, SecludiaLanguage } from "@/config/configTypes";
import * as Storage from "@/config/localStorage";
import type { TranslationKey } from "@/i18n/types";
import type { InterpolationValues } from "@/i18n";
import { t as translate } from "@/i18n";

interface AppContextValue {
  t: (key: TranslationKey, values?: InterpolationValues) => string;
  getLanguage: () => SecludiaLanguage;
  getTheme: () => SecludiaTheme;
  setTheme: (theme: SecludiaTheme) => void;
  setLanguage: (language: SecludiaLanguage) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SecludiaConfig>(() => Storage.loadConfig());

  useEffect(() => {
    document.documentElement.dataset.theme = config.theme;
    document.documentElement.lang = config.language;
  }, [config.theme, config.language]);

  const getLanguage = useCallback(() => config.language, [config.language]);

  const getTheme = useCallback(() => config.theme, [config.theme]);

  const t = useCallback(
    (key: TranslationKey, values?: InterpolationValues) => translate(config.language, key, values),
    [config.language]
  );

  const setTheme = useCallback((theme: SecludiaTheme) => {
    Storage.updateTheme(theme);
    setConfig((prev) => ({ ...prev, theme }));
  }, []);

  const setLanguage = useCallback((language: SecludiaLanguage) => {
    Storage.updateLanguage(language);
    setConfig((prev) => ({ ...prev, language }));
  }, []);

  const value = useMemo(
    () => ({ getLanguage, getTheme, setTheme, setLanguage, t }),
    [getLanguage, getTheme, setTheme, setLanguage, t]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used inside AppContextProvider");
  return ctx;
}
