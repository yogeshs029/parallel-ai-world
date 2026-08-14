import React, { useState, useEffect } from 'react';
import { Volume2, Square, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { voiceService } from '../../../services/voiceService';
import { audioQueuePlayer } from '../../../services/audioQueuePlayer';
import { VoiceProfile } from '../../../types/voice';
import { cn } from '../../../lib/utils';

export interface VoicePlayerButtonProps {
  text: string;
  voiceProfile?: VoiceProfile | null;
  personName?: string;
  className?: string;
}

export const VoicePlayerButton: React.FC<VoicePlayerButtonProps> = ({
  text,
  voiceProfile,
  personName = 'Maya',
  className,
}) => {
  const [isPlayingThis, setIsPlayingThis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = audioQueuePlayer.subscribe((isPlaying, currentText) => {
      setIsPlayingThis(isPlaying && currentText === text);
    });
    return () => unsubscribe();
  }, [text]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlayingThis) {
      audioQueuePlayer.stop();
      setIsPlayingThis(false);
      return;
    }

    try {
      setIsLoading(true);
      const audioUrl = await voiceService.synthesize({
        text,
        voiceId: voiceProfile?.voiceId || 'en-US-AvaNeural',
        speed: voiceProfile?.speakingRate || 1.0,
        pitch: voiceProfile?.pitch || 1.0,
      });

      if (audioUrl) {
        audioQueuePlayer.stop();
        audioQueuePlayer.enqueue(audioUrl, text);
        setIsPlayingThis(true);
      }
    } catch (err) {
      console.error('Speech synthesis failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={cn(
        'text-xs h-7 px-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer',
        isPlayingThis
          ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/40 font-semibold'
          : 'text-text-muted hover:text-text-primary hover:bg-background-elevated',
        className,
      )}
      title={isPlayingThis ? 'Stop speaking' : `Listen to ${personName}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-purple-light" />
      ) : isPlayingThis ? (
        <>
          <Square className="w-3 h-3 fill-current text-brand-purple-light animate-pulse" />
          <span className="flex items-center gap-0.5">
            <span className="w-1 h-2 bg-brand-purple-light animate-bounce" />
            <span className="w-1 h-3 bg-brand-purple-light animate-bounce [animation-delay:0.2s]" />
            <span className="w-1 h-1.5 bg-brand-purple-light animate-bounce [animation-delay:0.4s]" />
          </span>
          <span className="text-[11px]">Stop</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5" />
          <span className="text-[11px]">Play</span>
        </>
      )}
    </Button>
  );
};
