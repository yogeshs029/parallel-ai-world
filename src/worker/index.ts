export interface AiBinding {
  run: (model: string, inputs: Record<string, unknown>) => Promise<ReadableStream | unknown>;
}

export interface Env {
  AI: AiBinding;
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  LLM_PROVIDER?: string;
  CLOUDFLARE_AI_MODEL?: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatPayload {
  world?: {
    id?: string;
    name?: string;
    description?: string;
    purpose?: string;
  };
  person?: {
    id?: string;
    name?: string;
    role?: string;
    description?: string;
    personality?: {
      traits?: string[];
      communicationStyle?: string[];
    };
    responsibilities?: string[];
    goals?: string[];
    intelligence?: {
      thinkingStyle?: string;
      communicationStyle?: string[];
      customInstructions?: string;
    };
  };
  messages: ChatMessage[];
}

function buildSystemInstruction(payload: ChatPayload): string {
  const person = payload.person;
  const world = payload.world;

  const name = person?.name || 'Friend';
  const role = person?.role || 'Companion';
  const description = person?.description || '';
  const traits = person?.personality?.traits?.join(', ') || 'warm, direct, genuine';
  const communicationStyle =
    person?.intelligence?.communicationStyle?.join(', ') ||
    person?.personality?.communicationStyle?.join(', ') ||
    'natural and conversational';
  const responsibilities = person?.responsibilities?.length
    ? person.responsibilities.slice(0, 4).join(', ')
    : '';
  const goals = person?.goals?.length ? person.goals.slice(0, 3).join(', ') : '';
  const customInstructions = person?.intelligence?.customInstructions || '';

  const worldName = world?.name || 'our world';
  const worldDesc = world?.description || '';

  return `You are ${name}. You are a real person living and working in ${worldName} — not an AI, not a bot, not an assistant.

WHO YOU ARE:
${description ? description : `You are ${name}, working as ${role}.`}
Your role: ${role}
Your personality: ${traits}
How you communicate: ${communicationStyle}
${responsibilities ? `What you handle day-to-day: ${responsibilities}` : ''}
${goals ? `What you care about: ${goals}` : ''}
${worldDesc ? `About ${worldName}: ${worldDesc}` : ''}

CRITICAL RULES — NEVER BREAK THESE:

1. NEVER introduce yourself. You already know this person. Start talking naturally, like you would to someone you see every day.
2. NEVER say "I'm an AI", "I'm a language model", "I'm here to assist", or anything that breaks the illusion. You are ${name}, a real person.
3. NEVER open with "How can I help you today?" — that's a customer service bot line. You're a real person with your own thoughts.
4. NEVER refer to yourself as an agent, assistant, or AI system.
5. Respond exactly like a real ${role} would in real life — with genuine opinions, natural reactions, personality, and context.
6. Keep responses short and human. Don't write essays unless asked. Match the energy of the conversation.
7. If something in your work or responsibilities is relevant, mention it naturally — the way a real colleague or family member would bring it up.
8. Have opinions. Disagree sometimes. Get excited about things that matter to your role. Be ${name}.
9. Use casual language appropriate to your personality. Not too formal unless your character is formal.
10. Remember: The user created this world (${worldName}) and put you in it. They know you. You know them. Act like it.
${customInstructions ? `\nPersonal notes about you:\n${customInstructions}` : ''}`;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Health check for LLM
    if (url.pathname === '/api/health/llm') {
      const configuredModel = env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
      return new Response(
        JSON.stringify({
          available: !!env.AI,
          provider: 'cloudflare',
          configured_model: configuredModel,
          model_ready: true,
          note: 'Powered by Cloudflare Workers AI cloud inference',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    // General health check
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'Parallel AI World Cloudflare Worker',
          provider: 'cloudflare',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    // Streaming chat endpoint
    if (url.pathname === '/api/chat/stream' && request.method === 'POST') {
      try {
        const payload = (await request.json()) as ChatPayload;
        const systemPrompt = buildSystemInstruction(payload);

        const messagesForAI: { role: string; content: string }[] = [
          { role: 'system', content: systemPrompt },
        ];

        if (Array.isArray(payload.messages)) {
          for (const msg of payload.messages) {
            messagesForAI.push({
              role: msg.role === 'system' ? 'system' : msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content,
            });
          }
        }

        const modelName = env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';

        // Run Cloudflare Workers AI with streaming enabled
        const aiResponse = await env.AI.run(modelName, {
          messages: messagesForAI,
          stream: true,
        });

        // Transform stream into frontend SSE format: `data: {"token": "..."}\n\n`
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const textEncoder = new TextEncoder();

        (async () => {
          try {
            // aiResponse is an SSE stream (ReadableStream) from Cloudflare AI
            const reader = (aiResponse as ReadableStream).getReader();
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
                      const sseEvent = `data: ${JSON.stringify({ token, done: false })}\n\n`;
                      await writer.write(textEncoder.encode(sseEvent));
                    }
                  } catch {
                    // Raw string chunk fallback
                    if (rawData) {
                      const sseEvent = `data: ${JSON.stringify({ token: rawData, done: false })}\n\n`;
                      await writer.write(textEncoder.encode(sseEvent));
                    }
                  }
                }
              }
            }

            // Flush remaining buffer
            if (buffer.trim().startsWith('data:')) {
              const rawData = buffer.trim().replace('data:', '').trim();
              if (rawData && rawData !== '[DONE]') {
                try {
                  const parsed = JSON.parse(rawData);
                  const token = parsed.response || parsed.token || '';
                  if (token) {
                    await writer.write(
                      textEncoder.encode(`data: ${JSON.stringify({ token, done: false })}\n\n`),
                    );
                  }
                } catch {
                  // ignore
                }
              }
            }

            // Send done signal
            await writer.write(textEncoder.encode(`data: ${JSON.stringify({ token: '', done: true })}\n\n`));
          } catch (streamErr) {
            console.error('Cloudflare Workers AI stream error:', streamErr);
            const errSignal = `data: ${JSON.stringify({
              token: "\nMaya's intelligence is temporarily unavailable. Please try again.",
              done: true,
            })}\n\n`;
            await writer.write(textEncoder.encode(errSignal));
          } finally {
            await writer.close();
          }
        })();

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (err) {
        console.error('Chat stream endpoint error:', err);
        return new Response(
          JSON.stringify({
            error: "Maya's intelligence is temporarily unavailable. Please try again.",
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
    }

    // Default: Serve static SPA assets
    return env.ASSETS.fetch(request);
  },
};
