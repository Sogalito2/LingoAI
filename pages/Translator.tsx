
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES, NATIVE_LANGUAGE } from '../constants';
import { LiveTranslator } from '../services/geminiService';
import { ChatMessage } from '../types';

interface TranslatorProps {
  targetLangCode: string;
  incrementUsage: (seconds: number) => void;
}

export const Translator: React.FC<TranslatorProps> = ({ targetLangCode, incrementUsage }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('disconnected');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const translatorRef = useRef<LiveTranslator | null>(null);
  const usageIntervalRef = useRef<number | null>(null);
  const conversationIdRef = useRef<string>(Date.now().toString());

  const nativeLang = LANGUAGES.find(l => l.code === NATIVE_LANGUAGE)!;
  const targetLang = LANGUAGES.find(l => l.code === targetLangCode)!;

  useEffect(() => {
    translatorRef.current = new LiveTranslator(
      (newStatus) => setStatus(newStatus),
      (err) => setErrorMsg(err),
      (level) => setAudioLevel(level),
      (text, isUser, isFinal) => handleTranscript(text, isUser, isFinal)
    );

    return () => {
      stopSession();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTranscript = (text: string, isUser: boolean, isFinal: boolean) => {
    setMessages(prev => {
        const lastMsgIndex = prev.length - 1;
        const lastMsg = prev[lastMsgIndex];
        const sender = isUser ? 'user' : 'agent';

        // Update streaming message
        if (lastMsg && lastMsg.sender === sender && !lastMsg.isFinal) {
            const updated = [...prev];
            updated[lastMsgIndex] = {
                ...lastMsg,
                text: text,
                isFinal: isFinal
            };
            return updated;
        } 
        
        // Deduplication for Final messages
        if (isFinal) {
            const lastSameSenderMsg = [...prev].reverse().find(m => m.sender === sender);
            if (lastSameSenderMsg && lastSameSenderMsg.text === text) {
                return prev;
            }
        }

        return [...prev, {
            id: Date.now().toString() + Math.random(),
            sender: sender,
            text: text,
            timestamp: Date.now(),
            isFinal: isFinal
        }];
    });
  };

  // Usage Timer
  useEffect(() => {
    if (status === 'connected') {
      usageIntervalRef.current = window.setInterval(() => {
        incrementUsage(1);
      }, 1000);
    } else {
      if (usageIntervalRef.current) {
        clearInterval(usageIntervalRef.current);
        usageIntervalRef.current = null;
      }
    }
    return () => {
      if (usageIntervalRef.current) clearInterval(usageIntervalRef.current);
    };
  }, [status, incrementUsage]);

  const toggleSession = () => {
    if (status === 'connected' || status === 'connecting') {
      stopSession();
    } else {
      startSession();
    }
  };

  const startSession = async () => {
    setErrorMsg(null);
    if (translatorRef.current) {
      // Pass the current ID to inject into system prompt
      await translatorRef.current.connect(nativeLang.code, targetLang.code as any, conversationIdRef.current);
    }
  };

  const stopSession = () => {
    if (translatorRef.current) {
      translatorRef.current.disconnect();
    }
    setAudioLevel(0);
  };

  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // 1. Force Disconnect (Await to ensure sockets are closed)
    if (translatorRef.current) {
        await translatorRef.current.disconnect();
    }

    // 2. Clear Local State IMMEDIATELY
    setMessages([]);
    setAudioLevel(0);
    setErrorMsg(null);

    // 3. Generate NEW Session ID (Crucial: this ID is sent to Gemini System Prompt)
    const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) 
        ? crypto.randomUUID() 
        : Date.now().toString() + Math.random().toString().slice(2);
    conversationIdRef.current = newId;

    // 4. Update UI Status
    setStatus('disconnected');

    // 5. Restart Immediately (Preserving user gesture context for AudioContext)
    startSession();
  };

  const handleExit = () => {
    stopSession();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-50 relative">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-2">
            <span className="text-xl">{targetLang.flag}</span>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-700 leading-tight">{targetLang.name}</span>
              <span className="text-[10px] text-indigo-500 font-medium">MODO LIVE</span>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            {/* Reset Button - Clears current view only */}
            <div className="relative z-50">
                <button 
                    onClick={handleReset}
                    className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-slate-100 transition-colors pointer-events-auto"
                    title="Reiniciar Sessão (Limpar Tela)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>

            <button 
                onClick={handleExit}
                className="text-slate-500 hover:text-indigo-600 font-medium text-sm px-3 py-1 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1 border border-slate-200"
            >
                <span>Sair</span>
            </button>
        </div>
      </div>

      {errorMsg && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 w-3/4 max-w-xs">
              <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg text-sm text-center animate-fade-in-down font-medium">
                  {errorMsg}
              </div>
          </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-4">
              <div className="text-6xl opacity-20 animate-pulse">💬</div>
              <p>Inicie a conversa para ver a transcrição.</p>
           </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed transition-all duration-300
              ${msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}
              ${!msg.isFinal ? 'opacity-70' : ''}
            `}>
              <p>{msg.text}</p>
              <div className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                {msg.sender === 'user' ? 'Você' : 'Intérprete'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Visualizer & Controls Bar */}
      <div className="bg-white border-t border-slate-200 p-4 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
         
         {status === 'connected' && (
            <div className="flex items-center justify-center gap-1 h-4 mb-4">
               {[...Array(5)].map((_, i) => (
                 <div 
                   key={i} 
                   className="w-1 bg-indigo-500 rounded-full transition-all duration-75"
                   style={{ 
                     height: `${Math.max(4, audioLevel * 100 * (Math.random() + 0.5))}px`,
                     opacity: 0.7 
                   }}
                 ></div>
               ))}
            </div>
         )}

         <button
            onClick={toggleSession}
            disabled={status === 'connecting'}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-200 active:scale-95 flex items-center justify-center gap-3
              ${status === 'connected' 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              }
              ${status === 'connecting' ? 'opacity-70 cursor-wait' : ''}
            `}
          >
            {status === 'connected' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                <span>Parar Intérprete</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span>{status === 'connecting' ? 'Conectando...' : 'Conectar Intérprete'}</span>
              </>
            )}
         </button>
      </div>
    </div>
  );
};
