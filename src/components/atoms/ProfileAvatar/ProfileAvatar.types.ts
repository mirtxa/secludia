import type { Presence } from "@/context";

export interface ProfileAvatarProps {
  /** User display name */
  name: string;
  /** User avatar URL */
  avatarUrl?: string;
  /** User presence status */
  presence: Presence;
  /** Avatar size */
  size?: "sm" | "md" | "lg";
  /** Show edit button overlay */
  showEditButton?: boolean;
  /** Called when edit button is clicked */
  onEditClick?: () => void;
}
