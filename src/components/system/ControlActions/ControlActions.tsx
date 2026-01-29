import { memo } from "react";
import { useTauriWindow } from "@/hooks/useTauriWindow";
import { ControlButton } from "../ControlButton";
import "./ControlActions.css";

export const ControlActions = memo(function ControlActions() {
  const { minimize, toggleMaximize, close } = useTauriWindow();

  return (
    <div className="control-actions">
      <ControlButton type="minimize" icon="─" onPress={minimize} />
      <ControlButton type="maximize" icon="□" onPress={toggleMaximize} />
      <ControlButton type="close" icon="✕" onPress={close} />
    </div>
  );
});
