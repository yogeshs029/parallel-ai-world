import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Square,
  RotateCcw,
  Sliders,
  User,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Brain,
  Mic,
  Volume2,
  Radio,
  Loader2,
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
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

      // Check Ollama health
      const health = await conversationService.checkLLMHealth();
      setIsLLMOnline(health.available);
      if (!health.available) {
        setErrorBanner(
          `${p?.name || 'Your person'}'s intelligence service is currently unavailable. Ensure Ollama is running.`,
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

  const starterPrompts = [
    `Tell me about yourself and what you're working on`,
    `What can you help me with in ${world.name}?`,
    person.responsibilities && person.responsibilities.length > 0
      ? `Help me with ${person.responsibilities[0]}`
      : `Let's discuss our priorities`,
    `What recommendations do you have for ${world.name}?`,
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] font-sans max-w-5xl mx-auto">
      {/* Top Chat Header */}
      <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-background-surface border border-border shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to={`/world/${world.id}/people/${person.id}`}
            className="p-1.5 rounded-xl hover:bg-background-elevated text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Back to Profile"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="relative">
            <Avatar
              name={person.name}
              emoji={personEmoji}
              size="md"
              status={isStreaming ? 'working' : presenceState === 'speaking' ? 'working' : 'available'}
            />
            {presenceState === 'speaking' && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand-purple border-2 border-background-surface animate-ping" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-text-primary">
                {person.name}
              </h2>
              <Badge
                variant={
                  presenceState === 'speaking'
                    ? 'completed'
                    : isStreaming
                    ? 'thinking'
                    : isRecording
                    ? 'warning'
                    : 'available'
                }
                size="sm"
                dot
              >
                {presenceState === 'speaking'
                  ? 'Speaking...'
                  : isStreaming
                  ? 'Thinking...'
                  : isRecording
                  ? 'Listening...'
                  : 'Available'}
              </Badge>
            </div>
            <div className="text-xs text-text-muted flex items-center gap-1.5">
              <span className="text-brand-purple-light font-medium">{person.role}</span>
              <span>•</span>
              <span className="text-text-dim flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-text-muted" />
                {voiceProfile?.voiceName || 'Voice Enabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5">
          {presenceState === 'speaking' && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={Square}
              onClick={handleStopSpeaking}
              className="text-xs text-brand-purple-light border-brand-purple/40 bg-brand-purple/10"
            >
              Stop Voice
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            leftIcon={Radio}
            onClick={voiceConversationDisclosure.onOpen}
            title="Start interactive voice conversation"
            className="text-brand-purple-light border-brand-purple/40 bg-gradient-to-r from-brand-purple/10 to-brand-indigo/10 hover:from-brand-purple/20 hover:to-brand-indigo/20 font-bold"
          >
            <span>Voice Mode</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={Volume2}
            onClick={voiceSettingsDisclosure.onOpen}
            title="Configure Voice"
            className="hidden sm:inline-flex"
          >
            Voice
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={Brain}
            onClick={memoryDisclosure.onOpen}
            title="View what this person remembers"
            className="text-brand-purple-light hover:text-white"
          >
            <span>Memory</span>
          </Button>

          <Link to={`/world/${world.id}/people/${person.id}`}>
            <Button variant="ghost" size="sm" leftIcon={User} className="hidden sm:inline-flex">
              Profile
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={Sliders}
            onClick={intelligenceDisclosure.onOpen}
            title="Configure Intelligence"
            className="hidden sm:inline-flex"
          >
            Intelligence
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={RotateCcw}
            onClick={handleResetConversation}
            title="Reset Conversation"
          >
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      {/* Offline Alert Banner */}
      {errorBanner && (
        <div className="my-2 p-3 bg-brand-amber-subtle border border-brand-amber/30 rounded-2xl flex items-center justify-between text-xs text-brand-amber animate-fade-in shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={loadData}
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 space-y-5 animate-fade-in max-w-lg mx-auto">
            <div className="relative">
              <Avatar name={person.name} emoji={personEmoji} size="xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background-elevated border border-border flex items-center justify-center text-xs">
                ✨
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-text-primary">
                Hi, I'm {person.name}.
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {person.description || `I'm ready to help you with ${person.role} tasks in ${world.name}.`}
              </p>
            </div>

            <div className="w-full space-y-2 pt-2 text-left">
              <span className="text-[11px] font-bold uppercase text-text-muted tracking-wider block text-center">
                Suggested conversation starters:
              </span>
              <div className="flex flex-col gap-2">
                {starterPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 rounded-2xl bg-background-surface hover:bg-background-elevated border border-border hover:border-brand-purple/40 text-xs text-text-secondary hover:text-text-primary text-left transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">"{prompt}"</span>
                    <Sparkles className="w-3.5 h-3.5 text-text-dim group-hover:text-brand-purple-light shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex items-start gap-3 animate-fade-in group',
                  isUser ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                {!isUser && (
                  <Avatar
                    name={person.name}
                    emoji={personEmoji}
                    size="sm"
                    className="mt-0.5 shrink-0"
                  />
                )}

                <div className="space-y-1 max-w-[85%] sm:max-w-[75%]">
                  <div
                    className={cn(
                      'rounded-3xl p-4 text-xs sm:text-sm leading-relaxed space-y-1.5 shadow-sm font-sans',
                      isUser
                        ? 'bg-gradient-to-r from-brand-purple to-brand-indigo text-white rounded-tr-sm'
                        : 'bg-background-surface border border-border text-text-primary rounded-tl-sm',
                    )}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content || (
                        <span className="inline-flex items-center gap-1 text-text-muted italic">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-ping" />
                          Thinking...
                        </span>
                      )}
                    </div>
                  </div>

                  {!isUser && msg.content && (
                    <div className="flex items-center gap-2 pl-2">
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

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 rounded-3xl bg-background-surface border border-border shrink-0 shadow-lg space-y-2">
        {/* Live Microphone Recording Banner */}
        {isRecording && (
          <div className="p-2.5 rounded-2xl bg-brand-rose/10 border border-brand-rose/30 flex items-center justify-between animate-fade-in text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-brand-rose animate-ping shrink-0" />
              <span className="font-bold text-brand-rose">Listening to you...</span>
              <div className="flex items-center gap-0.5">
                <span
                  className="w-1 bg-brand-rose rounded-full transition-all"
                  style={{ height: `${8 + audioLevel * 20}px` }}
                />
                <span
                  className="w-1 bg-brand-rose rounded-full transition-all"
                  style={{ height: `${12 + audioLevel * 24}px` }}
                />
                <span
                  className="w-1 bg-brand-rose rounded-full transition-all"
                  style={{ height: `${6 + audioLevel * 16}px` }}
                />
              </div>
            </div>
            <button
              onClick={handleToggleMicrophone}
              className="text-xs font-bold text-brand-rose hover:underline cursor-pointer"
            >
              Done speaking
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isTranscribing
                ? 'Converting speech to text...'
                : `Talk to ${person.name}... (or click microphone to speak)`
            }
            disabled={isStreaming || isTranscribing}
            className="flex-1 bg-background-elevated text-text-primary text-xs sm:text-sm rounded-2xl border border-border px-4 py-3 placeholder:text-text-dim focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple resize-none font-sans max-h-36 disabled:opacity-60"
            autoFocus
          />

          {/* Microphone Action Button */}
          <Button
            variant="outline"
            size="md"
            onClick={handleToggleMicrophone}
            disabled={isStreaming || isTranscribing}
            className={cn(
              'rounded-2xl shrink-0 h-11 px-3.5 transition-all',
              isRecording
                ? 'bg-brand-rose text-white border-brand-rose hover:bg-rose-600 animate-pulse'
                : 'text-text-secondary hover:text-text-primary',
            )}
            title={isRecording ? 'Stop Recording' : 'Speak with Microphone'}
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-purple-light" />
            ) : isRecording ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>

          {isStreaming ? (
            <Button
              variant="danger"
              size="md"
              leftIcon={Square}
              onClick={handleStopStreaming}
              className="rounded-2xl shrink-0 h-11 px-4"
              title="Stop Generating"
            >
              Stop
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              leftIcon={Send}
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="rounded-2xl shrink-0 h-11 px-4"
              title="Send Message"
            >
              Send
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-dim px-2">
          <span>Shift + Enter for new line • Click 🎤 to speak</span>
          <span className="flex items-center gap-1">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isLLMOnline ? 'bg-brand-emerald' : 'bg-brand-amber',
              )}
            />
            {isLLMOnline ? 'Local Intelligence Online' : 'Intelligence Offline'}
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
