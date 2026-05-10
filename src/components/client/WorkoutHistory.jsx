import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Dumbbell, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function WorkoutHistory({ user }) {
  const [sessions, setSessions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sessions'); // 'sessions' | 'progress'

  useEffect(() => { loadHistory(); }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const snap = await get(dbRef(db, `workout-history/${user.uid}`));
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, s]) => ({ id, ...s }))
          .filter(s => s.completed)
          .sort((a, b) => b.startTime - a.startTime);
        setSessions(list);
      }
    } catch (err) {
      console.error('Error loading workout history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return null;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  const formatDate = (ts) =>
    new Date(ts).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const getExerciseList = (exercises) => (exercises ? Object.values(exercises) : []);

  // Build per-exercise progression data from all sessions
  const buildProgressData = () => {
    const exerciseMap = {};
    [...sessions].reverse().forEach(session => {
      if (!session.exercises) return;
      Object.values(session.exercises).forEach(ex => {
        if (!ex.exerciseName) return;
        const completedSets = (ex.sets || []).filter(s => s.completed && (s.weight || 0) > 0);
        if (completedSets.length === 0) return;
        const maxWeight = Math.max(...completedSets.map(s => s.weight));
        if (!exerciseMap[ex.exerciseName]) exerciseMap[ex.exerciseName] = [];
        exerciseMap[ex.exerciseName].push({
          date: session.startTime,
          weight: maxWeight,
          reps: completedSets[0]?.reps || 0,
          sets: completedSets.length,
        });
      });
    });
    // Return exercises with 2+ data points, sorted by most recent
    return Object.entries(exerciseMap)
      .filter(([, data]) => data.length >= 2)
      .sort(([, a], [, b]) => b[b.length - 1].date - a[a.length - 1].date)
      .slice(0, 10);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 animate-pulse h-20" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl p-4 border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const progressData = buildProgressData();

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
        <h2 className="text-xl font-bold">Workout History</h2>
        <p className="text-emerald-100 text-sm mt-1">
          {sessions.length} completed session{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Tab switcher */}
      {sessions.length > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-1.5 border border-gray-200 dark:border-[#C6A45F]/25 flex gap-1">
          <TabButton active={tab === 'sessions'} onClick={() => setTab('sessions')}>Sessions</TabButton>
          <TabButton active={tab === 'progress'} onClick={() => setTab('progress')}>
            Strength Progress
          </TabButton>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-10 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <Dumbbell className="w-14 h-14 text-gray-300 dark:text-[#d8e7de]/20 mx-auto mb-4" />
          <p className="font-semibold text-gray-600 dark:text-[#d8e7de]/70 mb-1">No workouts yet</p>
          <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">Complete your first workout to see it here.</p>
        </div>
      )}

      {/* ── Sessions tab ─────────────────────────────────────────── */}
      {tab === 'sessions' && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map(session => {
            const isExpanded = expandedId === session.id;
            const exerciseList = getExerciseList(session.exercises);
            const totalSets = exerciseList.reduce((sum, ex) => sum + (ex.sets || []).length, 0);
            const doneSets = exerciseList.reduce((sum, ex) => sum + (ex.sets || []).filter(s => s.completed).length, 0);
            const duration = formatDuration(session.duration);
            const totalVolume = exerciseList.reduce((sum, ex) =>
              sum + (ex.sets || []).filter(s => s.completed).reduce((s2, s) => s2 + (s.weight || 0) * (s.reps || 0), 0), 0
            );

            return (
              <div key={session.id} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="w-full p-4 text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 dark:text-[#d8e7de] truncate">{session.workoutName}</div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-[#d8e7de]/50">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(session.startTime)}
                        </span>
                        {duration && (
                          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-[#d8e7de]/50">
                            <Clock className="w-3.5 h-3.5" />
                            {duration}
                          </span>
                        )}
                        {totalVolume > 0 && (
                          <span className="text-xs text-gray-400 dark:text-[#d8e7de]/50">
                            {totalVolume.toLocaleString()} lbs total
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {isExpanded
                        ? <ChevronDown className="w-5 h-5 text-gray-400" />
                        : <ChevronRight className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                  </div>

                  {/* Thin progress bar */}
                  <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1">
                    <div
                      className="h-1 rounded-full bg-emerald-500"
                      style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-1">
                    {exerciseList.length} exercises · {doneSets}/{totalSets} sets
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-[#C6A45F]/10 bg-gray-50 dark:bg-[#0a0a0a]/30 divide-y divide-gray-100 dark:divide-[#C6A45F]/10">
                    {exerciseList.map((exData, i) => {
                      const completedSets = (exData.sets || []).filter(s => s.completed);
                      const allSets = exData.sets || [];
                      return (
                        <div key={i} className="p-4">
                          <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm mb-2">
                            {exData.exerciseName}
                          </div>
                          {allSets.length > 0 ? (
                            <div className="space-y-1">
                              {allSets.map((s, si) => (
                                <div key={si} className={`flex items-center gap-3 text-sm ${s.completed ? '' : 'opacity-40'}`}>
                                  <span className="w-12 text-xs text-gray-400 dark:text-[#d8e7de]/40">Set {si + 1}</span>
                                  {(s.weight || 0) > 0
                                    ? <span className="font-semibold text-gray-700 dark:text-[#d8e7de]/80">{s.weight} lbs × {s.reps} reps</span>
                                    : <span className="text-gray-500 dark:text-[#d8e7de]/60">{s.reps} reps</span>
                                  }
                                  {s.completed && <span className="text-emerald-500 text-xs ml-auto">✓</span>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">No set data recorded</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Progress tab ──────────────────────────────────────────── */}
      {tab === 'progress' && (
        <div className="space-y-3">
          {progressData.length === 0 ? (
            <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-8 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-300 dark:text-[#d8e7de]/20 mb-3" />
              <p className="text-gray-500 dark:text-[#d8e7de]/60">
                Complete the same workout at least twice to see your progress here.
              </p>
            </div>
          ) : (
            progressData.map(([name, data]) => {
              const first = data[0].weight;
              const last = data[data.length - 1].weight;
              const diff = last - first;
              const recent = data.slice(-5);
              return (
                <div key={name} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 dark:text-[#d8e7de] truncate">{name}</div>
                      <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                        {data.length} sessions logged
                      </div>
                    </div>
                    <TrendBadge diff={diff} />
                  </div>

                  {/* Weight progression dots */}
                  <div className="flex items-end gap-1.5 h-12 mb-2">
                    {recent.map((point, i) => {
                      const maxW = Math.max(...recent.map(p => p.weight));
                      const minW = Math.min(...recent.map(p => p.weight));
                      const range = maxW - minW || 1;
                      const heightPct = 30 + ((point.weight - minW) / range) * 70;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-emerald-400 dark:bg-emerald-500 rounded-sm"
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Labels under bars */}
                  <div className="flex items-center gap-1.5">
                    {recent.map((point, i) => (
                      <div key={i} className="flex-1 text-center">
                        <div className="text-xs font-bold text-gray-700 dark:text-[#d8e7de]/80">{point.weight}</div>
                        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                          {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition min-h-[44px] ${
        active
          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm'
          : 'text-gray-600 dark:text-[#d8e7de]/70'
      }`}
    >
      {children}
    </button>
  );
}

function TrendBadge({ diff }) {
  if (diff > 0) return (
    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-xl text-xs font-bold flex-shrink-0">
      <TrendingUp className="w-3.5 h-3.5" />
      +{diff} lbs
    </div>
  );
  if (diff < 0) return (
    <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-xl text-xs font-bold flex-shrink-0">
      <TrendingDown className="w-3.5 h-3.5" />
      {diff} lbs
    </div>
  );
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-500 dark:text-[#d8e7de]/50 px-2.5 py-1 rounded-xl text-xs font-bold flex-shrink-0">
      <Minus className="w-3.5 h-3.5" />
      Steady
    </div>
  );
}
