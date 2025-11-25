import { Conversation, ChatMessage } from '../types';

const HISTORY_KEY = 'lingua_history';

export const saveConversation = (conversation: Conversation) => {
  const current = getHistory();
  // Generate a summary if none exists (use first message or date)
  if (!conversation.summary && conversation.messages.length > 0) {
    const firstMsg = conversation.messages[0].text;
    conversation.summary = firstMsg.slice(0, 30) + (firstMsg.length > 30 ? '...' : '');
  } else if (!conversation.summary) {
    conversation.summary = 'Conversa sem texto';
  }

  // Check if exists to update, or unshift to add to top
  const index = current.findIndex(c => String(c.id) === String(conversation.id));
  if (index >= 0) {
    current[index] = conversation;
  } else {
    current.unshift(conversation);
  }
  
  localStorage.setItem(HISTORY_KEY, JSON.stringify(current));
};

export const getHistory = (): Conversation[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

export const getConversationById = (id: string): Conversation | undefined => {
  const history = getHistory();
  return history.find(c => String(c.id) === String(id));
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export const deleteConversation = (id: string) => {
  const current = getHistory();
  // Ensure we are comparing strings strictly to avoid type mismatches
  const targetId = String(id);
  const updated = current.filter(c => String(c.id) !== targetId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
};