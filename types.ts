
export enum LanguageCode {
  English = 'en-US',
  Spanish = 'es-ES',
  French = 'fr-FR',
  Italian = 'it-IT',
  German = 'de-DE',
  Portuguese = 'pt-BR',
  Chinese = 'zh-CN',
  Japanese = 'ja-JP',
  Russian = 'ru-RU',
  Finnish = 'fi-FI',
}

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  flag: string; // Emoji
  voiceName: string; // Mapping for Gemini TTS
}

export interface UsageState {
  secondsUsed: number;
  lastUpdated: string; // Date string
  isPremium: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: number;
  isFinal?: boolean; // For streaming transcription
}

export interface Conversation {
  id: string;
  date: number;
  targetLangCode: string;
  messages: ChatMessage[];
  summary?: string; // Optional title/summary
}

export type DownloadStatus = 'idle' | 'downloading' | 'downloaded';
