export interface UserAvatarProps {
  size?: "sm" | "md" | "lg";
  showPresenceRing?: boolean;
  showEditButton?: boolean;
  onEditClick?: () => void;
}
