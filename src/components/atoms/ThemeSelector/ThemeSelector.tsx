import { memo, useMemo } from "react";
import { Palette } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { SelectorDropdown } from "../SelectorDropdown";
import type { SecludiaTheme } from "@/config/configTypes";
import type { TranslationKey } from "@/i18n/types";

const THEME_KEYS: { key: SecludiaTheme; label: TranslationKey }[] = [
  { key: "default", label: "SETTINGS_THEME_DEFAULT" },
  { key: "default-dark", label: "SETTINGS_THEME_DEFAULT_DARK" },
  { key: "familiar", label: "SETTINGS_THEME_FAMILIAR" },
  { key: "midnight", label: "SETTINGS_THEME_MIDNIGHT" },
  { key: "sunset", label: "SETTINGS_THEME_SUNSET" },
  { key: "mint", label: "SETTINGS_THEME_MINT" },
];

export const ThemeSelector = memo(function ThemeSelector() {
  const { theme, setTheme, t } = useAppContext();

  const options = useMemo(
    () => THEME_KEYS.map((item) => ({ key: item.key, label: t(item.label) })),
    [t]
  );

  const displayValue = useMemo(() => {
    const found = THEME_KEYS.find((item) => item.key === theme);
    return found ? t(found.label) : theme;
  }, [theme, t]);

  return (
    <SelectorDropdown
      icon={<Palette />}
      title={t("SETTINGS_THEME")}
      options={options}
      value={theme}
      displayValue={displayValue}
      onChange={setTheme}
    />
  );
});
