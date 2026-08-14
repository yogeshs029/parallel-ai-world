import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Square,
  X,
  Radio,
  Loader2,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { useMicrophoneRecorder } from '../../../hooks/useMicrophoneRecorder';
import { voiceService } from '../../../services/voiceService';
import { audioQueuePlayer } from '../../../services/audioQueuePlayer';
import { conversationService, ChatMessage } from '../../../services/conversationService';
import { Person, World } from '../../../types';
import { VoiceProfile, VoiceState } from '../../../types/voice';
import { cn } from '../../../lib/utils';

export interface VoiceConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  world: World;
  person: Person;
  voiceProfile: VoiceProfile | null;
}

export const VoiceConversationModal: React.FC<VoiceConversationModalProps> = ({
  isOpen,
  onClose,
  world,
  person,
  voiceProfile,
}) => {
  const [presenceState, setPresenceState] = useState<VoiceState>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [handsFree, setHandsFree] = useState(true);
  const [currentSpokenText, setCurrentSpokenText] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isRecording,
    audioLevel,
    error: micError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useMicrophoneRecorder();

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync state with audio player
  useEffect(() => {
    const unsubscribe = audioQueuePlayer.subscribe((isPlaying, text) => {
      if (isPlaying) {
        setPresenceState('speaking');
        setCurrentSpokenText(text || null);
      } else {
        if (presenceState === 'speaking') {
          setPresenceState('idle');
          setCurrentSpokenText(null);
          // If hands free and modal open, auto-listen for next user turn
          if (handsFree && isOpen && !isRecording && !isProcessing) {
            setTimeout(() => {
              startRecording();
            }, 600);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [presenceState, handsFree, isOpen, isRecording, isProcessing, startRecording]);

  // Load existing chat messages
  useEffect(() => {
    if (isOpen) {
      const history = conversationService.getMessages(person.id);
      setMessages(history.slice(-6)); // last 6 messages
      // Auto-start recording on open if hands free
      if (handsFree) {
        setTimeout(() => {
          startRecording();
        }, 500);
      }
    } else {
      audioQueuePlayer.stop();
      cancelRecording();
      setPresenceState('idle');
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen, person.id, handsFree, cancelRecording, startRecording]);

  useEffect(() => {
    if (isRecording) {
      setPresenceState('listening');
    }
  }, [isRecording]);

  const handleSendVoiceMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      };

      const asstMsgId = `asst-${Date.now()}`;
      const initialAsstMsg: ChatMessage = {
        id: asstMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg, initialAsstMsg]);
      setPresenceState('thinking');
      setIsProcessing(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let accumulatedContent = '';
      let sentenceBuffer = '';

      try {
        await conversationService.streamChat(
          world,
          person,
          [...messages, userMsg],
          async (token: string) => {
            accumulatedContent += token;
            sentenceBuffer += token;

            // Update UI message
            setMessages((prev) =>
              prev.map((m) => (m.id === asstMsgId ? { ...m, content: accumulatedContent } : m)),
            );

            // Check for sentence boundary for streaming speech synthesis
            const boundaryMatch = sentenceBuffer.match(/([.!?]+[\s\n]+|[\n]{2,})/);
            if (boundaryMatch && sentenceBuffer.trim().length >= 15) {
              const sentenceToSpeak = sentenceBuffer.trim();
              sentenceBuffer = '';

              try {
                const audioUrl = await voiceService.synthesize({
                  text: sentenceToSpeak,
                  voiceId: voiceProfile?.voiceId || 'en-US-AvaNeural',
                  speed: voiceProfile?.speakingRate || 1.0,
                  pitch: voiceProfile?.pitch || 1.0,
                });
                if (audioUrl) {
                  audioQueuePlayer.enqueue(audioUrl, sentenceToSpeak);
                }
              } catch (synthErr) {
                console.warn('Sentence synthesis error:', synthErr);
              }
            }
          },
          controller.signal,
        );

        // Flush remainder
        if (sentenceBuffer.trim()) {
          try {
            const finalAudioUrl = await voiceService.synthesize({
              text: sentenceBuffer.trim(),
              voiceId: voiceProfile?.voiceId || 'en-US-AvaNeural',
              speed: voiceProfile?.speakingRate || 1.0,
              pitch: voiceProfile?.pitch || 1.0,
            });
            if (finalAudioUrl) {
              audioQueuePlayer.enqueue(finalAudioUrl, sentenceBuffer.trim());
            }
          } catch (e) {
            console.warn('Final sentence synthesis error:', e);
          }
        }
      } catch (err) {
        console.error('Voice stream failed:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [world, person, messages, voiceProfile],
  );

  const handleToggleMic = async () => {
    // Interruption / Barge-in: If assistant is speaking, stop it immediately
    if (presenceState === 'speaking') {
      audioQueuePlayer.stop();
    }

    if (isRecording) {
      setPresenceState('thinking');
      const blob = await stopRecording();
      if (blob) {
        setIsProcessing(true);
        const res = await voiceService.transcribeAudio(blob);
        setIsProcessing(false);
        if (res && res.transcript.trim()) {
          await handleSendVoiceMessage(res.transcript);
        } else {
          setPresenceState('idle');
        }
      } else {
        setPresenceState('idle');
      }
    } else {
      await startRecording();
    }
  };

  const handleStopSpeaking = () => {
    audioQueuePlayer.stop();
    setPresenceState('idle');
  };

  const personEmoji = person.avatar?.emoji || person.avatarEmoji || '👤';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
      className="max-w-2xl bg-background-deep/95 backdrop-blur-xl border-border/80 p-0 overflow-hidden"
    >
      <div className="flex flex-col h-[75vh] max-h-[700px] justify-between p-6 sm:p-8 font-sans relative">
        {/* Top Bar */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Avatar name={person.name} emoji={personEmoji} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-text-primary">
                  {person.name}
                </h3>
                <Badge
                  variant={
                    presenceState === 'speaking'
                      ? 'completed'
                      : presenceState === 'listening'
                      ? 'warning'
                      : presenceState === 'thinking'
                      ? 'thinking'
                      : 'neutral'
                  }
                  size="sm"
                >
                  {presenceState === 'speaking'
                    ? 'Speaking...'
                    : presenceState === 'listening'
                    ? 'Listening...'
                    : presenceState === 'thinking'
                    ? 'Thinking...'
                    : 'Voice Mode'}
                </Badge>
              </div>
              <p className="text-[11px] text-text-secondary">{person.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setHandsFree(!handsFree)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border',
                handsFree
                  ? 'bg-brand-purple/20 text-brand-purple-light border-brand-purple/40'
                  : 'bg-background-elevated text-text-muted border-border hover:text-text-primary',
              )}
              title="Auto listen when response finishes"
            >
              <Radio className={cn('w-3.5 h-3.5', handsFree && 'animate-pulse')} />
              <span>Hands-free</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-background-elevated transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Orb & Presence Visualizer */}
        <div className="flex flex-col items-center justify-center my-auto space-y-6 relative">
          {/* Animated Presence Rings */}
          <div className="relative flex items-center justify-center">
            {/* Pulsing Aura */}
            <div
              className={cn(
                'absolute rounded-full transition-all duration-300',
                presenceState === 'speaking' &&
                  'w-48 h-48 sm:w-56 sm:h-56 bg-brand-purple/20 animate-ping [animation-duration:2s]',
                presenceState === 'listening' &&
                  'bg-brand-cyan/25 rounded-full transition-all',
                presenceState === 'thinking' &&
                  'w-44 h-44 bg-brand-amber/20 animate-pulse',
              )}
              style={{
                width: presenceState === 'listening' ? `${140 + audioLevel * 100}px` : undefined,
                height: presenceState === 'listening' ? `${140 + audioLevel * 100}px` : undefined,
              }}
            />

            {/* Main Avatar / Presence Core */}
            <div
              className={cn(
                'w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-5xl relative z-10 transition-transform shadow-2xl border-2',
                presenceState === 'speaking'
                  ? 'bg-brand-purple/20 border-brand-purple scale-105 shadow-brand-purple/30'
                  : presenceState === 'listening'
                  ? 'bg-brand-cyan/20 border-brand-cyan scale-105 shadow-brand-cyan/30'
                  : presenceState === 'thinking'
                  ? 'bg-brand-amber/20 border-brand-amber animate-pulse shadow-brand-amber/30'
                  : 'bg-background-elevated border-border',
              )}
            >
              {personEmoji}
            </div>
          </div>

          {/* Subtitle / Spoken Text Display */}
          <div className="text-center max-w-lg px-4 min-h-[60px] flex items-center justify-center">
            {presenceState === 'speaking' && currentSpokenText ? (
              <p className="text-sm sm:text-base text-text-primary font-medium italic animate-fade-in leading-relaxed">
                "{currentSpokenText}"
              </p>
            ) : presenceState === 'listening' ? (
              <p className="text-xs sm:text-sm text-brand-cyan font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
                Listening to you... (speak now)
              </p>
            ) : presenceState === 'thinking' ? (
              <p className="text-xs sm:text-sm text-brand-amber font-medium flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {person.name} is thinking...
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-text-muted">
                {handsFree
                  ? 'Tap the microphone or speak to start'
                  : 'Tap the microphone below to talk'}
              </p>
            )}
          </div>

          {micError && (
            <p className="text-xs text-brand-rose bg-brand-rose/10 px-3 py-1.5 rounded-xl border border-brand-rose/30">
              {micError}
            </p>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="flex flex-col items-center justify-center gap-4 z-10 pt-4 border-t border-border/50">
          <div className="flex items-center gap-4">
            {presenceState === 'speaking' && (
              <Button
                variant="outline"
                size="md"
                leftIcon={Square}
                onClick={handleStopSpeaking}
                className="rounded-2xl border-brand-purple/40 text-brand-purple-light"
              >
                Stop Voice
              </Button>
            )}

            {/* Giant Microphone Action Button */}
            <button
              onClick={handleToggleMic}
              disabled={isProcessing && presenceState === 'thinking'}
              className={cn(
                'w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all cursor-pointer relative',
                isRecording
                  ? 'bg-brand-rose hover:bg-rose-600 scale-110 shadow-brand-rose/40 animate-pulse'
                  : 'bg-brand-purple hover:bg-purple-600 hover:scale-105 shadow-brand-purple/40',
              )}
              title={isRecording ? 'Tap to finish speaking' : 'Tap to speak'}
            >
              {isRecording ? (
                <Square className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
              ) : (
                <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
              )}
            </button>
          </div>

          <span className="text-[11px] text-text-dim">
            {isRecording ? 'Tap to finish and send' : 'Tap microphone to talk'}
          </span>
        </div>
      </div>
    </Modal>
  );
};
