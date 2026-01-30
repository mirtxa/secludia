import { memo, useMemo, useState } from "react";
import { Font, Palette, PlanetEarth } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { AVAILABLE_LANGUAGES, getLanguageDisplayName } from "@/i18n";
import { SettingsRow } from "./SettingsRow";
import type { SecludiaTheme } from "@/config/configTypes";
import type { TranslationKey } from "@/i18n/types";

type FontSize = "small" | "medium" | "large";

const THEME_KEYS: { key: SecludiaTheme; label: TranslationKey }[] = [
  { key: "default", label: "SETTINGS_THEME_DEFAULT" },
  { key: "default-dark", label: "SETTINGS_THEME_DEFAULT_DARK" },
  { key: "familiar", label: "SETTINGS_THEME_FAMILIAR" },
  { key: "midnight", label: "SETTINGS_THEME_MIDNIGHT" },
  { key: "sunset", label: "SETTINGS_THEME_SUNSET" },
  { key: "mint", label: "SETTINGS_THEME_MINT" },
];

const FONT_SIZE_KEYS: { key: FontSize; label: TranslationKey }[] = [
  { key: "small", label: "SETTINGS_FONT_SIZE_SMALL" },
  { key: "medium", label: "SETTINGS_FONT_SIZE_MEDIUM" },
  { key: "large", label: "SETTINGS_FONT_SIZE_LARGE" },
];

export const AppearanceSection = memo(function AppearanceSection() {
  const { theme, setTheme, language, setLanguage, t } = useAppContext();
  const [fontSize, setFontSize] = useState<FontSize>("medium");

  const themeOptions = useMemo(
    () => THEME_KEYS.map((item) => ({ key: item.key, label: t(item.label) })),
    [t]
  );

  const themeDisplayValue = useMemo(() => {
    const found = THEME_KEYS.find((item) => item.key === theme);
    return found ? t(found.label) : theme;
  }, [theme, t]);

  const languageOptions = useMemo(
    () => AVAILABLE_LANGUAGES.map((lang) => ({ key: lang, label: getLanguageDisplayName(lang) })),
    []
  );

  const fontSizeOptions = useMemo(
    () => FONT_SIZE_KEYS.map((item) => ({ key: item.key, label: t(item.label) })),
    [t]
  );

  const fontSizeDisplayValue = useMemo(() => {
    const found = FONT_SIZE_KEYS.find((item) => item.key === fontSize);
    return found ? t(found.label) : fontSize;
  }, [fontSize, t]);

  return (
    <div className="flex flex-col gap-3">
      <SettingsRow
        icon={<Palette />}
        title={t("SETTINGS_THEME")}
        options={themeOptions}
        value={theme}
        displayValue={themeDisplayValue}
        onChange={setTheme}
      />

      <SettingsRow
        icon={<PlanetEarth />}
        title={t("SETTINGS_LANGUAGE")}
        options={languageOptions}
        value={language}
        displayValue={getLanguageDisplayName(language)}
        onChange={setLanguage}
      />

      <SettingsRow
        icon={<Font />}
        title={t("SETTINGS_FONT_SIZE")}
        options={fontSizeOptions}
        value={fontSize}
        displayValue={fontSizeDisplayValue}
        onChange={setFontSize}
      />
    </div>
  );
});
