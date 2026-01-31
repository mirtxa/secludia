import { memo } from "react";
import type { ControlButtonProps } from "./ControlButton.types";

export const ControlButton = memo(function ControlButton({
  type,
  icon,
  onPress,
}: ControlButtonProps) {
  const isClose = type === "close";

  return (
    <button
      className={`flex h-8 w-[46px] cursor-pointer select-none items-center justify-center border-none bg-transparent text-[10px] text-foreground ${
        isClose ? "hover:bg-danger hover:text-danger-foreground" : "hover:bg-default"
      }`}
      onClick={onPress}
      aria-label={type}
    >
      {icon}
    </button>
  );
});
