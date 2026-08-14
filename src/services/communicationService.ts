import { PersonConversation, PersonToPersonMessage } from '../types/communication';
import { World, Person } from '../types';
import { communicationPolicyService } from './communicationPolicyService';
import { API_BASE } from '../lib/apiConfig';

const CONV_STORAGE_KEY = 'parallel_ai_conversations_v1';
const MSG_STORAGE_KEY = 'parallel_ai_p2p_messages_v1';

function getStoredConversations(worldId: string): PersonConversation[] {
  try {
    const raw = localStorage.getItem(`${CONV_STORAGE_KEY}:${worldId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading conversations from localStorage:', e);
  }
  return [];
}

function saveStoredConversations(worldId: string, list: PersonConversation[]): void {
  try {
    localStorage.setItem(`${CONV_STORAGE_KEY}:${worldId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving conversations to localStorage:', e);
  }
}

function getStoredMessages(conversationId: string): PersonToPersonMessage[] {
  try {
    const raw = localStorage.getItem(`${MSG_STORAGE_KEY}:${conversationId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading P2P messages from localStorage:', e);
  }
  return [];
}

function saveStoredMessages(conversationId: string, list: PersonToPersonMessage[]): void {
  try {
    localStorage.setItem(`${MSG_STORAGE_KEY}:${conversationId}`, JSON.stringify(list));
  } catch (e) {
    console.warn('Error saving P2P messages to localStorage:', e);
  }
}

export const communicationService = {
  async getConversations(worldId: string): Promise<PersonConversation[]> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/conversations`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend conversations API offline, using local store:', e);
    }
    return getStoredConversations(worldId);
  },

  async getConversationById(worldId: string, conversationId: string): Promise<PersonConversation | null> {
    const list = await this.getConversations(worldId);
    return list.find((c) => c.id === conversationId) || null;
  },

  async getMessages(conversationId: string): Promise<PersonToPersonMessage[]> {
    try {
      const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend messages API offline, using local store:', e);
    }
    return getStoredMessages(conversationId);
  },

  async createConversation(
    worldId: string,
    participantIds: string[],
    topic?: string,
  ): Promise<PersonConversation> {
    const newConv: PersonConversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      worldId,
      type: participantIds.length > 2 ? 'GROUP' : 'DIRECT',
      participantIds,
      topic: topic || 'Discussion',
      lastActivityAt: new Date().toISOString(),
      exchangeCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConv),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend create conversation API offline, saving locally:', e);
    }

    const current = getStoredConversations(worldId);
    const updated = [newConv, ...current];
    saveStoredConversations(worldId, updated);
    return newConv;
  },

  async sendMessage(
    world: World,
    conversationId: string,
    sender: Person,
    recipient: Person,
    content: string,
  ): Promise<PersonToPersonMessage> {
    // 1. Verify policy
    const policy = await communicationPolicyService.canCommunicate(world, sender.id, recipient.id);
    if (!policy.allowed) {
      throw new Error(policy.reason || 'Communication policy blocked message.');
    }

    const msg: PersonToPersonMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      worldId: world.id,
      conversationId,
      senderPersonId: sender.id,
      recipientPersonId: recipient.id,
      senderName: sender.name,
      senderAvatarEmoji: sender.avatar?.emoji || sender.avatarEmoji || '👤',
      content,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    // Save message locally & backend
    try {
      await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      });
    } catch (e) {
      console.warn('Backend sendMessage API offline, saving locally:', e);
    }

    const msgs = getStoredMessages(conversationId);
    saveStoredMessages(conversationId, [...msgs, msg]);

    // Update conversation state
    const convs = getStoredConversations(world.id);
    const updatedConvs = convs.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: msg,
          lastActivityAt: new Date().toISOString(),
          exchangeCount: c.exchangeCount + 1,
        };
      }
      return c;
    });
    saveStoredConversations(world.id, updatedConvs);

    communicationPolicyService.recordExchange(sender.id, recipient.id);

    return msg;
  },

  async userIntervene(
    worldId: string,
    conversationId: string,
    content: string,
  ): Promise<PersonToPersonMessage> {
    const userMsg: PersonToPersonMessage = {
      id: `user-msg-${Date.now()}`,
      worldId,
      conversationId,
      senderPersonId: 'user',
      recipientPersonId: 'all',
      senderName: 'You (Creator)',
      senderAvatarEmoji: '👤',
      content,
      createdAt: new Date().toISOString(),
      status: 'read',
    };

    const msgs = getStoredMessages(conversationId);
    saveStoredMessages(conversationId, [...msgs, userMsg]);

    // Reset loop exchange count so conversation can continue cleanly after user steering
    const convs = getStoredConversations(worldId);
    const updatedConvs = convs.map((c) => {
      if (c.id === conversationId) {
        return {
          ...c,
          lastMessage: userMsg,
          lastActivityAt: new Date().toISOString(),
          exchangeCount: 0,
        };
      }
      return c;
    });
    saveStoredConversations(worldId, updatedConvs);

    return userMsg;
  },
};
