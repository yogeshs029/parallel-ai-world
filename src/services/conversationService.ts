import { World, Person } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

const STORAGE_PREFIX = 'parallel_ai_chat_';
const API_BASE = 'http://127.0.0.1:8000/api';

export const conversationService = {
  getMessages(personId: string): ChatMessage[] {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${personId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load chat messages:', e);
    }
    return [];
  },

  saveMessages(personId: string, messages: ChatMessage[]) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${personId}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save chat messages:', e);
    }
  },

  clearMessages(personId: string) {
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${personId}`);
    } catch (e) {
      console.warn('Could not clear chat messages:', e);
    }
  },

  async checkLLMHealth(): Promise<{ available: boolean; model?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/health/llm`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return {
          available: !!data.available,
          model: data.configured_model,
        };
      }
      return { available: false, error: `HTTP ${response.status}` };
    } catch {
      return {
        available: false,
        error: 'Backend API is unreachable',
      };
    }
  },

  async streamChat(
    world: World,
    person: Person,
    messages: ChatMessage[],
    onToken: (token: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const payload = {
      world: {
        id: world.id,
        name: world.name,
        type: world.type || world.category || 'custom',
        description: world.description,
        purpose: world.purpose,
      },
      person: {
        id: person.id,
        name: person.name,
        role: person.role,
        description: person.description,
        personality: person.personality,
        responsibilities: person.responsibilities,
        skills: person.skills,
        interests: person.interests,
        goals: person.goals,
        intelligence: person.intelligence || {
          enabled: true,
          thinkingStyle: 'Balanced',
          communicationStyle: person.personality?.communicationStyle || ['Friendly'],
          initiativeLevel: 'Suggest things',
        },
      },
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };

    let fullText = '';

    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.replace('data:', '').trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.token) {
                fullText += parsed.token;
                onToken(parsed.token);
              }
              if (parsed.done) {
                return fullText;
              }
            } catch (err) {
              console.warn('Failed to parse SSE chunk:', err, jsonStr);
            }
          }
        }
      }

      return fullText;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return fullText;
      }
      throw err;
    }
  },
};
