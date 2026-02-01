import { memo } from "react";
import { Palette } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { THEME_OPTIONS } from "@/config/configTypes";
import { useTranslatedOptions } from "@/hooks";
import { SelectDropdown } from "../SelectDropdown";

export const ThemeSelector = memo(function ThemeSelector() {
  const { theme, setTheme, t } = useAppContext();
  const { options, getDisplayValue } = useTranslatedOptions(THEME_OPTIONS);

  return (
    <SelectDropdown
      icon={<Palette />}
      title={t("SETTINGS_THEME")}
      options={options}
      value={theme}
      displayValue={getDisplayValue(theme)}
      onChange={setTheme}
    />
  );
});
