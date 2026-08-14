import React, { useEffect, useState, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/layout/LoadingState';
import { ConfigureIntelligenceModal } from '../features/intelligence/components/ConfigureIntelligenceModal';
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
  }, [worldId, personId]);

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
          ? `${person.name} can now engage in uncensored, explicit & romantic dialogue.`
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
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <h2 className="text-lg font-semibold text-slate-800">Person not found</h2>
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
    : isGirlfriend
    ? '❤️ Girlfriend • Online'
    : isBoyfriend
    ? '💙 Boyfriend • Online'
    : 'Active now';

  return (
    <div className={cn('chat-shell', isRomantic && 'border-rose-500/30 shadow-rose-500/10')}>
      {/* ── iOS Header ── */}
      <div className={cn('chat-header', isRomantic && 'bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900')}>
        <Link
          to={`/world/${world.id}/people/${person.id}`}
          className="chat-back-btn"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="chat-header-person">
          <div className="relative">
            <Avatar
              name={person.name}
              emoji={personEmoji}
              size="sm"
              status={isStreaming ? 'working' : presenceState === 'speaking' ? 'working' : 'available'}
            />
          </div>
          <div className="chat-header-info">
            <span className="chat-header-name flex items-center gap-1">
              {person.name}
              {isGirlfriend && <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />}
              {isBoyfriend && <Heart className="w-3.5 h-3.5 text-indigo-400 fill-current" />}
            </span>
            <span className={cn(
              'chat-header-status font-medium flex items-center gap-1',
              isRomantic ? 'text-rose-400' : isStreaming || presenceState === 'speaking' ? 'text-[#34c759]' : 'text-slate-400'
            )}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            onClick={handleToggleExplicitMode}
            className={cn(
              'chat-action-btn flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg transition-all',
              person.explicitMode
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            )}
            title={person.explicitMode ? 'Explicit Mode Enabled (Click to toggle)' : 'Enable Explicit Mode'}
          >
            <Flame className={cn('w-4 h-4', person.explicitMode ? 'text-rose-400 fill-current animate-pulse' : '')} />
            <span className="hidden md:inline">{person.explicitMode ? 'Explicit ON' : 'Explicit'}</span>
          </button>

          {presenceState === 'speaking' && (
            <button onClick={handleStopSpeaking} className="chat-action-btn" title="Stop speaking">
              <Square className="w-4 h-4 fill-current" />
            </button>
          )}
          <button onClick={intelligenceDisclosure.onOpen} className="chat-action-btn" title="Persona Settings">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={voiceConversationDisclosure.onOpen} className="chat-action-btn" title="Voice call">
            <Radio className="w-4 h-4" />
          </button>
          <button onClick={memoryDisclosure.onOpen} className="chat-action-btn hidden sm:flex" title="Memories">
            <Brain className="w-4 h-4" />
          </button>
          <button onClick={handleResetConversation} className="chat-action-btn" title="New conversation">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="chat-error-banner">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-xs">{errorBanner}</span>
          <button onClick={loadData} className="flex items-center gap-1 font-semibold text-xs text-amber-700">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty-state">
            <Avatar name={person.name} emoji={personEmoji} size="lg" />
            <p className="text-sm font-semibold text-slate-800 mt-3">{person.name}</p>
            <p className="text-xs text-slate-400">{person.role}</p>
            <div className="dot-pulse mt-4"><span /><span /><span /></div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isLastAI = !isUser && idx === messages.length - 1;
            const showAvatar = !isUser && (idx === messages.length - 1 || messages[idx + 1]?.role === 'user');

            return (
              <div
                key={msg.id}
                className={cn('chat-row', isUser ? 'chat-row-user' : 'chat-row-ai')}
              >
                {!isUser && (
                  <div className="w-7 shrink-0 self-end mb-0.5">
                    {showAvatar && (
                      <Avatar name={person.name} emoji={personEmoji} size="xs" />
                    )}
                  </div>
                )}

                <div className={cn('chat-bubble-wrap', isUser ? 'items-end' : 'items-start')}>
                  {isUser ? (
                    <div className="imessage-bubble-user">{msg.content}</div>
                  ) : (
                    <div className="imessage-bubble-ai">
                      {msg.content ? (
                        <span className="whitespace-pre-wrap">{msg.content}</span>
                      ) : (
                        <div className="dot-pulse"><span /><span /><span /></div>
                      )}
                    </div>
                  )}

                  {!isUser && msg.content && isLastAI && (
                    <div className="mt-1 pl-1">
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

      {/* ── Input Bar ── */}
      <div className="chat-input-area">
        {isRecording && (
          <div className="chat-recording-banner">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-xs font-medium text-red-600 flex-1">Listening...</span>
            <div className="flex items-center gap-0.5">
              {[6, 12, 8].map((base, i) => (
                <span
                  key={i}
                  className="w-0.5 bg-red-500 rounded-full transition-all duration-75"
                  style={{ height: `${base + audioLevel * 16}px` }}
                />
              ))}
            </div>
            <button onClick={handleToggleMicrophone} className="text-xs text-red-600 font-semibold ml-1">
              Done
            </button>
          </div>
        )}

        <div className="chat-input-row">
          <button
            onClick={handleToggleMicrophone}
            disabled={isStreaming || isTranscribing}
            className={cn(
              'chat-input-icon-btn',
              isRecording ? 'text-red-500' : 'text-slate-400 hover:text-slate-700'
            )}
            title={isRecording ? 'Stop' : 'Voice input'}
          >
            {isTranscribing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={isTranscribing ? 'Converting...' : `Message ${person.name}`}
            disabled={isStreaming || isTranscribing}
            className="chat-textarea"
            autoFocus
          />

          {isStreaming ? (
            <button
              onClick={handleStopStreaming}
              className="chat-send-btn chat-send-btn-stop"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="chat-send-btn chat-send-btn-active"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="chat-input-footer">
          <span className="flex items-center gap-1.5">
            <span className={cn(
              'w-1.5 h-1.5 rounded-full',
              isLLMOnline ? 'bg-[#34c759]' : 'bg-amber-500'
            )} />
            <span>{isLLMOnline ? 'Connected' : 'Offline'}</span>
          </span>
          <span>Enter to send</span>
        </div>
      </div>

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
    </div>
  );
};

export default PersonChatPage;
