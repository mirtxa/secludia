import { createContext, useContext, useState, ReactNode } from "react";
import type {
  SecludiaConfig,
  SecludiaTheme,
  SecludiaLanguage,
} from "@/config/configTypes";
import * as Storage from "@/config/localStorage";
import { TranslationKey } from "@/i18n/types";
import { t as translate } from "@/i18n";

interface AppContextValue {
  config: SecludiaConfig;
  t: (key: TranslationKey) => string;
  setTheme: (theme: SecludiaTheme) => void;
  setLanguage: (language: SecludiaLanguage) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SecludiaConfig>(() => {
    const cfg = Storage.loadConfig();

    document.documentElement.dataset.theme = cfg.theme;
    document.documentElement.lang = cfg.language;

    return cfg;
  });

  const t = (key: TranslationKey) => translate(config.language, key);

  const setTheme = (theme: SecludiaTheme) => {
    Storage.updateTheme(theme);
    setConfig((prev) => ({ ...prev, theme }));
  };

  const setLanguage = (language: SecludiaLanguage) => {
    Storage.updateLanguage(language);
    setConfig((prev) => ({ ...prev, language }));
  };

  return (
    <AppContext.Provider value={{ config, setTheme, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx)
    throw new Error("useAppContext must be used inside AppContextProvider");
  return ctx;
}
