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
    <div className="title-bar" data-tauri-drag-region>
      <div className="title-bar__spacer" />
      <span className="title-bar__title">{selectedRoom?.name ?? "Secludia"}</span>
      <ControlActions />
    </div>
  );
});
