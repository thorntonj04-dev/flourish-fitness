import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, Award, CheckCircle, XCircle, Clock, Dumbbell, ChevronDown, ChevronRight } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function AdminClientAnalytics() {
  const [clients, setClients] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [selectedClient, setSelectedClient] = useState(null);
  const [timeframe, setTimeframe] = useState('week'); // week, month, all
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadClients(),
        loadWorkoutLogs(),
        loadAssignments()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    const usersRef = dbRef(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const clientData = Object.entries(usersData)
        .filter(([id, user]) => user.role === 'client')
        .map(([id, user]) => ({ id, ...user }));
      setClients(clientData);
    }
  };

  const loadWorkoutLogs = async () => {
    const logsRef = dbRef(db, 'workout-logs');
    const snapshot = await get(logsRef);
    
    if (snapshot.exists()) {
      const allLogs = Object.entries(snapshot.val()).map(([key, log]) => ({ id: key, ...log }));
      setWorkoutLogs(allLogs);
    }
  };

  const loadAssignments = async () => {
    const assignmentsRef = dbRef(db, 'workout-assignments');
    const snapshot = await get(assignmentsRef);
    
    if (snapshot.exists()) {
      setAssignments(snapshot.val());
    }
  };

  const getClientStats = (clientId) => {
    const clientLogs = workoutLogs.filter(log => log.userId === clientId);
    const now = new Date();
    let cutoffDate;
    
    switch (timeframe) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(0);
    }

    const filteredLogs = clientLogs.filter(log => new Date(log.completedAt) > cutoffDate);
    
    // Calculate completion rate
    const clientAssignments = assignments[clientId] || {};
    const assignedDays = Object.keys(clientAssignments).length;
    const completedWorkouts = filteredLogs.length;
    
    // Calculate average completion percentage per workout
    const avgCompletion = filteredLogs.length > 0
      ? filteredLogs.reduce((sum, log) => {
          const totalSets = log.exercises?.reduce((s, ex) => s + (ex.sets || 0), 0) || 0;
          const completedSets = Object.values(log.completedSets || {}).reduce((s, sets) => s + sets.length, 0);
          return sum + (totalSets > 0 ? (completedSets / totalSets) * 100 : 0);
        }, 0) / filteredLogs.length
      : 0;

    // Calculate total volume
    const totalVolume = filteredLogs.reduce((sum, log) => {
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

    // Calculate current streak
    const sortedDates = clientLogs
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

    // Calculate average workout duration
    const avgDuration = filteredLogs.length > 0
      ? Math.round(filteredLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / filteredLogs.length / 60)
      : 0;

    // Get last workout date
    const lastWorkout = clientLogs.length > 0
      ? new Date(clientLogs[0].completedAt)
      : null;

    const daysSinceLastWorkout = lastWorkout
      ? Math.floor((now - lastWorkout) / (1000 * 60 * 60 * 24))
      : null;

    return {
      totalWorkouts: clientLogs.length,
      periodWorkouts: filteredLogs.length,
      assignedDays,
      avgCompletion: Math.round(avgCompletion),
      totalVolume,
      streak,
      avgDuration,
      lastWorkout,
      daysSinceLastWorkout,
      isActive: daysSinceLastWorkout !== null && daysSinceLastWorkout <= 7
    };
  };

  const getOverallStats = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter(client => {
      const stats = getClientStats(client.id);
      return stats.isActive;
    }).length;

    const allWorkouts = workoutLogs.length;
    const thisWeek = workoutLogs.filter(log => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(log.completedAt) > weekAgo;
    }).length;

    const avgCompletionRate = clients.length > 0
      ? Math.round(
          clients.reduce((sum, client) => sum + getClientStats(client.id).avgCompletion, 0) / clients.length
        )
      : 0;

    return {
      totalClients,
      activeClients,
      allWorkouts,
      thisWeek,
      avgCompletionRate
    };
  };

  const getEngagementLevel = (stats) => {
    if (stats.daysSinceLastWorkout === null) return { label: 'Never Started', color: 'gray', bgColor: 'bg-gray-100 dark:bg-gray-800' };
    if (stats.daysSinceLastWorkout === 0) return { label: 'Active Today', color: 'green', bgColor: 'bg-green-100 dark:bg-green-900' };
    if (stats.daysSinceLastWorkout <= 3) return { label: 'Active', color: 'green', bgColor: 'bg-green-100 dark:bg-green-900' };
    if (stats.daysSinceLastWorkout <= 7) return { label: 'Recent', color: 'yellow', bgColor: 'bg-yellow-100 dark:bg-yellow-900' };
    if (stats.daysSinceLastWorkout <= 14) return { label: 'At Risk', color: 'orange', bgColor: 'bg-orange-100 dark:bg-orange-900' };
    return { label: 'Inactive', color: 'red', bgColor: 'bg-red-100 dark:bg-red-900' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600 dark:text-gray-300">Loading analytics...</div>
      </div>
    );
  }

  const overallStats = getOverallStats();

  if (selectedClient) {
    const client = clients.find(c => c.id === selectedClient);
    const stats = getClientStats(selectedClient);
    const engagement = getEngagementLevel(stats);
    const clientLogs = workoutLogs
      .filter(log => log.userId === selectedClient)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return (
      <div className="space-y-6 pb-6">
        <button
          onClick={() => setSelectedClient(null)}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium"
        >
          ← Back to All Clients
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">{client.name}</h2>
          <p className="text-emerald-100">{client.email}</p>
        </div>

        {/* Client Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Workouts</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalWorkouts}</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Current Streak</div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.streak} 🔥</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Avg Completion</div>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.avgCompletion}%</div>
          </div>
          <div className={`rounded-xl p-4 shadow-sm border-2 ${engagement.bgColor} border-${engagement.color}-300 dark:border-${engagement.color}-700`}>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Status</div>
            <div className={`text-lg font-bold text-${engagement.color}-700 dark:text-${engagement.color}-400`}>{engagement.label}</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Workouts</h3>
          {clientLogs.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300 text-center py-8">No workouts completed yet</p>
          ) : (
            <div className="space-y-3">
              {clientLogs.slice(0, 10).map(log => {
                const completionRate = log.exercises 
                  ? (Object.values(log.completedSets || {}).reduce((sum, sets) => sum + sets.length, 0) / 
                     log.exercises.reduce((sum, ex) => sum + ex.sets, 0)) * 100
                  : 0;
                
                return (
                  <div key={log.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{log.workoutName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {new Date(log.completedAt).toLocaleDateString()} • {Math.floor((log.duration || 0) / 60)} min
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        completionRate === 100 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {Math.round(completionRate)}%
                      </div>
                      {completionRate === 100 && <div className="text-xs text-green-600 dark:text-green-400">Perfect!</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">Performance Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Avg Duration</span>
                <span className="font-semibold dark:text-white">{stats.avgDuration} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Total Volume</span>
                <span className="font-semibold dark:text-white">{Math.round(stats.totalVolume / 1000)}k lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Last Workout</span>
                <span className="font-semibold dark:text-white">
                  {stats.lastWorkout 
                    ? `${stats.daysSinceLastWorkout} day${stats.daysSinceLastWorkout !== 1 ? 's' : ''} ago`
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">Assignments</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Workouts Assigned</span>
                <span className="font-semibold dark:text-white">{stats.assignedDays} days/week</span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-300 mt-2">
                {stats.assignedDays > 0 
                  ? 'Check Workout Builder to modify assignments'
                  : 'No workouts assigned yet'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Client Analytics</h2>
        <p className="text-purple-100">Monitor client progress and engagement</p>
      </div>

      {/* Timeframe Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timeframe</label>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeframe('week')}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              timeframe === 'week'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              timeframe === 'month'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeframe('all')}
            className={`flex-1 py-2 rounded-lg font-medium transition ${
              timeframe === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Clients</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.totalClients}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Active Clients</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{overallStats.activeClients}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Total Workouts</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">{overallStats.allWorkouts}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">This Week</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{overallStats.thisWeek}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Avg Completion</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{overallStats.avgCompletionRate}%</div>
        </div>
      </div>

      {/* Client List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Client Performance</h3>
        
        {clients.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300 text-center py-8">No clients yet</p>
        ) : (
          <div className="space-y-3">
            {clients
              .map(client => ({ client, stats: getClientStats(client.id) }))
              .sort((a, b) => b.stats.periodWorkouts - a.stats.periodWorkouts)
              .map(({ client, stats }) => {
                const engagement = getEngagementLevel(stats);
                
                return (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client.id)}
                    className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-400 transition text-left"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{client.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">{client.email}</div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${engagement.bgColor} text-${engagement.color}-700 dark:text-${engagement.color}-400`}>
                        {engagement.label}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.periodWorkouts}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">Workouts</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.avgCompletion}%</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">Completion</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.streak}🔥</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">Streak</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgDuration}m</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">Avg Time</div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
