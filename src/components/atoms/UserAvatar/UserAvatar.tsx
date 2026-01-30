import { memo } from "react";
import { Pencil } from "@gravity-ui/icons";
import { Avatar } from "@heroui/react";
import { useUserContext, type Presence } from "@/context";
import type { UserAvatarProps } from "./UserAvatar.types";

const PRESENCE_RING_COLORS: Record<Presence, string> = {
  online: "ring-success",
  offline: "ring-muted",
  unavailable: "ring-warning",
};

const SIZE_CLASSES: Record<
  NonNullable<UserAvatarProps["size"]>,
  { avatar: string; ring: string; button: string; icon: string }
> = {
  sm: { avatar: "size-8 text-xs", ring: "ring-1", button: "size-5", icon: "size-3" },
  md: { avatar: "size-10 text-sm", ring: "ring-2", button: "size-6", icon: "size-3.5" },
  lg: { avatar: "size-24 text-3xl", ring: "ring-3", button: "size-7", icon: "size-4" },
};

export const UserAvatar = memo(function UserAvatar({
  size = "md",
  showPresenceRing = true,
  showEditButton = false,
  onEditClick,
}: UserAvatarProps) {
  const { user, presence } = useUserContext();
  const sizeClasses = SIZE_CLASSES[size];

  if (!user) {
    return (
      <Avatar className={sizeClasses.avatar}>
        <Avatar.Fallback>?</Avatar.Fallback>
      </Avatar>
    );
  }

  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("");

  const ringClasses = showPresenceRing
    ? `${sizeClasses.ring} ${PRESENCE_RING_COLORS[presence]} ring-offset-2 ring-offset-background`
    : "";

  return (
    <div className="relative">
      <Avatar className={`${sizeClasses.avatar} ${ringClasses}`}>
        {user.avatarUrl && <Avatar.Image alt={user.displayName} src={user.avatarUrl} />}
        <Avatar.Fallback>{initials}</Avatar.Fallback>
      </Avatar>
      {showEditButton && onEditClick && (
        <button
          type="button"
          className={`absolute right-0 bottom-0 ${sizeClasses.button} flex items-center justify-center rounded-full bg-accent text-on-accent ring-2 ring-background transition-transform hover:scale-125 cursor-pointer border-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
          onClick={onEditClick}
        >
          <Pencil className={sizeClasses.icon} />
        </button>
      )}
    </div>
  );
});
