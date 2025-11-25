import { LanguageCode, LanguageOption } from './types';

export const DAILY_LIMIT_SECONDS = 5 * 60; // 5 minutes
export const NATIVE_LANGUAGE = LanguageCode.Portuguese;

export const LANGUAGES: LanguageOption[] = [
  { code: LanguageCode.Portuguese, name: 'Português', flag: '🇧🇷', voiceName: 'Puck' },
  { code: LanguageCode.English, name: 'Inglês', flag: '🇺🇸', voiceName: 'Kore' },
  { code: LanguageCode.Spanish, name: 'Espanhol', flag: '🇪🇸', voiceName: 'Puck' },
  { code: LanguageCode.French, name: 'Francês', flag: '🇫🇷', voiceName: 'Charon' },
  { code: LanguageCode.Italian, name: 'Italiano', flag: '🇮🇹', voiceName: 'Puck' },
  { code: LanguageCode.German, name: 'Alemão', flag: '🇩🇪', voiceName: 'Fenrir' },
  { code: LanguageCode.Chinese, name: 'Chinês (Mandarim)', flag: '🇨🇳', voiceName: 'Zephyr' },
  { code: LanguageCode.Japanese, name: 'Japonês', flag: '🇯🇵', voiceName: 'Kore' },
  { code: LanguageCode.Russian, name: 'Russo', flag: '🇷🇺', voiceName: 'Fenrir' },
  { code: LanguageCode.Finnish, name: 'Finlandês', flag: '🇫🇮', voiceName: 'Kore' },
];

export const PLANS = {
  monthly: { price: 'R$ 39,90', label: 'Mensal' },
  annual: { price: 'R$ 19,90', label: 'Anual' }
};