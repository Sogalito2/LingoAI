
import { LanguageCode } from '../types';

const STORAGE_KEY = 'lingua_offline_packs';

export const getDownloadedPacks = (): LanguageCode[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const saveDownloadedPack = (code: LanguageCode) => {
  const current = getDownloadedPacks();
  if (!current.includes(code)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, code]));
  }
};

export const removeDownloadedPack = (code: LanguageCode) => {
  const current = getDownloadedPacks();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter(c => c !== code)));
};

export const isPackAvailable = (code: LanguageCode): boolean => {
  return getDownloadedPacks().includes(code);
};

// A simulated basic offline dictionary for demonstration purposes
// In a real app, this would query a local database or a WASM model
export const offlineTranslate = (text: string, targetLang: LanguageCode): string => {
  // Simple heuristic simulation for demo
  const prefix = "[Offline] ";
  
  // Very basic dictionary for demo purposes
  const greetings: Record<string, string> = {
    'hello': 'ola', 'hola': 'ola', 'bonjour': 'ola', 'hallo': 'ola',
    'ola': 'hello',
    'good morning': 'bom dia', 'buenos dias': 'bom dia',
    'thank you': 'obrigado', 'gracias': 'obrigado',
  };
  
  const lowerText = text.toLowerCase().trim();
  
  if (greetings[lowerText]) {
    return `${prefix}${greetings[lowerText]} (Simulated)`;
  }

  return `${prefix} ${text}`;
};
