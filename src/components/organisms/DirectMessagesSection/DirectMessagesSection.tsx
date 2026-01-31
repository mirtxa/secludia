import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { PersonPlus, TrashBin } from "@gravity-ui/icons";
import { Button, Modal, SearchField, Skeleton } from "@heroui/react";
import { Scrollbar } from "@/components/atoms";
import { useAppContext } from "@/context";
import { MOCK_CONVERSATIONS } from "@/mocks";
import { ConversationItem } from "./ConversationItem";
import type { DirectMessagesSectionProps } from "./DirectMessagesSection.types";
import "./DirectMessagesSection.css";

export const DirectMessagesSection = memo(function DirectMessagesSection({
  activeConversationId,
  onConversationSelect,
}: DirectMessagesSectionProps) {
  const { t } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state (replace with actual data fetching logic)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
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

  const handleConversationClick = useCallback(
    (conv: (typeof MOCK_CONVERSATIONS)[number]) => {
      onConversationSelect?.({
        id: conv.id,
        userId: conv.userId,
        displayName: conv.displayName,
        username: conv.username,
        avatarUrl: conv.avatarUrl,
        presence: conv.presence,
        isEncrypted: conv.isEncrypted,
      });
    },
    [onConversationSelect]
  );

  const handleSelectToggle = useCallback((convId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(convId)) {
        next.delete(convId);
      } else {
        next.add(convId);
      }
      return next;
    });
  }, []);

  const handleDeleteSelected = useCallback(() => {
    // TODO: Implement delete conversations
    console.log("Delete conversations:", Array.from(selectedIds));
    setSelectedIds(new Set());
  }, [selectedIds]);

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
              <SearchField.Input
                className="dm-search-input"
                placeholder={t("DM_SEARCH_PLACEHOLDER")}
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>

        <Modal>
          <Button
            variant="ghost"
            aria-label={t("DM_NEW_CHAT")}
            className="size-9 min-w-0 shrink-0 rounded-lg p-0"
          >
            <PersonPlus />
          </Button>
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
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                displayName={conv.displayName}
                username={conv.username}
                avatarUrl={conv.avatarUrl}
                lastMessage={conv.lastMessage}
                lastMessageIsFromMe={conv.lastMessageIsFromMe}
                meLabel={t("DM_ME")}
                presence={conv.presence}
                isActive={activeConversationId === conv.id}
                isSelected={selectedIds.has(conv.id)}
                onClick={() => handleConversationClick(conv)}
                onSelectToggle={() => handleSelectToggle(conv.id)}
              />
            ))
          ) : searchQuery.trim() ? (
            <p className="px-3 py-4 text-center text-sm text-foreground-500">
              {t("DM_NO_RESULTS")}
            </p>
          ) : (
            <p className="px-3 py-4 text-center text-sm text-foreground-500">
              {t("DM_NO_CONVERSATIONS")}
            </p>
          )}
        </div>
      </Scrollbar>

      {selectedIds.size > 0 && (
        <div className="shrink-0 border-t border-border px-3 py-2">
          <Button variant="danger" className="w-full" onPress={handleDeleteSelected}>
            <TrashBin />
            {selectedIds.size === 1 ? t("DM_DELETE_CONVERSATION") : t("DM_DELETE_CONVERSATIONS")}
          </Button>
        </div>
      )}
    </>
  );
});
