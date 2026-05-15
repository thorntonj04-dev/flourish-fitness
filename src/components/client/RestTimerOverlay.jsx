import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimerOverlay({ seconds, label, onSkip, onDone }) {
  const [remaining, setRemaining] = useState(seconds);
  const [minimized, setMinimized] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [flashBright, setFlashBright] = useState(false);

  // Flash animation when timer expires
  useEffect(() => {
    if (!flashing) return;
    setFlashBright(true);
    let count = 0;
    const id = setInterval(() => {
      count++;
      setFlashBright(p => !p);
      if (count >= 5) {
        clearInterval(id);
        setTimeout(onDone, 150);
      }
    }, 150);
    return () => clearInterval(id);
  }, [flashing]);

  // Countdown
  useEffect(() => {
    if (remaining <= 0) {
      if (navigator.vibrate) navigator.vibrate([150, 75, 150]);
      setFlashing(true);
      return;
    }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const progress = seconds > 0 ? (seconds - remaining) / seconds : 1;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  if (flashing) {
    return (
      <div
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ backgroundColor: flashBright ? '#10b981' : '#000000', transition: 'background-color 0.1s' }}
      />
    );
  }

  if (minimized) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-emerald-500 dark:bg-emerald-600 flex items-center justify-between px-5 py-3 shadow-xl">
        <span className="text-white text-sm font-semibold truncate mr-3">{label}</span>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-white font-bold text-xl tabular-nums">{remaining}s</span>
          <button
            onClick={() => setMinimized(false)}
            className="p-1.5 bg-white/20 rounded-lg active:bg-white/30"
          >
            <ChevronUp className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={onSkip}
            className="text-white/80 text-sm font-semibold"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#1E3328] border-t border-gray-200 dark:border-[#C6A45F]/25 rounded-t-3xl shadow-2xl px-6 pt-5 pb-10 flex flex-col items-center">
      {/* Handle row with minimize button */}
      <div className="w-full flex items-center justify-between mb-4">
        <div className="w-8" />
        <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full" />
        <button
          onClick={() => setMinimized(true)}
          className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-[#d8e7de]/40"
          aria-label="Minimize timer"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs font-bold text-gray-400 dark:text-[#d8e7de]/50 uppercase tracking-widest mb-5">
        {label}
      </p>

      <div className="relative w-36 h-36 mb-6">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="60" cy="60" r={RADIUS}
            fill="none"
            stroke="#10b981"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-gray-900 dark:text-[#d8e7de] tabular-nums leading-none">
            {remaining}
          </span>
          <span className="text-xs text-gray-400 dark:text-[#d8e7de]/50 mt-1">sec</span>
        </div>
      </div>

      <button
        onClick={onSkip}
        className="px-10 py-3.5 bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-600 dark:text-[#d8e7de]/70 rounded-2xl font-semibold text-base min-h-[52px] active:bg-gray-200 dark:active:bg-[#0a0a0a]/60"
      >
        Skip Rest
      </button>
    </div>
  );
}
