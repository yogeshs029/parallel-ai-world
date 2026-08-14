import {
  VoiceOption,
  VoiceProfile,
  VoiceProfileUpdate,
  TTSRequestPayload,
  STTResponseData,
  VoiceHealthStatus,
} from '../types/voice';
import { API_BASE } from '../lib/apiConfig';

class VoiceService {
  private objectUrls: Set<string> = new Set();

  public async getVoices(): Promise<VoiceOption[]> {
    try {
      const res = await fetch(`${API_BASE}/voice/voices`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to load voice options:', e);
    }
    return [
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
    ];
  }

  public async previewVoice(
    voiceId: string,
    speed = 1.0,
    pitch = 1.0,
    customText?: string,
  ): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE}/voice/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId, speed, pitch, customText }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        this.objectUrls.add(url);
        return url;
      }
    } catch (e) {
      console.error('Voice preview failed:', e);
    }
    return null;
  }

  public async synthesize(payload: TTSRequestPayload): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE}/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        this.objectUrls.add(url);
        return url;
      }
    } catch (e) {
      console.error('TTS synthesis failed:', e);
    }
    return null;
  }

  public async transcribeAudio(
    audioBlob: Blob,
    language?: string,
  ): Promise<STTResponseData | null> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'microphone_recording.wav');
      if (language) {
        formData.append('language', language);
      }

      const res = await fetch(`${API_BASE}/voice/stt`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Speech transcription failed:', e);
    }
    return null;
  }

  public async getPersonVoice(worldId: string, personId: string): Promise<VoiceProfile> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/people/${personId}/voice`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to load persona voice from backend:', e);
    }
    return {
      personId,
      worldId,
      enabled: true,
      voiceId: personId.includes('rahul') ? 'en-US-AndrewNeural' : 'en-US-AvaNeural',
      voiceName: personId.includes('rahul') ? 'Professional Male' : 'Warm Female',
      voiceGender: personId.includes('rahul') ? 'male' : 'female',
      language: 'en-US',
      speakingRate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      autoSpeak: true,
    };
  }

  public async updatePersonVoice(
    worldId: string,
    personId: string,
    update: VoiceProfileUpdate,
  ): Promise<VoiceProfile> {
    try {
      const res = await fetch(`${API_BASE}/worlds/${worldId}/people/${personId}/voice`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to update persona voice:', e);
    }
    return {
      personId,
      worldId,
      enabled: update.enabled ?? true,
      voiceId: update.voiceId ?? 'en-US-AvaNeural',
      voiceName: update.voiceName ?? 'Warm Female',
      voiceGender: update.voiceGender ?? 'female',
      language: update.language ?? 'en-US',
      speakingRate: update.speakingRate ?? 1.0,
      pitch: update.pitch ?? 1.0,
      volume: update.volume ?? 1.0,
      autoSpeak: update.autoSpeak ?? true,
    };
  }

  public async getHealth(): Promise<VoiceHealthStatus | null> {
    try {
      const res = await fetch(`${API_BASE}/voice/health`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Voice health check failed:', e);
    }
    return null;
  }

  public cleanup() {
    for (const url of this.objectUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }
    this.objectUrls.clear();
  }
}

export const voiceService = new VoiceService();
