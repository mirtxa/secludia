import { memo } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { useAppContext } from "@/context";
import { ControlActions } from "../ControlActions";
import "./TitleBar.css";

export const TitleBar = memo(function TitleBar() {
  const { selectedRoom } = useAppContext();

  if (!isTauri()) {
    return null;
  }

  return (
    <div
      className="title-bar flex h-8 shrink-0 select-none items-center bg-surface"
      data-tauri-drag-region
    >
      <div className="title-bar__spacer hidden md:block" />
      <span className="title-bar__title flex-1 pl-3 text-xs font-medium text-foreground md:pl-0 md:text-center">
        {selectedRoom?.name ?? "Secludia"}
      </span>
      <ControlActions />
    </div>
  );
});
