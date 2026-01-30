import type { ReactNode } from "react";
import { useState, useCallback, useMemo, useEffect } from "react";
import type { SecludiaConfig, SecludiaTheme, SecludiaLanguage } from "@/config/configTypes";
import * as Storage from "@/config/localStorage";
import type { InterpolationValues } from "@/i18n";
import { t as translate } from "@/i18n";
import { AppContext, type AppContextValue, type SelectedRoom } from "./AppContext.types";

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SecludiaConfig>(() => Storage.loadConfig());
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoom | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = config.theme;
    document.documentElement.lang = config.language;
  }, [config.theme, config.language]);

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
    () => ({
      t,
      language: config.language,
      theme: config.theme,
      setTheme,
      setLanguage,
      selectedRoom,
      setSelectedRoom,
    }),
    [t, config.language, config.theme, setTheme, setLanguage, selectedRoom]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
