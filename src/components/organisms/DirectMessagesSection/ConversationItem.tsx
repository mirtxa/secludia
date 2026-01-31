import { memo, useCallback } from "react";
import { CircleCheckFill } from "@gravity-ui/icons";
import { PresenceAvatar } from "@/components/atoms";
import type { Presence } from "@/context";

interface ConversationItemProps {
  displayName: string | null;
  username: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageIsFromMe: boolean;
  meLabel: string;
  presence?: Presence;
  isActive?: boolean;
  isSelected?: boolean;
  onClick: () => void;
  onSelectToggle: () => void;
}

export const ConversationItem = memo(function ConversationItem(props: ConversationItemProps) {
  const {
    displayName,
    username,
    avatarUrl,
    lastMessage,
    lastMessageIsFromMe,
    meLabel,
    presence = "offline",
    isActive = false,
    isSelected = false,
    onClick,
    onSelectToggle,
  } = props;
  const name = displayName ?? username;
  const senderPrefix = lastMessageIsFromMe ? meLabel : name;

  const handleAvatarClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectToggle();
    },
    [onSelectToggle]
  );

  const handleAvatarKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        onSelectToggle();
      }
    },
    [onSelectToggle]
  );

  const stateClass = isActive
    ? "bg-accent text-accent-foreground"
    : isSelected
      ? "bg-transparent text-foreground hover:bg-default"
      : "bg-transparent text-muted hover:bg-default hover:text-foreground";

  const avatarBorderClass = isActive ? "border-background" : "border-transparent";

  return (
    <button
      type="button"
      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border-none px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${stateClass}`}
      onClick={onClick}
    >
      <div
        role="checkbox"
        aria-checked={isSelected}
        tabIndex={0}
        className="shrink-0 cursor-pointer"
        onClick={handleAvatarClick}
        onKeyDown={handleAvatarKeyDown}
      >
        <div className="flex size-10 items-center justify-center">
          {isSelected ? (
            <div className="relative flex size-10 items-center justify-center">
              <div className="absolute inset-1 rounded-full bg-accent-foreground" />
              <CircleCheckFill className="relative size-10 text-accent" />
            </div>
          ) : (
            <div className={`rounded-full border-4 ${avatarBorderClass}`}>
              <PresenceAvatar name={name} avatarUrl={avatarUrl} presence={presence} size="sm" />
            </div>
          )}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="w-full truncate text-sm font-medium">{name}</span>
        <span className="w-full truncate text-xs text-foreground-500">
          {senderPrefix}: {lastMessage}
        </span>
      </div>
    </button>
  );
});
