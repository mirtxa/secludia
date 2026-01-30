import { memo } from "react";
import { Tooltip } from "@heroui/react";
import type { NavBarButtonProps } from "./NavBarButton.types";
import "./NavBarButton.css";

export const NavBarButton = memo(function NavBarButton({
  label,
  selected = false,
  showIndicator = true,
  children,
  onPress,
}: NavBarButtonProps) {
  const className = selected ? "nav-bar-button nav-bar-button--selected" : "nav-bar-button";

  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger aria-label={label}>
        <button type="button" className={className} onClick={onPress}>
          {showIndicator && <div className="nav-bar-button__indicator" />}
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Content placement="right" offset={12} className="rounded-lg">
        {label}
      </Tooltip.Content>
    </Tooltip>
  );
});
