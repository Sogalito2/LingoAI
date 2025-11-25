
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory, deleteConversation, clearHistory } from '../services/historyService';
import { Conversation } from '../types';
import { LANGUAGES } from '../constants';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Force load from disk
  const reloadHistory = () => {
    const data = getHistory();
    setHistory(data);
  };

  useEffect(() => {
    reloadHistory();
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    // 1. Stop all event bubbling immediately
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm("Apagar conversa?")) {
        // 2. Optimistic Update: Update UI immediately
        setHistory(prevHistory => prevHistory.filter(c => String(c.id) !== String(id)));

        // 3. Update Storage in background
        deleteConversation(id);
        
        if (selectedConversation?.id === id) {
            setSelectedConversation(null);
        }
    }
  };

  const handleClearAll = () => {
      if (window.confirm("Apagar TUDO?")) {
          clearHistory();
          setHistory([]); // Instant clear
          setSelectedConversation(null);
      }
  }

  const getLangName = (code: string) => LANGUAGES.find(l => l.code === code)?.name || code;
  const getLangFlag = (code: string) => LANGUAGES.find(l => l.code === code)?.flag || '🌐';

  // Detail View
  if (selectedConversation) {
    return (
      <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
        <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center justify-between shadow-sm">
          <button onClick={() => setSelectedConversation(null)} className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Voltar
          </button>
          <div className="text-sm font-semibold text-slate-800">
             {new Date(selectedConversation.date).toLocaleDateString()}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {selectedConversation.messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                    max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed
                    ${msg.sender === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}
                    `}>
                        <p>{msg.text}</p>
                    </div>
                </div>
             ))}
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-slate-500 hover:text-indigo-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <h2 className="text-lg font-bold text-slate-800">Histórico</h2>
        </div>
        {history.length > 0 && (
            <button onClick={handleClearAll} className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">
                Limpar Tudo
            </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-3">
        {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Nenhuma conversa salva.</p>
            </div>
        ) : (
            history.map((chat) => (
                <div 
                    key={chat.id} 
                    className="bg-white p-0 rounded-xl border border-slate-200 shadow-sm flex overflow-hidden relative"
                >
                    {/* Main Click Area */}
                    <div 
                        onClick={() => setSelectedConversation(chat)}
                        className="flex-1 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{getLangFlag(chat.targetLangCode)}</span>
                                <span className="font-semibold text-slate-700">{getLangName(chat.targetLangCode)}</span>
                            </div>
                            <span className="text-xs text-slate-400">
                                {new Date(chat.date).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm line-clamp-2">
                            {chat.summary || "..."}
                        </p>
                    </div>

                    {/* Delete Button Area - Physically separated & Robust */}
                    <div className="border-l border-slate-100 flex items-center justify-center w-14 bg-slate-50">
                        <button 
                            type="button"
                            onClick={(e) => handleDelete(e, chat.id)}
                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors w-full h-full flex items-center justify-center active:bg-red-100"
                            title="Apagar"
                        >
                            {/* pointer-events-none ensures the click always registers on the button, not the path */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
