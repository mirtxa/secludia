import { memo, useCallback } from "react";
import type { Selection } from "@heroui/react";
import { Button, Dropdown, Header, Label } from "@heroui/react";
import { CircleCheckFill, PlanetEarth } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { AVAILABLE_LANGUAGES, getLanguageDisplayName } from "@/i18n";
import type { SecludiaLanguage } from "@/config/configTypes";

export const LanguageSelector = memo(function LanguageSelector() {
  const { getLanguage, setLanguage, t } = useAppContext();

  const handleSelectionChange = useCallback(
    (selection: Selection) => {
      if (typeof selection === "object" && "currentKey" in selection) {
        setLanguage(selection.currentKey as SecludiaLanguage);
      }
    },
    [setLanguage]
  );

  return (
    <Dropdown>
      <Button className="text-muted" aria-label="Menu" variant="ghost">
        <PlanetEarth />
        {getLanguageDisplayName(getLanguage())}
      </Button>
      <Dropdown.Popover className="min-w-[256px]" placement="top">
        <Dropdown.Menu
          selectedKeys={new Set([getLanguage()])}
          selectionMode="single"
          disallowEmptySelection
          onSelectionChange={handleSelectionChange}
        >
          <Dropdown.Section>
            <Header>{t("SETTINGS_LANGUAGE")}</Header>
            {AVAILABLE_LANGUAGES.map((language) => (
              <Dropdown.Item
                key={language}
                id={language}
                textValue={getLanguageDisplayName(language)}
              >
                <Dropdown.ItemIndicator>
                  {({ isSelected }) =>
                    isSelected ? <CircleCheckFill className="text-accent" /> : null
                  }
                </Dropdown.ItemIndicator>
                <Label>{getLanguageDisplayName(language)}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
});
