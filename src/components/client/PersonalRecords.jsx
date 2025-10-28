import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Award, Flame, Target, Calendar } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function PersonalRecords({ user }) {
  const [records, setRecords] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecordsAndAchievements();
  }, [user]);

  const loadRecordsAndAchievements = async () => {
    setLoading(true);
    try {
      const logsRef = dbRef(db, 'workout-logs');
      const snapshot = await get(logsRef);
      
      if (snapshot.exists()) {
        const allLogs = Object.entries(snapshot.val())
          .filter(([key, log]) => log.userId === user.uid)
          .map(([key, log]) => ({ id: key, ...log }))
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        
        processRecords(allLogs);
        calculateAchievements(allLogs);
        calculateMilestones(allLogs);
      }
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const processRecords = (logs) => {
    const exerciseRecords = {};

    logs.forEach(log => {
      if (log.exercises && log.weights) {
        log.exercises.forEach((exercise, idx) => {
          const weight = log.weights[idx] || 0;
          const exerciseName = exercise.name;
          
          if (weight > 0) {
            if (!exerciseRecords[exerciseName] || weight > exerciseRecords[exerciseName].weight) {
              exerciseRecords[exerciseName] = {
                name: exerciseName,
                weight: weight,
                sets: exercise.sets,
                reps: exercise.reps,
                date: log.completedAt,
                workoutName: log.workoutName
              };
            }
          }
        });
      }
    });

    const sortedRecords = Object.values(exerciseRecords)
      .sort((a, b) => b.weight - a.weight);
    
    setRecords(sortedRecords);
  };

  const calculateAchievements = (logs) => {
    const achievementsList = [];
    
    // Workout count achievements
    const milestones = [1, 5, 10, 25, 50, 100, 200, 500];
    const workoutCount = logs.length;
    const lastMilestone = milestones.reverse().find(m => workoutCount >= m);
    
    if (lastMilestone) {
      achievementsList.push({
        id: 'workouts',
        title: `${lastMilestone} Workouts Completed`,
        description: `You've completed ${workoutCount} total workouts!`,
        icon: '🏋️',
        date: logs[logs.length - lastMilestone]?.completedAt,
        category: 'consistency'
      });
    }

    // Streak achievements
    const streakDays = calculateCurrentStreak(logs);
    if (streakDays >= 3) {
      achievementsList.push({
        id: 'streak',
        title: `${streakDays} Day Streak`,
        description: 'Keep the momentum going!',
        icon: '🔥',
        date: new Date().toISOString(),
        category: 'streak'
      });
    }

    // Volume achievements
    const totalVolume = logs.reduce((sum, log) => {
      if (!log.exercises || !log.weights || !log.completedSets) return sum;
      
      let logVolume = 0;
      log.exercises.forEach((exercise, idx) => {
        const weight = log.weights[idx] || 0;
        const setsCompleted = log.completedSets[idx]?.length || 0;
        const reps = exercise.reps || 0;
        logVolume += weight * setsCompleted * reps;
      });
      return sum + logVolume;
    }, 0);

    const volumeMilestones = [10000, 50000, 100000, 250000, 500000, 1000000];
    const lastVolumeMilestone = volumeMilestones.reverse().find(m => totalVolume >= m);
    
    if (lastVolumeMilestone) {
      achievementsList.push({
        id: 'volume',
        title: `${(lastVolumeMilestone / 1000).toFixed(0)}k lbs Lifted`,
        description: `Total weight lifted: ${Math.round(totalVolume).toLocaleString()} lbs`,
        icon: '💪',
        date: logs[0]?.completedAt,
        category: 'strength'
      });
    }

    // Heavy weight achievements (200+ lb club, 300+ lb club, etc)
    const maxWeight = Math.max(...records.map(r => r.weight), 0);
    const weightClubs = [100, 200, 300, 400, 500];
    const lastWeightClub = weightClubs.reverse().find(w => maxWeight >= w);
    
    if (lastWeightClub) {
      achievementsList.push({
        id: 'heavy',
        title: `${lastWeightClub}+ lb Club`,
        description: `Max weight: ${maxWeight} lbs`,
        icon: '⚡',
        date: records.find(r => r.weight === maxWeight)?.date,
        category: 'strength'
      });
    }

    // Perfect workout achievements
    const perfectWorkouts = logs.filter(log => {
      if (!log.exercises || !log.completedSets) return false;
      const totalSets = log.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
      const completedSets = Object.values(log.completedSets).reduce((sum, sets) => sum + sets.length, 0);
      return totalSets === completedSets && totalSets > 0;
    }).length;

    if (perfectWorkouts >= 5) {
      achievementsList.push({
        id: 'perfect',
        title: `${perfectWorkouts} Perfect Workouts`,
        description: 'Completed every single set!',
        icon: '🎯',
        date: logs[0]?.completedAt,
        category: 'consistency'
      });
    }

    setAchievements(achievementsList);
  };

  const calculateCurrentStreak = (logs) => {
    const sortedDates = logs
      .map(log => new Date(log.completedAt).toISOString().split('T')[0])
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

    return streak;
  };

  const calculateMilestones = (logs) => {
    const milestonesList = [];
    
    // First workout
    if (logs.length > 0) {
      milestonesList.push({
        title: 'First Workout',
        description: 'The beginning of your journey',
        date: logs[logs.length - 1].completedAt,
        icon: '🌟'
      });
    }

    // Most recent PR
    if (records.length > 0) {
      const newestPR = records.reduce((newest, record) => {
        return new Date(record.date) > new Date(newest.date) ? record : newest;
      }, records[0]);

      milestonesList.push({
        title: 'Latest PR',
        description: `${newestPR.name}: ${newestPR.weight} lbs`,
        date: newestPR.date,
        icon: '🏆'
      });
    }

    // Longest workout
    const longestWorkout = logs.reduce((longest, log) => {
      return (log.duration || 0) > (longest.duration || 0) ? log : longest;
    }, logs[0] || {});

    if (longestWorkout.duration) {
      milestonesList.push({
        title: 'Longest Workout',
        description: `${Math.floor(longestWorkout.duration / 60)} minutes`,
        date: longestWorkout.completedAt,
        icon: '⏱️'
      });
    }

    setMilestones(milestonesList.sort((a, b) => new Date(b.date) - new Date(a.date)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading records...</div>
      </div>
    );
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'strength': return 'from-red-500 to-orange-500';
      case 'consistency': return 'from-blue-500 to-purple-500';
      case 'streak': return 'from-orange-500 to-yellow-500';
      default: return 'from-emerald-500 to-teal-500';
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Personal Records</h2>
        <p className="text-yellow-100">Your best lifts and achievements</p>
      </div>

      {/* Top Records */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold text-gray-900">Top Lifts</h3>
        </div>
        
        {records.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No records yet!</p>
            <p className="text-sm text-gray-500 mt-2">Complete workouts to set your first PRs</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.slice(0, 10).map((record, idx) => (
              <div 
                key={record.name}
                className={`p-4 rounded-xl border-2 ${
                  idx === 0 
                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {idx < 3 && (
                      <div className="text-3xl">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg">{record.name}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {record.sets} sets × {record.reps} reps
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">{record.weight}</div>
                    <div className="text-sm text-gray-600">lbs</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <Award className="w-6 h-6 text-purple-500" />
          <h3 className="text-xl font-bold text-gray-900">Achievements</h3>
        </div>

        {achievements.length === 0 ? (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No achievements yet!</p>
            <p className="text-sm text-gray-500 mt-2">Keep training to unlock achievements</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map(achievement => (
              <div 
                key={achievement.id}
                className={`p-4 rounded-xl bg-gradient-to-r ${getCategoryColor(achievement.category)} text-white`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-1">{achievement.title}</div>
                    <div className="text-white/90 text-sm">{achievement.description}</div>
                    {achievement.date && (
                      <div className="text-white/70 text-xs mt-2">
                        {new Date(achievement.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Milestones */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-6 h-6 text-emerald-500" />
          <h3 className="text-xl font-bold text-gray-900">Milestones</h3>
        </div>

        {milestones.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No milestones yet!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-3xl">{milestone.icon}</div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{milestone.title}</div>
                  <div className="text-sm text-gray-600">{milestone.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {new Date(milestone.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivational Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-purple-900 mb-3">💪 Keep Pushing!</h3>
        <ul className="space-y-2 text-purple-800">
          <li className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>Every PR started with a first attempt</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>Progressive overload is key - add just 2.5-5 lbs when ready</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>Focus on perfect form before increasing weight</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500 mt-1">•</span>
            <span>Rest and recovery are when you actually get stronger</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
