import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bars, CommentFill, Gear, Hashtag, Plus } from "@gravity-ui/icons";
import { Avatar, Button, Separator, Skeleton, useOverlayState } from "@heroui/react";
import { EncryptionChip, NavBarButton, PresenceAvatar, Scrollbar } from "@/components/atoms";
import { PrivacyIndicatorModal } from "@/components/molecules";
import {
  DirectMessagesSection,
  NotificationPermissionAlert,
  SettingsModal,
  type Conversation,
} from "@/components/organisms";
import { SIDEBAR_WIDTH, SIMULATED_LOADING_DELAY } from "@/constants";
import { useAppContext, useMediaRegistry, useUserContext, type RoomType } from "@/context";
import { useBreakpoint, useResizable, useSidebar } from "@/hooks";
import { MOCK_CONVERSATIONS, MOCK_ROOMS } from "@/mocks";
import { cn, getInitials } from "@/utils";
import type { MainScreenProps } from "./MainScreen.types";
import "./MainScreen.css";

const SIDEBAR_WIDTH_OPTIONS = {
  minWidth: SIDEBAR_WIDTH.min,
  maxWidth: SIDEBAR_WIDTH.max,
  defaultWidth: SIDEBAR_WIDTH.default,
};

export const MainScreen = memo(function MainScreen(_: MainScreenProps) {
  const { selectedRoom, setSelectedRoom, t } = useAppContext();
  const { user, presence } = useUserContext();
  const { hasActiveMedia } = useMediaRegistry();
  const sidebar = useSidebar();
  const isDesktop = useBreakpoint("md");
  const resizable = useResizable(SIDEBAR_WIDTH_OPTIONS);
  const settingsState = useOverlayState();
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [roomsHasScroll, setRoomsHasScroll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const roomsWrapperRef = useRef<HTMLDivElement>(null);
  const roomsContentRef = useRef<HTMLDivElement>(null);
  const hasInitializedConversation = useRef(false);

  // Simulate loading state and auto-select first conversation on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      if (!hasInitializedConversation.current && MOCK_CONVERSATIONS.length > 0) {
        hasInitializedConversation.current = true;
        const first = MOCK_CONVERSATIONS[0];
        setActiveConversation({
          id: first.id,
          userId: first.userId,
          displayName: first.displayName,
          username: first.username,
          avatarUrl: first.avatarUrl,
          presence: first.presence,
          isEncrypted: first.isEncrypted,
        });
      }
    }, SIMULATED_LOADING_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const handleConversationSelect = useCallback(
    (conversation: Conversation) => {
      setActiveConversation(conversation);
      if (!isDesktop) {
        sidebar.close();
      }
    },
    [isDesktop, sidebar]
  );

  // Memoize translated label to prevent unnecessary effect re-runs
  const dmLabel = useMemo(() => t("NAV_DIRECT_MESSAGES"), [t]);

  const isTablet = useBreakpoint("sm") && !isDesktop;

  const handleNavSelect = useCallback(
    (id: string | number, name: string, type: RoomType) => {
      setSelectedRoom({ id, name, type });
      if (isTablet && type !== "group") {
        sidebar.open();
      } else if (isTablet && type === "group") {
        sidebar.close();
      }
    },
    [setSelectedRoom, isTablet, sidebar]
  );

  useEffect(() => {
    setSelectedRoom({ id: "dm", name: dmLabel, type: "dm" });
  }, [setSelectedRoom, dmLabel]);

  useEffect(() => {
    const checkScroll = () => {
      const wrapper = roomsWrapperRef.current;
      const content = roomsContentRef.current;
      if (wrapper && content) {
        setRoomsHasScroll(content.scrollHeight > wrapper.clientHeight);
      }
    };

    checkScroll();

    const resizeObserver = new ResizeObserver(checkScroll);
    if (roomsWrapperRef.current) {
      resizeObserver.observe(roomsWrapperRef.current);
    }
    if (roomsContentRef.current) {
      resizeObserver.observe(roomsContentRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const isDmEmpty = selectedRoom?.type === "dm" && !isLoading && MOCK_CONVERSATIONS.length === 0;
  const sidebarClass = cn(
    "sidebar",
    sidebar.isOpen && "sidebar--open",
    isDmEmpty && "sidebar--dm-empty"
  );
  const resizeHandleClass = cn(
    "sidebar__resize-handle",
    resizable.isResizing && "sidebar__resize-handle--active"
  );
  const contentStyle = useMemo(
    () => (isDesktop ? { width: resizable.width } : undefined),
    [isDesktop, resizable.width]
  );

  return (
    <div className="main-screen">
      <aside className={sidebarClass}>
        <nav className="sidebar__nav" aria-label="Main navigation">
          <div className="sidebar__nav-top">
            <NavBarButton
              label={dmLabel}
              selected={selectedRoom?.id === "dm"}
              onPress={() => handleNavSelect("dm", dmLabel, "dm")}
            >
              <Avatar className="size-10 rounded-lg">
                <Avatar.Fallback className="rounded-lg">
                  <CommentFill />
                </Avatar.Fallback>
              </Avatar>
            </NavBarButton>
            <Separator className="w-10" />
          </div>

          <div ref={roomsWrapperRef} className="sidebar__nav-scroll-wrapper">
            <Scrollbar className="sidebar__nav-scroll">
              <div ref={roomsContentRef} className="sidebar__nav-rooms">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex h-14 items-center justify-center">
                        <Skeleton className="size-10 rounded-lg" />
                      </div>
                    ))
                  : MOCK_ROOMS.map((room) => (
                      <NavBarButton
                        key={room.id}
                        label={room.name}
                        selected={selectedRoom?.id === room.id}
                        onPress={() => handleNavSelect(room.id, room.name, room.type)}
                      >
                        <div className="relative">
                          <Avatar className="size-10 rounded-lg">
                            {room.image && (
                              <Avatar.Image
                                alt={room.name}
                                src={room.image}
                                className="rounded-lg"
                              />
                            )}
                            <Avatar.Fallback className="rounded-lg">
                              {getInitials(room.name)}
                            </Avatar.Fallback>
                          </Avatar>
                          {room.type === "space" && (
                            <div className="space-badge absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-default ring-2 ring-background">
                              <Hashtag className="size-2.5 text-muted" />
                            </div>
                          )}
                        </div>
                      </NavBarButton>
                    ))}
              </div>
            </Scrollbar>
          </div>

          <div className="sidebar__nav-bottom">
            {roomsHasScroll && <Separator className="w-10" />}
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
              onPress={settingsState.open}
            >
              <Avatar className="size-10 rounded-lg">
                <Avatar.Fallback className="rounded-lg">
                  <Gear />
                </Avatar.Fallback>
              </Avatar>
            </NavBarButton>

            <div className="mt-3">
              {isLoading ? (
                <div className="flex h-14 items-center justify-center">
                  <Skeleton className="size-10 rounded-full" />
                </div>
              ) : (
                <PrivacyIndicatorModal>
                  <PresenceAvatar
                    name={user?.displayName ?? ""}
                    avatarUrl={user?.avatarUrl ?? undefined}
                    presence={presence}
                    size="md"
                    mediaActive={hasActiveMedia}
                  />
                </PrivacyIndicatorModal>
              )}
            </div>
          </div>
        </nav>
        {selectedRoom?.type !== "group" && (
          <div className="sidebar__content" style={contentStyle}>
            {selectedRoom?.type === "dm" && (
              <DirectMessagesSection
                activeConversationId={activeConversation?.id}
                onConversationSelect={handleConversationSelect}
              />
            )}
            <div className={resizeHandleClass} onMouseDown={resizable.handleMouseDown} />
          </div>
        )}
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
          <div className="main-content__header-content flex items-center gap-3 px-3">
            {activeConversation && (
              <>
                <PresenceAvatar
                  name={activeConversation.displayName ?? activeConversation.username}
                  avatarUrl={activeConversation.avatarUrl}
                  presence={activeConversation.presence}
                  size="sm"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {activeConversation.displayName ?? activeConversation.username}
                </span>
                <div className="ml-auto shrink-0">
                  <EncryptionChip isEncrypted={activeConversation.isEncrypted} />
                </div>
              </>
            )}
          </div>
        </header>
        <Scrollbar className="main-content__body" />
        <NotificationPermissionAlert />
      </main>

      <SettingsModal state={settingsState} />
    </div>
  );
});
