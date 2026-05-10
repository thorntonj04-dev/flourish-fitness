import React, { useState, useEffect } from 'react';
import { ref as dbRef, get, set, push } from 'firebase/database';
import { db } from '../../firebase';
import { Flame, Dumbbell, Trophy, TrendingUp, TrendingDown, Calendar, Award, Scale, Plus } from 'lucide-react';

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
  const recentWorkouts = history.slice(0, 6);

  const displayName = user.displayName || user.email?.split('@')[0] || 'Athlete';
  const memberSince = (() => {
    const validTimes = history.map(h => h.startTime).filter(Boolean);
    return validTimes.length > 0
      ? new Date(Math.min(...validTimes)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : null;
  })();

  const chartMetrics = metrics.slice(-10);
  const latestWeight = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const weightDelta = metrics.length > 1 ? metrics[metrics.length - 1].weight - metrics[0].weight : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl animate-pulse h-44" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-2xl animate-pulse h-28 bg-gray-200 dark:bg-[#1E3328]" />)}
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">

      {/* Hero header */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-44 h-44 bg-white/5 rounded-full" />
        <div className="absolute -bottom-12 -left-4 w-36 h-36 bg-white/5 rounded-full" />
        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0 border-2 border-white/30">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">Your Profile</div>
            <div className="text-2xl font-bold capitalize truncate">{displayName}</div>
            {memberSince && (
              <div className="text-emerald-100 text-sm mt-0.5">Training since {memberSince}</div>
            )}
          </div>
        </div>
        <div className="relative flex gap-2 mt-4 flex-wrap">
          <div className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">
            {stats?.totalWorkouts || 0} workouts
          </div>
          {(stats?.currentStreak || 0) > 0 && (
            <div className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">
              🔥 {stats.currentStreak} day streak
            </div>
          )}
          {totalVolume > 0 && (
            <div className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">
              {formatVolume(totalVolume)} lbs lifted
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          gradient="from-emerald-400 to-emerald-600"
          icon={<Dumbbell className="w-5 h-5 text-white" />}
          value={stats?.totalWorkouts || 0}
          label="Workouts"
        />
        <StatCard
          gradient="from-orange-400 to-orange-600"
          icon={<Flame className="w-5 h-5 text-white" />}
          value={stats?.currentStreak || 0}
          label="Day Streak"
        />
        <StatCard
          gradient="from-violet-400 to-violet-600"
          icon={<TrendingUp className="w-5 h-5 text-white" />}
          value={formatVolume(totalVolume)}
          label="lbs Lifted"
        />
      </div>

      {/* Streak highlight */}
      {(stats?.currentStreak || 0) > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/15 rounded-2xl p-4 border border-orange-200 dark:border-orange-700/30 flex items-center gap-3">
          <div className="text-4xl leading-none">🔥</div>
          <div className="flex-1">
            <div className="font-bold text-orange-800 dark:text-orange-300 text-lg leading-tight">
              {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''} in a row!
            </div>
            <div className="text-sm text-orange-600/80 dark:text-orange-400/70 mt-0.5">
              Best: {stats?.longestStreak || 0} days
            </div>
          </div>
          {stats?.lastWorkoutDate && (
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-orange-400 dark:text-orange-500">Last session</div>
              <div className="text-sm font-bold text-orange-700 dark:text-orange-300 mt-0.5">
                {new Date(stats.lastWorkoutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Body weight — full redesign */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">

        {/* Card header */}
        <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="font-bold text-gray-900 dark:text-[#d8e7de]">Body Weight</div>
              <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
                {metrics.length} {metrics.length === 1 ? 'entry' : 'entries'} logged
              </div>
            </div>
          </div>
          {latestWeight && (
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-[#d8e7de] leading-tight">
                {latestWeight.weight}
                <span className="text-sm font-normal text-gray-400 ml-1">lbs</span>
              </div>
              {weightDelta !== null && Math.abs(weightDelta) >= 0.1 && (
                <div className={`text-xs font-semibold flex items-center justify-end gap-0.5 mt-0.5 ${weightDelta < 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {weightDelta < 0
                    ? <TrendingDown className="w-3 h-3" />
                    : <TrendingUp className="w-3 h-3" />
                  }
                  {Math.abs(weightDelta).toFixed(1)} lbs {weightDelta < 0 ? 'lost' : 'gained'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SVG line chart */}
        {chartMetrics.length >= 2 && (
          <div className="px-5 pb-3">
            <WeightChart metrics={chartMetrics} />
          </div>
        )}

        {/* Entry list — newest first, last 5 */}
        {metrics.length > 0 && (
          <div className="border-t border-gray-100 dark:border-[#C6A45F]/10">
            {[...metrics].reverse().slice(0, 5).map((m, i, arr) => {
              const older = arr[i + 1];
              const delta = older != null ? m.weight - older.weight : null;
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 px-5 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50 dark:border-[#C6A45F]/5' : ''}`}
                >
                  <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60 flex-1">
                    {new Date(m.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="font-bold text-gray-900 dark:text-[#d8e7de]">{m.weight} lbs</div>
                  <div className={`text-xs font-semibold w-14 text-right ${delta == null ? 'text-gray-300' : delta < 0 ? 'text-emerald-500' : delta > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                    {delta == null ? '—' : delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Log input */}
        <div className="px-5 py-4 bg-gray-50 dark:bg-[#0a0a0a]/30 border-t border-gray-100 dark:border-[#C6A45F]/10">
          {metrics.length === 0 && (
            <p className="text-xs text-center text-gray-400 dark:text-[#d8e7de]/40 mb-3">
              Start logging your weight to see your trend over time.
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Today's weight (lbs)"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogWeight()}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] dark:placeholder-[#d8e7de]/30 text-base"
              step="0.1"
              min="0"
            />
            <button
              onClick={handleLogWeight}
              disabled={savingMetric || !newWeight}
              className="px-5 py-3 bg-blue-500 text-white rounded-xl font-semibold active:bg-blue-600 disabled:opacity-50 min-h-[52px] flex items-center gap-1.5 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Log
            </button>
          </div>
        </div>
      </div>

      {/* Personal records */}
      {personalRecords.length > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Personal Records</h3>
            <span className="ml-auto text-xs text-gray-400 dark:text-[#d8e7de]/40">{personalRecords.length} lifts</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {personalRecords.map(([name, record]) => (
              <div
                key={name}
                className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/15 dark:to-amber-900/10 rounded-xl p-3 border border-yellow-100 dark:border-yellow-700/20"
              >
                <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide mb-1.5 truncate">
                  {name}
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-[#d8e7de]">
                  {record.weight}
                  <span className="text-xs font-normal text-gray-400 ml-1">lbs</span>
                </div>
                <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-1">
                  {record.reps} reps · {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent workouts */}
      {recentWorkouts.length > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Recent Workouts</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-[#C6A45F]/5">
            {recentWorkouts.map((session, i) => {
              const exerciseCount = session.exercises ? Object.values(session.exercises).length : 0;
              const durationMins = session.duration ? Math.round(session.duration / 60) : null;
              const date = new Date(session.startTime);
              const todayStr = new Date().toDateString();
              const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
              const dateLabel = date.toDateString() === todayStr
                ? 'Today'
                : date.toDateString() === yesterdayStr
                ? 'Yesterday'
                : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              const ratingEmoji = { 1: '😴', 2: '😐', 3: '💪', 4: '🔥', 5: '⚡' };
              return (
                <div key={i} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm truncate">
                      {session.workoutName}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                      {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}{durationMins ? ` · ${durationMins} min` : ''}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {session.difficulty && (
                      <div className="text-base leading-none">{ratingEmoji[session.difficulty]}</div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-1">{dateLabel}</div>
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
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Award className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-[#d8e7de] mb-2">Your journey starts here</h3>
          <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60">
            Complete your first workout to start building your fitness story.
          </p>
        </div>
      )}
    </div>
  );
}

function WeightChart({ metrics }) {
  const W = 340, H = 90;
  const pad = { t: 12, r: 10, b: 8, l: 10 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const weights = metrics.map(m => m.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 0.5;

  const toX = (i) => pad.l + (i / (metrics.length - 1)) * innerW;
  const toY = (w) => pad.t + ((maxW - w) / range) * innerH;

  const points = metrics.map((m, i) => ({ x: toX(i), y: toY(m.weight) }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M ${points[0].x},${H - pad.b} L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${H - pad.b} Z`;

  return (
    <div className="rounded-xl overflow-hidden bg-blue-50 dark:bg-blue-900/10 px-2 pt-2 pb-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }}>
        <defs>
          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#wGrad)" />
        <polyline points={polyline} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 5 : 3}
            fill={i === points.length - 1 ? '#2563eb' : '#3b82f6'}
          />
        ))}
      </svg>
      <div className="flex justify-between px-1 pb-1">
        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
          {new Date(metrics[0].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
          {new Date(metrics[metrics.length - 1].date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ gradient, icon, value, label }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-center shadow-sm`}>
      <div className="flex justify-center mb-2 opacity-90">{icon}</div>
      <div className="text-2xl font-bold text-white leading-tight">{value}</div>
      <div className="text-xs text-white/75 mt-0.5">{label}</div>
    </div>
  );
}
