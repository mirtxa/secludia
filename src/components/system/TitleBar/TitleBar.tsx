import { memo } from "react";
import { usePlatform } from "@/platforms";
import { useAppContext } from "@/context";
import { ControlActions } from "../ControlActions";

export const TitleBar = memo(function TitleBar() {
  const platform = usePlatform();
  const { selectedRoom } = useAppContext();

  if (!platform.isTauri) {
    return null;
  }

  return (
    <div
      className="flex h-8 shrink-0 select-none items-center bg-surface [-webkit-app-region:drag]"
      data-tauri-drag-region
    >
      <div className="hidden w-[138px] md:block" />
      <span className="flex-1 pl-3 text-xs font-medium text-foreground md:pl-0 md:text-center">
        {selectedRoom?.name ?? "Secludia"}
      </span>
      <ControlActions />
    </div>
  );
});
