import { memo } from "react";
import { Button, Tooltip } from "@heroui/react";
import type { NavBarButtonProps } from "./NavBarButton.types";
import "./NavBarButton.css";

export const NavBarButton = memo(function NavBarButton({
  label,
  selected = false,
  showIndicator = true,
  rounded = false,
  children,
  onPress,
}: NavBarButtonProps) {
  const baseClass = rounded ? "nav-bar-button nav-bar-button--rounded" : "nav-bar-button";
  const className = selected ? `${baseClass} nav-bar-button--selected` : baseClass;

  return (
    <Tooltip delay={0}>
      <Button className={className} onPress={onPress} aria-label={label}>
        {showIndicator && <div className="nav-bar-button__indicator" />}
        {children}
      </Button>
      <Tooltip.Content placement="right" offset={12} className="rounded-lg">
        {label}
      </Tooltip.Content>
    </Tooltip>
  );
});
