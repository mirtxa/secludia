import { memo, useMemo } from "react";
import { PlanetEarth } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { AVAILABLE_LANGUAGES, getLanguageDisplayName } from "@/i18n";
import { SelectorDropdown } from "../SelectorDropdown";

export const LanguageSelector = memo(function LanguageSelector() {
  const { language, setLanguage, t } = useAppContext();

  const options = useMemo(
    () => AVAILABLE_LANGUAGES.map((lang) => ({ key: lang, label: getLanguageDisplayName(lang) })),
    []
  );

  return (
    <SelectorDropdown
      icon={<PlanetEarth />}
      title={t("SETTINGS_LANGUAGE")}
      options={options}
      value={language}
      displayValue={getLanguageDisplayName(language)}
      onChange={setLanguage}
    />
  );
});
