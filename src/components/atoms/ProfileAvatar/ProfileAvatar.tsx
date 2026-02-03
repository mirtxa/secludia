import { memo } from "react";
import { Pencil } from "@gravity-ui/icons";
import { PresenceAvatar } from "../PresenceAvatar";
import type { ProfileAvatarProps } from "./ProfileAvatar.types";

const EDIT_BUTTON_CLASSES = {
  sm: { button: "size-5", icon: "size-3" },
  md: { button: "size-6", icon: "size-3.5" },
  lg: { button: "size-7", icon: "size-4" },
} as const;

export const ProfileAvatar = memo(function ProfileAvatar({
  name,
  avatarUrl,
  presence,
  size = "md",
  showEditButton = false,
  onEditClick,
}: ProfileAvatarProps) {
  const avatar = (
    <PresenceAvatar name={name} avatarUrl={avatarUrl} presence={presence} size={size} />
  );

  if (!showEditButton || !onEditClick) {
    return avatar;
  }

  const { button, icon } = EDIT_BUTTON_CLASSES[size];

  return (
    <div className="relative">
      {avatar}
      <button
        type="button"
        className={`absolute right-0 bottom-0 ${button} flex cursor-pointer items-center justify-center rounded-full border-none bg-accent text-on-accent ring-2 ring-background transition-transform hover:scale-125 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2`}
        onClick={onEditClick}
      >
        <Pencil className={icon} />
      </button>
    </div>
  );
});
