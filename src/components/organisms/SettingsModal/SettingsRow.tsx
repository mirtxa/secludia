import { memo, useCallback, useMemo } from "react";
import type { Selection } from "@heroui/react";
import { Dropdown, Header, Label } from "@heroui/react";
import { ChevronDown, CircleCheckFill } from "@gravity-ui/icons";
import "./SettingsRow.css";

interface SettingsRowProps<T extends string> {
  icon: React.ReactNode;
  title: string;
  options: { key: T; label: string }[];
  value: T;
  displayValue: string;
  onChange: (value: T) => void;
}

function SettingsRowInner<T extends string>({
  icon,
  title,
  options,
  value,
  displayValue,
  onChange,
}: SettingsRowProps<T>) {
  const selectedKeys = useMemo(() => new Set([value]), [value]);

  const handleSelectionChange = useCallback(
    (selection: Selection) => {
      if (typeof selection === "object" && "currentKey" in selection) {
        const key = selection.currentKey;
        if (options.some((opt) => opt.key === key)) {
          onChange(key as T);
        }
      }
    },
    [onChange, options]
  );

  return (
    <Dropdown>
      <Dropdown.Trigger className="settings-row">
        <div className="settings-row__icon">{icon}</div>
        <div className="settings-row__content">
          <span className="settings-row__title">{title}</span>
          <span className="settings-row__value">{displayValue}</span>
        </div>
        <ChevronDown className="settings-row__chevron" />
      </Dropdown.Trigger>
      <Dropdown.Popover className="min-w-[200px]" placement="bottom end">
        <Dropdown.Menu
          selectedKeys={selectedKeys}
          selectionMode="single"
          disallowEmptySelection
          onSelectionChange={handleSelectionChange}
        >
          <Dropdown.Section>
            <Header>{title}</Header>
            {options.map((option) => (
              <Dropdown.Item key={option.key} id={option.key} textValue={option.label}>
                <Dropdown.ItemIndicator>
                  {({ isSelected }) =>
                    isSelected ? <CircleCheckFill className="text-accent" /> : null
                  }
                </Dropdown.ItemIndicator>
                <Label>{option.label}</Label>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export const SettingsRow = memo(SettingsRowInner) as typeof SettingsRowInner;
