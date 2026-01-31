import { memo } from "react";
import { Avatar } from "@heroui/react";
import { PRESENCE_RING_COLORS } from "@/constants";
import type { Presence } from "@/context";
import { getInitials } from "@/utils";

export interface PresenceAvatarProps {
  name: string;
  avatarUrl?: string;
  presence: Presence;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: { avatar: "size-8 text-xs", ring: "ring-2 ring-offset-1" },
  md: { avatar: "size-10 text-sm", ring: "ring-3 ring-offset-1" },
  lg: { avatar: "size-24 text-3xl", ring: "ring-4 ring-offset-2" },
} as const;

export const PresenceAvatar = memo(function PresenceAvatar({
  name,
  avatarUrl,
  presence,
  size = "sm",
}: PresenceAvatarProps) {
  const initials = getInitials(name);
  const { avatar, ring } = SIZE_CLASSES[size];
  const ringClass = `${ring} ${PRESENCE_RING_COLORS[presence]} ring-offset-background`;

  return (
    <Avatar className={`${avatar} ${ringClass}`}>
      {avatarUrl && <Avatar.Image alt={name} src={avatarUrl} />}
      <Avatar.Fallback>{initials}</Avatar.Fallback>
    </Avatar>
  );
});
