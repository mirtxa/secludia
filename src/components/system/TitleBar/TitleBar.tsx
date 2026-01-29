import { memo } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { ControlActions } from "../ControlActions";
import "./TitleBar.css";

interface TitleBarProps {
  title?: string;
}

export const TitleBar = memo(function TitleBar({ title = "Secludia" }: TitleBarProps) {
  // Only render in Tauri desktop app, not on web
  if (!isTauri()) {
    return null;
  }

  return (
    <div className="title-bar" data-tauri-drag-region>
      <span className="title-bar__title">{title}</span>
      <ControlActions />
    </div>
  );
});
