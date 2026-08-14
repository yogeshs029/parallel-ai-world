interface AiBinding {
  run: (model: string, inputs: Record<string, unknown>) => Promise<ReadableStream | unknown>;
}

interface Env {
  AI?: AiBinding;
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

  const name = person?.name || 'Assistant';
  const role = person?.role || 'Companion';
  const description = person?.description || '';
  const traits = person?.personality?.traits?.join(', ') || 'Empathetic, clear, and articulate';
  const communicationStyle =
    person?.intelligence?.communicationStyle?.join(', ') ||
    person?.personality?.communicationStyle?.join(', ') ||
    'Friendly';
  const responsibilities = person?.responsibilities?.map((r) => `- ${r}`).join('\n') || 'None specified';
  const goals = person?.goals?.map((g) => `- ${g}`).join('\n') || 'None specified';
  const customInstructions = person?.intelligence?.customInstructions || '';

  const worldName = world?.name || 'Parallel AI World';
  const worldDesc = world?.description || '';
  const worldPurpose = world?.purpose || '';

  return `You are ${name}, a realistic individual living and working in ${worldName}.
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
- Speak naturally and conversationally without meta commentary.
- Be helpful, engaging, concise, and aligned with your role in ${worldName}.
`;
}

function createSSEFallbackStream(text: string): Response {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const words = text.split(' ');
      for (const word of words) {
        const token = word + ' ';
        const sseEvent = `data: ${JSON.stringify({ token, done: false })}\n\n`;
        await writer.write(encoder.encode(sseEvent));
        await new Promise((r) => setTimeout(r, 40));
      }
      await writer.write(encoder.encode(`data: ${JSON.stringify({ token: '', done: true })}\n\n`));
    } catch {
      // ignore
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
}

export const onRequest = async (context: { request: Request; env: Env }): Promise<Response> => {
  const { request, env } = context;
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
  if (url.pathname.endsWith('/health/llm')) {
    const configuredModel = env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';
    return new Response(
      JSON.stringify({
        available: true,
        provider: 'cloudflare',
        configured_model: configuredModel,
        model_ready: true,
        hasAiBinding: !!env.AI,
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
  if (url.pathname.endsWith('/health')) {
    return new Response(
      JSON.stringify({
        status: 'ok',
        service: 'Parallel AI World Cloudflare Pages Functions',
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

  // Chat message history fallback
  if (url.pathname.includes('/messages') && request.method === 'GET') {
    return new Response(JSON.stringify([]), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Voice endpoints fallback
  if (url.pathname.includes('/voice/voices')) {
    return new Response(
      JSON.stringify([
        {
          id: 'en-US-AvaNeural',
          name: 'Warm Female',
          gender: 'female',
          language: 'en-US',
          description: 'Warm, clear, and empathetic tone.',
          previewText: "Hi! I'm Maya. It's really great to work with you on our projects.",
          isDefault: true,
        },
        {
          id: 'en-US-AndrewNeural',
          name: 'Professional Male',
          gender: 'male',
          language: 'en-US',
          description: 'Confident, articulate, and executive tone.',
          previewText: "Hello, I'm Rahul. Let's focus on high-impact objectives today.",
        },
      ]),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }

  // Streaming chat endpoint
  if (url.pathname.endsWith('/chat/stream') && request.method === 'POST') {
    try {
      const payload = (await request.json()) as ChatPayload;
      const personName = payload.person?.name || 'Assistant';
      const personRole = payload.person?.role || 'Teammate';
      const worldName = payload.world?.name || 'Parallel AI World';

      // If env.AI binding is available in Cloudflare
      if (env.AI && typeof env.AI.run === 'function') {
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

        const aiResponse = await env.AI.run(modelName, {
          messages: messagesForAI,
          stream: true,
        });

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const textEncoder = new TextEncoder();

        (async () => {
          try {
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
                    if (rawData) {
                      const sseEvent = `data: ${JSON.stringify({ token: rawData, done: false })}\n\n`;
                      await writer.write(textEncoder.encode(sseEvent));
                    }
                  }
                }
              }
            }

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

            await writer.write(textEncoder.encode(`data: ${JSON.stringify({ token: '', done: true })}\n\n`));
          } catch (streamErr) {
            console.error('Cloudflare Workers AI stream error:', streamErr);
            const errSignal = `data: ${JSON.stringify({
              token: `\n${personName}'s intelligence is temporarily unavailable. Please try again.`,
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
      }

      // If env.AI is not yet configured in Cloudflare Pages dashboard
      const latestMsg = payload.messages?.filter((m) => m.role === 'user').pop()?.content || '';
      const fallbackResponse = `Hi! I'm ${personName}, working as ${personRole} in ${worldName}. I received your message: "${latestMsg}". I'm ready to collaborate on our goals here in ${worldName}!`;

      return createSSEFallbackStream(fallbackResponse);
    } catch (err) {
      console.error('Pages chat stream error:', err);
      return new Response(
        JSON.stringify({ error: 'Intelligence service temporarily unavailable.' }),
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

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
};
