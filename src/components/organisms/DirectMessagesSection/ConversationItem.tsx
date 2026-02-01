import { memo } from "react";
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
}

export const ConversationItem = memo(function ConversationItem({
  displayName,
  username,
  avatarUrl,
  lastMessage,
  lastMessageIsFromMe,
  meLabel,
  presence = "offline",
  isActive = false,
}: ConversationItemProps) {
  const name = displayName ?? username;
  const senderPrefix = lastMessageIsFromMe ? meLabel : name;
  const avatarBorderClass = isActive ? "border-background" : "border-transparent";

  return (
    <>
      <div className={`shrink-0 rounded-full border-4 ${avatarBorderClass}`}>
        <PresenceAvatar name={name} avatarUrl={avatarUrl} presence={presence} size="sm" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="w-full truncate text-sm font-medium">{name}</span>
        <span className="w-full truncate text-xs opacity-70">
          {senderPrefix}: {lastMessage}
        </span>
      </div>
    </>
  );
});
