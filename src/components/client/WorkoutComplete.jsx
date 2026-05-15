import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Flame, Star, X, Copy, Check } from 'lucide-react';
import { ref as dbRef, get, update } from 'firebase/database';
import { db } from '../../firebase';
import Confetti from 'react-confetti';

export default function WorkoutComplete({ workout, onClose, userId, sessionId, sessionData = {}, exercises = [], duration = 0 }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [hasRated, setHasRated] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadStats();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  }, []);

  useEffect(() => {
    if (!sessionId || !sessionNote.trim()) return;
    const t = setTimeout(async () => {
      try {
        await update(dbRef(db, `workout-history/${userId}/${sessionId}`), { note: sessionNote.trim() });
        setNoteSaved(true);
      } catch (err) {
        console.error('Error saving note:', err);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [sessionNote, sessionId]);

  const loadStats = async () => {
    try {
      const statsRef = dbRef(db, `user-stats/${userId}`);
      const snapshot = await get(statsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setStats(data);
        checkAchievements(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const checkAchievements = (statsData) => {
    const newAchievements = [];
    
    // Check for milestones
    if (statsData.totalWorkouts === 1) {
      newAchievements.push({
        icon: '🎉',
        title: 'First Workout!',
        description: 'You completed your first workout!'
      });
    }
    
    if (statsData.totalWorkouts === 10) {
      newAchievements.push({
        icon: '💪',
        title: 'Dedicated',
        description: '10 workouts completed!'
      });
    }
    
    if (statsData.totalWorkouts === 50) {
      newAchievements.push({
        icon: '🏆',
        title: 'Warrior',
        description: '50 workouts completed!'
      });
    }
    
    if (statsData.totalWorkouts === 100) {
      newAchievements.push({
        icon: '👑',
        title: 'Legend',
        description: '100 workouts completed!'
      });
    }
    
    // Check streak achievements
    if (statsData.currentStreak === 7) {
      newAchievements.push({
        icon: '🔥',
        title: 'Week Streak',
        description: '7 days in a row!'
      });
    }
    
    if (statsData.currentStreak === 30) {
      newAchievements.push({
        icon: '⚡',
        title: 'Month Streak',
        description: '30 days strong!'
      });
    }
    
    if (statsData.currentStreak === 90) {
      newAchievements.push({
        icon: '🌟',
        title: 'Quarter Warrior',
        description: '90 day streak!'
      });
    }

    setAchievements(newAchievements);
  };

  const handleRating = async (rating) => {
    setDifficultyRating(rating);
    setHasRated(true);
    
    // Save rating to session
    if (sessionId) {
      try {
        await update(dbRef(db, `workout-history/${userId}/${sessionId}`), {
          difficultyRating: rating
        });
      } catch (error) {
        console.error('Error saving rating:', error);
      }
    }
  };

  const getRatingEmoji = (rating) => {
    const emojis = ['😅', '🙂', '😊', '💪', '🔥'];
    return emojis[rating - 1] || '';
  };

  const getRatingLabel = (rating) => {
    const labels = ['Easy', 'Light', 'Good', 'Hard', 'Brutal'];
    return labels[rating - 1] || '';
  };

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s > 0 ? `${s}s` : ''}`.trim() : `${s}s`;
  };

  const buildSummaryText = () => {
    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const lines = [
      `💪 ${workout.name}`,
      `📅 ${date}${duration > 0 ? ` · ⏱ ${formatDuration(duration)}` : ''}`,
      '',
    ];

    let totalVolume = 0;
    const hasSections = exercises.some(ex => ex.section);

    const renderExercise = (ex, idx) => {
      const data = sessionData[idx];
      if (!data) return;
      const completedSets = (data.sets || []).filter(s => s.completed);
      if (completedSets.length === 0) return;
      const dbLabel = ex.dumbbells === 2 ? ' ea.' : '';
      const setsStr = completedSets.map(s => `${s.weight}${dbLabel}×${s.reps}`).join(' | ');
      const dbMult = ex.dumbbells === 2 ? 2 : 1;
      lines.push(`  ${ex.name}: ${setsStr}`);
      completedSets.forEach(s => { totalVolume += (s.weight || 0) * dbMult * (s.reps || 0); });
    };

    if (hasSections) {
      const sectionOrder = ['warmup', 'work', 'cooldown'];
      const sectionLabels = { warmup: '🔥 WARMUP', work: '💪 WORK', cooldown: '🧘 COOLDOWN' };
      sectionOrder.forEach(section => {
        const items = exercises.map((ex, idx) => ({ ex, idx })).filter(({ ex }) => ex.section === section);
        if (items.length === 0) return;
        lines.push(sectionLabels[section]);
        items.forEach(({ ex, idx }) => renderExercise(ex, idx));
        lines.push('');
      });
    } else {
      exercises.forEach((ex, idx) => renderExercise(ex, idx));
      lines.push('');
    }

    if (totalVolume > 0) lines.push(`🏋️ Total volume: ${totalVolume.toLocaleString()} lbs`);
    lines.push('— Flourish Fitness');
    return lines.join('\n');
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(buildSummaryText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0a0a0a] dark:to-[#1E3328] relative overflow-hidden">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <div className="max-w-2xl mx-auto p-4 pt-12">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center text-white/70 active:text-white z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Celebration Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl animate-bounce">
            <Trophy className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-[#d8e7de] mb-2">
            Workout Complete! 🎉
          </h1>
          <p className="text-xl text-gray-500 dark:text-[#d8e7de]/80">
            {workout.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Streak */}
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 text-center border border-gray-200 dark:border-[#C6A45F]/25">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-[#d8e7de] mb-1">
              {stats?.currentStreak || 1}
            </div>
            <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60">Day Streak</div>
          </div>

          {/* Total Workouts */}
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 text-center border border-gray-200 dark:border-[#C6A45F]/25">
            <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-[#d8e7de] mb-1">
              {stats?.totalWorkouts || 1}
            </div>
            <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60">Total</div>
          </div>

          {/* Longest Streak */}
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 text-center border border-gray-200 dark:border-[#C6A45F]/25">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900 dark:text-[#d8e7de] mb-1">
              {stats?.longestStreak || 1}
            </div>
            <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60">Best Streak</div>
          </div>
        </div>

        {/* New Achievements */}
        {achievements.length > 0 && (
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 mb-8 border border-gray-200 dark:border-[#C6A45F]/25">
            <h3 className="text-xl font-bold text-gray-900 dark:text-[#d8e7de] mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              New Achievements!
            </h3>
            <div className="space-y-3">
              {achievements.map((achievement, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 animate-pulse"
                >
                  <div className="text-4xl">{achievement.icon}</div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-[#d8e7de]">{achievement.title}</div>
                    <div className="text-sm text-gray-500 dark:text-[#d8e7de]/80">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Rating */}
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 mb-8 border border-gray-200 dark:border-[#C6A45F]/25">
          <h3 className="text-xl font-bold text-gray-900 dark:text-[#d8e7de] mb-4 text-center">
            How was this workout?
          </h3>
          {!hasRated ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 border-gray-200 dark:border-[#C6A45F]/25 active:border-emerald-500 active:bg-emerald-50 dark:active:bg-emerald-900/20 transition min-h-[72px]"
                >
                  <span className="text-2xl">{getRatingEmoji(rating)}</span>
                  <span className="text-xs text-gray-500 dark:text-[#d8e7de]/60 font-medium leading-tight">
                    {getRatingLabel(rating)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">{getRatingEmoji(difficultyRating)}</div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                Thanks for your feedback!
              </div>
              <div className="text-gray-500 dark:text-[#d8e7de]/80">
                This helps your trainer create better workouts for you
              </div>
            </div>
          )}
        </div>

        {/* Workout Summary */}
        {Object.keys(sessionData).length > 0 && (
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 mb-6 border border-gray-200 dark:border-[#C6A45F]/25">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de]">Workout Summary</h3>
              <button
                onClick={handleCopySummary}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition active:scale-95 ${
                  copied
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-emerald-500 text-white active:bg-emerald-600'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-[#0a0a0a]/40 rounded-xl p-4 text-sm text-gray-700 dark:text-[#d8e7de]/80 whitespace-pre-wrap font-mono leading-relaxed">
              {buildSummaryText()}
            </div>
          </div>
        )}

        {/* Session Notes */}
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 mb-6 border border-gray-200 dark:border-[#C6A45F]/25">
          <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de] mb-3">Session Notes</h3>
          <textarea
            value={sessionNote}
            onChange={e => { setSessionNote(e.target.value); setNoteSaved(false); }}
            placeholder="How did it feel? Any notes for next time..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] resize-none text-base"
          />
          {noteSaved && <p className="text-xs text-emerald-500 mt-1.5">Saved</p>}
        </div>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white text-center mb-8">
          <p className="text-xl font-semibold mb-2">
            {stats?.currentStreak >= 7
              ? "🔥 You're on fire! Keep up the amazing consistency!"
              : stats?.totalWorkouts === 1
              ? "🌟 Great start! The hardest part is showing up, and you did it!"
              : "💪 Another one in the books! You're building momentum!"}
          </p>
          <p className="text-emerald-100">
            {stats?.currentStreak >= 7
              ? `${stats.currentStreak} days and counting!`
              : "See you at the next workout!"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pb-8">
          <button
            onClick={onClose}
            className="w-full py-4 bg-white dark:bg-[#1E3328] border-2 border-gray-200 dark:border-[#C6A45F]/25 text-gray-700 dark:text-[#d8e7de]/80 rounded-2xl font-bold min-h-[56px] active:bg-gray-50"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
