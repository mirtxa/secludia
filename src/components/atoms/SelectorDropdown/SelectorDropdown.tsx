import { memo, useCallback } from "react";
import type { Selection } from "@heroui/react";
import { Button, Dropdown, Header, Label } from "@heroui/react";
import { CircleCheckFill } from "@gravity-ui/icons";
import type { SelectorDropdownProps } from "./SelectorDropdown.types";

function SelectorDropdownInner<T extends string>({
  icon,
  title,
  options,
  value,
  displayValue,
  onChange,
}: SelectorDropdownProps<T>) {
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
      <Button className="text-muted" aria-label={title} variant="ghost">
        {icon}
        {displayValue}
      </Button>
      <Dropdown.Popover className="min-w-[256px]" placement="top">
        <Dropdown.Menu
          selectedKeys={new Set([value])}
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

export const SelectorDropdown = memo(SelectorDropdownInner) as typeof SelectorDropdownInner;
