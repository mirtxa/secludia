import { memo, useMemo } from "react";
import { PlanetEarth } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { AVAILABLE_LANGUAGES, getLanguageDisplayName } from "@/i18n";
import { SelectDropdown } from "../SelectDropdown";

export const LanguageSelector = memo(function LanguageSelector() {
  const { language, setLanguage, t } = useAppContext();

  const options = useMemo(
    () => AVAILABLE_LANGUAGES.map((lang) => ({ key: lang, label: getLanguageDisplayName(lang) })),
    []
  );

  return (
    <SelectDropdown
      icon={<PlanetEarth />}
      title={t("SETTINGS_LANGUAGE")}
      options={options}
      value={language}
      displayValue={getLanguageDisplayName(language)}
      onChange={setLanguage}
    />
  );
});
