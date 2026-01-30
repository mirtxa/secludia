import { memo, useMemo } from "react";
import { Bars } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useBreakpoint, useResizable, useSidebar } from "@/hooks";
import type { MainScreenProps } from "./MainScreen.types";
import "./MainScreen.css";

const SIDEBAR_WIDTH_OPTIONS = { minWidth: 180, maxWidth: 348, defaultWidth: 280 };

export const MainScreen = memo(function MainScreen(_props: MainScreenProps) {
  const sidebar = useSidebar();
  const isDesktop = useBreakpoint("md");
  const resizable = useResizable(SIDEBAR_WIDTH_OPTIONS);

  const sidebarClass = sidebar.isOpen ? "sidebar sidebar--open" : "sidebar";
  const resizeHandleClass = resizable.isResizing
    ? "sidebar__resize-handle sidebar__resize-handle--active"
    : "sidebar__resize-handle";
  const contentStyle = useMemo(
    () => (isDesktop ? { width: resizable.width } : undefined),
    [isDesktop, resizable.width]
  );

  return (
    <div className="main-screen">
      <aside className={sidebarClass}>
        <nav className="sidebar__nav" />
        <div className="sidebar__content" style={contentStyle}>
          <header className="sidebar__header" />
          <div className="sidebar__body" />
          <div className={resizeHandleClass} onMouseDown={resizable.handleMouseDown} />
        </div>
      </aside>

      <main className="main-content">
        <header className="main-content__header">
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Open menu"
            onPress={sidebar.open}
            className="main-content__menu-button"
          >
            <Bars />
          </Button>
          <div className="main-content__header-content" />
        </header>
        <div className="main-content__body" />
      </main>
    </div>
  );
});
