import { memo, useMemo, useState } from "react";
import { Font, Palette, PlanetEarth } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { THEME_OPTIONS } from "@/config/configTypes";
import { AVAILABLE_LANGUAGES, getLanguageDisplayName } from "@/i18n";
import type { TranslationKey } from "@/i18n/types";
import { useTranslatedOptions } from "@/hooks";
import { SettingSelect } from "@/components/molecules";

type FontSize = "small" | "medium" | "large";

const FONT_SIZE_OPTIONS: readonly { key: FontSize; labelKey: TranslationKey }[] = [
  { key: "small", labelKey: "SETTINGS_FONT_SIZE_SMALL" },
  { key: "medium", labelKey: "SETTINGS_FONT_SIZE_MEDIUM" },
  { key: "large", labelKey: "SETTINGS_FONT_SIZE_LARGE" },
] as const;

export const AppearanceSection = memo(function AppearanceSection() {
  const { theme, setTheme, language, setLanguage, t } = useAppContext();
  const [fontSize, setFontSize] = useState<FontSize>("medium");

  const { options: themeOptions } = useTranslatedOptions(THEME_OPTIONS);
  const { options: fontSizeOptions } = useTranslatedOptions(FONT_SIZE_OPTIONS);

  const languageOptions = useMemo(
    () => AVAILABLE_LANGUAGES.map((lang) => ({ key: lang, label: getLanguageDisplayName(lang) })),
    []
  );

  return (
    <div className="flex flex-col gap-3">
      <SettingSelect
        icon={<Palette />}
        label={t("SETTINGS_THEME")}
        options={themeOptions}
        value={theme}
        onChange={setTheme}
      />

      <SettingSelect
        icon={<PlanetEarth />}
        label={t("SETTINGS_LANGUAGE")}
        options={languageOptions}
        value={language}
        onChange={setLanguage}
      />

      <SettingSelect
        icon={<Font />}
        label={t("SETTINGS_FONT_SIZE")}
        options={fontSizeOptions}
        value={fontSize}
        onChange={setFontSize}
      />
    </div>
  );
});
