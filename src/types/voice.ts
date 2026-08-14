export type VoiceGender = 'female' | 'male' | 'neutral';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VoiceOption {
  id: string;
  name: string;
  gender: VoiceGender;
  language: string;
  description: string;
  previewText: string;
  accent?: string;
  isDefault?: boolean;
}

export interface VoiceProfile {
  personId: string;
  worldId: string;
  enabled: boolean;
  voiceId: string;
  voiceName: string;
  voiceGender: VoiceGender;
  language: string;
  speakingRate: number; // 0.5 to 2.0
  pitch: number; // 0.5 to 1.5
  volume: number; // 0.1 to 1.0
  autoSpeak: boolean;
  updatedAt?: string;
}

export interface VoiceProfileUpdate {
  enabled?: boolean;
  voiceId?: string;
  voiceName?: string;
  voiceGender?: VoiceGender;
  language?: string;
  speakingRate?: number;
  pitch?: number;
  volume?: number;
  autoSpeak?: boolean;
}

export interface TTSRequestPayload {
  text: string;
  voiceId?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  personId?: string;
}

export interface STTResponseData {
  transcript: string;
  language?: string;
  duration?: number;
  confidence?: number;
}

export interface VoiceHealthStatus {
  ttsAvailable: boolean;
  sttAvailable: boolean;
  ttsProvider: string;
  sttProvider: string;
  supportedVoicesCount: number;
}
