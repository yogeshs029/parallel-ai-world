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

  // Listen to audio queue playback state
  useEffect(() => {
    const unsubscribe = audioQueuePlayer.subscribe((isPlaying) => {
      if (isPlaying) {
        setPresenceState('speaking');
      } else if (!isStreaming && !isRecording) {
        setPresenceState('idle');
      }
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

      // If this is a fresh conversation, trigger a proactive opening from the person
      if (history.length === 0 && !hasAutoInitiatedRef.current) {
        hasAutoInitiatedRef.current = true;
        // Small delay so UI is settled
        setTimeout(() => {
          triggerPersonOpening(w!, p!);
        }, 600);
      }

      // Check LLM health
      const health = await conversationService.checkLLMHealth();
      setIsLLMOnline(health.available);
      if (!health.available) {
        setErrorBanner(
          `${p?.name || 'Your person'} can't connect right now. Check that Ollama is running.`,
        );
      } else {
        setErrorBanner(null);
      }
    } catch (err) {
      console.error('Failed to load chat data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [worldId, personId]);

  // Generate a natural proactive opening message from the person
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

    // Build a hidden system trigger — NOT shown to user
    const hiddenTrigger: ChatMessage = {
      id: `trigger-${Date.now()}`,
      role: 'user',
      content: `[SYSTEM: Start the conversation naturally. Say something relevant to your role as ${p.role} in ${w.name}. Don't introduce yourself — they already know you. Keep it short and casual — like you're checking in, mentioning something you're working on, or asking about something relevant. NO greetings like "Hey!" or "Hi!" — just start talking like you normally would mid-day.]`,
      timestamp: new Date().toISOString(),
    };

    let content = '';
    try {
      await conversationService.streamChat(
        w,
        p,
        [hiddenTrigger],
        (token) => {
          content += token;
          setMessages([{ ...openingMsg, content }]);
        },
      );
      const finalMsg = { ...openingMsg, content };
      conversationService.saveMessages(p.id, [finalMsg]);
      setMessages([finalMsg]);
    } catch (e) {
      // If opening fails, show an empty state without self-introduction
      setMessages([]);
    } finally {
      setIsStreaming(false);
    }
  }, []);


  useEffect(() => {
    loadData();
    return () => {
      audioQueuePlayer.stop();
      cancelRecording();
    };
  }, [loadData, cancelRecording]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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

    // Barge-in: stop any existing speech playback immediately
    audioQueuePlayer.stop();

    // Reset input
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

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

          // Sentence-chunked auto-speech
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
                if (audioUrl) {
                  audioQueuePlayer.enqueue(audioUrl, sentenceToSpeak);
                }
              } catch (synthErr) {
                console.warn('Sentence synthesis error:', synthErr);
              }
            }
          }
        },
        abortController.signal,
      );

      // Flush remaining sentence
      if (voiceProfile?.autoSpeak && sentenceBuffer.trim() && !abortController.signal.aborted) {
        try {
          const finalUrl = await voiceService.synthesize({
            text: sentenceBuffer.trim(),
            voiceId: voiceProfile.voiceId,
            speed: voiceProfile.speakingRate,
            pitch: voiceProfile.pitch,
          });
          if (finalUrl) {
            audioQueuePlayer.enqueue(finalUrl, sentenceBuffer.trim());
          }
        } catch (e) {
          console.warn('Final sentence synthesis error:', e);
        }
      }

      // Save complete conversation
      const finalMessages = [
        ...messages,
        userMsg,
        { ...initialAssistantMsg, content: accumulatedContent },
      ];
      conversationService.saveMessages(person.id, finalMessages);
      setMessages(finalMessages);
    } catch (err: unknown) {
      console.error('Streaming error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        // Handled as intentional cancellation
      } else {
        const errorMsg = `${person.name}'s intelligence is temporarily unavailable. Please try again.`;
        setErrorBanner(errorMsg);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content:
                    accumulatedContent ||
                    `I'm having a brief moment of pause. Please ask me again.`,
                }
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      audioQueuePlayer.stop();
      toast.info('Stopped generating', 'Response generation was cancelled.');
    }
  };

  const handleStopSpeaking = () => {
    audioQueuePlayer.stop();
    setPresenceState('idle');
  };

  const handleToggleMicrophone = async () => {
    // Interruption: stop assistant playback
    audioQueuePlayer.stop();

    if (isRecording) {
      setIsTranscribing(true);
      const blob = await stopRecording();
      if (blob) {
        const res = await voiceService.transcribeAudio(blob);
        if (res && res.transcript.trim()) {
          setInputValue((prev) => (prev ? `${prev} ${res.transcript}` : res.transcript));
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
            textareaRef.current.focus();
          }
        } else {
          toast.info('No speech detected', 'Please try speaking a bit louder.');
        }
      }
      setIsTranscribing(false);
    } else {
      const ok = await startRecording();
      if (!ok && micError) {
        toast.error('Microphone error', micError);
      }
    }
  };

  const handleResetConversation = () => {
    if (!person) return;
    audioQueuePlayer.stop();
    conversationService.clearMessages(person.id);
    setMessages([]);
    toast.info('Conversation reset', `Started a fresh conversation with ${person.name}. Long-term memories are preserved.`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return <LoadingState message="Connecting to person intelligence & voice..." />;
  }

  if (!world || !person) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-4 font-sans">
        <h2 className="text-xl font-bold">Person Not Found</h2>
        <Link to="/worlds">
          <Button variant="primary" size="md" leftIcon={ArrowLeft}>
            Return to Worlds
          </Button>
        </Link>
      </div>
    );
  }

  const personEmoji = person.avatar?.emoji || person.avatarEmoji || '👤';



  return (
    <div className="flex flex-col h-[calc(100dvh-60px)] font-sans max-w-3xl mx-auto">
      {/* ── Chat Header ── */}
      <div className="flex items-center gap-3 px-3 py-2.5 cosmos-card mb-1 shrink-0">
        {/* Back */}
        <Link
          to={`/world/${world.id}/people/${person.id}`}
          className="cosmos-btn-icon w-8 h-8 shrink-0 rounded-xl"
          title="Back to Profile"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Avatar + Status ping */}
        <div className="relative shrink-0">
          <Avatar
            name={person.name}
            emoji={personEmoji}
            size="md"
            status={isStreaming ? 'working' : presenceState === 'speaking' ? 'working' : 'available'}
          />
          {presenceState === 'speaking' && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#7c9bf7] border-2 border-[#0d1117] animate-ping" />
          )}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-text-primary truncate">{person.name}</h2>
            <span className={cn(
              'cosmos-chip text-[10px]',
              presenceState === 'speaking' ? 'cosmos-chip-blue'
              : isStreaming ? 'cosmos-chip-amber'
              : isRecording ? 'cosmos-chip-red'
              : 'cosmos-chip-green',
            )}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
              {presenceState === 'speaking' ? 'Speaking' : isStreaming ? 'Thinking' : isRecording ? 'Listening' : 'Online'}
            </span>
          </div>
          <p className="text-[11px] text-text-muted truncate">{person.role}</p>
        </div>

        {/* Action Pill Buttons - minimal on mobile */}
        <div className="flex items-center gap-1 shrink-0">
          {presenceState === 'speaking' && (
            <button
              onClick={handleStopSpeaking}
              className="cosmos-btn cosmos-btn-ghost text-[11px] px-2 py-1 h-auto gap-1 rounded-lg"
            >
              <Square className="w-3 h-3" /> Stop
            </button>
          )}
          <button
            onClick={voiceConversationDisclosure.onOpen}
            title="Voice Mode"
            className="w-8 h-8 cosmos-btn-icon rounded-xl text-[#a5bef9]"
          >
            <Radio className="w-4 h-4" />
          </button>
          <button
            onClick={memoryDisclosure.onOpen}
            title="Memory"
            className="hidden sm:flex w-8 h-8 cosmos-btn-icon rounded-xl"
          >
            <Brain className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetConversation}
            title="Reset Chat"
            className="w-8 h-8 cosmos-btn-icon rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {errorBanner && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 animate-fade-in shrink-0 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1">{errorBanner}</span>
          <button
            onClick={loadData}
            className="flex items-center gap-1 text-amber-300 hover:text-amber-100 font-semibold transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 ? (
          /* Conversation starting... spinner — shown only if proactive message is loading */
          <div className="flex flex-col items-center justify-center min-h-[55vh] gap-4 animate-fade-in">
            <Avatar name={person.name} emoji={personEmoji} size="xl" />
            <div className="text-center space-y-1.5">
              <p className="text-sm font-semibold text-text-primary">{person.name}</p>
              <p className="text-xs text-text-muted">{person.role}</p>
            </div>
            <div className="dot-pulse mt-2"><span /><span /><span /></div>
            <p className="text-[11px] text-text-dim">Starting conversation...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            // Hide internal system trigger messages
            if (isUser && msg.content.startsWith('[SYSTEM:')) return null;
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-end gap-2.5 fade-up',
                  isUser ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                {/* AI avatar — only for non-user */}
                {!isUser && (
                  <div className="shrink-0 mb-0.5">
                    <Avatar name={person.name} emoji={personEmoji} size="sm" />
                  </div>
                )}

                <div className={cn('space-y-1', isUser ? 'items-end' : 'items-start', 'flex flex-col max-w-[82%] sm:max-w-[72%]')}>
                  {/* Bubble */}
                  {isUser ? (
                    <div className="bubble-user">
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ) : (
                    <div className="bubble-ai">
                      {msg.content ? (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                        /* Thinking dots */
                        <div className="dot-pulse">
                          <span /><span /><span />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voice play button */}
                  {!isUser && msg.content && (
                    <div className="pl-1">
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
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div className="shrink-0 px-2 pb-3 pt-2 space-y-2">
        {/* Mic recording banner */}
        {isRecording && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 animate-fade-in">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping shrink-0" />
            <span className="font-semibold flex-1">Listening...</span>
            {/* waveform */}
            <div className="flex items-center gap-0.5">
              {[8, 14, 10].map((base, i) => (
                <span
                  key={i}
                  className="w-1 bg-rose-400 rounded-full transition-all"
                  style={{ height: `${base + audioLevel * 18}px` }}
                />
              ))}
            </div>
            <button
              onClick={handleToggleMicrophone}
              className="font-semibold text-rose-300 hover:text-rose-100 transition-colors"
            >
              Done
            </button>
          </div>
        )}

        {/* Main input row */}
        <div className="flex items-end gap-2 cosmos-card px-3 py-2.5">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isTranscribing
                ? 'Converting speech to text...'
                : `Message ${person.name}...`
            }
            disabled={isStreaming || isTranscribing}
            className="flex-1 bg-transparent text-text-primary text-sm placeholder:text-text-dim focus:outline-none resize-none font-sans max-h-36 disabled:opacity-50 leading-relaxed py-1"
            autoFocus
          />

          {/* Mic button */}
          <button
            onClick={handleToggleMicrophone}
            disabled={isStreaming || isTranscribing}
            title={isRecording ? 'Stop Recording' : 'Voice input'}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-40',
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'cosmos-btn-icon',
            )}
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#7c9bf7]" />
            ) : isRecording ? (
              <Square className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Send / Stop */}
          {isStreaming ? (
            <button
              onClick={handleStopStreaming}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition-all shrink-0"
              title="Stop generating"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="cosmos-btn cosmos-btn-primary w-9 h-9 rounded-xl p-0 shrink-0 disabled:opacity-30 disabled:pointer-events-none"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between text-[10px] text-text-dim px-1">
          <span>Enter to send • Shift+Enter new line</span>
          <span className="flex items-center gap-1">
            <span className={cn('w-1.5 h-1.5 rounded-full', isLLMOnline ? 'bg-emerald-400' : 'bg-amber-400')} />
            {isLLMOnline ? 'AI Online' : 'AI Offline'}
          </span>
        </div>
      </div>

      {/* Voice Configuration Modal */}
      <ConfigureVoiceModal
        isOpen={voiceSettingsDisclosure.isOpen}
        onClose={voiceSettingsDisclosure.onClose}
        worldId={world.id}
        personId={person.id}
        personName={person.name}
        onVoiceUpdated={(updated) => setVoiceProfile(updated)}
      />

      {/* Immersive Voice Conversation Modal */}
      <VoiceConversationModal
        isOpen={voiceConversationDisclosure.isOpen}
        onClose={voiceConversationDisclosure.onClose}
        world={world}
        person={person}
        voiceProfile={voiceProfile}
      />

      {/* Configure Intelligence Modal */}
      <ConfigureIntelligenceModal
        isOpen={intelligenceDisclosure.isOpen}
        onClose={intelligenceDisclosure.onClose}
        person={person}
        onUpdated={(updated) => setPerson(updated)}
      />

      {/* Memory Drawer */}
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
