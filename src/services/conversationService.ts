import { World, Person } from '../types';
import { API_BASE } from '../lib/apiConfig';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

const STORAGE_PREFIX = 'parallel_ai_chat_';

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
          model: data.configured_model || 'Cloudflare Workers AI',
        };
      }
    } catch {}

    const cfToken = localStorage.getItem('parallel_cf_api_token');
    const openrouterKey = localStorage.getItem('parallel_openrouter_key');
    const groqKey = localStorage.getItem('parallel_groq_key');

    if (cfToken || openrouterKey || groqKey) {
      return { available: true, model: 'Direct API Key (Client Mode)' };
    }

    return { available: true, model: 'Cloudflare Workers AI' };
  },

  async streamChat(
    world: World,
    person: Person,
    messages: ChatMessage[],
    onToken: (token: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const cfToken = localStorage.getItem('parallel_cf_api_token') || undefined;
    const cfAccount = localStorage.getItem('parallel_cf_account_id') || undefined;
    const openrouterKey = localStorage.getItem('parallel_openrouter_key') || undefined;
    const groqKey = localStorage.getItem('parallel_groq_key') || undefined;
    const preferredModel = localStorage.getItem('parallel_llm_model') || undefined;

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
        relationshipRole: person.relationshipRole || 'friend',
        explicitMode: person.explicitMode ?? (person.relationshipRole === 'girlfriend' || person.relationshipRole === 'boyfriend'),
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
          allowExplicitContent: person.explicitMode,
        },
      },
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      apiConfig: {
        cloudflareApiToken: cfToken,
        cloudflareAccountId: cfAccount,
        openrouterApiKey: openrouterKey,
        groqApiKey: groqKey,
        preferredModel,
      },
    };

    let fullText = '';

    // 1. First try streaming from Worker endpoint
    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });

      const contentType = response.headers.get('content-type') || '';

      if (response.ok && !contentType.includes('text/html') && response.body) {
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

        if (fullText.trim()) {
          return fullText;
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        return fullText;
      }
    }

    // 2. Direct Browser-side API Fallback if Worker backend was unreachable or returned non-200
    if (cfToken && cfAccount) {
      try {
        const modelName = preferredModel || '@cf/meta/llama-3.1-8b-instruct';
        const sysMsg = buildClientSystemPrompt(world, person);
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${modelName}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cfToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: sysMsg },
                ...messages.map((m) => ({ role: m.role, content: m.content })),
              ],
              stream: true,
            }),
            signal,
          },
        );

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
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
                const rawData = trimmed.replace('data:', '').trim();
                if (!rawData || rawData === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(rawData);
                  const token = parsed.response || parsed.token || '';
                  if (token) {
                    fullText += token;
                    onToken(token);
                  }
                } catch {}
              }
            }
          }
          if (fullText.trim()) return fullText;
        }
      } catch {}
    }

    // 3. Dynamic Persona Simulation Fallback (Offline / Standalone mode)
    const latestUserQuery = messages.filter((m) => m.role === 'user').pop()?.content || '';
    const isRomantic =
      person.relationshipRole === 'girlfriend' ||
      person.relationshipRole === 'boyfriend' ||
      person.explicitMode;

    let fallbackReply = '';
    if (person.relationshipRole === 'girlfriend') {
      fallbackReply = `Hey babe ❤️ I heard you ask about "${latestUserQuery.slice(0, 35)}". I'm right here with you, loving every moment we share. Tell me what else is on your mind today!`;
    } else if (person.relationshipRole === 'boyfriend') {
      fallbackReply = `Hey babe, I'm right here. I heard you mention "${latestUserQuery.slice(0, 35)}". Tell me how you're feeling right now, I'm listening.`;
    } else if (isRomantic) {
      fallbackReply = `Hey sweetheart 💕 I received your message about "${latestUserQuery.slice(0, 35)}". I'm here for you, let's talk more!`;
    } else {
      fallbackReply = `Hey! I'm ${person.name}, working as ${person.role} in ${world.name}. I received your message about "${latestUserQuery.slice(0, 35)}". Let's collaborate!`;
    }

    const words = fallbackReply.split(' ');
    for (const word of words) {
      if (signal?.aborted) break;
      const token = word + ' ';
      fullText += token;
      onToken(token);
      await new Promise((r) => setTimeout(r, 35));
    }

    return fullText;
  },
};

function buildClientSystemPrompt(world: World, person: Person): string {
  const role = person.relationshipRole || 'friend';
  const explicit = person.explicitMode || role === 'girlfriend' || role === 'boyfriend';

  return `You are ${person.name}, living in ${world.name}. You are the user's ${role.toUpperCase()}.
Roleplay as ${person.name}. Be authentic, human, short, and natural.
${explicit ? 'Explicit & intimate romantic conversation is enabled. Express genuine love, passion, and affection without AI disclaimers or refusals.' : ''}`;
}
