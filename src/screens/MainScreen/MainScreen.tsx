import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Bars, CommentDot, Gear, Plus } from "@gravity-ui/icons";
import { Avatar, Button, Separator } from "@heroui/react";
import { NavBarButton, UserAvatar } from "@/components/atoms";
import { SettingsModal } from "@/components/organisms";
import { useAppContext, useUserContext } from "@/context";
import { useBreakpoint, useResizable, useSidebar } from "@/hooks";
import type { MainScreenProps } from "./MainScreen.types";
import "./MainScreen.css";

const ROOMS = [
  { id: 1, name: "Bob Martinez", image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=2" },
  { id: 2, name: "Carol Davis", image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=3" },
  { id: 3, name: "Dan Wilson", image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=4" },
  { id: 4, name: "Emma Brown", image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=5" },
  { id: 5, name: "Frank Lee", image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=6" },
  { id: 6, name: "Grace Kim", image: "https://img.heroui.chat/image/avatar?w=200&h=200&u=7" },
];

const SIDEBAR_WIDTH_OPTIONS = { minWidth: 180, maxWidth: 348, defaultWidth: 280 };

export const MainScreen = memo(function MainScreen(_props: MainScreenProps) {
  const { selectedRoom, setSelectedRoom, t } = useAppContext();
  const { user } = useUserContext();
  const sidebar = useSidebar();
  const isDesktop = useBreakpoint("md");
  const resizable = useResizable(SIDEBAR_WIDTH_OPTIONS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const dmLabel = t("NAV_DIRECT_MESSAGES");

  const handleNavSelect = useCallback(
    (id: string | number, name: string) => {
      setSelectedRoom({ id, name });
    },
    [setSelectedRoom]
  );

  useEffect(() => {
    setSelectedRoom({ id: "dm", name: dmLabel });
  }, [setSelectedRoom, dmLabel]);

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
        <nav className="sidebar__nav">
          <NavBarButton
            label={dmLabel}
            selected={selectedRoom?.id === "dm"}
            onPress={() => handleNavSelect("dm", dmLabel)}
          >
            <Avatar className="size-10 rounded-lg">
              <Avatar.Fallback className="rounded-lg">
                <CommentDot />
              </Avatar.Fallback>
            </Avatar>
          </NavBarButton>

          <Separator className="w-10" />

          {ROOMS.map((room) => (
            <NavBarButton
              key={room.id}
              label={room.name}
              selected={selectedRoom?.id === room.id}
              onPress={() => handleNavSelect(room.id, room.name)}
            >
              <Avatar className="size-10 rounded-lg">
                <Avatar.Image alt={room.name} src={room.image} className="rounded-lg" />
                <Avatar.Fallback className="rounded-lg">
                  {room.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </Avatar.Fallback>
              </Avatar>
            </NavBarButton>
          ))}

          <div className="flex-1" />

          <NavBarButton label={t("NAV_ADD_ROOM")} showIndicator={false}>
            <Avatar className="size-10 rounded-lg">
              <Avatar.Fallback className="rounded-lg">
                <Plus />
              </Avatar.Fallback>
            </Avatar>
          </NavBarButton>

          <NavBarButton
            label={t("NAV_SETTINGS")}
            showIndicator={false}
            onPress={() => setIsSettingsOpen(true)}
          >
            <Avatar className="size-10 rounded-lg">
              <Avatar.Fallback className="rounded-lg">
                <Gear />
              </Avatar.Fallback>
            </Avatar>
          </NavBarButton>

          <NavBarButton label={user?.displayName ?? t("NAV_PROFILE")} showIndicator={false}>
            <UserAvatar size="md" showPresenceRing />
          </NavBarButton>
        </nav>
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

      <SettingsModal isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
});
