import type { ReactNode } from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import type { SecludiaConfig, SecludiaTheme, SecludiaLanguage } from "@/config/configTypes";
import * as Storage from "@/config/localStorage";
import type { InterpolationValues } from "@/i18n";
import { t as translate } from "@/i18n";
import { AppContext, type AppContextValue } from "./AppContext.types";

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SecludiaConfig>(() => Storage.loadConfig());

  useEffect(() => {
    document.documentElement.dataset.theme = config.theme;
    document.documentElement.lang = config.language;
  }, [config.theme, config.language]);

  const getLanguage = useCallback(() => config.language, [config.language]);

  const getTheme = useCallback(() => config.theme, [config.theme]);

  const t = useCallback(
    (key: Parameters<AppContextValue["t"]>[0], values?: InterpolationValues) =>
      translate(config.language, key, values),
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
