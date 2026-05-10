import React, { useState, useEffect } from 'react';
import { ref as dbRef, get, set, push } from 'firebase/database';
import { db } from '../../firebase';
import { Flame, Dumbbell, Trophy, TrendingUp, Calendar, Award, Scale, Plus } from 'lucide-react';

export default function ClientProfile({ user }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [savingMetric, setSavingMetric] = useState(false);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsSnap, historySnap, metricsSnap] = await Promise.all([
        get(dbRef(db, `user-stats/${user.uid}`)),
        get(dbRef(db, `workout-history/${user.uid}`)),
        get(dbRef(db, `body-metrics/${user.uid}`)),
      ]);
      if (statsSnap.exists()) setStats(statsSnap.val());
      if (historySnap.exists()) {
        const sessions = Object.values(historySnap.val())
          .filter(s => s.completed)
          .sort((a, b) => b.startTime - a.startTime);
        setHistory(sessions);
      }
      if (metricsSnap.exists()) {
        const list = Object.entries(metricsSnap.val())
          .map(([id, m]) => ({ id, ...m }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setMetrics(list);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // Best weight per exercise across all sessions
  const getPersonalRecords = () => {
    const records = {};
    history.forEach(session => {
      if (!session.exercises) return;
      Object.values(session.exercises).forEach(ex => {
        if (!ex.exerciseName) return;
        (ex.sets || []).filter(s => s.completed && (s.weight || 0) > 0).forEach(s => {
          if (!records[ex.exerciseName] || s.weight > records[ex.exerciseName].weight) {
            records[ex.exerciseName] = { weight: s.weight, reps: s.reps, date: session.startTime };
          }
        });
      });
    });
    return Object.entries(records)
      .sort(([, a], [, b]) => b.weight - a.weight)
      .slice(0, 6);
  };

  // Total volume lifted (lbs × reps across all sessions)
  const getTotalVolume = () => {
    let total = 0;
    history.forEach(session => {
      if (!session.exercises) return;
      Object.values(session.exercises).forEach(ex => {
        (ex.sets || []).filter(s => s.completed).forEach(s => {
          total += (s.weight || 0) * (s.reps || 0);
        });
      });
    });
    return total;
  };

  const formatVolume = (lbs) => {
    if (lbs >= 1000000) return `${(lbs / 1000000).toFixed(1)}M`;
    if (lbs >= 1000) return `${Math.round(lbs / 1000)}K`;
    return lbs.toLocaleString();
  };

  const handleLogWeight = async () => {
    const w = parseFloat(newWeight);
    if (!w || w <= 0) return;
    setSavingMetric(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const newRef = push(dbRef(db, `body-metrics/${user.uid}`));
      await set(newRef, { date: today, weight: w, unit: 'lbs', loggedAt: Date.now() });
      setNewWeight('');
      loadData();
    } catch (err) {
      console.error('Error logging weight:', err);
    } finally {
      setSavingMetric(false);
    }
  };

  const personalRecords = getPersonalRecords();
  const totalVolume = getTotalVolume();
  const recentWorkouts = history.slice(0, 8);
  const recentMetrics = metrics.slice(-8);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl animate-pulse h-28" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse h-24" />
          ))}
        </div>
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Profile header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xl truncate">{user.email}</div>
          <div className="text-emerald-100 text-sm mt-0.5">
            Member since {history.length > 0
              ? (() => {
                  const validTimes = history.map(h => h.startTime).filter(Boolean);
                  return validTimes.length > 0
                    ? new Date(Math.min(...validTimes)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                    : 'now';
                })()
              : 'now'}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Dumbbell className="w-6 h-6 text-emerald-500" />}
          value={stats?.totalWorkouts || 0}
          label="Workouts"
        />
        <StatCard
          icon={<Flame className="w-6 h-6 text-orange-500" />}
          value={stats?.currentStreak || 0}
          label="Day Streak"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
          value={formatVolume(totalVolume)}
          label="Total lbs"
        />
      </div>

      {/* Streak details */}
      {(stats?.currentStreak || 0) > 0 || history.length > 0 ? (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-4 border border-gray-200 dark:border-[#C6A45F]/25 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Flame className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 dark:text-[#d8e7de]">
              {stats?.currentStreak || 0} day{(stats?.currentStreak || 0) !== 1 ? 's' : ''} in a row
            </div>
            <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60">
              Best: {stats?.longestStreak || 0} days
            </div>
          </div>
          {stats?.lastWorkoutDate && (
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">Last workout</div>
              <div className="text-sm font-semibold text-gray-700 dark:text-[#d8e7de]/80">
                {new Date(stats.lastWorkoutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Personal records */}
      {personalRecords.length > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Personal Records</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#C6A45F]/10">
            {personalRecords.map(([name, record]) => (
              <div key={name} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm truncate">{name}</div>
                  <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                    {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-gray-900 dark:text-[#d8e7de]">{record.weight} lbs</div>
                  <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">× {record.reps} reps</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body weight log */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center gap-2">
          <Scale className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Body Weight</h3>
          {recentMetrics.length > 0 && (
            <span className="ml-auto text-sm font-bold text-gray-700 dark:text-[#d8e7de]/80">
              {recentMetrics[recentMetrics.length - 1].weight} lbs
            </span>
          )}
        </div>

        {recentMetrics.length >= 2 && (
          <div className="px-5 pt-4">
            <div className="flex items-end gap-1.5 h-14 mb-2">
              {recentMetrics.map((m, i) => {
                const maxW = Math.max(...recentMetrics.map(x => x.weight));
                const minW = Math.min(...recentMetrics.map(x => x.weight));
                const range = maxW - minW || 1;
                const pct = 30 + ((m.weight - minW) / range) * 70;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-blue-400 dark:bg-blue-500 rounded-sm" style={{ height: `${pct}%` }} />
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5 mb-4">
              {recentMetrics.map((m, i) => (
                <div key={i} className="flex-1 text-center">
                  <div className="text-xs font-bold text-gray-700 dark:text-[#d8e7de]/80">{m.weight}</div>
                  <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
                    {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-5 pb-5">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Today's weight (lbs)"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogWeight()}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] text-base"
              step="0.1"
              min="0"
            />
            <button
              onClick={handleLogWeight}
              disabled={savingMetric || !newWeight}
              className="px-5 py-3 bg-blue-500 text-white rounded-xl font-semibold active:bg-blue-600 disabled:opacity-50 min-h-[52px] flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Log
            </button>
          </div>
          {recentMetrics.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-2">
              Log your weight regularly to see your trend over time.
            </p>
          )}
        </div>
      </div>

      {/* Recent activity */}
      {recentWorkouts.length > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#C6A45F]/10">
            {recentWorkouts.map((session, i) => {
              const exerciseCount = session.exercises ? Object.values(session.exercises).length : 0;
              const durationMins = session.duration ? Math.round(session.duration / 60) : null;
              return (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm truncate">
                      {session.workoutName}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                      {exerciseCount} exercises{durationMins ? ` · ${durationMins} min` : ''}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-[#d8e7de]/50 flex-shrink-0 text-right">
                    {new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {history.length === 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-10 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <Award className="w-14 h-14 mx-auto text-gray-300 dark:text-[#d8e7de]/20 mb-4" />
          <h3 className="font-bold text-gray-800 dark:text-[#d8e7de] mb-2">No workouts yet</h3>
          <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60">
            Complete your first workout to start tracking your progress here.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-4 text-center border border-gray-200 dark:border-[#C6A45F]/25">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-[#d8e7de] leading-tight">{value}</div>
      <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">{label}</div>
    </div>
  );
}
