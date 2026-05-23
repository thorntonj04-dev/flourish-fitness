import React, { useState, useEffect } from 'react';
import { Check, X, Trophy, Clock, Plus, Minus, Play, Settings, Timer } from 'lucide-react';
import { ref as dbRef, get, set, push, update } from 'firebase/database';
import { db } from '../../firebase';
import WorkoutComplete from './WorkoutComplete';
import RestTimerOverlay from './RestTimerOverlay';

export default function FormWorkoutSession({ workout, userId, onExit, previewMode = false }) {
  const [exercises, setExercises] = useState([]);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [slideClass, setSlideClass] = useState('');
  const [sessionData, setSessionData] = useState({});
  const [lastWorkoutData, setLastWorkoutData] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [restTimer, setRestTimer] = useState(null);
  const [removeExerciseConfirm, setRemoveExerciseConfirm] = useState(null);
  const [restDefaultSecs, setRestDefaultSecs] = useState(30);
  const [showCogMenu, setShowCogMenu] = useState(false);

  useEffect(() => {
    initializeWorkout();
    loadPersonalBests();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (!sessionId || Object.keys(sessionData).length === 0) return;
    const t = setTimeout(() => saveProgress(), 10000);
    return () => clearTimeout(t);
  }, [sessionData, sessionId]);

  const parseRepTarget = (reps) => {
    if (typeof reps === 'string' && reps.includes('-')) return parseInt(reps.split('-')[0]) || 10;
    return parseInt(reps) || 10;
  };

  const findNextIncompleteExercise = (afterIdx) =>
    Object.keys(sessionData)
      .map(Number)
      .find(i => i > afterIdx && sessionData[i] && !(sessionData[i].sets || []).every(s => s.completed));

  const handleRestDone = () => {
    const { type, nextExIdx } = restTimer || {};
    setRestTimer(null);
    if (type === 'exercise' && nextExIdx !== undefined) navigateTo(nextExIdx);
  };

  const navigateTo = (idx, direction = 'slide-forward') => {
    setSlideClass(direction);
    setCurrentExIdx(idx);
    setTimeout(() => setSlideClass(''), 250);
  };

  const initializeWorkout = async () => {
    let exerciseList = [];
    if (workout.exercises && workout.exercises.length > 0) {
      exerciseList = workout.exercises;
    } else {
      exerciseList = [
        ...(workout.warmup || []).map(ex => ({ ...ex, section: 'warmup' })),
        ...(workout.work || []).map(ex => ({ ...ex, section: 'work' })),
        ...(workout.cooldown || []).map(ex => ({ ...ex, section: 'cooldown' })),
      ];
    }
    setExercises(exerciseList);

    const initialData = {};
    exerciseList.forEach((ex, idx) => {
      initialData[idx] = {
        exerciseName: ex.name,
        useDuration: ex.useDuration || false,
        durationMinutes: ex.durationMinutes || 0,
        durationSeconds: ex.durationSeconds || 30,
        sets: Array(ex.sets || 1).fill(null).map((_, i) => ({
          setNumber: i + 1,
          weight: ex.recommendedWeight || 0,
          reps: ex.useDuration ? 0 : parseRepTarget(ex.reps),
          completed: false,
          timestamp: null,
        })),
      };
    });
    setSessionData(initialData);

    if (previewMode) return;

    const sessionRef = push(dbRef(db, `workout-history/${userId}`));
    setSessionId(sessionRef.key);
    await set(sessionRef, {
      workoutId: workout.id,
      workoutName: workout.name,
      startTime: Date.now(),
      completed: false,
      exercises: initialData,
    });
  };

  const loadPersonalBests = async () => {
    if (previewMode) return;
    try {
      const snap = await get(dbRef(db, `workout-history/${userId}`));
      if (!snap.exists()) return;
      const bests = {};
      Object.values(snap.val()).forEach(session => {
        if (!session.completed || !session.exercises) return;
        Object.values(session.exercises).forEach(exData => {
          const name = exData.exerciseName;
          if (!name) return;
          (exData.sets || []).forEach(s => {
            if (!s.completed || s.weight == null) return;
            if (!bests[name] || s.weight > bests[name].weight) {
              bests[name] = { weight: s.weight, reps: s.reps ?? 0 };
            }
          });
        });
      });
      setLastWorkoutData(bests);
      setSessionData(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(idxStr => {
          const idx = Number(idxStr);
          const best = bests[next[idx].exerciseName];
          if (best && best.weight > 0) {
            next[idx] = {
              ...next[idx],
              sets: next[idx].sets.map(s => s.completed ? s : { ...s, weight: best.weight }),
            };
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Error loading personal bests:', err);
    }
  };

  const saveProgress = async () => {
    if (!sessionId || previewMode) return;
    try {
      await update(dbRef(db, `workout-history/${userId}/${sessionId}`), { exercises: sessionData, lastUpdated: Date.now() });
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    setSessionData(prev => {
      const next = { ...prev };
      next[exIdx] = { ...next[exIdx] };
      next[exIdx].sets = next[exIdx].sets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s);
      return next;
    });
  };

  const completeSet = (exIdx, setIdx) => {
    const currentSets = sessionData[exIdx]?.sets || [];
    const isMarkingComplete = !currentSets[setIdx]?.completed;
    const exercise = exercises[exIdx];

    if (isMarkingComplete) {
      const supersetGroupId = exercise?.supersetGroupId;
      const partnerIdx = supersetGroupId
        ? exercises.findIndex((ex, i) => i !== exIdx && ex.supersetGroupId === supersetGroupId)
        : -1;
      if (partnerIdx !== -1) {
        const partnerSets = sessionData[partnerIdx]?.sets || [];
        const partnerSetDone = partnerSets[setIdx]?.completed;
        if (!partnerSetDone) {
          setTimeout(() => navigateTo(partnerIdx), 400);
        } else {
          const willAllThisDone = currentSets.every((s, i) => i === setIdx ? true : s.completed);
          const allPartnerDone = partnerSets.every(s => s.completed);
          if (willAllThisDone && allPartnerDone) {
            const afterBoth = Math.max(exIdx, partnerIdx) + 1;
            if (afterBoth < exercises.length) {
              setTimeout(() => setRestTimer({ seconds: restDefaultSecs, label: 'Rest before next exercise', type: 'exercise', nextExIdx: afterBoth }), 600);
            }
          } else {
            const firstExIdx = Math.min(exIdx, partnerIdx);
            setTimeout(() => setRestTimer({ seconds: restDefaultSecs, label: 'Rest between rounds', type: 'exercise', nextExIdx: firstExIdx }), 400);
          }
        }
      } else {
        const willAllBeDone = currentSets.every((s, i) => i === setIdx ? true : s.completed);
        if (willAllBeDone) {
          const nextIdx = exIdx + 1;
          if (nextIdx < exercises.length) {
            setTimeout(() => setRestTimer({ seconds: restDefaultSecs, label: 'Rest before next exercise', type: 'exercise', nextExIdx: nextIdx }), 600);
          }
        } else {
          setTimeout(() => setRestTimer({ seconds: restDefaultSecs, label: 'Rest between sets', type: 'set' }), 400);
        }
      }
    }

    setSessionData(prev => {
      const next = { ...prev };
      next[exIdx] = { ...next[exIdx] };
      const sets = next[exIdx].sets.map((s, i) => {
        if (i !== setIdx) return s;
        const nowComplete = !s.completed;
        return { ...s, completed: nowComplete, timestamp: nowComplete ? Date.now() : null };
      });
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const addSet = (exIdx) => {
    setSessionData(prev => {
      const next = { ...prev };
      const lastSet = next[exIdx].sets[next[exIdx].sets.length - 1];
      next[exIdx] = {
        ...next[exIdx],
        sets: [...next[exIdx].sets, { setNumber: next[exIdx].sets.length + 1, weight: lastSet?.weight ?? 0, reps: lastSet?.reps ?? 10, completed: false, timestamp: null }],
      };
      return next;
    });
  };

  const removeSet = (exIdx) => {
    if ((sessionData[exIdx]?.sets || []).length <= 1) {
      setRemoveExerciseConfirm(exIdx);
      return;
    }
    setSessionData(prev => {
      const next = { ...prev };
      next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.slice(0, -1) };
      return next;
    });
  };

  const removeExercise = (exIdx) => {
    setExercises(prev => prev.filter((_, i) => i !== exIdx));
    setSessionData(prev => {
      const next = {};
      let newIdx = 0;
      Object.keys(prev).map(Number).sort().forEach(i => {
        if (i !== exIdx) next[newIdx++] = prev[i];
      });
      return next;
    });
    setCurrentExIdx(prev => {
      if (prev === exIdx) return Math.max(0, exIdx - 1);
      if (prev > exIdx) return prev - 1;
      return prev;
    });
    setRemoveExerciseConfirm(null);
  };



  const handleCompleteWorkout = async () => {
    if (!previewMode) {
      const endTime = Date.now();
      if (sessionId) {
        await update(dbRef(db, `workout-history/${userId}/${sessionId}`), {
          completed: true, endTime, duration: Math.round((endTime - startTime) / 1000), exercises: sessionData,
        });
      }
      await updateUserStats();
    }
    setIsCompleted(true);
  };

  const updateUserStats = async () => {
    try {
      const statsRef = dbRef(db, `user-stats/${userId}`);
      const snap = await get(statsRef);
      const today = new Date().toDateString();
      let stats = snap.exists() ? snap.val() : { currentStreak: 0, longestStreak: 0, totalWorkouts: 0, lastWorkoutDate: null };
      if (new Date(stats.lastWorkoutDate).toDateString() === today) return;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      stats.currentStreak = new Date(stats.lastWorkoutDate).toDateString() === yesterday ? stats.currentStreak + 1 : 1;
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
      stats.totalWorkouts += 1;
      stats.lastWorkoutDate = Date.now();
      await set(statsRef, stats);
    } catch (err) {
      console.error('Error updating stats:', err);
    }
  };

  const progress = (() => {
    const totalSets = Object.values(sessionData).reduce((sum, ex) => sum + ex.sets.length, 0);
    if (totalSets === 0) return 0;
    const done = Object.values(sessionData).reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
    return Math.round((done / totalSets) * 100);
  })();

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const getSectionStyle = (section) => {
    if (section === 'warmup') return {
      border: 'border-amber-400 dark:border-amber-500',
      chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      icon: '🔥',
      headerGradient: 'bg-gradient-to-br from-amber-50 via-orange-50/60 to-white dark:from-amber-900/20 dark:via-orange-900/10 dark:to-transparent',
      cardShadow: 'shadow-lg shadow-amber-500/10 dark:shadow-black/30',
      stripAccent: 'border-l-4 border-l-amber-400',
    };
    if (section === 'work') return {
      border: 'border-emerald-500 dark:border-emerald-500',
      chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      icon: '💪',
      headerGradient: 'bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white dark:from-emerald-900/20 dark:via-teal-900/10 dark:to-transparent',
      cardShadow: 'shadow-lg shadow-emerald-500/10 dark:shadow-black/30',
      stripAccent: 'border-l-4 border-l-emerald-500',
    };
    return {
      border: 'border-teal-400 dark:border-teal-500',
      chip: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      icon: '🧘',
      headerGradient: 'bg-gradient-to-br from-teal-50 via-cyan-50/60 to-white dark:from-teal-900/20 dark:via-cyan-900/10 dark:to-transparent',
      cardShadow: 'shadow-lg shadow-teal-500/10 dark:shadow-black/30',
      stripAccent: 'border-l-4 border-l-teal-400',
    };
  };

  // ─── Completed view ───────────────────────────────────────────────────────────

  if (isCompleted) {
    if (previewMode) {
      return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0a0a0a] dark:to-[#1E3328] flex items-center justify-center p-6">
          <div className="text-center max-w-sm w-full">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 shadow-2xl">
              <Trophy className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#d8e7de] mb-2">Preview Complete</h2>
            <p className="text-gray-500 dark:text-[#d8e7de]/60 mb-2">
              This is exactly what your clients experience when they finish <span className="font-semibold">{workout.name}</span>.
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-8">No data was saved.</p>
            <button onClick={onExit} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold min-h-[56px]">
              Back to Workouts
            </button>
          </div>
        </div>
      );
    }
    return (
      <WorkoutComplete
        workout={workout}
        onClose={onExit}
        userId={userId}
        sessionId={sessionId}
        sessionData={sessionData}
        exercises={exercises}
        duration={elapsedTime}
      />
    );
  }

  // ─── Main session view ────────────────────────────────────────────────────────

  const exercise = exercises[currentExIdx];
  const exData = sessionData[currentExIdx];
  const nextExercise = currentExIdx + 1 < exercises.length ? exercises[currentExIdx + 1] : null;
  const nextExData = currentExIdx + 1 < exercises.length ? sessionData[currentExIdx + 1] : null;

  if (!exercise || !exData) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-[#0d1a12] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completedSets = exData.sets.filter(s => s.completed).length;
  const totalSets = exData.sets.length;
  const isAllDone = completedSets === totalSets;
  const last = lastWorkoutData[exercise.name];
  const style = getSectionStyle(exercise.section);
  const nextStyle = nextExercise ? getSectionStyle(nextExercise.section) : null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-[#0d1a12] flex flex-col">

      {previewMode && (
        <div className="bg-amber-500 text-white text-center py-2.5 px-4 text-sm font-bold flex items-center justify-center gap-2">
          <span>👁</span> Preview Mode — nothing is saved
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white/90 dark:bg-[#1E3328]/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-[#C6A45F]/20 shadow-sm z-40 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-4">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() => previewMode ? onExit() : setExitConfirm(true)}
              className="p-2.5 text-gray-500 dark:text-[#d8e7de]/60 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl active:bg-gray-100 dark:active:bg-white/10"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center flex-1 mx-2">
              <h1 className="text-sm font-bold text-gray-900 dark:text-[#d8e7de] truncate tracking-tight">{workout.name}</h1>
              <p className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">{currentExIdx + 1} of {exercises.length}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatTime(elapsedTime)}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700/60 rounded-full h-2 overflow-hidden">
            <div className="progress-shimmer h-full transition-[width] duration-700 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40">{exercises.length} exercises</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
          </div>
        </div>
      </div>

      {/* ── Exercise card ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div key={currentExIdx} className={`p-4 max-w-2xl mx-auto ${slideClass}`}>
          <div className={`bg-white dark:bg-[#1E3328] rounded-2xl border-2 overflow-hidden transition-shadow ${
            isAllDone
              ? 'border-emerald-400 dark:border-emerald-500 shadow-lg shadow-emerald-500/15 dark:shadow-black/30'
              : `${style.border} ${style.cardShadow}`
          }`}>

            {/* ── Card header ───────────────────────────────────────────────── */}
            <div className={`p-4 relative ${
              isAllDone
                ? 'bg-gradient-to-br from-emerald-100 via-teal-50/70 to-white dark:from-emerald-900/30 dark:via-teal-900/15 dark:to-transparent'
                : style.headerGradient
            }`}>

              {/* Chips row + cog menu */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${style.chip}`}>
                  {style.icon} {exercise.section}
                </span>
                {exercise.supersetGroupId && (
                  <span className="text-[11px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-bold">SS</span>
                )}
                {isAllDone && (
                  <span className="text-[11px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Done
                  </span>
                )}

                {/* Cog menu */}
                <div className="ml-auto relative">
                  <button
                    onClick={() => setShowCogMenu(v => !v)}
                    className="p-1.5 rounded-lg active:bg-gray-200 dark:active:bg-white/10 min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <Settings className="w-4 h-4 text-gray-500 dark:text-[#d8e7de]/50" />
                  </button>

                  {showCogMenu && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={() => setShowCogMenu(false)} />
                      <div className="absolute right-0 top-10 z-[61] bg-white dark:bg-[#1E3328] rounded-2xl shadow-xl border border-gray-200 dark:border-[#C6A45F]/25 py-1.5 w-44 overflow-hidden">
                        <button
                          onClick={() => { addSet(currentExIdx); setShowCogMenu(false); }}
                          className="w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-[#d8e7de] font-medium active:bg-gray-50 dark:active:bg-white/5 flex items-center gap-2.5"
                        >
                          <Plus className="w-4 h-4 text-emerald-500" /> Add a set
                        </button>
                        <button
                          onClick={() => { removeSet(currentExIdx); setShowCogMenu(false); }}
                          className="w-full px-4 py-3 text-sm text-left text-gray-700 dark:text-[#d8e7de] font-medium active:bg-gray-50 dark:active:bg-white/5 flex items-center gap-2.5"
                        >
                          <Minus className="w-4 h-4 text-orange-500" /> Remove a set
                        </button>
                        <div className="my-1 border-t border-gray-100 dark:border-[#C6A45F]/10" />
                        <button
                          onClick={() => { setRemoveExerciseConfirm(currentExIdx); setShowCogMenu(false); }}
                          className="w-full px-4 py-3 text-sm text-left text-red-500 dark:text-red-400 font-medium active:bg-red-50 dark:active:bg-red-900/10 flex items-center gap-2.5"
                        >
                          <X className="w-4 h-4" /> Remove exercise
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <h2 className="font-bold text-xl text-gray-900 dark:text-[#d8e7de] tracking-tight leading-tight">
                {exercise.name}
              </h2>

              {last && last.weight > 0 && (
                <div className="mt-1.5">
                  <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
                    Best: {exercise.useDuration
                      ? `${last.weight} lbs`
                      : `${last.weight}${exercise.dumbbells === 2 ? ' ea.' : ' lbs'}`
                    }
                  </span>
                </div>
              )}

              {/* ── Nav row ─────────────────────────────────────────────────── */}
              <div className="flex items-center justify-between mt-3 -mx-1">
                <button
                  onClick={() => navigateTo(currentExIdx - 1, 'slide-back')}
                  disabled={currentExIdx === 0}
                  className="px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-[#d8e7de]/40 rounded-lg disabled:opacity-25 min-h-[36px]"
                >
                  ← Back
                </button>

                {/* Rest timer cycle button */}
                <button
                  onClick={() => setRestDefaultSecs(s => s === 30 ? 60 : s === 60 ? 90 : 30)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-bold min-h-[36px]"
                >
                  <Timer className="w-3.5 h-3.5" />
                  {restDefaultSecs}s rest
                </button>

                <button
                  onClick={() => navigateTo(currentExIdx + 1, 'slide-forward')}
                  disabled={currentExIdx >= exercises.length - 1}
                  className="px-2 py-1.5 text-xs font-semibold text-gray-400 dark:text-[#d8e7de]/40 rounded-lg disabled:opacity-25 min-h-[36px]"
                >
                  Skip →
                </button>
              </div>
            </div>

            {/* ── Card body ─────────────────────────────────────────────────── */}
            <div className="border-t border-gray-100 dark:border-[#C6A45F]/10">

              {exercise.videoUrl && (
                <div className="px-4 pt-4">
                  <a
                    href={exercise.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-gray-900 dark:bg-black/40 text-white rounded-xl active:opacity-80"
                  >
                    <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Play className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Watch Form Video</div>
                      <div className="text-xs text-gray-400">Technique reference</div>
                    </div>
                  </a>
                </div>
              )}

              {exercise.notes && (
                <div className="px-4 pt-4">
                  <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40 rounded-xl p-3 text-sm">
                    <span className="font-bold text-amber-700 dark:text-amber-400">Coach: </span>
                    <span className="text-amber-800 dark:text-amber-200/80">{exercise.notes}</span>
                  </div>
                </div>
              )}

              {/* ── Set table ───────────────────────────────────────────────── */}
              <div className="px-3 pt-4 pb-3 space-y-2">
                <div className="flex items-center gap-2 px-1 pb-1">
                  <span className="w-8 flex-shrink-0" />
                  <span className="w-24 text-center text-[11px] font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wider flex-shrink-0">
                    {exercise.dumbbells === 2 ? 'lbs ea.' : 'lbs'}
                  </span>
                  <span className="w-5 flex-shrink-0" />
                  <span className="w-20 text-center text-[11px] font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wider flex-shrink-0">
                    {exercise.useDuration
                      ? 'duration'
                      : (typeof exercise.reps === 'string' && exercise.reps.includes('-') ? `${exercise.reps} reps` : 'reps')}
                  </span>
                  <span className="flex-1" />
                  <span className="w-12 flex-shrink-0" />
                </div>

                {exData.sets.map((s, setIdx) => (
                  <SetRow
                    key={setIdx}
                    set={s}
                    onComplete={() => completeSet(currentExIdx, setIdx)}
                    onWeightChange={v => updateSet(currentExIdx, setIdx, 'weight', v)}
                    onRepsChange={v => updateSet(currentExIdx, setIdx, 'reps', v)}
                    dumbbells={exercise.dumbbells}
                    useDuration={exData.useDuration}
                    durationMinutes={exData.durationMinutes}
                    durationSeconds={exData.durationSeconds}
                  />
                ))}

              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Coming up next / Complete ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#1E3328] border-t border-gray-200/60 dark:border-[#C6A45F]/20 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] flex-shrink-0">
        {nextExercise ? (
          <div className={`flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto ${nextStyle.stripAccent}`}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-widest mb-0.5">Coming up next</p>
              <p className="font-semibold text-sm text-gray-800 dark:text-[#d8e7de] truncate">{nextExercise.name}</p>
              {nextExData && (
                <p className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mt-0.5">
                  {nextExData.sets.length} sets{nextExercise.supersetGroupId ? ' · Superset' : ''}
                </p>
              )}
            </div>
            <span className="text-2xl">{nextStyle.icon}</span>
          </div>
        ) : (
          <div className="p-4 max-w-2xl mx-auto">
            <button
              onClick={handleCompleteWorkout}
              disabled={progress < 100}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 min-h-[56px] transition-all ${
                progress === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-gray-100 dark:bg-gray-800/60 text-gray-400 dark:text-gray-600'
              }`}
            >
              <Trophy className="w-5 h-5" />
              {progress === 100 ? 'Complete Workout 🎉' : `${progress}% — keep going!`}
            </button>
          </div>
        )}
      </div>

      {restTimer && (
        <RestTimerOverlay
          seconds={restTimer.seconds}
          label={restTimer.label}
          onSkip={handleRestDone}
          onDone={handleRestDone}
        />
      )}

      {removeExerciseConfirm !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de] mb-2 tracking-tight">Remove exercise?</h3>
            <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mb-5">
              {exercises[removeExerciseConfirm]?.name} will be removed from this workout.
            </p>
            <div className="flex gap-3">
              <button onClick={() => removeExercise(removeExerciseConfirm)} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold min-h-[48px]">Yes, Remove</button>
              <button onClick={() => setRemoveExerciseConfirm(null)} className="flex-1 py-3 border border-gray-200 dark:border-[#C6A45F]/25 text-gray-700 dark:text-[#d8e7de]/80 rounded-xl font-bold min-h-[48px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {exitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de] mb-2 tracking-tight">Leave workout?</h3>
            <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mb-5">Your progress has been saved. You can resume later.</p>
            <div className="flex gap-3">
              <button onClick={() => { saveProgress(); onExit(); }} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold min-h-[48px]">Leave</button>
              <button onClick={() => setExitConfirm(false)} className="flex-1 py-3 border border-gray-200 dark:border-[#C6A45F]/25 text-gray-700 dark:text-[#d8e7de]/80 rounded-xl font-bold min-h-[48px]">Stay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Set row ──────────────────────────────────────────────────────────────────

function SetRow({ set, onComplete, onWeightChange, onRepsChange, dumbbells, useDuration = false, durationMinutes = 0, durationSeconds = 30 }) {
  const [rippleKey, setRippleKey] = React.useState(null);

  const handleCheck = () => {
    if (!set.completed) setRippleKey(Date.now());
    onComplete();
  };

  const durLabel = durationMinutes > 0
    ? `${durationMinutes}m ${durationSeconds > 0 ? durationSeconds + 's' : ''}`.trim()
    : `${durationSeconds}s`;

  return (
    <div className={`flex items-center gap-2 rounded-xl px-2 py-2.5 transition-all duration-300 ${
      set.completed
        ? 'bg-gradient-to-r from-emerald-100/80 to-teal-50/60 dark:from-emerald-900/25 dark:to-teal-900/10'
        : 'bg-gray-50/50 dark:bg-white/[0.02]'
    }`}>

      {/* Set number */}
      <span className={`w-8 text-center text-sm font-black flex-shrink-0 ${
        set.completed ? 'text-emerald-500' : 'text-gray-300 dark:text-[#d8e7de]/25'
      }`}>
        {set.setNumber}
      </span>

      {/* Weight input */}
      <div className="relative flex-shrink-0 w-24">
        <input
          type="number"
          inputMode="decimal"
          value={set.weight}
          onChange={e => onWeightChange(Math.max(0, parseFloat(e.target.value) || 0))}
          onClick={e => e.target.select()}
          disabled={set.completed}
          className={`w-full py-3 text-center text-xl font-black rounded-xl border-2 transition ${
            set.completed
              ? 'border-transparent bg-transparent text-emerald-500 dark:text-emerald-400'
              : 'border-gray-200 dark:border-[#C6A45F]/20 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-[#d8e7de] focus:border-emerald-500 focus:outline-none'
          }`}
          min="0"
          step="5"
        />
        {dumbbells && !set.completed && (
          <span className="absolute right-1.5 bottom-1.5 text-[9px] font-bold text-emerald-400 pointer-events-none leading-none">
            {dumbbells === 2 ? '×2' : '×1'}
          </span>
        )}
      </div>

      {/* × separator */}
      <span className={`text-base font-bold flex-shrink-0 ${
        set.completed ? 'text-emerald-300 dark:text-emerald-700' : 'text-gray-200 dark:text-[#d8e7de]/20'
      }`}>×</span>

      {/* Reps input OR duration display */}
      {useDuration ? (
        <div className={`w-20 flex-shrink-0 flex items-center justify-center rounded-xl py-3 ${
          set.completed ? 'text-emerald-500 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
        }`}>
          <span className="text-lg font-black tabular-nums">{durLabel}</span>
        </div>
      ) : (
        <input
          type="number"
          inputMode="numeric"
          value={set.reps}
          onChange={e => onRepsChange(Math.max(1, parseInt(e.target.value) || 1))}
          onClick={e => e.target.select()}
          disabled={set.completed}
          className={`w-20 flex-shrink-0 py-3 text-center text-xl font-black rounded-xl border-2 transition ${
            set.completed
              ? 'border-transparent bg-transparent text-emerald-500 dark:text-emerald-400'
              : 'border-gray-200 dark:border-[#C6A45F]/20 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-[#d8e7de] focus:border-emerald-500 focus:outline-none'
          }`}
          min="1"
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Check button */}
      <button
        onClick={handleCheck}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all overflow-visible ${
          set.completed
            ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-500/40 scale-105'
            : 'border-2 border-gray-200 dark:border-[#C6A45F]/25 text-gray-300 dark:text-[#d8e7de]/20 active:border-emerald-400 active:text-emerald-400'
        }`}
      >
        {rippleKey && (
          <span
            key={rippleKey}
            className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ripple"
          />
        )}
        <Check className="w-5 h-5" />
      </button>
    </div>
  );
}
