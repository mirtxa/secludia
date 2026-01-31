import { memo, useMemo } from "react";
import { Palette } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { THEME_OPTIONS } from "@/config/configTypes";
import { SelectDropdown } from "../SelectDropdown";

export const ThemeSelector = memo(function ThemeSelector() {
  const { theme, setTheme, t } = useAppContext();

  const options = useMemo(
    () => THEME_OPTIONS.map((item) => ({ key: item.key, label: t(item.labelKey) })),
    [t]
  );

  const displayValue = useMemo(() => {
    const found = THEME_OPTIONS.find((item) => item.key === theme);
    return found ? t(found.labelKey) : theme;
  }, [theme, t]);

  return (
    <SelectDropdown
      icon={<Palette />}
      title={t("SETTINGS_THEME")}
      options={options}
      value={theme}
      displayValue={displayValue}
      onChange={setTheme}
    />
  );
});
