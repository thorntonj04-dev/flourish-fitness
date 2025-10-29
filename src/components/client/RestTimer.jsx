import React, { useState, useEffect, useRef } from 'react';
import { Timer, SkipForward, Plus, Minus } from 'lucide-react';

export default function RestTimer({ duration, onComplete, onSkip }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    
    startTimer();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          playCompletionSound();
          setTimeout(() => onComplete(), 500);
          return 0;
        }
        
        // Play countdown sounds at 3, 2, 1
        if (prev <= 3 && prev > 0) {
          playBeep(prev === 1 ? 800 : 600);
        }
        
        return prev - 1;
      });
    }, 1000);
  };

  const playBeep = (frequency = 600) => {
    if (!audioContextRef.current) return;
    
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  };

  const playCompletionSound = () => {
    if (!audioContextRef.current) return;
    
    // Play a pleasant ascending tone
    [440, 554, 659].forEach((freq, idx) => {
      setTimeout(() => playBeep(freq), idx * 100);
    });
  };

  const togglePause = () => {
    if (isPaused) {
      startTimer();
    } else {
      clearInterval(intervalRef.current);
    }
    setIsPaused(!isPaused);
  };

  const addTime = (seconds) => {
    setTimeLeft(prev => Math.min(prev + seconds, 600));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
        {/* Background Progress */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 transition-all duration-1000"
          style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
              <Timer className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rest Time</h2>
            <p className="text-gray-600 dark:text-gray-300">Catch your breath and get ready!</p>
          </div>

          {/* Timer Display */}
          <div className="text-center mb-8">
            <div className={`text-7xl font-bold transition-colors duration-300 ${
              timeLeft <= 3 ? 'text-red-500 animate-pulse' : 'text-emerald-600'
            }`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              seconds remaining
            </div>
          </div>

          {/* Progress Ring */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button
              onClick={() => addTime(-15)}
              disabled={timeLeft <= 15}
              className="flex flex-col items-center justify-center py-3 px-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-5 h-5 text-gray-700 mb-1" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">-15s</span>
            </button>
            
            <button
              onClick={togglePause}
              className="flex flex-col items-center justify-center py-3 px-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
            >
              {isPaused ? (
                <>
                  <Timer className="w-5 h-5 text-emerald-700 mb-1" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Resume</span>
                </>
              ) : (
                <>
                  <Timer className="w-5 h-5 text-emerald-700 mb-1" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Pause</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => addTime(15)}
              className="flex flex-col items-center justify-center py-3 px-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Plus className="w-5 h-5 text-gray-700 mb-1" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">+15s</span>
            </button>
          </div>

          {/* Skip Button */}
          <button
            onClick={onSkip}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2 shadow-lg"
          >
            <SkipForward className="w-6 h-6" />
            Skip Rest
          </button>

          {/* Motivational Message */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 italic">
              {timeLeft > 30 ? "💪 You're crushing it!" : 
               timeLeft > 10 ? "🔥 Almost ready to go!" : 
               "⚡ Get ready!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
