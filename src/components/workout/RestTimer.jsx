import React, { useState, useEffect } from 'react';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

export default function RestTimer({ seconds, onComplete, onSkip, nextSet }) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      // Play completion sound
      if (isSoundEnabled) {
        playSound();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        
        // Play beep on last 3 seconds
        if (isSoundEnabled && newTime > 0 && newTime <= 3) {
          playBeep();
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onComplete, isSoundEnabled]);

  const playBeep = () => {
    // Simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const playSound = () => {
    // Completion sound (higher pitched)
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1200;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);

    // Vibrate
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCircleColor = () => {
    const percentLeft = (timeLeft / seconds) * 100;
    if (percentLeft > 50) return '#10b981'; // emerald-500
    if (percentLeft > 20) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  const getBackgroundColor = () => {
    const percentLeft = (timeLeft / seconds) * 100;
    if (percentLeft > 50) return 'bg-gradient-to-br from-emerald-900/95 to-black';
    if (percentLeft > 20) return 'bg-gradient-to-br from-amber-900/95 to-black';
    return 'bg-gradient-to-br from-red-900/95 to-black';
  };

  return (
    <div className={`fixed inset-0 ${getBackgroundColor()} z-50 flex items-center justify-center p-4 transition-colors duration-500`}>
      <div className="text-center max-w-md w-full">
        {/* Circular Progress */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke={getCircleColor()}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - timeLeft / seconds)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          {/* Time display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white">
              <div className={`font-bold mb-2 transition-all duration-300 ${
                timeLeft <= 3 ? 'text-8xl animate-pulse' : 'text-7xl'
              }`}>
                {timeLeft}
              </div>
              <div className="text-2xl text-white/70">seconds</div>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="text-white mb-8">
          <div className="text-3xl font-bold mb-2">Rest Time</div>
          <div className="text-xl text-white/70">
            Prepare for Set {nextSet}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onSkip}
            className="w-full px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:bg-gray-100 flex items-center justify-center gap-2 shadow-xl transition-transform active:scale-95"
          >
            <SkipForward className="w-6 h-6" />
            Skip Rest
          </button>
          
          <button
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            className="px-4 py-2 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 flex items-center justify-center gap-2 transition"
          >
            {isSoundEnabled ? (
              <>
                <Volume2 className="w-5 h-5" />
                Sound On
              </>
            ) : (
              <>
                <VolumeX className="w-5 h-5" />
                Sound Off
              </>
            )}
          </button>
        </div>

        {/* Breathing Guide (last 10 seconds) */}
        {timeLeft <= 10 && timeLeft > 0 && (
          <div className="mt-8 text-white/70 animate-pulse">
            <div className="text-lg">Take deep breaths</div>
            <div className="text-sm">Get ready for your next set</div>
          </div>
        )}
      </div>
    </div>
  );
}
