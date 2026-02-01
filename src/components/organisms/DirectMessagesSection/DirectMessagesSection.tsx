import type { Selection } from "@heroui/react";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { PersonPlus } from "@gravity-ui/icons";
import { Button, ListBox, Modal, SearchField, Skeleton, useOverlayState } from "@heroui/react";
import { Scrollbar } from "@/components/atoms";
import { GhostEmptyState } from "@/components/molecules";
import { SIMULATED_LOADING_DELAY } from "@/constants";
import { useAppContext } from "@/context";
import { MOCK_CONVERSATIONS } from "@/mocks";
import { ConversationItem } from "./ConversationItem";
import type { DirectMessagesSectionProps } from "./DirectMessagesSection.types";

export const DirectMessagesSection = memo(function DirectMessagesSection({
  activeConversationId,
  onConversationSelect,
}: DirectMessagesSectionProps) {
  const { t } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const newChatModal = useOverlayState();

  // Simulate loading state (replace with actual data fetching logic)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), SIMULATED_LOADING_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_CONVERSATIONS;
    const query = searchQuery.toLowerCase();
    return MOCK_CONVERSATIONS.filter(
      (conv) =>
        conv.displayName?.toLowerCase().includes(query) ||
        conv.username.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const selectedKeys = useMemo(
    () => (activeConversationId ? new Set([activeConversationId]) : new Set<string>()),
    [activeConversationId]
  );

  const handleSelectionChange = useCallback(
    (keys: Selection) => {
      if (keys === "all") return;
      const selectedId = Array.from(keys)[0] as string | undefined;
      if (!selectedId) return;

      const conv = MOCK_CONVERSATIONS.find((c) => c.id === selectedId);
      if (conv) {
        onConversationSelect?.({
          id: conv.id,
          userId: conv.userId,
          displayName: conv.displayName,
          username: conv.username,
          avatarUrl: conv.avatarUrl,
          presence: conv.presence,
          isEncrypted: conv.isEncrypted,
        });
      }
    },
    [onConversationSelect]
  );

  return (
    <>
      <header className="sidebar__header flex items-center gap-2 px-3">
        <div className="min-w-0 flex-1">
          <SearchField
            aria-label={t("DM_SEARCH_PLACEHOLDER")}
            value={searchQuery}
            onChange={setSearchQuery}
            variant="secondary"
            fullWidth
          >
            <SearchField.Group className="h-9 rounded-lg">
              <SearchField.Input className="min-w-0" placeholder={t("DM_SEARCH_PLACEHOLDER")} />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>

        <Button
          variant="ghost"
          aria-label={t("DM_NEW_CHAT")}
          className="size-9 min-w-0 shrink-0 rounded-lg p-0"
          onPress={newChatModal.open}
        >
          <PersonPlus />
        </Button>

        <Modal state={newChatModal}>
          <Modal.Backdrop>
            <Modal.Container size="sm">
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>{t("DM_NEW_CHAT")}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <SearchField
                    aria-label={t("DM_SEARCH_USERS")}
                    value={userSearchQuery}
                    onChange={setUserSearchQuery}
                    fullWidth
                  >
                    <SearchField.Group>
                      <SearchField.SearchIcon />
                      <SearchField.Input placeholder={t("DM_SEARCH_USERS")} />
                      <SearchField.ClearButton />
                    </SearchField.Group>
                  </SearchField>
                  {userSearchQuery.trim() && (
                    <p className="mt-3 text-sm text-muted">{t("DM_SEARCH_USERS_HINT")}</p>
                  )}
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </header>

      {!isLoading && filteredConversations.length === 0 && !searchQuery.trim() ? (
        <div className="sidebar__body">
          <GhostEmptyState
            text={t("DM_EMPTY_STATE")}
            actionLabel={t("DM_NEW_CHAT")}
            onAction={newChatModal.open}
          />
        </div>
      ) : (
        <Scrollbar className="sidebar__body">
          <div className="flex flex-col gap-1 px-2 py-2">
            {isLoading ? (
              Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="flex w-full items-center gap-3 rounded-lg px-3 py-2">
                  <div className="shrink-0">
                    <Skeleton className="size-8 rounded-full ring-1 ring-transparent ring-offset-2 ring-offset-transparent" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
                    <Skeleton className="h-5 w-24 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                  </div>
                </div>
              ))
            ) : filteredConversations.length > 0 ? (
              <ListBox
                aria-label={t("NAV_DIRECT_MESSAGES")}
                selectionMode="single"
                selectedKeys={selectedKeys}
                onSelectionChange={handleSelectionChange}
                className="flex flex-col gap-1"
              >
                {filteredConversations.map((conv) => (
                  <ListBox.Item
                    key={conv.id}
                    id={conv.id}
                    textValue={conv.displayName ?? conv.username}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-muted outline-none data-[hovered]:bg-default data-[hovered]:text-foreground data-[selected]:bg-accent data-[selected]:text-accent-foreground data-[focus-visible]:outline-2 data-[focus-visible]:outline-accent data-[focus-visible]:outline-offset-2"
                  >
                    <ConversationItem
                      displayName={conv.displayName}
                      username={conv.username}
                      avatarUrl={conv.avatarUrl}
                      lastMessage={conv.lastMessage}
                      lastMessageIsFromMe={conv.lastMessageIsFromMe}
                      meLabel={t("DM_ME")}
                      presence={conv.presence}
                      isActive={activeConversationId === conv.id}
                    />
                  </ListBox.Item>
                ))}
              </ListBox>
            ) : (
              <p className="px-3 py-4 text-center text-sm text-foreground-500">
                {t("DM_NO_RESULTS")}
              </p>
            )}
          </div>
        </Scrollbar>
      )}
    </>
  );
});
