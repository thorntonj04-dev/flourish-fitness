import React, { useState, useEffect } from 'react';
import { ref as dbRef, get, set, push } from 'firebase/database';
import { db } from '../../firebase';
import { Flame, Dumbbell, Trophy, TrendingUp, TrendingDown, Scale, Plus, X, Share } from 'lucide-react';

const LEVELS = [
  { min: 0,   max: 4,        name: 'Rookie',   emoji: '🌱', color: 'from-slate-400 to-slate-500',      bar: 'bg-slate-400' },
  { min: 5,   max: 19,       name: 'Athlete',  emoji: '💪', color: 'from-blue-400 to-blue-600',        bar: 'bg-blue-400' },
  { min: 20,  max: 49,       name: 'Warrior',  emoji: '⚔️', color: 'from-emerald-400 to-teal-500',     bar: 'bg-emerald-400' },
  { min: 50,  max: 99,       name: 'Champion', emoji: '🏆', color: 'from-purple-400 to-violet-600',    bar: 'bg-purple-400' },
  { min: 100, max: Infinity, name: 'Legend',   emoji: '👑', color: 'from-yellow-400 to-orange-500',    bar: 'bg-yellow-400' },
];

function getLevel(n) { return LEVELS.find(l => n >= l.min && n <= l.max) || LEVELS[0]; }
function getLevelProgress(n) {
  const lvl = getLevel(n);
  const next = LEVELS.find(l => l.min > lvl.min);
  if (!next) return 100;
  return Math.min(100, Math.round(((n - lvl.min) / (next.min - lvl.min)) * 100));
}
function getNextLevelAt(n) {
  const lvl = getLevel(n);
  const next = LEVELS.find(l => l.min > lvl.min);
  return next ? next.min : null;
}

function getVolumeEquivalent(lbs) {
  if (lbs < 8000) return null;
  if (lbs < 80000) return { count: Math.round(lbs / 4000), thing: 'cars' };
  if (lbs < 400000) return { count: Math.round(lbs / 13000), thing: 'elephants' };
  return { count: Math.round(lbs / 30000), thing: 'school buses' };
}

export default function ClientProfile({ user }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newWeight, setNewWeight] = useState('');
  const [savingMetric, setSavingMetric] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(
    () => localStorage.getItem('pwa-banner-dismissed') !== 'true'
  );
  const [installExpanded, setInstallExpanded] = useState(false);

  const dismissInstallBanner = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true');
    setShowInstallBanner(false);
  };

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
    return Object.entries(records).sort(([, a], [, b]) => b.weight - a.weight).slice(0, 8);
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

  const build14DayCalendar = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sessionDates = new Set(history.map(h => new Date(h.startTime).toDateString()));
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (13 - i));
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        dayNum: d.getDate(),
        isToday: i === 13,
        hasWorkout: sessionDates.has(d.toDateString()),
      };
    });
  };

  const totalWorkouts = stats?.totalWorkouts || 0;
  const lvl = getLevel(totalWorkouts);
  const lvlProgress = getLevelProgress(totalWorkouts);
  const nextAt = getNextLevelAt(totalWorkouts);
  const personalRecords = getPersonalRecords();
  const totalVolume = getTotalVolume();
  const volEquiv = getVolumeEquivalent(totalVolume);
  const calendar = build14DayCalendar();
  const chartMetrics = metrics.slice(-10);
  const latestWeight = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const weightDelta = metrics.length > 1 ? metrics[metrics.length - 1].weight - metrics[0].weight : null;
  const displayName = user.displayName || user.email?.split('@')[0] || 'Athlete';
  const memberSince = (() => {
    const validTimes = history.map(h => h.startTime).filter(Boolean);
    return validTimes.length > 0
      ? new Date(Math.min(...validTimes)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : null;
  })();

  const streakMessage = () => {
    const s = stats?.currentStreak || 0;
    if (s >= 30) return "You're absolutely unstoppable. 🌟";
    if (s >= 14) return "Two weeks strong. Don't stop now. 🔥";
    if (s >= 7) return "A full week in a row. That's discipline.";
    if (s >= 3) return "You're building real momentum.";
    if (s === 1) return "Every legend started with day one.";
    return "Your next workout starts your streak.";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl animate-pulse h-52" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="rounded-2xl animate-pulse h-28 bg-gray-200 dark:bg-[#1E3328]" />)}
        </div>
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse h-36" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">

      {/* ── iOS Install banner ────────────────────────────── */}
      {showInstallBanner && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl overflow-hidden text-white shadow-lg">
          <button
            onClick={() => setInstallExpanded(p => !p)}
            className="w-full p-4 text-left active:opacity-80"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                📲
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">Add to your Home Screen</div>
                <div className="text-indigo-200 text-xs mt-0.5">
                  {installExpanded ? 'Tap anywhere to collapse' : 'Get the full app experience — tap to see how'}
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); dismissInstallBanner(); }}
                className="p-1.5 bg-white/15 rounded-lg flex-shrink-0 active:bg-white/25"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </button>

          {installExpanded && (
            <div className="px-4 pb-5 space-y-3">
              <div className="h-px bg-white/20" />
              <p className="text-sm text-indigo-100 font-medium">Follow these steps in Safari on your iPhone:</p>
              <div className="space-y-2.5">
                {[
                  { step: '1', text: 'Tap the Share button at the bottom of your browser', icon: '⬆️' },
                  { step: '2', text: 'Scroll down and tap "Add to Home Screen"', icon: '➕' },
                  { step: '3', text: 'Tap "Add" in the top-right corner', icon: '✓' },
                ].map(({ step, text, icon }) => (
                  <div key={step} className="flex items-start gap-3 bg-white/10 rounded-xl p-3">
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0">
                      {step}
                    </div>
                    <div className="flex-1 text-sm text-indigo-100 leading-snug">{icon} {text}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-indigo-300 text-center">The app will open full-screen with no browser chrome — just like a native app.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Hero card ─────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/5 rounded-full" />
        <div className="absolute -bottom-14 -left-6 w-40 h-40 bg-white/5 rounded-full" />

        {/* Name + level badge */}
        <div className="relative flex items-start gap-4 mb-5">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 border-2 border-white/30">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-0.5">Your Profile</div>
            <div className="text-2xl font-bold capitalize truncate">{displayName}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`bg-gradient-to-r ${lvl.color} text-white text-xs font-black px-2.5 py-1 rounded-full`}>
                {lvl.emoji} {lvl.name}
              </span>
              {memberSince && (
                <span className="text-emerald-200 text-xs">since {memberSince}</span>
              )}
            </div>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="relative mb-5">
          <div className="flex justify-between text-xs text-emerald-200 mb-1.5">
            <span>{totalWorkouts} workouts</span>
            <span>
              {nextAt ? `${nextAt - totalWorkouts} to ${LEVELS.find(l => l.min === nextAt)?.name}` : '🏆 Max level reached'}
            </span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${lvlProgress}%` }}
            />
          </div>
        </div>

        {/* 14-day calendar */}
        <div className="relative">
          <div className="text-xs text-emerald-200 font-semibold mb-2">Last 14 days</div>
          <div className="grid grid-cols-14 gap-0.5" style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: '3px' }}>
            {calendar.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className={`w-full aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition ${
                    day.hasWorkout
                      ? 'bg-white text-emerald-700'
                      : day.isToday
                      ? 'bg-white/30 text-white'
                      : 'bg-white/10 text-emerald-300/60'
                  }`}
                >
                  {day.hasWorkout ? '✓' : day.isToday ? '·' : ''}
                </div>
                <div className="text-[8px] text-emerald-300/60 font-medium">{day.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          gradient="from-emerald-400 to-emerald-600"
          top={<Dumbbell className="w-4 h-4 text-white/80" />}
          value={totalWorkouts}
          label="Workouts"
        />
        <StatCard
          gradient="from-orange-400 to-orange-600"
          top={<Flame className="w-4 h-4 text-white/80" />}
          value={stats?.currentStreak || 0}
          label="Day Streak"
          sub={stats?.longestStreak ? `Best ${stats.longestStreak}` : null}
        />
        <StatCard
          gradient="from-violet-400 to-violet-600"
          top={<TrendingUp className="w-4 h-4 text-white/80" />}
          value={formatVolume(totalVolume)}
          label="lbs Lifted"
          sub={volEquiv ? `≈ ${volEquiv.count} ${volEquiv.thing}` : null}
        />
      </div>

      {/* ── Streak motivational banner ────────────────────── */}
      {(stats?.currentStreak || 0) > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/15 rounded-2xl p-4 border border-orange-200/60 dark:border-orange-700/30 flex items-center gap-3">
          <div className="text-3xl leading-none">
            {(stats.currentStreak || 0) >= 7 ? '🔥' : '⚡'}
          </div>
          <div className="flex-1">
            <div className="font-bold text-orange-800 dark:text-orange-200 leading-tight">
              {stats.currentStreak} day{stats.currentStreak !== 1 ? 's' : ''} in a row
            </div>
            <div className="text-sm text-orange-600/80 dark:text-orange-300/70 mt-0.5">{streakMessage()}</div>
          </div>
        </div>
      )}

      {/* ── Personal Records ──────────────────────────────── */}
      {personalRecords.length > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Personal Records</h3>
            <span className="ml-auto text-xs text-gray-400 dark:text-[#d8e7de]/40">{personalRecords.length} lifts</span>
          </div>

          {/* Top 3 podium */}
          {personalRecords.length >= 1 && (
            <div className="p-4 grid grid-cols-3 gap-2 border-b border-gray-100 dark:border-[#C6A45F]/10">
              {/* Silver — 2nd */}
              {personalRecords[1] ? (
                <div className="flex flex-col items-center pt-3">
                  <div className="text-lg mb-1">🥈</div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-[#d8e7de]/50 font-semibold truncate w-full px-1">{personalRecords[1][0]}</div>
                    <div className="text-lg font-black text-gray-800 dark:text-[#d8e7de] mt-0.5">{personalRecords[1][1].weight}</div>
                    <div className="text-xs text-gray-400">lbs</div>
                  </div>
                </div>
              ) : <div />}

              {/* Gold — 1st */}
              <div className="flex flex-col items-center bg-gradient-to-b from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/15 rounded-2xl pt-2 pb-3 border border-yellow-200 dark:border-yellow-700/30">
                <div className="text-2xl mb-1">🥇</div>
                <div className="text-center px-2">
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide truncate w-full">{personalRecords[0][0]}</div>
                  <div className="text-2xl font-black text-gray-900 dark:text-[#d8e7de] mt-0.5 leading-none">{personalRecords[0][1].weight}</div>
                  <div className="text-xs text-amber-500 font-semibold mt-0.5">lbs</div>
                </div>
              </div>

              {/* Bronze — 3rd */}
              {personalRecords[2] ? (
                <div className="flex flex-col items-center pt-3">
                  <div className="text-lg mb-1">🥉</div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-[#d8e7de]/50 font-semibold truncate w-full px-1">{personalRecords[2][0]}</div>
                    <div className="text-lg font-black text-gray-800 dark:text-[#d8e7de] mt-0.5">{personalRecords[2][1].weight}</div>
                    <div className="text-xs text-gray-400">lbs</div>
                  </div>
                </div>
              ) : <div />}
            </div>
          )}

          {/* Remaining PRs */}
          {personalRecords.length > 3 && (
            <div className="divide-y divide-gray-50 dark:divide-[#C6A45F]/5">
              {personalRecords.slice(3).map(([name, record], i) => (
                <div key={name} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-sm text-gray-300 dark:text-[#d8e7de]/20 font-bold w-5 text-center">{i + 4}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-700 dark:text-[#d8e7de]/80 truncate">{name}</div>
                    <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                      {record.reps} reps · {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-base font-bold text-gray-800 dark:text-[#d8e7de] flex-shrink-0">
                    {record.weight} <span className="text-xs font-normal text-gray-400">lbs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Body weight tracker ───────────────────────────── */}
      <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
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
                  {weightDelta < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                  {Math.abs(weightDelta).toFixed(1)} lbs {weightDelta < 0 ? 'lost' : 'gained'}
                </div>
              )}
            </div>
          )}
        </div>

        {chartMetrics.length >= 2 && (
          <div className="px-5 pb-3">
            <WeightChart metrics={chartMetrics} />
          </div>
        )}

        {metrics.length > 0 && (
          <div className="border-t border-gray-100 dark:border-[#C6A45F]/10">
            {[...metrics].reverse().slice(0, 5).map((m, i, arr) => {
              const older = arr[i + 1];
              const delta = older != null ? m.weight - older.weight : null;
              return (
                <div key={m.id} className={`flex items-center gap-3 px-5 py-3 ${i < arr.length - 1 ? 'border-b border-gray-50 dark:border-[#C6A45F]/5' : ''}`}>
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
              step="0.1" min="0"
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

      {/* ── Empty state ───────────────────────────────────── */}
      {history.length === 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-10 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h3 className="font-bold text-gray-800 dark:text-[#d8e7de] mb-2">Your journey starts here</h3>
          <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60">
            Complete your first workout to unlock your stats and start building your fitness story.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ gradient, top, value, label, sub }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-center shadow-sm`}>
      <div className="flex justify-center mb-1.5 opacity-80">{top}</div>
      <div className="text-2xl font-black text-white leading-tight">{value}</div>
      <div className="text-xs text-white/70 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[10px] text-white/50 mt-1 leading-tight">{sub}</div>}
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
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3} fill={i === points.length - 1 ? '#2563eb' : '#3b82f6'} />
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
