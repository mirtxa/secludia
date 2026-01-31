import { memo } from "react";
import { useTauriWindow } from "@/hooks/useTauriWindow";
import { ControlButton } from "../ControlButton";

export const ControlActions = memo(function ControlActions() {
  const { minimize, toggleMaximize, close } = useTauriWindow();

  return (
    <div
      className="flex items-center"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <ControlButton type="minimize" icon="─" onPress={minimize} />
      <ControlButton type="maximize" icon="□" onPress={toggleMaximize} />
      <ControlButton type="close" icon="✕" onPress={close} />
    </div>
  );
});
