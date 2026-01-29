import { memo } from "react";
import type { SecludiaTheme } from "@/config/configTypes";

import type { Selection } from "@heroui/react";
import { Button, Dropdown, Header, Label } from "@heroui/react";
import { useAppContext } from "@/context/AppContext";
import { CircleCheckFill, Palette } from "@gravity-ui/icons";
import type { TranslationKey } from "@/i18n/types";

const THEMES: { key: SecludiaTheme; label: TranslationKey }[] = [
  { key: "default", label: "SETTINGS_THEME_DEFAULT" },
  { key: "default-dark", label: "SETTINGS_THEME_DEFAULT_DARK" },
  { key: "familiar", label: "SETTINGS_THEME_FAMILIAR" },
  { key: "midnight", label: "SETTINGS_THEME_MIDNIGHT" },
  { key: "sunset", label: "SETTINGS_THEME_SUNSET" },
  { key: "mint", label: "SETTINGS_THEME_MINT" },
];

export const ThemeSelector = memo(function ThemeSelector() {
  const { getTheme, setTheme, t } = useAppContext();

  const handleSelectionChange = (selection: Selection) => {
    if (typeof selection === "object" && "currentKey" in selection) {
      setTheme(selection.currentKey as SecludiaTheme);
    }
  };

  const currentTheme = THEMES.find((theme) => theme.key === getTheme());

  return (
    <Dropdown>
      <Button className="text-muted" aria-label="Menu" variant="ghost">
        <Palette />
        {currentTheme ? t(currentTheme.label) : getTheme()}
      </Button>
      <Dropdown.Popover className="min-w-[256px]" placement="top">
        <Dropdown.Menu
          selectedKeys={new Set([getTheme()])}
          selectionMode="single"
          disallowEmptySelection
          onSelectionChange={handleSelectionChange}
        >
          <Dropdown.Section>
            <Header>{t("SETTINGS_THEME")}</Header>
            {THEMES.map((theme) => (
              <Dropdown.Item key={theme.key} id={theme.key} textValue={t(theme.label)}>
                <Dropdown.ItemIndicator>
                  {({ isSelected }) =>
                    isSelected ? <CircleCheckFill className="text-accent" /> : null
                  }
                </Dropdown.ItemIndicator>
                <Label>{t(theme.label)}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
});
