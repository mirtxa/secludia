import { SecludiaLanguage } from "@/config/configTypes";
import { AVAILABLE_LANGUAGES, getLanguageDisplayName } from "@/i18n";

import { Button, Dropdown, Header, Label, Selection } from "@heroui/react";
import { useAppContext } from "@/context/AppContext";
import { CircleCheckFill, PlanetEarth } from "@gravity-ui/icons";

export const LanguageSelector: React.FC = () => {
  const { getLanguage, setLanguage, t } = useAppContext();

  const handleSelectionChange = (selection: Selection) => {
    if (typeof selection === "object" && "currentKey" in selection) {
      setLanguage(selection.currentKey as SecludiaLanguage);
    }
  };

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
};
