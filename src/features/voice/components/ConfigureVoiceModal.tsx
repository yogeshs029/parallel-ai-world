import React, { useEffect, useState, useRef } from 'react';
import {
  Volume2,
  Play,
  Square,
  Save,
  Sparkles,
  Check,
  Globe,
  Gauge,
  Sliders,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../hooks/useToast';
import { voiceService } from '../../../services/voiceService';
import { VoiceOption, VoiceProfile, VoiceGender } from '../../../types/voice';
import { cn } from '../../../lib/utils';

export interface ConfigureVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  worldId: string;
  personId: string;
  personName: string;
  onVoiceUpdated?: (updated: VoiceProfile) => void;
}

export const ConfigureVoiceModal: React.FC<ConfigureVoiceModalProps> = ({
  isOpen,
  onClose,
  worldId,
  personId,
  personName,
  onVoiceUpdated,
}) => {
  const toast = useToast();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [profile, setProfile] = useState<VoiceProfile | null>(null);
  const [genderFilter, setGenderFilter] = useState<'all' | VoiceGender>('all');
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      Promise.all([
        voiceService.getVoices(),
        voiceService.getPersonVoice(worldId, personId),
      ])
        .then(([vList, pVoice]) => {
          setVoices(vList);
          setProfile(pVoice);
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    } else {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPreviewingVoiceId(null);
    }
  }, [isOpen, worldId, personId]);

  const handlePreview = async (voice: VoiceOption, e: React.MouseEvent) => {
    e.stopPropagation();

    if (previewingVoiceId === voice.id && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
      setPreviewingVoiceId(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    setPreviewingVoiceId(voice.id);
    try {
      const url = await voiceService.previewVoice(
        voice.id,
        profile?.speakingRate || 1.0,
        profile?.pitch || 1.0,
        `Hi, I'm ${personName}. It's wonderful to meet you.`,
      );

      if (url) {
        const audio = new Audio(url);
        previewAudioRef.current = audio;
        audio.onended = () => {
          setPreviewingVoiceId(null);
          previewAudioRef.current = null;
        };
        audio.onerror = () => {
          setPreviewingVoiceId(null);
          previewAudioRef.current = null;
        };
        await audio.play();
      } else {
        setPreviewingVoiceId(null);
      }
    } catch (err) {
      console.error(err);
      setPreviewingVoiceId(null);
    }
  };

  const handleSelectVoice = (voice: VoiceOption) => {
    if (!profile) return;
    setProfile({
      ...profile,
      voiceId: voice.id,
      voiceName: voice.name,
      voiceGender: voice.gender,
      language: voice.language,
    });
  };

  const handleSave = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      const updated = await voiceService.updatePersonVoice(worldId, personId, profile);
      toast.success('Voice updated', `${personName}'s voice settings have been saved.`);
      if (onVoiceUpdated) onVoiceUpdated(updated);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Update failed', 'Could not save voice settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredVoices = voices.filter((v) => {
    if (genderFilter === 'all') return true;
    return v.gender === genderFilter;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${personName}'s Voice`}
      description="Choose how this persona sounds and speaks during conversations."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={Save}
          >
            Save Voice Profile
          </Button>
        </>
      }
    >
      {isLoading || !profile ? (
        <div className="p-8 text-center text-xs text-text-muted">Loading voice options...</div>
      ) : (
        <div className="space-y-5 font-sans max-h-[65vh] overflow-y-auto pr-1">
          {/* Gender / Style Filter */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-text-primary">Voice Style</span>
            <div className="flex items-center gap-1 bg-background-elevated p-1 rounded-xl border border-border">
              {(['all', 'female', 'male'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenderFilter(g)}
                  className={cn(
                    'px-3 py-1 text-xs rounded-lg font-medium transition-colors capitalize cursor-pointer',
                    genderFilter === g
                      ? 'bg-brand-purple text-white shadow-xs'
                      : 'text-text-muted hover:text-text-primary',
                  )}
                >
                  {g === 'all' ? 'All Voices' : g}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredVoices.map((voice) => {
              const isSelected = profile.voiceId === voice.id;
              const isPreviewing = previewingVoiceId === voice.id;

              return (
                <div
                  key={voice.id}
                  onClick={() => handleSelectVoice(voice)}
                  className={cn(
                    'p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative',
                    isSelected
                      ? 'bg-gradient-to-br from-brand-purple/15 via-background-surface to-background-surface border-brand-purple shadow-sm'
                      : 'bg-background-surface/80 border-border/80 hover:border-brand-purple/40',
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        <span>{voice.name}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-brand-purple text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </span>
                      <Badge variant={voice.gender === 'female' ? 'primary' : 'neutral'} size="sm">
                        {voice.accent || voice.gender}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                      {voice.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <span className="text-[10px] text-text-dim flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {voice.language}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handlePreview(voice, e)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer',
                        isPreviewing
                          ? 'bg-brand-purple text-white'
                          : 'bg-background-elevated text-text-secondary hover:text-text-primary hover:bg-border',
                      )}
                    >
                      {isPreviewing ? (
                        <>
                          <Square className="w-2.5 h-2.5 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Preview</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Voice Modulation & Pace */}
          <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
              <Sliders className="w-4 h-4 text-brand-purple-light" />
              <span>Speaking Speed & Pitch</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Speed Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary font-medium flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5" />
                    Speaking Speed
                  </span>
                  <span className="text-[11px] font-bold text-brand-purple-light">
                    {profile.speakingRate.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  value={profile.speakingRate}
                  onChange={(e) =>
                    setProfile({ ...profile, speakingRate: parseFloat(e.target.value) })
                  }
                  className="w-full accent-brand-purple cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-dim">
                  <span>Slower (0.7x)</span>
                  <span>Normal (1.0x)</span>
                  <span>Faster (1.4x)</span>
                </div>
              </div>

              {/* Pitch Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Tone / Pitch
                  </span>
                  <span className="text-[11px] font-bold text-brand-purple-light">
                    {profile.pitch === 1.0 ? 'Natural' : `${profile.pitch.toFixed(2)}x`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.85"
                  max="1.15"
                  step="0.05"
                  value={profile.pitch}
                  onChange={(e) =>
                    setProfile({ ...profile, pitch: parseFloat(e.target.value) })
                  }
                  className="w-full accent-brand-purple cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-text-dim">
                  <span>Deeper</span>
                  <span>Natural</span>
                  <span>Higher</span>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-Speak Toggle */}
          <div className="p-4 rounded-2xl bg-background-elevated/70 border border-border flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                <Volume2 className="w-4 h-4 text-brand-emerald" />
                <span>Automatic Speech in Chat</span>
              </div>
              <p className="text-[11px] text-text-secondary">
                Speak responses aloud progressively as {personName} writes them.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={profile.autoSpeak}
                onChange={(e) => setProfile({ ...profile, autoSpeak: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-background-deep peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-purple border border-border"></div>
            </label>
          </div>
        </div>
      )}
    </Modal>
  );
};
