import React, { useState, useEffect } from 'react';
import { Calendar, Dumbbell, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function WorkoutHistory({ user }) {
  const [sessions, setSessions] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sessions');

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
    return `${Math.floor(secs / 60)}m`;
  };

  const getExerciseList = (exercises) => {
    if (!exercises) return [];
    return Array.isArray(exercises) ? exercises : Object.values(exercises);
  };

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
    return Object.entries(exerciseMap)
      .filter(([, data]) => data.length >= 2)
      .sort(([, a], [, b]) => b[b.length - 1].date - a[a.length - 1].date)
      .slice(0, 10);
  };

  const formatVolume = (lbs) => {
    if (lbs >= 1000000) return `${(lbs / 1000000).toFixed(1)}M`;
    if (lbs >= 1000) return `${Math.round(lbs / 1000)}K`;
    return lbs.toLocaleString();
  };

  const totalVolumeAll = sessions.reduce((sum, session) => {
    const exList = getExerciseList(session.exercises);
    return sum + exList.reduce((s2, ex) =>
      s2 + (ex.sets || []).filter(s => s.completed).reduce((s3, s) => s3 + (s.weight || 0) * (s.reps || 0), 0), 0);
  }, 0);

  const durSessions = sessions.filter(s => s.duration);
  const avgDuration = durSessions.length > 0
    ? Math.round(durSessions.reduce((sum, s) => sum + s.duration, 0) / durSessions.length / 60)
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl animate-pulse h-40" />
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse h-14" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const progressData = buildProgressData();

  return (
    <div className="space-y-4 pb-6">

      {/* Hero header */}
      <div className="bg-gradient-to-br from-teal-500 via-emerald-500 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-44 h-44 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-teal-200" />
            <span className="text-teal-100 text-sm font-medium">All time</span>
          </div>
          <h2 className="text-2xl font-bold">Workout History</h2>
          <p className="text-teal-100 text-sm mt-0.5">
            {sessions.length} completed session{sessions.length !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            {avgDuration > 0 && (
              <div className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">
                ⏱ {avgDuration}m avg session
              </div>
            )}
            {totalVolumeAll > 0 && (
              <div className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">
                🏋️ {formatVolume(totalVolumeAll)} lbs total
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      {sessions.length > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-1.5 border border-gray-200 dark:border-[#C6A45F]/25 flex gap-1">
          <TabButton active={tab === 'sessions'} onClick={() => setTab('sessions')}>Sessions</TabButton>
          <TabButton active={tab === 'progress'} onClick={() => setTab('progress')}>Strength Progress</TabButton>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-10 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="font-bold text-gray-700 dark:text-[#d8e7de] mb-1">No sessions yet</p>
          <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">Complete your first workout to see it here.</p>
        </div>
      )}

      {/* Sessions tab */}
      {tab === 'sessions' && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map(session => {
            const isExpanded = expandedId === session.id;
            const exerciseList = getExerciseList(session.exercises);
            const totalSets = exerciseList.reduce((sum, ex) => sum + (ex.sets || []).length, 0);
            const doneSets = exerciseList.reduce((sum, ex) => sum + (ex.sets || []).filter(s => s.completed).length, 0);
            const duration = formatDuration(session.duration);
            const totalVolume = exerciseList.reduce((sum, ex) =>
              sum + (ex.sets || []).filter(s => s.completed).reduce((s2, s) => s2 + (s.weight || 0) * (s.reps || 0), 0), 0);

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
              <div key={session.id} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="w-full p-4 text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-gray-900 dark:text-[#d8e7de] leading-tight truncate">
                          {session.workoutName}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {session.difficulty && (
                            <span className="text-base leading-none">{ratingEmoji[session.difficulty]}</span>
                          )}
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-gray-400" />
                            : <ChevronRight className="w-4 h-4 text-gray-400" />
                          }
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-xs text-gray-400 dark:text-[#d8e7de]/50">{dateLabel}</span>
                        {duration && (
                          <>
                            <span className="text-gray-200 dark:text-[#d8e7de]/20">·</span>
                            <span className="text-xs text-gray-400 dark:text-[#d8e7de]/50">{duration}</span>
                          </>
                        )}
                        {totalVolume > 0 && (
                          <>
                            <span className="text-gray-200 dark:text-[#d8e7de]/20">·</span>
                            <span className="text-xs text-gray-400 dark:text-[#d8e7de]/50">{totalVolume.toLocaleString()} lbs</span>
                          </>
                        )}
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-[#0a0a0a]/40 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40 flex-shrink-0">
                          {doneSets}/{totalSets} sets
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-[#C6A45F]/10">
                    {exerciseList.map((exData, i) => {
                      const allSets = exData.sets || [];
                      const completedCount = allSets.filter(s => s.completed).length;
                      return (
                        <div
                          key={i}
                          className={`px-4 py-3.5 ${i < exerciseList.length - 1 ? 'border-b border-gray-50 dark:border-[#C6A45F]/5' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm">
                              {exData.exerciseName}
                            </div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                              {completedCount}/{allSets.length} sets
                            </div>
                          </div>
                          {allSets.length > 0 ? (
                            <div className="space-y-2">
                              {allSets.map((s, si) => (
                                <div
                                  key={si}
                                  className={`flex items-center gap-2.5 ${!s.completed ? 'opacity-35' : ''}`}
                                >
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${s.completed ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-[#0a0a0a]/30'}`}>
                                    {s.completed && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                  </div>
                                  <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40 w-9 flex-shrink-0">
                                    Set {si + 1}
                                  </span>
                                  <span className="text-sm font-semibold text-gray-700 dark:text-[#d8e7de]/80">
                                    {(s.weight || 0) > 0
                                      ? `${s.weight} lbs × ${s.reps} reps`
                                      : `${s.reps} reps`
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">No data recorded</div>
                          )}
                        </div>
                      );
                    })}
                    {session.note && (
                      <div className="mx-4 mb-4 mt-1 bg-amber-50 dark:bg-amber-900/15 rounded-xl px-4 py-3 border border-amber-100 dark:border-amber-700/20">
                        <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                          Session Note
                        </div>
                        <p className="text-sm text-gray-700 dark:text-[#d8e7de]/70 italic leading-relaxed">
                          {session.note}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Progress tab */}
      {tab === 'progress' && (
        <div className="space-y-3">
          {progressData.length === 0 ? (
            <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-8 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl mx-auto flex items-center justify-center mb-3">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="font-semibold text-gray-700 dark:text-[#d8e7de] mb-1">Building your data</p>
              <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">
                Do the same exercises at least twice to start seeing your strength progress here.
              </p>
            </div>
          ) : (
            progressData.map(([name, data]) => {
              const first = data[0].weight;
              const last = data[data.length - 1].weight;
              const diff = last - first;
              const recent = data.slice(-8);
              return (
                <div key={name} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
                  <div className="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 dark:text-[#d8e7de] truncate">{name}</div>
                      <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                        {data.length} sessions logged
                      </div>
                    </div>
                    <TrendBadge diff={diff} />
                  </div>
                  <div className="px-5 pb-3">
                    <StrengthChart data={recent} />
                  </div>
                  <div className="px-5 py-3 bg-gray-50 dark:bg-[#0a0a0a]/20 border-t border-gray-100 dark:border-[#C6A45F]/10 flex items-center">
                    <div className="text-center flex-shrink-0">
                      <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">Started</div>
                      <div className="font-bold text-gray-600 dark:text-[#d8e7de]/70 text-sm mt-0.5">{first} lbs</div>
                    </div>
                    <div className="flex-1 mx-4 h-px bg-gray-200 dark:bg-[#C6A45F]/15" />
                    <div className="text-center flex-shrink-0">
                      <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">Current</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{last} lbs</div>
                    </div>
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

function StrengthChart({ data }) {
  const W = 340, H = 80;
  const pad = { t: 10, r: 10, b: 8, l: 10 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 0.5;

  const toX = (i) => pad.l + (i / (data.length - 1)) * innerW;
  const toY = (w) => pad.t + ((maxW - w) / range) * innerH;

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.weight) }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M ${points[0].x},${H - pad.b} L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L ${points[points.length - 1].x},${H - pad.b} Z`;

  return (
    <div className="rounded-xl overflow-hidden bg-emerald-50 dark:bg-emerald-900/10 px-2 pt-2 pb-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sGrad)" />
        <polyline
          points={polyline}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 5 : 3}
            fill={i === points.length - 1 ? '#059669' : '#10b981'}
          />
        ))}
      </svg>
      <div className="flex justify-between px-1 pb-1">
        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
          {new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
          {new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>
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
