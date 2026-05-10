import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Award, Dumbbell, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function ProgressDashboard({ user }) {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [exerciseProgress, setExerciseProgress] = useState({});
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalSets: 0,
    avgDuration: 0,
    currentStreak: 0
  });
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);

  useEffect(() => {
    loadWorkoutData();
  }, [user]);

  const loadWorkoutData = async () => {
    try {
      const logsRef = dbRef(db, 'workout-logs');
      const snapshot = await get(logsRef);
      
      if (snapshot.exists()) {
        const allLogs = Object.entries(snapshot.val())
          .filter(([key, log]) => log.userId === user.uid)
          .map(([key, log]) => ({ id: key, ...log }))
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        
        setWorkoutLogs(allLogs);
        calculateStats(allLogs);
        processExerciseProgress(allLogs);
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
    }
  };

  const calculateStats = (logs) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = logs.filter(log => new Date(log.completedAt) > weekAgo).length;
    const thisMonth = logs.filter(log => new Date(log.completedAt) > monthAgo).length;
    const totalSets = logs.reduce((sum, log) => {
      return sum + Object.values(log.completedSets || {}).reduce((s, sets) => s + sets.length, 0);
    }, 0);
    const avgDuration = logs.length > 0
      ? Math.round(logs.reduce((sum, log) => sum + (log.duration || 0), 0) / logs.length / 60)
      : 0;

    // Calculate current streak
    const sortedDates = logs
      .map(log => new Date(log.completedAt).toISOString().split('T')[0])
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      streak = 1;
      let currentDate = new Date(sortedDates[0]);
      
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        if (sortedDates[i] === prevDate) {
          streak++;
          currentDate = new Date(sortedDates[i]);
        } else {
          break;
        }
      }
    }

    setStats({
      totalWorkouts: logs.length,
      thisWeek,
      thisMonth,
      totalSets,
      avgDuration,
      currentStreak: streak
    });
  };

  const processExerciseProgress = (logs) => {
    const exerciseData = {};

    logs.forEach(log => {
      if (log.exercises && log.weights) {
        log.exercises.forEach((exercise, idx) => {
          const exerciseName = exercise.name;
          const weight = log.weights[idx] || 0;
          const date = log.completedAt;

          if (!exerciseData[exerciseName]) {
            exerciseData[exerciseName] = {
              name: exerciseName,
              history: [],
              maxWeight: 0,
              totalSets: 0,
              avgWeight: 0
            };
          }

          exerciseData[exerciseName].history.push({
            date,
            weight,
            sets: exercise.sets,
            reps: exercise.reps,
            completed: exercise.completed
          });

          if (weight > exerciseData[exerciseName].maxWeight) {
            exerciseData[exerciseName].maxWeight = weight;
          }
          exerciseData[exerciseName].totalSets += exercise.sets;
        });
      }
    });

    // Calculate average weights
    Object.keys(exerciseData).forEach(exerciseName => {
      const data = exerciseData[exerciseName];
      const validWeights = data.history.filter(h => h.weight > 0);
      if (validWeights.length > 0) {
        data.avgWeight = Math.round(
          validWeights.reduce((sum, h) => sum + h.weight, 0) / validWeights.length
        );
      }
      // Sort history by date (newest first)
      data.history.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    setExerciseProgress(exerciseData);
  };

  const getWeightTrend = (exerciseName) => {
    const data = exerciseProgress[exerciseName];
    if (!data || data.history.length < 2) return 'stable';

    const validWeights = data.history.filter(h => h.weight > 0).slice(0, 5);
    if (validWeights.length < 2) return 'stable';

    const latest = validWeights[0].weight;
    const previous = validWeights[validWeights.length - 1].weight;

    if (latest > previous) return 'up';
    if (latest < previous) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <ChevronDown className="w-4 h-4 text-red-500" />;
    return <span className="text-gray-400">—</span>;
  };

  const sortedExercises = Object.values(exerciseProgress)
    .sort((a, b) => b.totalSets - a.totalSets);

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Progress Dashboard</h2>
        <p className="text-emerald-100">Track your strength gains and improvements</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-gray-600 text-sm mb-1">Total Workouts</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalWorkouts}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-gray-600 text-sm mb-1">This Week</div>
          <div className="text-3xl font-bold text-emerald-600">{stats.thisWeek}</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-gray-600 text-sm mb-1">This Month</div>
          <div className="text-3xl font-bold text-gray-900">{stats.thisMonth}</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-gray-600 text-sm mb-1">Current Streak</div>
          <div className="text-3xl font-bold text-orange-600">{stats.currentStreak} 🔥</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-gray-600 text-sm mb-1">Total Sets</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalSets}</div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-gray-600 text-sm mb-1">Avg Duration</div>
          <div className="text-3xl font-bold text-gray-900">{stats.avgDuration}m</div>
        </div>
      </div>

      {/* Exercise Progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Exercise Progress</h3>
        
        {sortedExercises.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Complete your first workout to see progress data!
          </p>
        ) : (
          <div className="space-y-3">
            {sortedExercises.map(exercise => {
              const trend = getWeightTrend(exercise.name);
              const isExpanded = expandedExercise === exercise.name;
              
              return (
                <div key={exercise.name} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedExercise(isExpanded ? null : exercise.name)}
                    className="w-full p-4 hover:bg-gray-50 transition text-left"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{exercise.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Max: {exercise.maxWeight} lbs • Avg: {exercise.avgWeight} lbs • {exercise.totalSets} sets
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getTrendIcon(trend)}
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-3">Recent History</div>
                      <div className="space-y-2">
                        {exercise.history.slice(0, 10).map((entry, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm py-2 px-3 bg-white rounded-lg">
                            <div className="text-gray-600">
                              {new Date(entry.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-900">
                                {entry.weight > 0 ? `${entry.weight} lbs` : 'Bodyweight'}
                              </span>
                              <span className="text-gray-500">
                                {entry.sets} × {entry.reps}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Personal Records */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">💪 Personal Records</h3>
        {sortedExercises.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            Keep training to set your first records!
          </p>
        ) : (
          <div className="space-y-3">
            {sortedExercises
              .filter(ex => ex.maxWeight > 0)
              .sort((a, b) => b.maxWeight - a.maxWeight)
              .slice(0, 10)
              .map((exercise, idx) => (
                <div key={exercise.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {idx < 3 && (
                      <div className="text-2xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900">{exercise.name}</div>
                      <div className="text-sm text-gray-600">
                        {exercise.totalSets} total sets completed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{exercise.maxWeight}</div>
                    <div className="text-sm text-gray-600">lbs</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">💡 Progress Tips</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>Aim to gradually increase weight or reps each week</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>Consistency beats intensity - show up regularly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>Track your weights to see how far you've come</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-1">•</span>
            <span>Celebrate small wins - progress is progress!</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
