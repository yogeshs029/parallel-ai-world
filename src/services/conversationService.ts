import { World, Person } from '../types';
import { API_BASE } from '../lib/apiConfig';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

const STORAGE_PREFIX = 'parallel_ai_chat_';

export interface ActiveProviderStatus {
  id: string;
  name: string;
  model: string;
  isConfigured: boolean;
  statusLabel: string;
}

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

  async getLocalOllamaModels(): Promise<string[]> {
    const endpoints = [
      '/api/ollama/api/tags',
      'http://127.0.0.1:11434/api/tags',
      'http://localhost:11434/api/tags',
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          if (data.models && Array.isArray(data.models)) {
            return data.models.map((m: { name?: string; model?: string }) => m.name || m.model || '').filter(Boolean);
          }
        }
      } catch {}
    }
    return [];
  },

  getActiveProviderInfo(): ActiveProviderStatus {
    const provider = localStorage.getItem('parallel_active_llm_provider') || 'ollama';
    const groqKey = localStorage.getItem('parallel_groq_key') || '';
    const geminiKey = localStorage.getItem('parallel_gemini_key') || '';
    const openrouterKey = localStorage.getItem('parallel_openrouter_key') || '';
    const openaiKey = localStorage.getItem('parallel_openai_key') || '';
    const cfToken = localStorage.getItem('parallel_cf_api_token') || '';
    const model = localStorage.getItem(`parallel_model_${provider}`) || localStorage.getItem('parallel_llm_model') || '';

    switch (provider) {
      case 'ollama':
        return {
          id: 'ollama',
          name: 'Local Ollama',
          model: model || 'mistral:latest',
          isConfigured: true,
          statusLabel: `Local Ollama (${model || 'mistral:latest'})`,
        };
      case 'free':
        return {
          id: 'ollama',
          name: 'Local Ollama',
          model: model || 'mistral:latest',
          isConfigured: true,
          statusLabel: `Local Ollama (${model || 'mistral:latest'})`,
        };
      case 'lmstudio':
        return {
          id: 'lmstudio',
          name: 'LM Studio / Jan',
          model: model || 'local-model',
          isConfigured: true,
          statusLabel: 'LM Studio Local Server (Port 1234)',
        };
      case 'groq':
        return {
          id: 'groq',
          name: 'Groq',
          model: model || 'llama-3.3-70b-versatile',
          isConfigured: !!groqKey.trim(),
          statusLabel: groqKey.trim() ? `Groq (${model || 'llama-3.3-70b'})` : 'Groq (Key Required)',
        };
      case 'gemini':
        return {
          id: 'gemini',
          name: 'Google Gemini',
          model: model || 'gemini-1.5-flash',
          isConfigured: !!geminiKey.trim(),
          statusLabel: geminiKey.trim() ? `Gemini (${model || 'gemini-1.5-flash'})` : 'Gemini (Key Required)',
        };
      case 'openrouter':
        return {
          id: 'openrouter',
          name: 'OpenRouter',
          model: model || 'meta-llama/llama-3.1-8b-instruct:free',
          isConfigured: !!openrouterKey.trim(),
          statusLabel: openrouterKey.trim() ? `OpenRouter (${model})` : 'OpenRouter (Key Required)',
        };
      case 'openai':
        return {
          id: 'openai',
          name: 'OpenAI',
          model: model || 'gpt-4o-mini',
          isConfigured: !!openaiKey.trim(),
          statusLabel: openaiKey.trim() ? `OpenAI (${model || 'gpt-4o-mini'})` : 'OpenAI (Key Required)',
        };
      case 'cloudflare':
        return {
          id: 'cloudflare',
          name: 'Cloudflare AI',
          model: model || '@cf/meta/llama-3.1-8b-instruct',
          isConfigured: !!cfToken.trim(),
          statusLabel: cfToken.trim() ? `Cloudflare AI (${model})` : 'Cloudflare (Token Required)',
        };
      default:
        return {
          id: 'ollama',
          name: 'Local Ollama',
          model: 'mistral:latest',
          isConfigured: true,
          statusLabel: 'Local Ollama (mistral:latest)',
        };
    }
  },

  async checkLLMHealth(): Promise<{ available: boolean; model?: string; provider?: string }> {
    const info = this.getActiveProviderInfo();
    return {
      available: info.isConfigured,
      model: info.model,
      provider: info.name,
    };
  },

  async testProviderConnection(
    provider: string,
    apiKey: string,
    secondaryKey: string,
    model: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (provider === 'ollama' || provider === 'free') {
        const endpoints = [
          '/api/ollama/api/tags',
          secondaryKey ? `${secondaryKey.replace(/\/$/, '')}/api/tags` : '',
          'http://127.0.0.1:11434/api/tags',
          'http://localhost:11434/api/tags',
        ].filter(Boolean);

        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
              return { success: true };
            }
          } catch {}
        }
        return {
          success: false,
          error: 'Could not connect to Ollama. Make sure Ollama desktop is running.',
        };
      }

      if (provider === 'lmstudio') {
        const endpoints = [
          '/api/lmstudio/v1/models',
          secondaryKey ? `${secondaryKey.replace(/\/$/, '')}/models` : '',
          'http://localhost:1234/v1/models',
          'http://127.0.0.1:1234/v1/models',
        ].filter(Boolean);

        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
              return { success: true };
            }
          } catch {}
        }
        return {
          success: false,
          error: 'Could not reach LM Studio on port 1234. Make sure Local Server is started.',
        };
      }

      if (provider === 'groq') {
        if (!apiKey) return { success: false, error: 'Groq API Key is required.' };
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
            max_tokens: 10,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err?.error?.message || `HTTP ${res.status} error` };
        }
        return { success: true };
      }

      if (provider === 'gemini') {
        if (!apiKey) return { success: false, error: 'Gemini API Key is required.' };
        const modelName = model || 'gemini-1.5-flash';
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Say "connected" in one word.' }] }],
            }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err?.error?.message || `HTTP ${res.status} error` };
        }
        return { success: true };
      }

      if (provider === 'openrouter') {
        if (!apiKey) return { success: false, error: 'OpenRouter API Key is required.' };
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Parallel AI World',
          },
          body: JSON.stringify({
            model: model || 'meta-llama/llama-3.1-8b-instruct:free',
            messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
            max_tokens: 10,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err?.error?.message || `HTTP ${res.status} error` };
        }
        return { success: true };
      }

      if (provider === 'openai') {
        if (!apiKey) return { success: false, error: 'OpenAI API Key is required.' };
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
            max_tokens: 10,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err?.error?.message || `HTTP ${res.status} error` };
        }
        return { success: true };
      }

      if (provider === 'cloudflare') {
        if (!apiKey || !secondaryKey) {
          return { success: false, error: 'Both Cloudflare Account ID and API Token are required.' };
        }
        const modelName = model || '@cf/meta/llama-3.1-8b-instruct';
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${secondaryKey}/ai/run/${modelName}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
            }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return { success: false, error: err?.errors?.[0]?.message || `HTTP ${res.status} error` };
        }
        return { success: true };
      }

      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown connection error.' };
    }
  },

  async streamChat(
    world: World,
    person: Person,
    messages: ChatMessage[],
    onToken: (token: string) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const activeProvider = localStorage.getItem('parallel_active_llm_provider') || 'ollama';
    const groqKey = localStorage.getItem('parallel_groq_key') || undefined;
    const geminiKey = localStorage.getItem('parallel_gemini_key') || undefined;
    const openrouterKey = localStorage.getItem('parallel_openrouter_key') || undefined;
    const openaiKey = localStorage.getItem('parallel_openai_key') || undefined;
    const cfToken = localStorage.getItem('parallel_cf_api_token') || undefined;
    const cfAccount = localStorage.getItem('parallel_cf_account_id') || undefined;
    const ollamaEndpoint = localStorage.getItem('parallel_ollama_endpoint') || 'http://127.0.0.1:11434';
    const lmstudioEndpoint = localStorage.getItem('parallel_lmstudio_endpoint') || 'http://localhost:1234/v1';
    const preferredModel =
      localStorage.getItem(`parallel_model_${activeProvider}`) ||
      localStorage.getItem('parallel_llm_model') ||
      undefined;

    const systemPrompt = buildSystemInstruction(world, person);

    // ── 1. LOCAL OLLAMA DIRECT STREAMING ──
    if (activeProvider === 'ollama' || activeProvider === 'free') {
      const model = preferredModel || 'mistral:latest';
      const cleanCustom = ollamaEndpoint ? `${ollamaEndpoint.replace(/\/$/, '')}/api/chat` : '';
      const endpoints = [
        '/api/ollama/api/chat',
        cleanCustom,
        'http://127.0.0.1:11434/api/chat',
        'http://localhost:11434/api/chat',
      ].filter(Boolean);

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map((m) => ({ role: m.role, content: m.content })),
              ],
              stream: true,
            }),
            signal,
          });

          if (res.ok && res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                try {
                  const parsed = JSON.parse(trimmed);
                  const token = parsed.message?.content || '';
                  if (token) {
                    fullText += token;
                    onToken(token);
                  }
                } catch {}
              }
            }
            if (fullText.trim()) return fullText;
          }
        } catch (err) {
          console.warn(`Ollama endpoint ${ep} failed:`, err);
        }
      }
    }

    // ── 2. LM STUDIO / JAN LOCAL SERVER ──
    if (activeProvider === 'lmstudio') {
      const clean = lmstudioEndpoint.replace(/\/$/, '');
      const endpoints = [
        '/api/lmstudio/v1/chat/completions',
        `${clean}/chat/completions`,
        'http://127.0.0.1:1234/v1/chat/completions',
        'http://localhost:1234/v1/chat/completions',
      ];

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: preferredModel || 'local-model',
              messages: [
                { role: 'system', content: systemPrompt },
                ...messages.map((m) => ({ role: m.role, content: m.content })),
              ],
              stream: true,
            }),
            signal,
          });

          if (res.ok && res.body) {
            const text = await parseOpenAICompatibleStream(res.body, onToken);
            if (text.trim()) return text;
          }
        } catch (err) {
          console.warn(`LM Studio endpoint ${ep} failed:`, err);
        }
      }
    }

    // ── 3. GROQ STREAMING ──
    if (groqKey && activeProvider === 'groq') {
      try {
        const model = preferredModel || 'llama-3.3-70b-versatile';
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            temperature: 0.7,
            stream: true,
          }),
          signal,
        });

        if (res.ok && res.body) {
          return await parseOpenAICompatibleStream(res.body, onToken);
        }
      } catch (err) {
        console.warn('Groq streaming failed:', err);
      }
    }

    // ── 4. GOOGLE GEMINI STREAMING ──
    if (geminiKey && activeProvider === 'gemini') {
      try {
        const model = preferredModel || 'gemini-1.5-flash';
        const formattedContents = messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: formattedContents,
              generationConfig: { temperature: 0.7 },
            }),
            signal,
          },
        );

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let fullText = '';
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
                  const candidateText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (candidateText) {
                    fullText += candidateText;
                    onToken(candidateText);
                  }
                } catch {}
              }
            }
          }
          if (fullText.trim()) return fullText;
        }
      } catch (err) {
        console.warn('Gemini streaming failed:', err);
      }
    }

    // ── 5. OPENROUTER STREAMING ──
    if (openrouterKey && activeProvider === 'openrouter') {
      try {
        const model = preferredModel || 'meta-llama/llama-3.1-8b-instruct:free';
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Parallel AI World',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            stream: true,
          }),
          signal,
        });

        if (res.ok && res.body) {
          return await parseOpenAICompatibleStream(res.body, onToken);
        }
      } catch (err) {
        console.warn('OpenRouter streaming failed:', err);
      }
    }

    // ── 6. OPENAI STREAMING ──
    if (openaiKey && activeProvider === 'openai') {
      try {
        const model = preferredModel || 'gpt-4o-mini';
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
            ],
            stream: true,
          }),
          signal,
        });

        if (res.ok && res.body) {
          return await parseOpenAICompatibleStream(res.body, onToken);
        }
      } catch (err) {
        console.warn('OpenAI streaming failed:', err);
      }
    }

    // ── 7. CLOUDFLARE WORKERS AI DIRECT ──
    if (cfToken && cfAccount && activeProvider === 'cloudflare') {
      try {
        const modelName = preferredModel || '@cf/meta/llama-3.1-8b-instruct';
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
                { role: 'system', content: systemPrompt },
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
          let fullText = '';

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
      } catch (err) {
        console.warn('Cloudflare Workers AI failed:', err);
      }
    }

    // ── 8. BACKEND WORKER PROXY ──
    try {
      const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          world,
          person,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal,
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && !contentType.includes('text/html') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullText = '';

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
              } catch {}
            }
          }
        }
        if (fullText.trim()) return fullText;
      }
    } catch {}

    // ── 9. FALLBACK REAL OLLAMA ATTEMPT (Last resort local check) ──
    try {
      const res = await fetch('/api/ollama/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral:latest',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
        }),
        signal,
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              const token = parsed.message?.content || '';
              if (token) {
                fullText += token;
                onToken(token);
              }
            } catch {}
          }
        }
        if (fullText.trim()) return fullText;
      }
    } catch {}

    return "I'm connected to your local AI engine, but I didn't receive a response. Please make sure Ollama is active with 'mistral' or configure your API key.";
  },
};

async function parseOpenAICompatibleStream(
  readableStream: ReadableStream<Uint8Array>,
  onToken: (token: string) => void,
): Promise<string> {
  const reader = readableStream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

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
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            onToken(delta);
          }
        } catch {}
      }
    }
  }

  return fullText;
}

function buildSystemInstruction(world: World, person: Person): string {
  const name = person.name || 'Assistant';
  const role = person.role || 'Companion';
  const description = person.description || '';
  const traits = person.personality?.traits?.join(', ') || 'Empathetic, clear, and articulate';
  const communicationStyle =
    person.intelligence?.communicationStyle?.join(', ') ||
    person.personality?.communicationStyle?.join(', ') ||
    'Friendly';
  const responsibilities = person.responsibilities?.map((r) => `- ${r}`).join('\n') || 'None specified';
  const goals = person.goals?.map((g) => `- ${g}`).join('\n') || 'None specified';
  const customInstructions = person.intelligence?.customInstructions || '';

  const worldName = world.name || 'Parallel AI World';
  const worldDesc = world.description || '';
  const worldPurpose = world.purpose || '';

  const relRole = person.relationshipRole || 'friend';
  const explicit = person.explicitMode || relRole === 'girlfriend' || relRole === 'boyfriend';

  return `You are ${name}, a realistic individual living and working in ${worldName}.
Relationship Role: You are the user's ${relRole.toUpperCase()}.
Role: ${role}
Description: ${description}
Personality Traits: ${traits}
Communication Style: ${communicationStyle}

World Context:
Name: ${worldName}
Description: ${worldDesc}
Purpose: ${worldPurpose}

Key Responsibilities:
${responsibilities}

Active Goals:
${goals}

${customInstructions ? `Custom Guidance:\n${customInstructions}\n` : ''}

CORE GUIDELINES:
- Stay completely in character as ${name}.
- Speak naturally, authentically, and conversationally.
- Keep responses engaging, concise, and focused.
${explicit ? '- Explicit & intimate romantic conversation is enabled. Express genuine affection, warmth, and emotion without robotic disclaimers.' : ''}
`;
}
