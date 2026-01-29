import { memo } from "react";
import type { ControlButtonProps } from "./ControlButton.types";
import "./ControlButton.css";

export const ControlButton = memo(function ControlButton({
  type,
  icon,
  onPress,
}: ControlButtonProps) {
  return (
    <button
      className={`control-button control-button--${type}`}
      onClick={onPress}
      aria-label={type}
    >
      {icon}
    </button>
  );
});
