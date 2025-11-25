
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LANGUAGES, NATIVE_LANGUAGE } from '../constants';

interface HomeProps {
  setTargetLang: (lang: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setTargetLang }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>(LANGUAGES[1].code); // Default to English (index 1)

  const handleStart = () => {
    setTargetLang(selected);
    navigate('/translate');
  };

  const nativeLang = LANGUAGES.find(l => l.code === NATIVE_LANGUAGE);

  return (
    <div className="p-6 flex flex-col h-full animate-fade-in relative justify-center">
      
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Olá!</h2>
        <p className="text-slate-500">Para qual idioma você deseja traduzir hoje?</p>
      </div>

      <div className="bg-indigo-50 p-6 rounded-2xl mb-8 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">De:</span>
          <div className="flex items-center gap-2 font-medium text-slate-700 bg-white px-3 py-1 rounded-lg shadow-sm">
            <span>{nativeLang?.flag}</span>
            <span>{nativeLang?.name}</span>
          </div>
        </div>

        <div className="flex items-center justify-center my-2">
          <div className="h-8 w-[2px] bg-indigo-200"></div>
        </div>

        <div className="mb-2">
          <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wider block mb-2">Para:</span>
          <div className="relative">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full appearance-none bg-white border border-indigo-200 text-slate-800 py-4 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 shadow-sm text-lg font-medium"
            >
              {LANGUAGES.filter(l => l.code !== NATIVE_LANGUAGE).map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} &nbsp; {lang.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-indigo-500">
              <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleStart}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-transform duration-100 active:scale-95 flex items-center justify-center gap-3"
      >
        <span>Iniciar Conversa</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>

      <p className="mt-6 text-center text-xs text-slate-400">
        Toque para começar a traduzir em tempo real.
      </p>
    </div>
  );
};
