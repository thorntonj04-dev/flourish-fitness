import React from 'react';
import { History, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ExerciseHistoryCard({ history, isExpanded, onToggle }) {
  if (!history || history.length === 0) return null;

  const mostRecent = history[0];
  
  // Calculate trend
  const getTrend = () => {
    if (history.length < 2) return 'neutral';
    
    const current = mostRecent.weightUsed;
    const previous = history[1].weightUsed;
    
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const trend = getTrend();

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600 dark:text-[#d8e7de]/60" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/30';
      case 'down':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30';
      default:
        return 'bg-gray-50 dark:bg-[#0a0a0a]/30 border-gray-200 dark:border-[#C6A45F]/25';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`rounded-2xl border-2 ${getTrendColor()} overflow-hidden transition-all`}>
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-gray-600 dark:text-[#d8e7de]/80" />
          <div className="text-left">
            <div className="font-bold text-gray-900 dark:text-[#d8e7de] flex items-center gap-2">
              Previous Performance
              {getTrendIcon()}
            </div>
            <div className="text-sm text-gray-600 dark:text-[#d8e7de]/80">
              Last time: {mostRecent.weightUsed} lbs × {mostRecent.actualReps || mostRecent.targetReps} reps
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-[#d8e7de]/60 hidden sm:inline">
            {isExpanded ? 'Hide' : 'Show'} history
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600 dark:text-[#d8e7de]/80" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600 dark:text-[#d8e7de]/80" />
          )}
        </div>
      </button>

      {/* Expanded History */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-[#C6A45F]/25 p-4 bg-white/50 dark:bg-black/20">
          <div className="space-y-3">
            {history.slice(0, 5).map((session, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  idx === 0
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30'
                    : 'bg-gray-50 dark:bg-[#0a0a0a]/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-[#d8e7de]">
                      {session.weightUsed} lbs × {session.actualReps || session.targetReps} reps
                    </div>
                    <div className="text-xs text-gray-600 dark:text-[#d8e7de]/60 mt-1">
                      {session.completedSets}/{session.sets} sets completed
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60">
                      {formatDate(session.date || new Date().toISOString())}
                    </div>
                    {idx === 0 && (
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">
                        Most Recent
                      </div>
                    )}
                  </div>
                </div>

                {/* Volume calculation */}
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-[#C6A45F]/25 text-xs text-gray-500 dark:text-[#d8e7de]/60">
                  Total volume: {session.weightUsed * (session.actualReps || session.targetReps) * session.completedSets} lbs
                </div>
              </div>
            ))}
          </div>

          {history.length > 5 && (
            <div className="mt-3 text-center text-sm text-gray-500 dark:text-[#d8e7de]/60">
              Showing last 5 sessions
            </div>
          )}
        </div>
      )}
    </div>
  );
}
