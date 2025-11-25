import React from 'react';
import { DAILY_LIMIT_SECONDS } from '../constants';

interface TimerProps {
  secondsUsed: number;
  isPremium: boolean;
}

export const Timer: React.FC<TimerProps> = ({ secondsUsed, isPremium }) => {
  if (isPremium) return <div className="text-xs font-semibold text-amber-500">PREMIUM</div>;

  const remaining = Math.max(0, DAILY_LIMIT_SECONDS - secondsUsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const isLow = remaining < 60;

  return (
    <div className={`text-xs font-mono px-2 py-1 rounded-full border ${isLow ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
      Free: {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};