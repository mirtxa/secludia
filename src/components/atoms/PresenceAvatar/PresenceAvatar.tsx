import { memo } from "react";
import { Avatar } from "@heroui/react";
import { PRESENCE_RING_COLORS } from "@/constants";
import type { Presence } from "@/context";
import { cn, getInitials } from "@/utils";
import "./PresenceAvatar.css";

export interface PresenceAvatarProps {
  name: string;
  avatarUrl?: string;
  presence: Presence;
  size?: "sm" | "md" | "lg";
  /** Show red pulsing ring when media (mic/camera/screen) is active */
  mediaActive?: boolean;
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
  mediaActive = false,
}: PresenceAvatarProps) {
  const initials = getInitials(name);
  const { avatar, ring } = SIZE_CLASSES[size];

  const presenceColor = PRESENCE_RING_COLORS[presence];
  const ringClass = mediaActive
    ? "ring-offset-background presence-avatar--media-active"
    : cn(ring, presenceColor, "ring-offset-background");

  return (
    <Avatar className={cn(avatar, ringClass)} data-presence={presence}>
      {avatarUrl && <Avatar.Image alt={name} src={avatarUrl} />}
      <Avatar.Fallback>{initials}</Avatar.Fallback>
    </Avatar>
  );
});
