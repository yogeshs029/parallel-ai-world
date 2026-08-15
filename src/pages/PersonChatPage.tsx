import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Square,
  RotateCcw,
  AlertCircle,
  RefreshCw,
  Brain,
  Mic,
  Radio,
  Loader2,
  Heart,
  Flame,
  Settings,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/layout/LoadingState';
import { ConfigureIntelligenceModal } from '../features/intelligence/components/ConfigureIntelligenceModal';
import { LLMConfigModal } from '../features/intelligence/components/LLMConfigModal';
import { MemoryDrawer } from '../features/memory/components/MemoryDrawer';
import { ConfigureVoiceModal } from '../features/voice/components/ConfigureVoiceModal';
import { VoiceConversationModal } from '../features/voice/components/VoiceConversationModal';
import { VoicePlayerButton } from '../features/voice/components/VoicePlayerButton';
import { useMicrophoneRecorder } from '../hooks/useMicrophoneRecorder';
import { useDisclosure } from '../hooks/useDisclosure';
import { useToast } from '../hooks/useToast';
import { worldService } from '../services/worldService';
import { peopleService } from '../services/peopleService';
import { conversationService, ChatMessage } from '../services/conversationService';
import { voiceService } from '../services/voiceService';
import { audioQueuePlayer } from '../services/audioQueuePlayer';
import { API_BASE } from '../lib/apiConfig';
import { World, Person } from '../types';
import { VoiceProfile, VoiceState } from '../types/voice';
import { cn } from '../lib/utils';

export const PersonChatPage: React.FC = () => {
  const { worldId, personId } = useParams<{ worldId: string; personId: string }>();
  const toast = useToast();

  const [world, setWorld] = useState<World | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLLMOnline, setIsLLMOnline] = useState<boolean | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [presenceState, setPresenceState] = useState<VoiceState>('idle');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasAutoInitiatedRef = useRef(false);

  const intelligenceDisclosure = useDisclosure(false);
  const memoryDisclosure = useDisclosure(false);
  const voiceSettingsDisclosure = useDisclosure(false);
  const voiceConversationDisclosure = useDisclosure(false);
  const llmDisclosure = useDisclosure(false);
  const [llmRefresh, setLlmRefresh] = useState(0);
  const llmInfo = useMemo(() => conversationService.getActiveProviderInfo(), [llmRefresh]);

  const {
    isRecording,
    audioLevel,
    error: micError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useMicrophoneRecorder();

  useEffect(() => {
    const unsubscribe = audioQueuePlayer.subscribe((isPlaying) => {
      if (isPlaying) setPresenceState('speaking');
      else if (!isStreaming && !isRecording) setPresenceState('idle');
    });
    return () => unsubscribe();
  }, [isStreaming, isRecording]);

  const triggerPersonOpening = useCallback(async (w: World, p: Person) => {
    if (!p || !w) return;
    const assistantMsgId = `asst-open-${Date.now()}`;
    const openingMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };
    setMessages([openingMsg]);
    setIsStreaming(true);

    const isRomantic =
      p.relationshipRole === 'girlfriend' ||
      p.relationshipRole === 'boyfriend' ||
      p.explicitMode;

    const userPingContent = isRomantic
      ? `Hey ${p.name} ❤️, I'm thinking about you!`
      : `Hey ${p.name}, what's on your mind today?`;

    const userPing: ChatMessage = {
      id: `ping-${Date.now()}`,
      role: 'user',
      content: userPingContent,
      timestamp: new Date().toISOString(),
    };

    let content = '';
    try {
      await conversationService.streamChat(
        w,
        p,
        [userPing],
        (token) => {
          content += token;
          setMessages([{ ...openingMsg, content }]);
        },
      );
      const finalMsg = { ...openingMsg, content };
      conversationService.saveMessages(p.id, [finalMsg]);
      setMessages([finalMsg]);
    } catch (e) {
      setMessages([]);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!worldId || !personId) return;
    try {
      setIsLoading(true);
      const [w, p, vProfile] = await Promise.all([
        worldService.getWorldById(worldId),
        peopleService.getPerson(worldId, personId),
        voiceService.getPersonVoice(worldId, personId),
      ]);
      setWorld(w);
      setPerson(p);
      setVoiceProfile(vProfile);

      const history = conversationService.getMessages(personId);
      try {
        const backendRes = await fetch(`${API_BASE}/worlds/${worldId}/people/${personId}/messages`);
        if (backendRes.ok) {
          const backendMsgs = await backendRes.json();
          if (Array.isArray(backendMsgs) && backendMsgs.length > 0) {
            const existingContents = new Set(history.map((m) => m.content));
            for (const bm of backendMsgs) {
              if (!existingContents.has(bm.content)) {
                history.push({
                  id: bm.id || `msg-${Date.now()}`,
                  role: bm.role,
                  content: bm.content,
                  timestamp: bm.timestamp || new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch (e) {
        console.warn('Could not read backend conversation:', e);
      }
      setMessages(history);

      if (history.length === 0 && !hasAutoInitiatedRef.current) {
        hasAutoInitiatedRef.current = true;
        setTimeout(() => triggerPersonOpening(w!, p!), 600);
      }

      const health = await conversationService.checkLLMHealth();
      setIsLLMOnline(health.available);
      if (!health.available) {
        setErrorBanner(`${p?.name || 'Person'} can't connect right now.`);
      } else {
        setErrorBanner(null);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId, personId, triggerPersonOpening]);

  const handleToggleExplicitMode = async () => {
    if (!person || !world) return;
    const newMode = !person.explicitMode;
    const updated = await peopleService.updatePerson(world.id, person.id, {
      explicitMode: newMode,
      intelligence: {
        ...(person.intelligence || {
          enabled: true,
          thinkingStyle: 'Balanced',
          communicationStyle: ['Friendly'],
          initiativeLevel: 'Suggest things',
        }),
        allowExplicitContent: newMode,
      },
    });
    if (updated) {
      setPerson(updated);
      toast.success(
        newMode ? '🔥 Explicit Mode Enabled' : 'Standard Mode Enabled',
        newMode
          ? `${person.name} can now engage in uncensored dialogue.`
          : `${person.name} switched to standard conversation.`,
      );
    }
  };

  useEffect(() => {
    loadData();
    return () => {
      audioQueuePlayer.stop();
      cancelRecording();
    };
  }, [loadData, cancelRecording]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isStreaming || !world || !person) return;

    audioQueuePlayer.stop();
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    const assistantMsgId = `asst-${Date.now()}`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg, initialAssistantMsg];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setPresenceState('thinking');
    setErrorBanner(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedContent = '';
    let sentenceBuffer = '';

    try {
      await conversationService.streamChat(
        world,
        person,
        [...messages, userMsg],
        async (token) => {
          accumulatedContent += token;
          sentenceBuffer += token;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: accumulatedContent } : msg,
            ),
          );

          if (voiceProfile?.autoSpeak && !abortController.signal.aborted) {
            const boundaryMatch = sentenceBuffer.match(/([.!?]+[\s\n]+|[\n]{2,})/);
            if (boundaryMatch && sentenceBuffer.trim().length >= 15) {
              const sentenceToSpeak = sentenceBuffer.trim();
              sentenceBuffer = '';
              try {
                const audioUrl = await voiceService.synthesize({
                  text: sentenceToSpeak,
                  voiceId: voiceProfile.voiceId,
                  speed: voiceProfile.speakingRate,
                  pitch: voiceProfile.pitch,
                });
                if (audioUrl) audioQueuePlayer.enqueue(audioUrl, sentenceToSpeak);
              } catch {}
            }
          }
        },
        abortController.signal,
      );

      if (voiceProfile?.autoSpeak && sentenceBuffer.trim() && !abortController.signal.aborted) {
        try {
          const finalUrl = await voiceService.synthesize({
            text: sentenceBuffer.trim(),
            voiceId: voiceProfile.voiceId,
            speed: voiceProfile.speakingRate,
            pitch: voiceProfile.pitch,
          });
          if (finalUrl) audioQueuePlayer.enqueue(finalUrl, sentenceBuffer.trim());
        } catch {}
      }

      const finalMessages = [
        ...messages,
        userMsg,
        { ...initialAssistantMsg, content: accumulatedContent },
      ];
      conversationService.saveMessages(person.id, finalMessages);
      setMessages(finalMessages);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // intentional
      } else {
        setErrorBanner(`Couldn't reach ${person.name}. Please try again.`);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: accumulatedContent || '...' }
              : msg,
          ),
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    audioQueuePlayer.stop();
  };

  const handleStopSpeaking = () => {
    audioQueuePlayer.stop();
    setPresenceState('idle');
  };

  const handleToggleMicrophone = async () => {
    audioQueuePlayer.stop();
    if (isRecording) {
      setIsTranscribing(true);
      const blob = await stopRecording();
      if (blob) {
        const res = await voiceService.transcribeAudio(blob);
        if (res?.transcript?.trim()) {
          setInputValue((prev) => (prev ? `${prev} ${res.transcript}` : res.transcript));
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
            textareaRef.current.focus();
          }
        } else {
          toast.info('No speech detected', 'Try speaking louder.');
        }
      }
      setIsTranscribing(false);
    } else {
      const ok = await startRecording();
      if (!ok && micError) toast.error('Microphone error', micError);
    }
  };

  const handleResetConversation = () => {
    if (!person) return;
    audioQueuePlayer.stop();
    conversationService.clearMessages(person.id);
    hasAutoInitiatedRef.current = false;
    setMessages([]);
    setTimeout(() => {
      if (world && person) triggerPersonOpening(world, person);
    }, 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) return <LoadingState message="Opening chat..." />;

  if (!world || !person) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-white font-sans">
        <h2 className="text-lg font-bold">Person not found</h2>
        <Link to="/worlds">
          <Button variant="primary" size="md" leftIcon={ArrowLeft}>Back to Worlds</Button>
        </Link>
      </div>
    );
  }

  const isGirlfriend = person.relationshipRole === 'girlfriend';
  const isBoyfriend = person.relationshipRole === 'boyfriend';
  const isRomantic = isGirlfriend || isBoyfriend || person.relationshipRole === 'partner';

  const personEmoji = person.avatar?.emoji || person.avatarEmoji || (isGirlfriend ? '💖' : isBoyfriend ? '💙' : '👤');

  const statusLabel = presenceState === 'speaking'
    ? 'Speaking...'
    : isStreaming
    ? 'Typing...'
    : isRecording
    ? 'Listening...'
    : 'Active now';

  return (
    <div className={cn(
      'flex flex-col h-[calc(100vh-100px)] min-h-[600px] w-full max-w-6xl mx-auto font-sans text-text-primary overflow-hidden rounded-3xl border border-white/[0.08] bg-[#090A12] shadow-2xl',
      isRomantic && 'border-rose-500/30 shadow-rose-500/10'
    )}>
      {/* ── COSMIC DARK HEADER BAR ── */}
      <div className="p-4 px-6 border-b border-white/[0.08] bg-[#0E0F1D]/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            to={`/world/${world.id}/people/${person.id}`}
            className="w-9 h-9 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-purple-300 transition-colors shrink-0 cursor-pointer"
            title="Back to profile"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="relative shrink-0">
            <Avatar
              name={person.name}
              emoji={personEmoji}
              size="md"
              status={isStreaming ? 'working' : presenceState === 'speaking' ? 'working' : 'available'}
            />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-white truncate flex items-center gap-1.5">
                {person.name}
                {isGirlfriend && <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />}
                {isBoyfriend && <Heart className="w-3.5 h-3.5 text-indigo-400 fill-current" />}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-400">{statusLabel}</span>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={llmDisclosure.onOpen}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border',
              llmInfo.isConfigured
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 hover:bg-purple-600/30 shadow-purple-glow'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            )}
            title="Configure LLM Provider & API Keys"
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                llmInfo.isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              )}
            />
            <span className="hidden md:inline">{llmInfo.statusLabel}</span>
            <span className="md:hidden">LLM</span>
          </button>

          <button
            onClick={handleToggleExplicitMode}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border',
              person.explicitMode
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-white/[0.06] border-white/[0.08] text-text-muted hover:text-white'
            )}
            title={person.explicitMode ? 'Explicit Mode Enabled' : 'Enable Explicit Mode'}
          >
            <Flame className={cn('w-3.5 h-3.5', person.explicitMode ? 'text-rose-400 fill-current animate-pulse' : '')} />
            <span className="hidden sm:inline">{person.explicitMode ? 'Explicit ON' : 'Explicit'}</span>
          </button>

          {presenceState === 'speaking' && (
            <button
              onClick={handleStopSpeaking}
              className="w-9 h-9 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center border border-rose-500/30 transition-colors cursor-pointer"
              title="Stop speaking"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}

          <Link
            to={`/world/${world.id}/people/${person.id}/capabilities`}
            className="w-9 h-9 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Configure Agent Capabilities & Allowed Tools"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Link>

          <button
            onClick={intelligenceDisclosure.onOpen}
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Persona Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={voiceConversationDisclosure.onOpen}
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Voice call"
          >
            <Radio className="w-4 h-4" />
          </button>

          <button
            onClick={memoryDisclosure.onOpen}
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-text-muted hover:text-white hidden sm:flex items-center justify-center transition-colors cursor-pointer"
            title="Memories"
          >
            <Brain className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetConversation}
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-text-muted hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="New conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-300 p-2.5 px-4 text-xs font-semibold flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={loadData} className="flex items-center gap-1 hover:underline cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* ── MESSAGES STREAM CONTAINER (Matching Cosmic Dark Design) ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-[#090A12]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-4 p-4">
            <div className="w-16 h-16 rounded-3xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-3xl shadow-purple-glow">
              <span>{personEmoji}</span>
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-base font-extrabold text-white">{person.name}</h3>
              <p className="text-xs text-text-muted">{person.role} in {world.name}</p>
            </div>

            {/* Quick Prompt Chips */}
            <div className="w-full max-w-md space-y-2 pt-2">
              <p className="text-[11px] font-bold text-purple-300/80 uppercase tracking-wider">Suggested Starters</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  `What are you working on right now?`,
                  `How can we improve our goals today?`,
                  `Give me a quick status overview.`,
                  `Let's brainstorm next steps.`,
                ].map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="px-3.5 py-2 rounded-2xl bg-white/[0.04] hover:bg-purple-600/20 border border-white/[0.08] hover:border-purple-500/40 text-xs font-medium text-text-secondary hover:text-white transition-all cursor-pointer text-left shadow-sm min-h-[40px]"
                  >
                    💬 {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isLastAI = !isUser && idx === messages.length - 1;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0">
                    <Avatar name={person.name} emoji={personEmoji} size="xs" />
                  </div>
                )}

                <div className={`flex flex-col max-w-[85%] sm:max-w-xl ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted pb-1 px-1 font-sans">
                    <span className="font-bold text-white">{isUser ? 'You' : person.name}</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="relative group">
                    <div
                      className={
                        isUser
                          ? 'p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans shadow-md bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white rounded-tr-xs border border-purple-500/30'
                          : 'p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans shadow-md bg-[#181A2A] text-white rounded-tl-xs border border-white/[0.08]'
                      }
                    >
                      {msg.content ? (
                        <span>{msg.content}</span>
                      ) : (
                        <div className="dot-pulse"><span /><span /><span /></div>
                      )}
                    </div>

                    {isUser && (
                      <div className="absolute -bottom-1 -right-4 flex items-center text-purple-300 text-xs">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    )}
                  </div>

                  {!isUser && msg.content && isLastAI && (
                    <div className="mt-1.5 pl-1">
                      <VoicePlayerButton
                        text={msg.content}
                        voiceProfile={voiceProfile}
                        personName={person.name}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* ── INPUT FOOTER BAR (Safe Area Supported & Touch Ready) ── */}
      <div
        className="p-3 sm:p-4 border-t border-white/[0.08] bg-[#0E0F1D] shrink-0 font-sans"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {isRecording && (
          <div className="mb-2 p-2.5 px-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className="font-semibold flex-1">Listening to your voice...</span>
            <div className="flex items-center gap-0.5">
              {[6, 12, 8].map((base, i) => (
                <span
                  key={i}
                  className="w-0.5 bg-rose-500 rounded-full transition-all duration-75"
                  style={{ height: `${base + audioLevel * 16}px` }}
                />
              ))}
            </div>
            <button onClick={handleToggleMicrophone} className="font-bold underline ml-2 cursor-pointer min-h-[44px] flex items-center">
              Done
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 bg-[#14162B] border border-purple-500/40 rounded-2xl p-2 px-3 focus-within:border-purple-500/80 transition-all shadow-purple-glow">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isTranscribing ? 'Transcribing audio...' : `Message ${person.name}...`}
            disabled={isStreaming || isTranscribing}
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-text-muted resize-none py-2 px-2"
          />

          {/* Microphone Button */}
          <button
            type="button"
            onClick={handleToggleMicrophone}
            disabled={isStreaming || isTranscribing}
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer border border-purple-400/30 shrink-0 min-h-[44px] min-w-[44px]',
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-glow'
            )}
            title={isRecording ? 'Stop Recording' : 'Voice input'}
          >
            {isTranscribing ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : isRecording ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Mic className="w-4.5 h-4.5" />
            )}
          </button>

          {/* Send or Stop Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="w-10 h-10 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 flex items-center justify-center border border-rose-500/30 transition-all cursor-pointer shrink-0 min-h-[44px] min-w-[44px]"
              title="Stop response"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="w-10 h-10 rounded-full bg-[#6D28D9] hover:bg-[#7C3AED] text-white flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:pointer-events-none shrink-0 min-h-[44px] min-w-[44px]"
              title="Send"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          )}
        </div>

        {/* Footer info line */}
        <div className="flex items-center justify-between text-[10px] text-text-muted pt-2 px-1 font-medium">
          <span className="flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full', isLLMOnline ? 'bg-emerald-400' : 'bg-amber-400')} />
            <span>{isLLMOnline ? 'Connected' : 'LLM Ready'}</span>
          </span>
          <span className="hidden sm:inline">Press Enter to send</span>
        </div>
      </div>

      {/* Modals */}
      <ConfigureVoiceModal
        isOpen={voiceSettingsDisclosure.isOpen}
        onClose={voiceSettingsDisclosure.onClose}
        worldId={world.id}
        personId={person.id}
        personName={person.name}
        onVoiceUpdated={(updated) => setVoiceProfile(updated)}
      />
      <VoiceConversationModal
        isOpen={voiceConversationDisclosure.isOpen}
        onClose={voiceConversationDisclosure.onClose}
        world={world}
        person={person}
        voiceProfile={voiceProfile}
      />
      <ConfigureIntelligenceModal
        isOpen={intelligenceDisclosure.isOpen}
        onClose={intelligenceDisclosure.onClose}
        person={person}
        onUpdated={(updated) => setPerson(updated)}
      />
      <MemoryDrawer
        isOpen={memoryDisclosure.isOpen}
        onClose={memoryDisclosure.onClose}
        world={world}
        person={person}
      />
      <LLMConfigModal
        isOpen={llmDisclosure.isOpen}
        onClose={llmDisclosure.onClose}
        onConfigSaved={() => setLlmRefresh((k) => k + 1)}
      />
    </div>
  );
};

export default PersonChatPage;
