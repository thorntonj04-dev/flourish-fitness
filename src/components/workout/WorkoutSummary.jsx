import React from 'react';
import { CheckCircle, Award, TrendingUp, Clock, Target, Flame, X, Share2 } from 'lucide-react';

export default function WorkoutSummary({ summary, newPRs, onClose }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const calculateCompletionRate = () => {
    const totalExercises = summary.exercises.length;
    const completedExercises = summary.exercises.filter(ex => ex.completed).length;
    return Math.round((completedExercises / totalExercises) * 100);
  };

  const getTotalSets = () => {
    return summary.exercises.reduce((sum, ex) => sum + ex.completedSets, 0);
  };

  const getTotalReps = () => {
    return summary.exercises.reduce((sum, ex) => sum + (ex.completedSets * ex.actualReps), 0);
  };

  const completionRate = calculateCompletionRate();
  const totalSets = getTotalSets();
  const totalReps = getTotalReps();

  const handleShare = async () => {
    const shareText = `💪 Just crushed my workout!\n\n${summary.workoutName}\n⏱️ ${formatTime(summary.duration)}\n🎯 ${completionRate}% completion\n🔥 ${summary.totalVolume.toLocaleString()} lbs total volume${newPRs.length > 0 ? `\n🏆 ${newPRs.length} new PR${newPRs.length > 1 ? 's' : ''}!` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Workout Complete!',
          text: shareText
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert('Workout summary copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 dark:from-emerald-900 dark:via-teal-900 dark:to-blue-900 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Celebration Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-block p-4 bg-white/20 dark:bg-black/20 rounded-full mb-4 animate-bounce">
            <CheckCircle className="w-20 h-20 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Workout Complete!</h1>
          <p className="text-2xl text-white/90">Amazing work! 💪</p>
        </div>

        {/* Main Summary Card */}
        <div className="bg-white dark:bg-[#1E3328] rounded-3xl shadow-2xl overflow-hidden mb-4">
          {/* Workout Name & Date */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-800 dark:to-teal-800 p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">{summary.workoutName}</h2>
            <p className="text-emerald-100 dark:text-emerald-200">{formatDate(summary.completedAt)}</p>
          </div>

          {/* Stats Grid */}
          <div className="p-6 grid grid-cols-2 gap-4">
            {/* Duration */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-2xl text-center border-2 border-blue-200 dark:border-blue-800/30">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                {formatTime(summary.duration)}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-400 mt-1">Duration</div>
            </div>

            {/* Completion Rate */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-2xl text-center border-2 border-emerald-200 dark:border-emerald-800/30">
              <Target className="w-8 h-8 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
              <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-300">
                {completionRate}%
              </div>
              <div className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">Completed</div>
            </div>

            {/* Total Volume */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-2xl text-center border-2 border-purple-200 dark:border-purple-800/30">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-300">
                {summary.totalVolume.toLocaleString()}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-400 mt-1">lbs Volume</div>
            </div>

            {/* Sets & Reps */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-2xl text-center border-2 border-orange-200 dark:border-orange-800/30">
              <Flame className="w-8 h-8 mx-auto mb-2 text-orange-600 dark:text-orange-400" />
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-300">
                {totalSets} / {totalReps}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-400 mt-1">Sets / Reps</div>
            </div>
          </div>

          {/* New PRs Section */}
          {newPRs.length > 0 && (
            <div className="px-6 pb-6">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-400 dark:border-yellow-600/30 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  <h3 className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                    New Personal Records! 🎉
                  </h3>
                </div>
                <div className="space-y-3">
                  {newPRs.map((pr, idx) => (
                    <div
                      key={idx}
                      className="bg-white/60 dark:bg-black/20 p-4 rounded-xl border border-yellow-300 dark:border-yellow-700/30"
                    >
                      <div className="font-bold text-gray-900 dark:text-[#d8e7de] text-lg mb-1">
                        {pr.exercise}
                      </div>
                      <div className="text-yellow-800 dark:text-yellow-400 font-semibold">
                        {pr.weight} lbs × {pr.reps} reps
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Exercise Breakdown */}
          <div className="px-6 pb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-[#d8e7de] mb-4">Exercise Breakdown</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {summary.exercises.map((exercise, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${
                    exercise.completed
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30'
                      : 'bg-gray-50 dark:bg-[#0a0a0a]/30 border-gray-200 dark:border-[#C6A45F]/25'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-[#d8e7de]">
                        {exercise.completed ? '✓' : '○'} {exercise.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-[#d8e7de]/80">
                        {exercise.completedSets}/{exercise.sets} sets
                        {exercise.weightUsed > 0 && ` • ${exercise.weightUsed} lbs`}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60">
                      {exercise.actualReps} reps
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 dark:border-[#C6A45F]/25 space-y-3">
            <button
              onClick={handleShare}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Share2 className="w-5 h-5" />
              Share Your Victory
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2 shadow-lg transition"
            >
              <CheckCircle className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Motivational Quote */}
        <div className="text-center text-white/90 text-lg italic">
          "The only bad workout is the one that didn't happen." 💪
        </div>
      </div>
    </div>
  );
}
