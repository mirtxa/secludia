import { memo } from "react";
import { Description, Label } from "@heroui/react";
import { cn } from "@/utils";

export interface LabeledItemProps {
  /** Icon to display in the icon box */
  icon?: React.ReactNode;
  /** Main label text */
  label: string;
  /** Optional description text */
  description?: string;
  /** Whether the item is disabled */
  isDisabled?: boolean;
  /** Always show icon, even on small screens (default: false, hides on mobile) */
  alwaysShowIcon?: boolean;
  /** Optional content to render on the right side (e.g., Select, Switch) */
  children?: React.ReactNode;
}

/**
 * Reusable labeled item component with icon, label, and description.
 * Can optionally include a control element (Select, Switch, etc.) on the right.
 */
export const LabeledItem = memo(function LabeledItem({
  icon,
  label,
  description,
  isDisabled = false,
  alwaysShowIcon = false,
  children,
}: LabeledItemProps) {
  const iconVisibilityClass = alwaysShowIcon ? "flex" : "hidden md:flex";

  return (
    <div className="flex w-full items-center justify-between gap-3">
      {icon && (
        <div
          className={cn(
            iconVisibilityClass,
            "size-10 shrink-0 items-center justify-center rounded-[10px]",
            isDisabled ? "bg-default/50 text-muted" : "bg-default text-foreground"
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Label isDisabled={isDisabled}>{label}</Label>
        {description && <Description>{description}</Description>}
      </div>
      {children}
    </div>
  );
});
