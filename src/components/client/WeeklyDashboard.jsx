import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Flame, Trophy, Target, Clock, Check } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function WeeklyDashboard({ userId }) {
  const [stats, setStats] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [personalRecords, setPersonalRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserStats(),
        loadWeeklyProgress(),
        loadRecentWorkouts(),
        loadPersonalRecords()
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    const statsRef = dbRef(db, `user-stats/${userId}`);
    const snapshot = await get(statsRef);
    if (snapshot.exists()) {
      setStats(snapshot.val());
    }
  };

  const loadWeeklyProgress = async () => {
    // Get workouts from the past 7 days
    const historyRef = dbRef(db, `workout-history/${userId}`);
    const snapshot = await get(historyRef);
    
    if (snapshot.exists()) {
      const history = Object.values(snapshot.val());
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      // Group by day
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - (i * 24 * 60 * 60 * 1000));
        const dayName = days[date.getDay()];
        const dateString = date.toDateString();
        
        const workoutsOnDay = history.filter(w => {
          const workoutDate = new Date(w.startTime).toDateString();
          return workoutDate === dateString && w.completed;
        });
        
        weekData.push({
          day: dayName,
          date: date,
          count: workoutsOnDay.length,
          completed: workoutsOnDay.length > 0
        });
      }
      
      setWeeklyData(weekData);
    }
  };

  const loadRecentWorkouts = async () => {
    const historyRef = dbRef(db, `workout-history/${userId}`);
    const snapshot = await get(historyRef);
    
    if (snapshot.exists()) {
      const history = Object.entries(snapshot.val())
        .map(([id, workout]) => ({ id, ...workout }))
        .filter(w => w.completed)
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 5);
      
      setRecentWorkouts(history);
    }
  };

  const loadPersonalRecords = async () => {
    const prRef = dbRef(db, `personal-records/${userId}`);
    const snapshot = await get(prRef);
    
    if (snapshot.exists()) {
      const records = Object.values(snapshot.val())
        .sort((a, b) => b.date - a.date)
        .slice(0, 5);
      
      setPersonalRecords(records);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Your Progress</h1>
          <p className="text-emerald-100">Keep up the amazing work!</p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Streak */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-gray-600">Streak</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.currentStreak || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats?.currentStreak === 1 ? 'day' : 'days'}
            </div>
          </div>

          {/* Total Workouts */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-gray-600">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.totalWorkouts || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">workouts</div>
          </div>

          {/* Best Streak */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">Best</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.longestStreak || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stats?.longestStreak === 1 ? 'day' : 'days'}
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">This Week</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {weeklyData.filter(d => d.completed).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">workouts</div>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Weekly Activity
          </h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyData.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={`w-full rounded-lg transition-all ${
                    day.completed
                      ? 'bg-gradient-to-t from-emerald-500 to-teal-500'
                      : 'bg-gray-200'
                  }`}
                  style={{ height: day.completed ? '100%' : '20%' }}
                  title={`${day.count} workout${day.count !== 1 ? 's' : ''}`}
                />
                <span className={`text-xs font-medium ${
                  day.completed ? 'text-emerald-600' : 'text-gray-400'
                }`}>
                  {day.day}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {weeklyData.filter(d => d.completed).length > 0 ? (
                <>
                  Great job! You've completed{' '}
                  <span className="font-bold text-emerald-600">
                    {weeklyData.filter(d => d.completed).length}
                  </span>{' '}
                  {weeklyData.filter(d => d.completed).length === 1 ? 'workout' : 'workouts'} this week 🎉
                </>
              ) : (
                "Let's get started this week! 💪"
              )}
            </p>
          </div>
        </div>

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Recent Workouts
            </h3>
            <div className="space-y-3">
              {recentWorkouts.map(workout => (
                <div
                  key={workout.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {workout.workoutName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(workout.startTime)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-emerald-600 font-medium">
                      <Check className="w-4 h-4" />
                      Complete
                    </div>
                    {workout.duration && (
                      <div className="text-xs text-gray-500">
                        {formatDuration(workout.duration)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Records */}
        {personalRecords.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Recent Personal Records
            </h3>
            <div className="space-y-3">
              {personalRecords.map((record, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {record.exerciseName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(record.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-yellow-700">
                      {record.bestWeight} lbs
                    </div>
                    <div className="text-sm text-yellow-600">
                      × {record.bestReps} reps
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {stats && (
          <div className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white text-center">
            <p className="text-lg font-semibold">
              {stats.currentStreak >= 7
                ? "🔥 You're on a roll! Keep that streak alive!"
                : stats.totalWorkouts >= 10
                ? "💪 You're building serious momentum!"
                : "🌟 Every workout brings you closer to your goals!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
