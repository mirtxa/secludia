import { memo, useMemo, useState } from "react";
import { Font, Palette, PlanetEarth } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { THEME_OPTIONS } from "@/config/configTypes";
import { AVAILABLE_LANGUAGES, getLanguageDisplayName } from "@/i18n";
import type { TranslationKey } from "@/i18n/types";
import { SettingsRow } from "./SettingsRow";

type FontSize = "small" | "medium" | "large";

const FONT_SIZE_OPTIONS: { key: FontSize; labelKey: TranslationKey }[] = [
  { key: "small", labelKey: "SETTINGS_FONT_SIZE_SMALL" },
  { key: "medium", labelKey: "SETTINGS_FONT_SIZE_MEDIUM" },
  { key: "large", labelKey: "SETTINGS_FONT_SIZE_LARGE" },
];

export const AppearanceSection = memo(function AppearanceSection() {
  const { theme, setTheme, language, setLanguage, t } = useAppContext();
  const [fontSize, setFontSize] = useState<FontSize>("medium");

  const themeOptions = useMemo(
    () => THEME_OPTIONS.map((item) => ({ key: item.key, label: t(item.labelKey) })),
    [t]
  );

  const themeDisplayValue = useMemo(() => {
    const found = THEME_OPTIONS.find((item) => item.key === theme);
    return found ? t(found.labelKey) : theme;
  }, [theme, t]);

  const languageOptions = useMemo(
    () => AVAILABLE_LANGUAGES.map((lang) => ({ key: lang, label: getLanguageDisplayName(lang) })),
    []
  );

  const fontSizeOptions = useMemo(
    () => FONT_SIZE_OPTIONS.map((item) => ({ key: item.key, label: t(item.labelKey) })),
    [t]
  );

  const fontSizeDisplayValue = useMemo(() => {
    const found = FONT_SIZE_OPTIONS.find((item) => item.key === fontSize);
    return found ? t(found.labelKey) : fontSize;
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
