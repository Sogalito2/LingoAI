import React from 'react';
import { PLANS } from '../constants';
import { useNavigate } from 'react-router-dom';

interface PremiumProps {
  onUpgrade: () => void;
}

export const Premium: React.FC<PremiumProps> = ({ onUpgrade }) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    // Simulate payment process
    alert("Obrigado por assinar! (Simulação)");
    onUpgrade();
    navigate('/');
  };

  return (
    <div className="min-h-full p-6 bg-slate-900 text-white flex flex-col items-center justify-center animate-fade-in">
      <div className="text-center mb-8">
        <span className="text-4xl mb-2 block">💎</span>
        <h2 className="text-3xl font-bold mb-2">Seja Premium</h2>
        <p className="text-slate-400">Seu tempo gratuito diário acabou.</p>
        <p className="text-slate-400 text-sm">Desbloqueie traduções ilimitadas.</p>
      </div>

      <div className="w-full space-y-4 mb-8">
        {/* Monthly */}
        <div 
          onClick={handleSubscribe}
          className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl p-6 cursor-pointer transition-colors relative overflow-hidden"
        >
           <div className="flex justify-between items-center relative z-10">
             <div>
               <h3 className="font-bold text-lg">{PLANS.monthly.label}</h3>
               <p className="text-slate-300 text-sm">Cobrado mensalmente</p>
             </div>
             <div className="text-2xl font-bold text-indigo-400">
               {PLANS.monthly.price}
             </div>
           </div>
        </div>

        {/* Annual */}
        <div 
          onClick={handleSubscribe}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 cursor-pointer transform hover:scale-[1.02] transition-transform shadow-xl border border-indigo-400/50"
        >
           <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg">
             MELHOR VALOR
           </div>
           <div className="flex justify-between items-center">
             <div>
               <h3 className="font-bold text-lg">{PLANS.annual.label}</h3>
               <p className="text-indigo-100 text-sm">Cobrado anualmente</p>
             </div>
             <div className="text-2xl font-bold text-white">
               {PLANS.annual.price}
             </div>
           </div>
        </div>
      </div>

      <button 
        onClick={() => navigate('/')}
        className="text-slate-500 text-sm hover:text-white transition-colors"
      >
        Voltar para Home (apenas visualização)
      </button>
    </div>
  );
};