import React, { useState, useEffect } from 'react';
import { Calendar, Dumbbell, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Star, Zap } from 'lucide-react';
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
    const m = Math.floor(secs / 60);
    return m > 0 ? `${m}m` : `${secs}s`;
  };

  const formatVolume = (lbs) => {
    if (lbs >= 1000000) return `${(lbs / 1000000).toFixed(1)}M`;
    if (lbs >= 1000) return `${Math.round(lbs / 1000)}K`;
    return lbs.toLocaleString();
  };

  const getExerciseList = (exercises) => {
    if (!exercises) return [];
    return Array.isArray(exercises) ? exercises : Object.values(exercises);
  };

  const getSessionVolume = (session) => {
    const exList = getExerciseList(session.exercises);
    return exList.reduce((sum, ex) =>
      sum + (ex.sets || []).filter(s => s.completed).reduce((s2, s) => s2 + (s.weight || 0) * (s.reps || 0), 0), 0);
  };

  // Build set of session IDs where a new PR was set (beats a previous session)
  const buildPrSessions = () => {
    const sortedAsc = [...sessions].reverse();
    const best = {};
    const prIds = new Set();
    sortedAsc.forEach(session => {
      if (!session.exercises) return;
      let hasPR = false;
      Object.values(session.exercises).forEach(ex => {
        if (!ex.exerciseName) return;
        (ex.sets || []).filter(s => s.completed && (s.weight || 0) > 0).forEach(s => {
          const prev = best[ex.exerciseName] || 0;
          if (s.weight > prev) {
            if (prev > 0) hasPR = true;
            best[ex.exerciseName] = s.weight;
          }
        });
      });
      if (hasPR) prIds.add(session.id);
    });
    return prIds;
  };

  // Group sessions into time buckets
  const groupSessions = () => {
    if (sessions.length === 0) return [];
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const dow = now.getDay();
    const thisMonday = new Date(todayStart);
    thisMonday.setDate(todayStart.getDate() - (dow === 0 ? 6 : dow - 1));
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);

    const groups = [];
    const thisWeek = sessions.filter(s => new Date(s.startTime) >= thisMonday);
    const lastWeek = sessions.filter(s => { const d = new Date(s.startTime); return d >= lastMonday && d < thisMonday; });
    const older = sessions.filter(s => new Date(s.startTime) < lastMonday);

    if (thisWeek.length > 0) groups.push({ label: 'This Week', sessions: thisWeek });
    if (lastWeek.length > 0) groups.push({ label: 'Last Week', sessions: lastWeek });

    const byMonth = {};
    older.forEach(s => {
      const key = new Date(s.startTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!byMonth[key]) byMonth[key] = [];
      byMonth[key].push(s);
    });
    Object.entries(byMonth).forEach(([label, s]) => groups.push({ label, sessions: s }));
    return groups;
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
        exerciseMap[ex.exerciseName].push({ date: session.startTime, weight: maxWeight, reps: completedSets[0]?.reps || 0, sets: completedSets.length });
      });
    });
    return Object.entries(exerciseMap)
      .filter(([, data]) => data.length >= 2)
      .sort(([, a], [, b]) => b[b.length - 1].date - a[a.length - 1].date)
      .slice(0, 10);
  };

  const totalVolumeAll = sessions.reduce((sum, s) => sum + getSessionVolume(s), 0);
  const durSessions = sessions.filter(s => s.duration);
  const avgDuration = durSessions.length > 0
    ? Math.round(durSessions.reduce((sum, s) => sum + s.duration, 0) / durSessions.length / 60)
    : 0;

  // Best session by volume
  const bestSession = sessions.length > 0
    ? sessions.reduce((best, s) => getSessionVolume(s) > getSessionVolume(best) ? s : best, sessions[0])
    : null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl animate-pulse h-44" />
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse h-14" />
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const prIds = buildPrSessions();
  const progressData = buildProgressData();
  const groups = groupSessions();
  const ratingEmoji = { 1: '😅', 2: '🙂', 3: '💪', 4: '🔥', 5: '⚡' };

  return (
    <div className="space-y-4 pb-6">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-teal-600 via-emerald-500 to-teal-700 rounded-2xl p-6 text-white relative overflow-hidden">
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
              <div className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">⏱ {avgDuration}m avg</div>
            )}
            {totalVolumeAll > 0 && (
              <div className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">🏋️ {formatVolume(totalVolumeAll)} lbs total</div>
            )}
            {prIds.size > 0 && (
              <div className="bg-white/15 rounded-full px-3 py-1 text-xs font-semibold">⭐ {prIds.size} PR sessions</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab switcher ──────────────────────────────────── */}
      {sessions.length > 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-1.5 border border-gray-200 dark:border-[#C6A45F]/25 flex gap-1">
          <TabButton active={tab === 'sessions'} onClick={() => setTab('sessions')}>Sessions</TabButton>
          <TabButton active={tab === 'progress'} onClick={() => setTab('progress')}>Strength Progress</TabButton>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────── */}
      {sessions.length === 0 && (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-10 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <div className="text-5xl mb-4">💪</div>
          <p className="font-bold text-gray-700 dark:text-[#d8e7de] mb-1">No sessions yet</p>
          <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">Complete your first workout to see it here.</p>
        </div>
      )}

      {/* ── Sessions tab ──────────────────────────────────── */}
      {tab === 'sessions' && sessions.length > 0 && (
        <div className="space-y-5">
          {groups.map(({ label, sessions: groupSessions }) => (
            <div key={label}>
              {/* Week/month group header */}
              <div className="flex items-center gap-3 mb-2 px-1">
                <span className="text-xs font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-widest">{label}</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-[#C6A45F]/10" />
                <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40">{groupSessions.length}</span>
              </div>

              <div className="space-y-2">
                {groupSessions.map(session => {
                  const isExpanded = expandedId === session.id;
                  const exerciseList = getExerciseList(session.exercises);
                  const totalSets = exerciseList.reduce((sum, ex) => sum + (ex.sets || []).length, 0);
                  const doneSets = exerciseList.reduce((sum, ex) => sum + (ex.sets || []).filter(s => s.completed).length, 0);
                  const duration = formatDuration(session.duration);
                  const totalVolume = getSessionVolume(session);
                  const isPRSession = prIds.has(session.id);
                  const isBestSession = bestSession?.id === session.id && totalVolume > 0;

                  const date = new Date(session.startTime);
                  const todayStr = new Date().toDateString();
                  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
                  const dateLabel = date.toDateString() === todayStr
                    ? 'Today'
                    : date.toDateString() === yesterdayStr
                    ? 'Yesterday'
                    : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

                  // Top 3 exercises by volume for compact preview
                  const topExercises = exerciseList
                    .map(ex => ({
                      name: ex.exerciseName,
                      vol: (ex.sets || []).filter(s => s.completed).reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0),
                      maxWeight: Math.max(0, ...(ex.sets || []).filter(s => s.completed && s.weight).map(s => s.weight)),
                    }))
                    .filter(ex => ex.maxWeight > 0)
                    .sort((a, b) => b.maxWeight - a.maxWeight)
                    .slice(0, 3);

                  return (
                    <div key={session.id} className={`bg-white dark:bg-[#1E3328] rounded-2xl border-2 overflow-hidden transition ${
                      isPRSession ? 'border-yellow-300 dark:border-yellow-600/50' : 'border-gray-100 dark:border-[#C6A45F]/15'
                    }`}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : session.id)}
                        className="w-full p-4 text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isBestSession
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                              : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                          }`}>
                            {isBestSession
                              ? <span className="text-lg">🏆</span>
                              : <Dumbbell className="w-5 h-5 text-white" />
                            }
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Workout name + badges */}
                            <div className="flex items-start gap-2 flex-wrap">
                              <span className="font-bold text-gray-900 dark:text-[#d8e7de] leading-tight truncate">
                                {session.workoutName}
                              </span>
                              {isPRSession && (
                                <span className="flex items-center gap-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0">
                                  <Star className="w-2.5 h-2.5" /> PR
                                </span>
                              )}
                            </div>

                            {/* Date + duration + volume row */}
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-xs text-gray-400 dark:text-[#d8e7de]/50 font-medium">{dateLabel}</span>
                              {duration && (
                                <>
                                  <span className="text-gray-200 dark:text-[#d8e7de]/20">·</span>
                                  <span className="text-xs text-gray-400 dark:text-[#d8e7de]/50">{duration}</span>
                                </>
                              )}
                              {totalVolume > 0 && (
                                <>
                                  <span className="text-gray-200 dark:text-[#d8e7de]/20">·</span>
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatVolume(totalVolume)} lbs
                                  </span>
                                </>
                              )}
                              {session.difficultyRating && (
                                <>
                                  <span className="text-gray-200 dark:text-[#d8e7de]/20">·</span>
                                  <span className="text-xs">{ratingEmoji[session.difficultyRating]}</span>
                                </>
                              )}
                            </div>

                            {/* Top lifts preview */}
                            {topExercises.length > 0 && !isExpanded && (
                              <div className="flex gap-1.5 mt-2 flex-wrap">
                                {topExercises.map(ex => (
                                  <span key={ex.name} className="text-[10px] bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-500 dark:text-[#d8e7de]/50 px-2 py-0.5 rounded-full font-medium">
                                    {ex.name.split(' ').slice(0, 2).join(' ')} {ex.maxWeight}lbs
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Sets progress bar */}
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
                              {isExpanded
                                ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              }
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-[#C6A45F]/10">
                          {exerciseList.map((exData, i) => {
                            const allSets = exData.sets || [];
                            const completedSets = allSets.filter(s => s.completed);
                            const maxW = completedSets.length > 0 ? Math.max(...completedSets.map(s => s.weight || 0)) : 0;
                            return (
                              <div key={i} className={`px-4 py-3.5 ${i < exerciseList.length - 1 ? 'border-b border-gray-50 dark:border-[#C6A45F]/5' : ''}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-semibold text-gray-800 dark:text-[#d8e7de] text-sm">{exData.exerciseName}</div>
                                  <div className="flex items-center gap-2">
                                    {maxW > 0 && (
                                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{maxW} lbs max</span>
                                    )}
                                    <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40">{completedSets.length}/{allSets.length}</span>
                                  </div>
                                </div>
                                {/* Sets in compact pill row */}
                                {allSets.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5">
                                    {allSets.map((s, si) => (
                                      <div
                                        key={si}
                                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
                                          s.completed
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                            : 'bg-gray-100 dark:bg-[#0a0a0a]/30 text-gray-300 dark:text-[#d8e7de]/20'
                                        }`}
                                      >
                                        {(s.weight || 0) > 0 ? `${s.weight}×${s.reps}` : `${s.reps} reps`}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {session.note && (
                            <div className="mx-4 mb-4 mt-1 bg-amber-50 dark:bg-amber-900/15 rounded-xl px-4 py-3 border border-amber-100 dark:border-amber-700/20">
                              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">Session Note</div>
                              <p className="text-sm text-gray-700 dark:text-[#d8e7de]/70 italic leading-relaxed">{session.note}</p>
                            </div>
                          )}
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

      {/* ── Progress tab ──────────────────────────────────── */}
      {tab === 'progress' && (
        <div className="space-y-3">
          {progressData.length === 0 ? (
            <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-8 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
              <div className="text-5xl mb-3">📈</div>
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
              const pct = first > 0 ? Math.round(((last - first) / first) * 100) : 0;
              const recent = data.slice(-8);
              return (
                <div key={name} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
                  {/* Improvement banner */}
                  {diff !== 0 && (
                    <div className={`px-5 py-2.5 flex items-center gap-2 ${
                      diff > 0
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/20'
                        : 'bg-gray-50 dark:bg-[#0a0a0a]/20 border-b border-gray-100 dark:border-[#C6A45F]/10'
                    }`}>
                      {diff > 0 ? (
                        <>
                          <Zap className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            Up {diff} lbs
                          </span>
                          <span className="text-xs text-emerald-500 dark:text-emerald-400/80">
                            ({pct > 0 ? `+${pct}%` : ''} since first session)
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-semibold text-gray-500 dark:text-[#d8e7de]/60">Holding steady</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="px-5 pt-4 pb-2 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 dark:text-[#d8e7de] truncate">{name}</div>
                      <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">{data.length} sessions logged</div>
                    </div>
                    <TrendBadge diff={diff} />
                  </div>

                  <div className="px-5 pb-3">
                    <StrengthChart data={recent} />
                  </div>

                  <div className="px-5 py-3 bg-gray-50 dark:bg-[#0a0a0a]/20 border-t border-gray-100 dark:border-[#C6A45F]/10 flex items-center">
                    <div className="text-center flex-shrink-0">
                      <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">Started</div>
                      <div className="font-bold text-gray-500 dark:text-[#d8e7de]/60 text-sm mt-0.5">{first} lbs</div>
                    </div>
                    <div className="flex-1 mx-4 relative">
                      <div className="h-px bg-gray-200 dark:bg-[#C6A45F]/15" />
                      {diff !== 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            diff > 0
                              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-500 dark:text-[#d8e7de]/50'
                          }`}>
                            {diff > 0 ? `+${diff}` : diff} lbs
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40">Now</div>
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
  const W = 340, H = 100;
  const pad = { t: 12, r: 12, b: 10, l: 12 };
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
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sGrad)" />
        <polyline points={polyline} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 5 : 3} fill={i === points.length - 1 ? '#059669' : '#10b981'} />
        ))}
        {/* Weight labels at first and last */}
        <text x={points[0].x} y={points[0].y - 6} textAnchor="middle" fontSize="9" fill="#6b7280">{data[0].weight}</text>
        <text x={points[points.length-1].x} y={points[points.length-1].y - 6} textAnchor="middle" fontSize="9" fill="#059669" fontWeight="700">{data[data.length-1].weight}</text>
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
      <TrendingUp className="w-3.5 h-3.5" /> +{diff} lbs
    </div>
  );
  if (diff < 0) return (
    <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-xl text-xs font-bold flex-shrink-0">
      <TrendingDown className="w-3.5 h-3.5" /> {diff} lbs
    </div>
  );
  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-500 dark:text-[#d8e7de]/50 px-2.5 py-1 rounded-xl text-xs font-bold flex-shrink-0">
      <Minus className="w-3.5 h-3.5" /> Steady
    </div>
  );
}
