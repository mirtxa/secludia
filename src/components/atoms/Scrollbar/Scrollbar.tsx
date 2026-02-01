import { memo, useCallback, useState } from "react";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import type { EventListenerArgs } from "overlayscrollbars";
import { cn } from "@/utils";
import type { ScrollbarProps } from "./Scrollbar.types";
import "./Scrollbar.css";

export const Scrollbar = memo(function Scrollbar({
  children,
  className,
  role,
  "aria-label": ariaLabel,
}: ScrollbarProps) {
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(false);

  const updateShadows = useCallback((instance: EventListenerArgs["scroll"][0]) => {
    const { viewport } = instance.elements();
    if (!viewport) return;

    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

    setShowTopShadow(!isAtTop);
    setShowBottomShadow(!isAtBottom && scrollHeight > clientHeight);
  }, []);

  const handleInitialized = useCallback(
    (instance: EventListenerArgs["initialized"][0]) => {
      updateShadows(instance);
    },
    [updateShadows]
  );

  const handleScroll = useCallback(
    (instance: EventListenerArgs["scroll"][0]) => {
      updateShadows(instance);
    },
    [updateShadows]
  );

  return (
    <OverlayScrollbarsComponent
      className={cn(
        className,
        showTopShadow && "scrollbar--shadow-top",
        showBottomShadow && "scrollbar--shadow-bottom"
      )}
      options={{
        scrollbars: {
          autoHide: "leave",
          autoHideDelay: 500,
        },
      }}
      events={{
        initialized: handleInitialized,
        scroll: handleScroll,
      }}
      defer
      element={role === "navigation" ? "nav" : "div"}
      {...(ariaLabel && { "aria-label": ariaLabel })}
    >
      {children}
    </OverlayScrollbarsComponent>
  );
});
