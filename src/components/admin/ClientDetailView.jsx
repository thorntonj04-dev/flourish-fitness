import React, { useState, useEffect } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';
import {
  ChevronLeft, Trophy, TrendingUp, TrendingDown, Minus, Dumbbell,
  Flame, Calendar, MessageSquare, Scale,
} from 'lucide-react';
import ProgramDashboard from '../client/ProgramDashboard';

export default function ClientDetailView({ client, onBack }) {
  const [tab, setTab] = useState('program');
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [client]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsSnap, historySnap, metricsSnap] = await Promise.all([
        get(dbRef(db, `user-stats/${client.id}`)),
        get(dbRef(db, `workout-history/${client.id}`)),
        get(dbRef(db, `body-metrics/${client.id}`)),
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
      console.error('Error loading client data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPersonalRecords = () => {
    const records = {};
    history.forEach(session => {
      if (!session.exercises) return;
      const exList = Array.isArray(session.exercises) ? session.exercises : Object.values(session.exercises);
      exList.forEach(ex => {
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
      const exList = Array.isArray(session.exercises) ? session.exercises : Object.values(session.exercises);
      exList.forEach(ex => {
        (ex.sets || []).filter(s => s.completed).forEach(s => {
          total += (s.weight || 0) * (s.reps || 0);
        });
      });
    });
    return total;
  };

  const buildProgressData = () => {
    const exerciseMap = {};
    [...history].reverse().forEach(session => {
      if (!session.exercises) return;
      const exList = Array.isArray(session.exercises) ? session.exercises : Object.values(session.exercises);
      exList.forEach(ex => {
        if (!ex.exerciseName) return;
        const doneSets = (ex.sets || []).filter(s => s.completed && (s.weight || 0) > 0);
        if (!doneSets.length) return;
        const maxW = Math.max(...doneSets.map(s => s.weight));
        if (!exerciseMap[ex.exerciseName]) exerciseMap[ex.exerciseName] = [];
        exerciseMap[ex.exerciseName].push({ date: session.startTime, weight: maxW });
      });
    });
    return Object.entries(exerciseMap)
      .filter(([, data]) => data.length >= 2)
      .sort(([, a], [, b]) => b[b.length - 1].date - a[a.length - 1].date)
      .slice(0, 6);
  };

  const formatVolume = (lbs) => {
    if (lbs >= 1000000) return `${(lbs / 1000000).toFixed(1)}M`;
    if (lbs >= 1000) return `${Math.round(lbs / 1000)}K`;
    return lbs.toLocaleString();
  };

  const formatDuration = (secs) => {
    if (!secs) return null;
    return `${Math.floor(secs / 60)}m`;
  };

  const personalRecords = getPersonalRecords();
  const progressData = buildProgressData();
  const recentMetrics = metrics.slice(-8);

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-2.5 rounded-xl bg-white/20 active:bg-white/30 text-white min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {(client.name || client.email || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white truncate">{client.name || client.email}</div>
          <div className="text-violet-200 text-xs truncate">{client.email}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#1E3328] border-b border-gray-200 dark:border-[#C6A45F]/25 flex flex-shrink-0">
        {[
          { id: 'program', label: 'Program' },
          { id: 'progress', label: 'Progress' },
          { id: 'history', label: 'History' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition min-h-[48px] ${
              tab === t.id
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 dark:text-[#d8e7de]/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Program tab ── */}
        {tab === 'program' && (
          <div className="p-4">
            <ProgramDashboard
              user={{ uid: client.id }}
              onStartWorkout={() => {}}
              readOnly={true}
            />
          </div>
        )}

        {/* ── Progress tab ── */}
        {tab === 'progress' && (
          <div className="p-4 space-y-4 pb-8">
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <>
                {/* Stat chips */}
                <div className="grid grid-cols-3 gap-3">
                  <StatChip icon={<Dumbbell className="w-5 h-5 text-emerald-500" />} value={stats?.totalWorkouts || 0} label="Workouts" />
                  <StatChip icon={<Flame className="w-5 h-5 text-orange-500" />} value={stats?.currentStreak || 0} label="Streak" />
                  <StatChip icon={<TrendingUp className="w-5 h-5 text-blue-500" />} value={formatVolume(getTotalVolume())} label="Total lbs" />
                </div>

                {/* Last workout + best streak */}
                {(stats?.lastWorkoutDate || stats?.longestStreak) && (
                  <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-4 border border-gray-200 dark:border-[#C6A45F]/25 flex items-center gap-4">
                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-800 dark:text-[#d8e7de]">Last Workout</div>
                      <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
                        {stats?.lastWorkoutDate
                          ? new Date(stats.lastWorkoutDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                          : 'Never'}
                      </div>
                    </div>
                    {stats?.longestStreak > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-800 dark:text-[#d8e7de]">Best Streak</div>
                        <div className="text-xs text-gray-400">{stats.longestStreak} days</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Personal records */}
                {personalRecords.length > 0 ? (
                  <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-[#C6A45F]/15 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="font-bold text-gray-900 dark:text-[#d8e7de] text-sm">Personal Records</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-[#C6A45F]/10">
                      {personalRecords.map(([name, record]) => (
                        <div key={name} className="px-4 py-3 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm truncate">{name}</div>
                            <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
                              {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-gray-900 dark:text-[#d8e7de] text-sm">{record.weight} lbs</div>
                            <div className="text-xs text-gray-400">× {record.reps} reps</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyCard icon={<Trophy className="w-8 h-8" />} text="No weighted exercises logged yet." />
                )}

                {/* Strength progress */}
                {progressData.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wide px-1">Strength Progress</div>
                    {progressData.map(([name, data]) => {
                      const first = data[0].weight;
                      const last = data[data.length - 1].weight;
                      const diff = last - first;
                      const recent = data.slice(-5);
                      return (
                        <div key={name} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 dark:text-[#d8e7de] truncate text-sm">{name}</div>
                              <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">{data.length} sessions</div>
                            </div>
                            <TrendBadge diff={diff} />
                          </div>
                          <div className="flex items-end gap-1.5 h-10 mb-2">
                            {recent.map((point, i) => {
                              const maxW = Math.max(...recent.map(p => p.weight));
                              const minW = Math.min(...recent.map(p => p.weight));
                              const range = maxW - minW || 1;
                              const pct = 30 + ((point.weight - minW) / range) * 70;
                              return (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                  <div className="w-full bg-emerald-400 dark:bg-emerald-500 rounded-sm" style={{ height: `${pct}%` }} />
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex gap-1.5">
                            {recent.map((point, i) => (
                              <div key={i} className="flex-1 text-center">
                                <div className="text-xs font-bold text-gray-700 dark:text-[#d8e7de]/80">{point.weight}</div>
                                <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
                                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Body weight chart */}
                {recentMetrics.length > 0 && (
                  <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Scale className="w-4 h-4 text-blue-500" />
                      <span className="font-bold text-gray-900 dark:text-[#d8e7de] text-sm">Body Weight</span>
                      <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40 ml-auto">
                        Latest: {recentMetrics[recentMetrics.length - 1].weight} lbs
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5 h-12 mb-2">
                      {recentMetrics.map((m, i) => {
                        const maxW = Math.max(...recentMetrics.map(x => x.weight));
                        const minW = Math.min(...recentMetrics.map(x => x.weight));
                        const range = maxW - minW || 1;
                        const pct = 30 + ((m.weight - minW) / range) * 70;
                        return (
                          <div key={i} className="flex-1">
                            <div className="w-full bg-blue-400 dark:bg-blue-500 rounded-sm" style={{ height: `${pct}%` }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5">
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
              </>
            )}
          </div>
        )}

        {/* ── History tab ── */}
        {tab === 'history' && (
          <div className="p-4 space-y-3 pb-8">
            {loading ? (
              <LoadingSkeleton />
            ) : history.length === 0 ? (
              <EmptyCard icon={<Dumbbell className="w-8 h-8" />} text="No completed sessions yet." />
            ) : (
              history.slice(0, 20).map((session, i) => {
                const exList = session.exercises
                  ? (Array.isArray(session.exercises) ? session.exercises : Object.values(session.exercises))
                  : [];
                const doneSets = exList.reduce((sum, ex) => sum + (ex.sets || []).filter(s => s.completed).length, 0);
                const duration = formatDuration(session.duration);
                return (
                  <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 dark:text-[#d8e7de] truncate text-sm">{session.workoutName}</div>
                        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5 flex flex-wrap gap-2">
                          <span>{new Date(session.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          {duration && <span>· {duration}</span>}
                          <span>· {doneSets} sets done</span>
                        </div>
                        {session.note && (
                          <div className="mt-2 flex items-start gap-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl px-3 py-2">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-700 dark:text-blue-300 italic leading-snug">{session.note}</p>
                          </div>
                        )}
                      </div>
                      {session.difficultyRating && (
                        <span className="text-2xl flex-shrink-0">
                          {['😅', '🙂', '😊', '💪', '🔥'][session.difficultyRating - 1] || ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatChip({ icon, value, label }) {
  return (
    <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-3 text-center border border-gray-200 dark:border-[#C6A45F]/25">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-xl font-bold text-gray-900 dark:text-[#d8e7de]">{value}</div>
      <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60">{label}</div>
    </div>
  );
}

function TrendBadge({ diff }) {
  if (diff > 0) return (
    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-xl text-xs font-bold flex-shrink-0">
      <TrendingUp className="w-3.5 h-3.5" />+{diff} lbs
    </div>
  );
  if (diff < 0) return (
    <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-xl text-xs font-bold flex-shrink-0">
      <TrendingDown className="w-3.5 h-3.5" />{diff} lbs
    </div>
  );
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-500 dark:text-[#d8e7de]/50 px-2.5 py-1 rounded-xl text-xs font-bold flex-shrink-0">
      <Minus className="w-3.5 h-3.5" />Steady
    </div>
  );
}

function EmptyCard({ icon, text }) {
  return (
    <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-8 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
      <div className="flex justify-center mb-3 text-gray-300 dark:text-[#d8e7de]/20">{icon}</div>
      <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60">{text}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl h-20 animate-pulse border border-gray-200 dark:border-[#C6A45F]/25" />
      ))}
    </div>
  );
}
