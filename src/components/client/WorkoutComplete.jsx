import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Flame, Star, Share2, X } from 'lucide-react';
import { ref as dbRef, get, update } from 'firebase/database';
import { db } from '../../firebase';
import Confetti from 'react-confetti';

export default function WorkoutComplete({ workout, onClose, userId, sessionId }) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [difficultyRating, setDifficultyRating] = useState(0);
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    loadStats();
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  }, []);

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
    const emojis = ['😰', '😅', '😊', '💪', '🔥'];
    return emojis[rating - 1] || '';
  };

  const getRatingLabel = (rating) => {
    const labels = ['Too Easy', 'Easy', 'Just Right', 'Challenging', 'Very Hard'];
    return labels[rating - 1] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
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
          className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-900 z-10"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Celebration Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl animate-bounce">
            <Trophy className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Workout Complete! 🎉
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {workout.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Streak */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.currentStreak || 1}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Day Streak</div>
          </div>

          {/* Total Workouts */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
            <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.totalWorkouts || 1}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
          </div>

          {/* Longest Streak */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {stats?.longestStreak || 1}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Best Streak</div>
          </div>
        </div>

        {/* New Achievements */}
        {achievements.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
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
                    <div className="font-bold text-gray-900 dark:text-white">{achievement.title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            How was this workout?
          </h3>
          {!hasRated ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition flex items-center justify-between group"
                >
                  <span className="text-3xl">{getRatingEmoji(rating)}</span>
                  <span className="text-lg font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-700">
                    {getRatingLabel(rating)}
                  </span>
                  <div className="flex gap-1">
                    {[...Array(rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">{getRatingEmoji(difficultyRating)}</div>
              <div className="text-2xl font-bold text-emerald-600 mb-2">
                Thanks for your feedback!
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                This helps your trainer create better workouts for you
              </div>
            </div>
          )}
        </div>

        {/* Motivational Message */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-lg p-6 text-white text-center mb-8">
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
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onClose}
            className="py-4 bg-white dark:bg-gray-800 border-2 border-gray-300 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50"
          >
            Back to Home
          </button>
          <button
            onClick={() => {
              // TODO: Implement share functionality
              alert('Share feature coming soon!');
            }}
            className="py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:opacity-90 flex items-center justify-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
