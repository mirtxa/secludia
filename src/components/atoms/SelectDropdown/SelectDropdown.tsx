import { memo, useCallback, useMemo } from "react";
import type { Selection } from "@heroui/react";
import { Button, Dropdown, Header, Label } from "@heroui/react";
import { ChevronDown, CircleCheckFill } from "@gravity-ui/icons";
import type { SelectDropdownProps } from "./SelectDropdown.types";

function SelectDropdownInner<T extends string>({
  icon,
  title,
  options,
  value,
  displayValue,
  onChange,
  variant = "compact",
}: SelectDropdownProps<T>) {
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

  const trigger =
    variant === "compact" ? (
      <Button className="text-muted" aria-label={title} variant="ghost">
        {icon}
        {displayValue}
      </Button>
    ) : (
      <Dropdown.Trigger className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-surface p-3 transition-colors hover:bg-default">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-default text-foreground">
          {icon}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <span className="text-[13px] text-muted">{displayValue}</span>
        </div>
        <ChevronDown className="shrink-0 text-muted" />
      </Dropdown.Trigger>
    );

  const popoverProps =
    variant === "compact"
      ? { className: "min-w-[256px]", placement: "top" as const }
      : { className: "min-w-[200px]", placement: "bottom end" as const };

  return (
    <Dropdown>
      {trigger}
      <Dropdown.Popover {...popoverProps}>
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

export const SelectDropdown = memo(SelectDropdownInner) as typeof SelectDropdownInner;
