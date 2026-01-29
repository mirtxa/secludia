import { SecludiaTheme } from "@/config/configTypes";

import { Button, Dropdown, Header, Label, Selection } from "@heroui/react";
import { useAppContext } from "@/context/AppContext";
import { CircleCheckFill, Palette } from "@gravity-ui/icons";

const THEMES: SecludiaTheme[] = [
  "ocean",
  "ocean-dark",
  "forest",
  "forest-dark",
  "familiar",
];

export const ThemeSelector: React.FC = () => {
  const { getTheme, setTheme, t } = useAppContext();

  const handleSelectionChange = (selection: Selection) => {
    if (typeof selection === "object" && "currentKey" in selection) {
      setTheme(selection.currentKey as SecludiaTheme);
    }
  };

  return (
    <Dropdown>
      <Button className="text-muted" aria-label="Menu" variant="ghost">
        <Palette />
        {getTheme()}
      </Button>
      <Dropdown.Popover className="min-w-[256px]" placement="top">
        <Dropdown.Menu
          selectedKeys={new Set([getTheme()])}
          selectionMode="single"
          onSelectionChange={handleSelectionChange}
        >
          <Dropdown.Section>
            <Header>{t("SETTINGS_THEME")}</Header>
            {THEMES.map((theme) => (
              <Dropdown.Item key={theme} id={theme} textValue={theme}>
                <Dropdown.ItemIndicator>
                  {({ isSelected }) =>
                    isSelected ? <CircleCheckFill className="text-accent" /> : null
                  }
                </Dropdown.ItemIndicator>
                <Label>{theme}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
};
