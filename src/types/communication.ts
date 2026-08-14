export type ConversationType = 'DIRECT' | 'USER_PERSON' | 'GROUP';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface PersonToPersonMessage {
  id: string;
  worldId: string;
  conversationId: string;
  senderPersonId: string;
  recipientPersonId: string;
  senderName?: string;
  senderAvatarEmoji?: string;
  content: string;
  createdAt: string;
  status: MessageStatus;
  metadata?: Record<string, unknown>;
}

export interface PersonConversation {
  id: string;
  worldId: string;
  type: ConversationType;
  participantIds: string[];
  topic?: string;
  lastMessage?: PersonToPersonMessage;
  lastActivityAt: string;
  exchangeCount: number;
  status: 'active' | 'completed' | 'paused';
  summary?: string;
  createdAt: string;
}
