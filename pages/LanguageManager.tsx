
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES } from '../constants';
import { LanguageCode } from '../types';
import { getDownloadedPacks, saveDownloadedPack, removeDownloadedPack } from '../services/offlineService';

export const LanguageManager: React.FC = () => {
  const navigate = useNavigate();
  const [downloaded, setDownloaded] = useState<LanguageCode[]>([]);
  const [downloading, setDownloading] = useState<LanguageCode | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setDownloaded(getDownloadedPacks());
  }, []);

  const handleDownload = (code: LanguageCode) => {
    if (downloading) return;
    setDownloading(code);
    setProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          saveDownloadedPack(code);
          setDownloaded(getDownloadedPacks());
          setDownloading(null);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleDelete = (code: LanguageCode) => {
    if (confirm('Remover este pacote de idioma offline?')) {
      removeDownloadedPack(code);
      setDownloaded(getDownloadedPacks());
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-in">
      <div className="p-4 bg-white border-b sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-indigo-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-slate-800">Idiomas Offline</h2>
      </div>

      <div className="p-4 overflow-y-auto pb-20">
        <div className="mb-6 bg-indigo-100 p-4 rounded-xl text-sm text-indigo-800 border border-indigo-200">
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Baixe pacotes para traduzir sem internet.
          </p>
        </div>

        <div className="space-y-3">
          {LANGUAGES.map((lang) => {
            const isDownloaded = downloaded.includes(lang.code);
            const isDownloading = downloading === lang.code;

            return (
              <div key={lang.code} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div>
                    <h3 className="font-semibold text-slate-800">{lang.name}</h3>
                    <p className="text-xs text-slate-500">
                      {isDownloaded ? 'Disponível offline' : 'Requer download (~45MB)'}
                    </p>
                  </div>
                </div>

                <div className="w-24 flex justify-end">
                  {isDownloading ? (
                    <div className="w-full">
                      <div className="text-xs text-center text-indigo-600 mb-1">{progress}%</div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-200"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : isDownloaded ? (
                    <button 
                      onClick={() => handleDelete(lang.code)}
                      className="p-2 text-emerald-500 bg-emerald-50 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors group"
                      title="Remover"
                    >
                      <span className="group-hover:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="hidden group-hover:block">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleDownload(lang.code)}
                      className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
