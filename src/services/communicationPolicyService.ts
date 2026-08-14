import { permissionService } from './permissionService';
import { PersonConversation } from '../types/communication';
import { World } from '../types/world';

const COOLDOWN_MS = 10000; // 10 seconds between P2P messages between same two people
const MAX_CONSECUTIVE_EXCHANGES = 5; // Max 5 turns without user intervention

const lastExchangeTimestamps: Record<string, number> = {};

export const communicationPolicyService = {
  async canCommunicate(
    world: World,
    senderId: string,
    recipientId: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    // 1. Check world level settings
    if (world.settings && world.settings.allowInterPersonCommunication === false) {
      return { allowed: false, reason: 'Inter-person communication is disabled in world settings.' };
    }

    // 2. Check sender permissions
    const perms = await permissionService.getPermissions(world.id, senderId);
    if (perms.communicateWithPeople === false) {
      return { allowed: false, reason: 'Sender lacks permission to communicate with people.' };
    }

    // 3. Check recipient permissions
    const recipientPerms = await permissionService.getPermissions(world.id, recipientId);
    if (recipientPerms.receiveMessages === false) {
      return { allowed: false, reason: 'Recipient is not configured to receive messages.' };
    }

    return { allowed: true };
  },

  isLoopLimitReached(conversation: PersonConversation): boolean {
    return conversation.exchangeCount >= MAX_CONSECUTIVE_EXCHANGES;
  },

  checkCooldown(senderId: string, recipientId: string): { onCooldown: boolean; remainingMs: number } {
    const pairKey = [senderId, recipientId].sort().join(':');
    const lastTime = lastExchangeTimestamps[pairKey] || 0;
    const now = Date.now();
    const elapsed = now - lastTime;

    if (elapsed < COOLDOWN_MS) {
      return { onCooldown: true, remainingMs: COOLDOWN_MS - elapsed };
    }

    return { onCooldown: false, remainingMs: 0 };
  },

  recordExchange(senderId: string, recipientId: string): void {
    const pairKey = [senderId, recipientId].sort().join(':');
    lastExchangeTimestamps[pairKey] = Date.now();
  },
};
