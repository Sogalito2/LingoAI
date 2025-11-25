
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Translator } from './pages/Translator';
import { Premium } from './pages/Premium';
import { DAILY_LIMIT_SECONDS } from './constants';
import { Timer } from './components/Timer';

// Mock simple usage tracking
const getInitialUsage = () => {
  const stored = localStorage.getItem('lingua_usage');
  const date = localStorage.getItem('lingua_date');
  const today = new Date().toDateString();

  if (date !== today) {
    return 0; // Reset if new day
  }
  return stored ? parseInt(stored, 10) : 0;
};

const App: React.FC = () => {
  const [secondsUsed, setSecondsUsed] = useState<number>(getInitialUsage());
  const [isPremium, setIsPremium] = useState<boolean>(false); // In real app, check backend
  const [targetLang, setTargetLang] = useState<string | null>(null);

  // Update storage whenever seconds change
  useEffect(() => {
    localStorage.setItem('lingua_usage', secondsUsed.toString());
    localStorage.setItem('lingua_date', new Date().toDateString());
  }, [secondsUsed]);

  const incrementUsage = (seconds: number) => {
    if (!isPremium) {
      setSecondsUsed(prev => prev + seconds);
    }
  };

  const isLimitReached = !isPremium && secondsUsed >= DAILY_LIMIT_SECONDS;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative flex flex-col">
        <header className="h-14 border-b flex items-center justify-between px-4 bg-white z-10 sticky top-0">
          <div className="flex flex-col">
             <h1 className="text-lg font-bold text-indigo-600 flex items-center gap-2">
               <span className="text-2xl">🗣️</span> Lingo
             </h1>
          </div>
          <Timer secondsUsed={secondsUsed} isPremium={isPremium} />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <HashRouter>
            <Routes>
              <Route 
                path="/" 
                element={<Home setTargetLang={setTargetLang} />} 
              />
              <Route 
                path="/translate" 
                element={
                  isLimitReached ? (
                    <Navigate to="/premium" replace />
                  ) : targetLang ? (
                    <Translator 
                      targetLangCode={targetLang} 
                      incrementUsage={incrementUsage}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                } 
              />
              <Route 
                path="/premium" 
                element={<Premium onUpgrade={() => setIsPremium(true)} />} 
              />
            </Routes>
          </HashRouter>
        </main>
      </div>
    </div>
  );
};

export default App;
