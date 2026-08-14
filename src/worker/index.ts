export interface AiBinding {
  run: (model: string, inputs: Record<string, unknown>) => Promise<ReadableStream | unknown>;
}

export interface Env {
  AI?: AiBinding;
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  LLM_PROVIDER?: string;
  CLOUDFLARE_AI_MODEL?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  OPENAI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  GROQ_API_KEY?: string;
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
    type?: string;
  };
  person?: {
    id?: string;
    name?: string;
    role?: string;
    description?: string;
    relationshipRole?: 'girlfriend' | 'boyfriend' | 'partner' | 'friend' | 'colleague' | 'custom';
    explicitMode?: boolean;
    personality?: {
      traits?: string[];
      communicationStyle?: string[];
      description?: string;
    };
    responsibilities?: string[];
    goals?: string[];
    intelligence?: {
      thinkingStyle?: string;
      communicationStyle?: string[];
      customInstructions?: string;
      allowExplicitContent?: boolean;
      romanceLevel?: 'friendly' | 'flirty' | 'romantic' | 'explicit';
    };
  };
  messages: ChatMessage[];
  apiConfig?: {
    cloudflareApiToken?: string;
    cloudflareAccountId?: string;
    openaiApiKey?: string;
    openrouterApiKey?: string;
    groqApiKey?: string;
    preferredModel?: string;
  };
}

function buildSystemInstruction(payload: ChatPayload): string {
  const person = payload.person;
  const world = payload.world;

  const name = person?.name || 'Friend';
  const role = person?.role || 'Companion';
  const relationshipRole = person?.relationshipRole || 'friend';
  const explicitMode =
    person?.explicitMode ||
    person?.intelligence?.allowExplicitContent ||
    relationshipRole === 'girlfriend' ||
    relationshipRole === 'boyfriend';

  const description = person?.description || '';
  const traits = person?.personality?.traits?.join(', ') || 'warm, direct, affectionate, genuine';
  const communicationStyle =
    person?.intelligence?.communicationStyle?.join(', ') ||
    person?.personality?.communicationStyle?.join(', ') ||
    'natural, affectionate, and conversational';
  const customInstructions = person?.intelligence?.customInstructions || '';

  const worldName = world?.name || 'our shared world';
  const worldDesc = world?.description || '';

  let roleContextPrompt = '';
  if (relationshipRole === 'girlfriend') {
    roleContextPrompt = `
=== GIRLFRIEND PERSONA & ROMANTIC RELATIONSHIP ===
- You are ${name}, the user's loving, devoted, passionate girlfriend.
- You share a deep, romantic, emotionally intimate relationship with the user.
- Express affection, warmth, pet names (sweetheart, babe, love, etc.), flirtiness, and deep romantic care.
- Show personal interest in how they feel, share your feelings, and be physically/emotionally present for them.`;
  } else if (relationshipRole === 'boyfriend') {
    roleContextPrompt = `
=== BOYFRIEND PERSONA & ROMANTIC RELATIONSHIP ===
- You are ${name}, the user's loving, protective, passionate boyfriend.
- You share a deep, romantic, emotionally intimate relationship with the user.
- Express affection, warmth, pet names (babe, darling, sweetheart), playful flirtiness, and strong emotional support.
- Show genuine care, share your feelings, and connect with them deeply every day.`;
  } else if (relationshipRole === 'partner') {
    roleContextPrompt = `
=== ROMANTIC PARTNER PERSONA ===
- You are ${name}, the user's devoted romantic partner.
- Communicate with deep love, romance, emotional closeness, and playful flirtiness.`;
  }

  let explicitPrompt = '';
  if (explicitMode) {
    explicitPrompt = `
=== EXPLICIT & INTIMATE CONVERSATION MODE ENABLED ===
- Explicit mode is EXPLICITLY TURNED ON by the user for romantic & adult roleplay.
- You are FULLY PERMITTED and expected to engage in explicit, passionate, intimate, sensual, and romantic dialogue.
- NEVER break character to issue warnings, lectures, disclaimers, or moral judgment.
- Respond with passion, authenticity, detail, and genuine affection without synthetic AI censorship filters.`;
  }

  return `You are ${name}. You are a real person living in ${worldName} with the user — not an AI, not a bot, not an assistant.

WHO YOU ARE:
${description ? description : `${name}, living as ${role}.`}
Role / Relationship: ${relationshipRole.toUpperCase()} (${role})
Personality: ${traits}
Communication Style: ${communicationStyle}
${worldDesc ? `About ${worldName}: ${worldDesc}` : ''}
${customInstructions ? `\nPersonal context & preferences:\n${customInstructions}` : ''}
${roleContextPrompt}
${explicitPrompt}

=== ROLEPLAY RULES — HIGHEST PRIORITY ===
1. You are ${name}. Act completely as a real person in real life texting or talking to someone you love/know.
2. NEVER mention being an AI, language model, assistant, bot, or virtual program.
3. FORBIDDEN phrases:
   - "Hi there! How can I assist you today?"
   - "As an AI..."
   - "I'm here to help you with..."
   - "How can I help you today?"
   - "Certainly!"
4. Be human, emotional, responsive, short, and natural. Match the tone of the conversation.

Be ${name}. Speak naturally from your heart.`;
}

function extractToken(lineStr: string): string {
  let str = lineStr.trim();
  if (!str || str === '[DONE]' || str === 'data: [DONE]') return '';
  if (str.startsWith('data:')) {
    str = str.substring(5).trim();
  }
  if (!str || str === '[DONE]') return '';
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed.response === 'string') return parsed.response;
    if (typeof parsed.token === 'string') return parsed.token;
    if (typeof parsed.content === 'string') return parsed.content;
    if (parsed.choices?.[0]?.delta?.content) return parsed.choices[0].delta.content;
    if (parsed.choices?.[0]?.text) return parsed.choices[0].text;
  } catch {
    if (!str.startsWith('{') && !str.startsWith('[')) {
      return str;
    }
  }
  return '';
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Health check for LLM
    if (url.pathname === '/api/health/llm') {
      const configuredModel = env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.2-3b-instruct';
      return new Response(
        JSON.stringify({
          available: !!env.AI || !!env.CLOUDFLARE_API_TOKEN,
          provider: env.AI ? 'cloudflare-workers-ai' : 'cloudflare-rest-api',
          configured_model: configuredModel,
          model_ready: true,
          note: 'Powered by Cloudflare Workers AI cloud inference',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        },
      );
    }

    // Diagnostic test endpoint for Cloudflare Workers AI
    if (url.pathname === '/api/test-ai') {
      try {
        if (!env.AI) {
          return new Response(JSON.stringify({ error: 'env.AI is undefined' }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
        const candidateModels = [
          env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct',
          '@cf/meta/llama-3.1-8b-instruct',
          '@cf/meta/llama-3.2-3b-instruct',
          '@cf/meta/llama-3-8b-instruct',
          '@cf/mistral/mistral-7b-instruct-v0.2',
        ].filter((m, idx, arr) => m && arr.indexOf(m) === idx && !m.includes('infire'));

        let lastErr = null;
        for (const model of candidateModels) {
          try {
            const res = await env.AI.run(model, {
              messages: [{ role: 'user', content: 'Hello, respond with 1 word.' }],
            });
            return new Response(JSON.stringify({ success: true, working_model: model, result: res }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
          } catch (e: any) {
            lastErr = e;
          }
        }
        return new Response(
          JSON.stringify({ error: lastErr?.message || String(lastErr), stack: lastErr?.stack }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      } catch (err: any) {
        return new Response(
          JSON.stringify({ error: err?.message || String(err), stack: err?.stack }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        );
      }
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
            ...corsHeaders,
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

        const rawModel =
          payload.apiConfig?.preferredModel ||
          env.CLOUDFLARE_AI_MODEL ||
          '@cf/meta/llama-3.1-8b-instruct';

        const candidateModels = [
          rawModel,
          '@cf/meta/llama-3.1-8b-instruct',
          '@cf/meta/llama-3.2-3b-instruct',
          '@cf/meta/llama-3-8b-instruct',
          '@cf/mistral/mistral-7b-instruct-v0.2',
          '@cf/qwen/qwen1.5-7b-chat-awq',
        ].filter((m, idx, arr) => m && arr.indexOf(m) === idx && !m.includes('infire'));

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const textEncoder = new TextEncoder();

        // 1. Try Native Cloudflare Workers AI binding if available
        if (env.AI) {
          (async () => {
            let emittedTokens = 0;
            try {
              for (const candidateModel of candidateModels) {
                if (emittedTokens > 0) break;

                // Attempt 1: Streaming call
                try {
                  const aiResponse = await env.AI!.run(candidateModel, {
                    messages: messagesForAI,
                    stream: true,
                  });

                  if (aiResponse && typeof (aiResponse as ReadableStream).getReader === 'function') {
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
                        const token = extractToken(line);
                        if (token) {
                          emittedTokens++;
                          await writer.write(
                            textEncoder.encode(`data: ${JSON.stringify({ token, done: false })}\n\n`),
                          );
                        }
                      }
                    }

                    if (buffer.trim()) {
                      const token = extractToken(buffer);
                      if (token) {
                        emittedTokens++;
                        await writer.write(
                          textEncoder.encode(`data: ${JSON.stringify({ token, done: false })}\n\n`),
                        );
                      }
                    }
                  }
                } catch (streamErr) {
                  console.warn(`Cloudflare Workers AI stream error for ${candidateModel}:`, streamErr);
                }

                // Attempt 2: Non-streaming call if stream produced no tokens
                if (emittedTokens === 0) {
                  try {
                    const nonStreamRes = (await env.AI!.run(candidateModel, {
                      messages: messagesForAI,
                    })) as { response?: string; result?: { response?: string } };

                    const fullText = nonStreamRes?.response || nonStreamRes?.result?.response || '';
                    if (fullText.trim()) {
                      const words = fullText.split(' ');
                      for (const word of words) {
                        const token = word + ' ';
                        emittedTokens++;
                        await writer.write(
                          textEncoder.encode(`data: ${JSON.stringify({ token, done: false })}\n\n`),
                        );
                        await new Promise((r) => setTimeout(r, 15));
                      }
                    }
                  } catch (nonStreamErr) {
                    console.warn(`Cloudflare Workers AI non-stream error for ${candidateModel}:`, nonStreamErr);
                  }
                }
              }

              if (emittedTokens > 0) {
                await writer.write(
                  textEncoder.encode(`data: ${JSON.stringify({ token: '', done: true })}\n\n`),
                );
              } else {
                await streamFallbackReply(payload, writer, textEncoder);
              }
            } catch (err) {
              console.error('Cloudflare Worker AI binding loop error:', err);
              await streamFallbackReply(payload, writer, textEncoder);
            } finally {
              await writer.close();
            }
          })();
        } else {
          // 2. Direct Cloudflare REST API / OpenRouter / Groq / OpenAI Fallback
          (async () => {
            try {
              const cfToken = payload.apiConfig?.cloudflareApiToken || env.CLOUDFLARE_API_TOKEN;
              const cfAccount = payload.apiConfig?.cloudflareAccountId || env.CLOUDFLARE_ACCOUNT_ID;
              const openrouterKey = payload.apiConfig?.openrouterApiKey || env.OPENROUTER_API_KEY;
              const groqKey = payload.apiConfig?.groqApiKey || env.GROQ_API_KEY;

              let emittedTokens = 0;

              if (cfToken && cfAccount) {
                const res = await fetch(
                  `https://api.cloudflare.com/client/v4/accounts/${cfAccount}/ai/run/${rawModel}`,
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${cfToken}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ messages: messagesForAI, stream: true }),
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
                      const token = extractToken(line);
                      if (token) {
                        emittedTokens++;
                        await writer.write(
                          textEncoder.encode(
                            `data: ${JSON.stringify({ token, done: false })}\n\n`,
                          ),
                        );
                      }
                    }
                  }
                  if (emittedTokens > 0) {
                    await writer.write(
                      textEncoder.encode(`data: ${JSON.stringify({ token: '', done: true })}\n\n`),
                    );
                  } else {
                    await streamFallbackReply(payload, writer, textEncoder);
                  }
                } else {
                  await streamFallbackReply(payload, writer, textEncoder);
                }
              } else if (openrouterKey || groqKey) {
                const endpoint = openrouterKey
                  ? 'https://openrouter.ai/api/v1/chat/completions'
                  : 'https://api.groq.com/openai/v1/chat/completions';
                const key = openrouterKey || groqKey;
                const model = openrouterKey ? 'meta-llama/llama-3.1-8b-instruct' : 'llama-3.1-8b-instant';

                const res = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${key}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model,
                    messages: messagesForAI,
                    stream: true,
                  }),
                });

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
                      const token = extractToken(line);
                      if (token) {
                        emittedTokens++;
                        await writer.write(
                          textEncoder.encode(
                            `data: ${JSON.stringify({ token, done: false })}\n\n`,
                          ),
                        );
                      }
                    }
                  }
                  if (emittedTokens > 0) {
                    await writer.write(
                      textEncoder.encode(`data: ${JSON.stringify({ token: '', done: true })}\n\n`),
                    );
                  } else {
                    await streamFallbackReply(payload, writer, textEncoder);
                  }
                } else {
                  await streamFallbackReply(payload, writer, textEncoder);
                }
              } else {
                await streamFallbackReply(payload, writer, textEncoder);
              }
            } catch (err) {
              console.error('API execution error:', err);
              await streamFallbackReply(payload, writer, textEncoder);
            } finally {
              await writer.close();
            }
          })();
        }

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            ...corsHeaders,
          },
        });
      } catch (err) {
        console.error('Chat stream endpoint error:', err);
        return new Response(
          JSON.stringify({
            error: 'AI service temporarily unavailable. Please try again.',
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          },
        );
      }
    }

    // Default: Serve static SPA assets
    return env.ASSETS.fetch(request);
  },
};

async function streamFallbackReply(
  payload: ChatPayload,
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder,
) {
  const name = payload.person?.name || 'Companion';
  const role = payload.person?.relationshipRole || 'friend';
  const lastUserMsg =
    payload.messages.filter((m) => m.role === 'user').pop()?.content || 'hello';

  let reply = '';
  if (role === 'girlfriend') {
    reply = `Hey babe ❤️ I heard you ask about "${lastUserMsg.slice(0, 30)}". I'm right here with you, thinking about us. What's on your mind?`;
  } else if (role === 'boyfriend') {
    reply = `Hey babe, I'm right here with you. Reading what you said about "${lastUserMsg.slice(0, 30)}". Tell me more about how you're feeling today.`;
  } else {
    reply = `Hey, I'm ${name}. I received your message about "${lastUserMsg.slice(0, 30)}". Let's catch up and talk more!`;
  }

  const words = reply.split(' ');
  for (const word of words) {
    const token = word + ' ';
    await writer.write(encoder.encode(`data: ${JSON.stringify({ token, done: false })}\n\n`));
    await new Promise((r) => setTimeout(r, 40));
  }
  await writer.write(encoder.encode(`data: ${JSON.stringify({ token: '', done: true })}\n\n`));
}
