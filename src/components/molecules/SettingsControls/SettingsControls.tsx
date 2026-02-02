import { memo } from "react";
import { CircleCheckFill } from "@gravity-ui/icons";
import { Label, ListBox, Select, Slider, Switch } from "@heroui/react";

export const SectionHeader = memo(function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
      <span className="text-accent">{icon}</span>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
  );
});

export const SettingSwitch = memo(function SettingSwitch({
  label,
  description,
  isSelected,
  onChange,
  isDisabled = false,
}: {
  label: string;
  description?: string;
  isSelected: boolean;
  onChange: (value: boolean) => void;
  isDisabled?: boolean;
}) {
  return (
    <Switch isSelected={isSelected} onChange={onChange} isDisabled={isDisabled}>
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex flex-col">
          <Label className="text-sm font-medium text-foreground">{label}</Label>
          {description && <span className="text-xs text-muted">{description}</span>}
        </div>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </div>
    </Switch>
  );
});

export const SettingSlider = memo(function SettingSlider({
  label,
  description,
  value,
  onChange,
  minValue,
  maxValue,
  step,
  formatValue,
  isDisabled = false,
}: {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  minValue: number;
  maxValue: number;
  step: number;
  formatValue?: (value: number) => string;
  isDisabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Slider
        value={value}
        onChange={(v) => onChange(v as number)}
        minValue={minValue}
        maxValue={maxValue}
        step={step}
        isDisabled={isDisabled}
      >
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">{label}</Label>
          <Slider.Output className="text-sm text-muted">
            {({ state }) => (formatValue ? formatValue(state.values[0]) : `${state.values[0]}`)}
          </Slider.Output>
        </div>
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      {description && <p className="text-xs text-muted">{description}</p>}
    </div>
  );
});

export interface SettingSelectOption<T extends string = string> {
  key: T;
  label: string;
}

interface SettingSelectProps<T extends string> {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  options: SettingSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  isDisabled?: boolean;
}

function SettingSelectInner<T extends string>({
  icon,
  label,
  description,
  options,
  value,
  onChange,
  isDisabled = false,
}: SettingSelectProps<T>) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      {icon && (
        <div className="hidden size-10 shrink-0 items-center justify-center rounded-[10px] bg-default text-foreground md:flex">
          {icon}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && <span className="text-xs text-muted">{description}</span>}
      </div>
      <Select
        className="w-1/2 shrink-0"
        value={value}
        onChange={(v) => onChange(v as T)}
        isDisabled={isDisabled}
        variant="secondary"
      >
        <Select.Trigger>
          <Select.Value className="truncate" />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {options.map((option) => (
              <ListBox.Item key={option.key} id={option.key} textValue={option.label}>
                {({ isSelected }) => (
                  <>
                    {isSelected ? (
                      <CircleCheckFill className="shrink-0 text-accent" />
                    ) : (
                      <span className="size-4 shrink-0" />
                    )}
                    {option.label}
                  </>
                )}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}

export const SettingSelect = memo(SettingSelectInner) as typeof SettingSelectInner;
