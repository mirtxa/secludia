import type { Presence } from "@/context";

export interface Conversation {
  id: string;
  userId: string;
  displayName: string | null;
  username: string;
  avatarUrl?: string;
  presence: Presence;
  isEncrypted: boolean;
}

export interface DirectMessagesSectionProps {
  activeConversationId?: string;
  onConversationSelect?: (conversation: Conversation) => void;
}
