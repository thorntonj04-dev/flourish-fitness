import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Dumbbell, ChevronDown, ChevronRight, Trophy, CheckCircle } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function WorkoutHistory({ user }) {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [expandedWorkout, setExpandedWorkout] = useState(null);
  const [filterMonth, setFilterMonth] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkoutHistory();
  }, [user]);

  const loadWorkoutHistory = async () => {
    setLoading(true);
    try {
      const logsRef = dbRef(db, 'workout-logs');
      const snapshot = await get(logsRef);
      
      if (snapshot.exists()) {
        const allLogs = Object.entries(snapshot.val())
          .filter(([key, log]) => log.userId === user.uid)
          .map(([key, log]) => ({ id: key, ...log }))
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
        
        setWorkoutLogs(allLogs);
      }
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMonthYear = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getMonthKey = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${date.getMonth()}`;
  };

  const uniqueMonths = [...new Set(workoutLogs.map(log => getMonthKey(log.completedAt)))];
  
  const filteredWorkouts = filterMonth === 'all' 
    ? workoutLogs 
    : workoutLogs.filter(log => getMonthKey(log.completedAt) === filterMonth);

  const groupedByDate = filteredWorkouts.reduce((acc, log) => {
    const date = new Date(log.completedAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {});

  const getTotalWeightLifted = (log) => {
    if (!log.exercises || !log.weights || !log.completedSets) return 0;
    
    let total = 0;
    log.exercises.forEach((exercise, idx) => {
      const weight = log.weights[idx] || 0;
      const setsCompleted = log.completedSets[idx]?.length || 0;
      const reps = exercise.reps || 0;
      total += weight * setsCompleted * reps;
    });
    return total;
  };

  const getCompletionRate = (log) => {
    if (!log.exercises || !log.completedSets) return 0;
    
    const totalSets = log.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
    const completedSets = Object.values(log.completedSets).reduce((sum, sets) => sum + sets.length, 0);
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading workout history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Workout History</h2>
        <p className="text-emerald-100">Review all your completed training sessions</p>
      </div>

      {/* Stats Summary */}
      {workoutLogs.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{workoutLogs.length}</div>
              <div className="text-sm text-gray-600">Total Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {Math.round(workoutLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / 3600)}
              </div>
              <div className="text-sm text-gray-600">Hours Trained</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {workoutLogs.reduce((sum, log) => {
                  return sum + Object.values(log.completedSets || {}).reduce((s, sets) => s + sets.length, 0);
                }, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Sets</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {Math.round(workoutLogs.reduce((sum, log) => sum + getTotalWeightLifted(log), 0) / 1000)}k
              </div>
              <div className="text-sm text-gray-600">lbs Lifted</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      {uniqueMonths.length > 1 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Month</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Time</option>
            {uniqueMonths.map(monthKey => {
              const date = new Date(monthKey.split('-')[0], monthKey.split('-')[1]);
              return (
                <option key={monthKey} value={monthKey}>
                  {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Workout List */}
      {filteredWorkouts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
          <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">No workouts yet!</p>
          <p className="text-sm text-gray-500">Complete your first workout to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, logs]) => (
            <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Date Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="text-sm text-gray-600">({logs.length} workout{logs.length > 1 ? 's' : ''})</span>
                </div>
              </div>

              {/* Workouts for this date */}
              <div className="divide-y divide-gray-200">
                {logs.map(log => {
                  const isExpanded = expandedWorkout === log.id;
                  const completionRate = getCompletionRate(log);
                  const totalWeight = getTotalWeightLifted(log);
                  
                  return (
                    <div key={log.id}>
                      <button
                        onClick={() => setExpandedWorkout(isExpanded ? null : log.id)}
                        className="w-full p-4 hover:bg-gray-50 transition text-left"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900">{log.workoutName}</h4>
                              {completionRate === 100 && (
                                <Trophy className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDuration(log.duration || 0)}
                              </span>
                              <span>
                                {Object.values(log.completedSets || {}).reduce((sum, sets) => sum + sets.length, 0)} sets
                              </span>
                              {totalWeight > 0 && (
                                <span>
                                  {Math.round(totalWeight).toLocaleString()} lbs total
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className={`text-sm font-semibold ${
                                completionRate === 100 ? 'text-green-600' : 'text-gray-600'
                              }`}>
                                {completionRate}%
                              </div>
                              <div className="text-xs text-gray-500">complete</div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              completionRate === 100 ? 'bg-green-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                      </button>

                      {/* Expanded Details */}
                      {isExpanded && log.exercises && (
                        <div className="px-4 pb-4 bg-gray-50">
                          <div className="space-y-2">
                            {log.exercises.map((exercise, idx) => {
                              const weight = log.weights?.[idx] || 0;
                              const setsCompleted = log.completedSets?.[idx]?.length || 0;
                              const isComplete = setsCompleted === exercise.sets;
                              
                              return (
                                <div 
                                  key={idx}
                                  className={`p-3 rounded-lg border ${
                                    isComplete 
                                      ? 'bg-green-50 border-green-200' 
                                      : 'bg-white border-gray-200'
                                  }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{exercise.name}</span>
                                        {isComplete && <CheckCircle className="w-4 h-4 text-green-600" />}
                                      </div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        {setsCompleted} of {exercise.sets} sets • {exercise.reps} reps
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {weight > 0 ? (
                                        <>
                                          <div className="font-bold text-gray-900">{weight} lbs</div>
                                          <div className="text-xs text-gray-500">
                                            {Math.round(weight * setsCompleted * exercise.reps)} lbs total
                                          </div>
                                        </>
                                      ) : (
                                        <div className="text-sm text-gray-600">Bodyweight</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Workout Time */}
                          <div className="mt-4 pt-3 border-t border-gray-200 text-sm text-gray-600">
                            Completed at {new Date(log.completedAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
