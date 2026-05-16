import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, X, Trophy, Clock, Save, Plus, Minus, Play } from 'lucide-react';
import { ref as dbRef, get, set, push, update } from 'firebase/database';
import { db } from '../../firebase';
import WorkoutComplete from './WorkoutComplete';
import RestTimerOverlay from './RestTimerOverlay';

export default function FormWorkoutSession({ workout, userId, onExit, previewMode = false }) {
  const [exercises, setExercises] = useState([]);
  const [expandedExercise, setExpandedExercise] = useState(0);
  const [sessionData, setSessionData] = useState({});
  const [lastWorkoutData, setLastWorkoutData] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saveAsDefaultFor, setSaveAsDefaultFor] = useState({});
  const [savingDefault, setSavingDefault] = useState({});
  const [exitConfirm, setExitConfirm] = useState(false);
  const [restTimer, setRestTimer] = useState(null);
  const [restSettings, setRestSettings] = useState({});

  useEffect(() => {
    initializeWorkout();
    loadLastWorkout();
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

  const setRestValue = (exIdx, type, value) => {
    setRestSettings(prev => {
      const curr = prev[exIdx] || { betweenSets: 0, betweenExercises: 0 };
      return { ...prev, [exIdx]: { ...curr, [type]: value } };
    });
  };

  const findNextIncompleteExercise = (afterIdx) =>
    Object.keys(sessionData)
      .map(Number)
      .find(i => i > afterIdx && sessionData[i] && !(sessionData[i].sets || []).every(s => s.completed));

  const handleRestDone = () => {
    const { type, nextExIdx } = restTimer || {};
    setRestTimer(null);
    if (type === 'exercise' && nextExIdx !== undefined) setExpandedExercise(nextExIdx);
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

    const initRest = {};
    exerciseList.forEach((ex, idx) => {
      initRest[idx] = {
        betweenSets: ex.restSeconds ?? 0,
        betweenExercises: ex.restBetweenExercisesSeconds ?? 0,
      };
    });
    setRestSettings(initRest);

    const initialData = {};
    exerciseList.forEach((ex, idx) => {
      initialData[idx] = {
        exerciseName: ex.name,
        sets: Array(ex.sets || 1).fill(null).map((_, i) => ({
          setNumber: i + 1,
          weight: ex.recommendedWeight || 0,
          reps: ex.reps || 10,
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

  const loadLastWorkout = async () => {
    if (previewMode) return;
    try {
      const snap = await get(dbRef(db, `workout-history/${userId}`));
      if (!snap.exists()) return;
      const history = Object.values(snap.val());
      const previous = history
        .filter(h => h.workoutId === workout.id && h.completed)
        .sort((a, b) => b.startTime - a.startTime);
      if (previous.length === 0) return;
      const last = previous[0];
      const lastData = {};
      if (last.exercises) {
        Object.values(last.exercises).forEach(exData => {
          const firstDone = (exData.sets || []).find(s => s.completed);
          if (firstDone) {
            lastData[exData.exerciseName] = { weight: firstDone.weight ?? 0, reps: firstDone.reps ?? exData.sets[0]?.reps ?? 0 };
          }
        });
      }
      setLastWorkoutData(lastData);
    } catch (err) {
      console.error('Error loading last workout:', err);
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
          setTimeout(() => setExpandedExercise(partnerIdx), 400);
        } else {
          const willAllThisDone = currentSets.every((s, i) => i === setIdx ? true : s.completed);
          const allPartnerDone = partnerSets.every(s => s.completed);
          if (willAllThisDone && allPartnerDone) {
            const restAfter = restSettings[exIdx]?.betweenExercises ?? exercise?.restBetweenExercisesSeconds ?? 0;
            const nextExIdx = findNextIncompleteExercise(Math.max(exIdx, partnerIdx));
            if (restAfter > 0 && nextExIdx !== undefined) {
              setTimeout(() => setRestTimer({ seconds: restAfter, label: 'Rest after superset', type: 'exercise', nextExIdx }), 400);
            } else if (nextExIdx !== undefined) {
              setTimeout(() => setExpandedExercise(nextExIdx), 700);
            }
          } else {
            const firstExIdx = Math.min(exIdx, partnerIdx);
            const restSeconds = restSettings[exIdx]?.betweenSets ?? exercise?.restSeconds ?? 0;
            if (restSeconds > 0) {
              setTimeout(() => setRestTimer({ seconds: restSeconds, label: 'Rest between rounds', type: 'exercise', nextExIdx: firstExIdx }), 400);
            } else {
              setTimeout(() => setExpandedExercise(firstExIdx), 400);
            }
          }
        }
      } else {
        const willAllBeDone = currentSets.every((s, i) => i === setIdx ? true : s.completed);
        if (willAllBeDone) {
          const restAfter = restSettings[exIdx]?.betweenExercises ?? exercise?.restBetweenExercisesSeconds ?? 0;
          const nextExIdx = findNextIncompleteExercise(exIdx);
          if (restAfter > 0 && nextExIdx !== undefined) {
            setTimeout(() => setRestTimer({ seconds: restAfter, label: 'Rest before next exercise', type: 'exercise', nextExIdx }), 400);
          } else if (nextExIdx !== undefined) {
            setTimeout(() => setExpandedExercise(nextExIdx), 700);
          }
        } else {
          const restSeconds = restSettings[exIdx]?.betweenSets ?? exercise?.restSeconds ?? 0;
          if (restSeconds > 0) {
            setTimeout(() => setRestTimer({ seconds: restSeconds, label: 'Rest between sets', type: 'set' }), 400);
          }
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
      const allDone = sets.every(s => s.completed);
      const ex = exercises[exIdx];
      if (allDone && ex) {
        const avgWeight = Math.round(sets.reduce((sum, s) => sum + (s.weight || 0), 0) / sets.length);
        if (avgWeight !== (ex.recommendedWeight || 0)) setSaveAsDefaultFor(p => ({ ...p, [exIdx]: 'pending' }));
      }
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
    setSessionData(prev => {
      const next = { ...prev };
      if (next[exIdx].sets.length <= 1) return prev;
      next[exIdx] = { ...next[exIdx], sets: next[exIdx].sets.slice(0, -1) };
      return next;
    });
  };

  const useLastValues = (exIdx) => {
    const ex = exercises[exIdx];
    if (!ex) return;
    const last = lastWorkoutData[ex.name];
    if (!last) return;
    setSessionData(prev => {
      const next = { ...prev };
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.map(s => s.completed ? s : { ...s, weight: last.weight, reps: last.reps }),
      };
      return next;
    });
  };

  const handleSaveDefault = async (exIdx) => {
    setSavingDefault(p => ({ ...p, [exIdx]: true }));
    try {
      const sets = sessionData[exIdx]?.sets ?? [];
      const avgWeight = Math.round(sets.reduce((sum, s) => sum + (s.weight || 0), 0) / sets.length);
      const avgReps = Math.round(sets.reduce((sum, s) => sum + (s.reps || 0), 0) / sets.length);
      const workoutSnap = await get(dbRef(db, `workouts/${workout.id}`));
      if (workoutSnap.exists()) {
        const workoutData = workoutSnap.val();
        if (!workoutData.exercises) return;
        const updatedExercises = workoutData.exercises.map((ex, i) =>
          i === exIdx ? { ...ex, recommendedWeight: avgWeight, reps: avgReps } : ex
        );
        await update(dbRef(db, `workouts/${workout.id}`), { exercises: updatedExercises });
      }
      setSaveAsDefaultFor(p => ({ ...p, [exIdx]: 'saved' }));
    } catch (err) {
      console.error('Error saving default:', err);
      alert('Could not save defaults.');
    } finally {
      setSavingDefault(p => ({ ...p, [exIdx]: false }));
    }
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
    if (section === 'warmup') return { border: 'border-amber-400 dark:border-amber-500', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: '🔥' };
    if (section === 'work')   return { border: 'border-emerald-500 dark:border-emerald-500', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: '💪' };
    return { border: 'border-teal-400 dark:border-teal-500', chip: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', icon: '🧘' };
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50 dark:bg-[#0d1a12] pb-32">

      {previewMode && (
        <div className="bg-amber-500 text-white text-center py-2.5 px-4 text-sm font-bold sticky top-0 z-50 flex items-center justify-center gap-2">
          <span>👁</span> Preview Mode — nothing is saved
        </div>
      )}

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className={`bg-white/90 dark:bg-[#1E3328]/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-[#C6A45F]/20 sticky z-40 shadow-sm ${previewMode ? 'top-[42px]' : 'top-0'}`}>
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
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-700 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40">{exercises.length} exercises</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
          </div>
        </div>
      </div>

      {/* ── Exercise cards ─────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {exercises.map((exercise, exIdx) => {
          const exData = sessionData[exIdx];
          if (!exData) return null;

          const completedSets = exData.sets.filter(s => s.completed).length;
          const totalSets = exData.sets.length;
          const isAllDone = completedSets === totalSets;
          const isExpanded = expandedExercise === exIdx;
          const last = lastWorkoutData[exercise.name];
          const defaultStatus = saveAsDefaultFor[exIdx];
          const style = getSectionStyle(exercise.section);

          return (
            <div
              key={exIdx}
              className={`bg-white dark:bg-[#1E3328] rounded-2xl border-2 overflow-hidden transition-all shadow-sm shadow-black/5 dark:shadow-black/20 ${
                isAllDone ? 'border-emerald-400 dark:border-emerald-500' : style.border
              }`}
            >
              {/* Exercise header */}
              <button
                onClick={() => setExpandedExercise(isExpanded ? null : exIdx)}
                className={`w-full p-4 text-left transition-colors ${
                  isAllDone ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : 'active:bg-gray-50 dark:active:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Section chip + status */}
                    <div className="flex items-center gap-2 mb-1.5">
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
                    </div>

                    {/* Exercise name */}
                    <div className="font-bold text-base text-gray-900 dark:text-[#d8e7de] truncate tracking-tight leading-tight">
                      {exercise.name}
                    </div>

                    {/* Sets progress + last workout */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-sm font-semibold tabular-nums ${isAllDone ? 'text-emerald-500' : 'text-gray-500 dark:text-[#d8e7de]/60'}`}>
                        {completedSets}/{totalSets} sets
                      </span>
                      {last && (
                        <>
                          <span className="text-gray-200 dark:text-[#d8e7de]/15">·</span>
                          <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
                            Last: {last.weight}{exercise.dumbbells === 2 ? ' ea.' : ' lbs'} × {last.reps}
                          </span>
                          {!isAllDone && (
                            <button
                              onClick={e => { e.stopPropagation(); useLastValues(exIdx); }}
                              className="text-xs text-emerald-600 dark:text-emerald-400 font-bold underline underline-offset-2"
                            >
                              Use last
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                    {/* Circular mini-progress */}
                    <div className="relative w-9 h-9">
                      <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
                          className="text-gray-200 dark:text-gray-700" />
                        <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3"
                          stroke={isAllDone ? '#10b981' : '#d1d5db'}
                          strokeDasharray={`${totalSets > 0 ? (completedSets / totalSets) * 87.96 : 0} 87.96`}
                          strokeLinecap="round"
                          className={isAllDone ? 'stroke-emerald-500' : 'stroke-emerald-400'}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-gray-600 dark:text-[#d8e7de]/70">
                        {completedSets}/{totalSets}
                      </span>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </div>
              </button>

              {/* ── Expanded content ──────────────────────────────────────── */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-[#C6A45F]/10">

                  {/* Form video */}
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

                  {/* Coach's notes */}
                  {exercise.notes && (
                    <div className="px-4 pt-4">
                      <div className="bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40 rounded-xl p-3 text-sm">
                        <span className="font-bold text-amber-700 dark:text-amber-400">Coach: </span>
                        <span className="text-amber-800 dark:text-amber-200/80">{exercise.notes}</span>
                      </div>
                    </div>
                  )}

                  {/* ── Set table ─────────────────────────────────────────── */}
                  <div className="px-4 pt-4 pb-3 space-y-2">

                    {/* Column labels */}
                    <div className="flex items-center gap-3 px-1 pb-1">
                      <span className="w-8 flex-shrink-0" />
                      <span className="w-24 text-center text-[11px] font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wider flex-shrink-0">
                        {exercise.dumbbells === 2 ? 'lbs ea.' : 'lbs'}
                      </span>
                      <span className="w-5 flex-shrink-0" />
                      <span className="w-20 text-center text-[11px] font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wider flex-shrink-0">reps</span>
                      <span className="flex-1" />
                      <span className="w-12 flex-shrink-0" />
                    </div>

                    {exData.sets.map((s, setIdx) => (
                      <SetRow
                        key={setIdx}
                        set={s}
                        onComplete={() => completeSet(exIdx, setIdx)}
                        onWeightChange={v => updateSet(exIdx, setIdx, 'weight', v)}
                        onRepsChange={v => updateSet(exIdx, setIdx, 'reps', v)}
                        dumbbells={exercise.dumbbells}
                      />
                    ))}

                    {/* Add / Remove set */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => addSet(exIdx)}
                        className="flex-1 py-2.5 border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <Plus className="w-4 h-4" /> Add Set
                      </button>
                      {exData.sets.length > 1 && (
                        <button
                          onClick={() => removeSet(exIdx)}
                          className="py-2.5 px-4 border-2 border-dashed border-red-200 dark:border-red-800/50 text-red-400 dark:text-red-500 rounded-xl text-sm font-semibold flex items-center justify-center min-h-[44px]"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── Rest presets ─────────────────────────────────────── */}
                  {restSettings[exIdx] !== undefined && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-[#C6A45F]/10 pt-3">
                      <RestPresets
                        label="Rest between sets"
                        value={restSettings[exIdx].betweenSets}
                        onChange={v => setRestValue(exIdx, 'betweenSets', v)}
                      />
                      <RestPresets
                        label="Rest after exercise"
                        value={restSettings[exIdx].betweenExercises}
                        onChange={v => setRestValue(exIdx, 'betweenExercises', v)}
                      />
                    </div>
                  )}

                  {/* Save as default */}
                  {defaultStatus === 'pending' && (
                    <div className="mx-4 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Save className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">Save as starting defaults?</span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleSaveDefault(exIdx)}
                          disabled={savingDefault[exIdx]}
                          className="px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold min-h-[40px] disabled:opacity-50"
                        >
                          {savingDefault[exIdx] ? '…' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setSaveAsDefaultFor(p => ({ ...p, [exIdx]: 'skipped' }))}
                          className="px-3 py-2 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold min-h-[40px]"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}
                  {defaultStatus === 'saved' && (
                    <div className="mx-4 mb-4 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold py-1">
                      ✓ Defaults saved for next time
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Complete workout button ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#1E3328]/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-[#C6A45F]/20 shadow-2xl">
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

      {/* Rest timer */}
      {restTimer && (
        <RestTimerOverlay
          seconds={restTimer.seconds}
          label={restTimer.label}
          onSkip={handleRestDone}
          onDone={handleRestDone}
        />
      )}

      {/* Exit confirmation */}
      {exitConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de] mb-2 tracking-tight">Leave workout?</h3>
            <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mb-5">Your progress has been saved. You can resume later.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { saveProgress(); onExit(); }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold min-h-[48px]"
              >
                Leave
              </button>
              <button
                onClick={() => setExitConfirm(false)}
                className="flex-1 py-3 border border-gray-200 dark:border-[#C6A45F]/25 text-gray-700 dark:text-[#d8e7de]/80 rounded-xl font-bold min-h-[48px]"
              >
                Stay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rest presets ─────────────────────────────────────────────────────────────

function RestPresets({ label, value, onChange }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wider mb-2">{label}</div>
      <div className="flex gap-2">
        {[0, 30, 60, 90].map(s => (
          <button
            key={s}
            onClick={() => onChange(s)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold min-h-[42px] transition-all ${
              value === s
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                : 'bg-gray-100 dark:bg-[#0a0a0a]/50 text-gray-500 dark:text-[#d8e7de]/50'
            }`}
          >
            {s === 0 ? 'Off' : `${s}s`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Set row ──────────────────────────────────────────────────────────────────

function SetRow({ set, onComplete, onWeightChange, onRepsChange, dumbbells }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors ${
      set.completed ? 'bg-emerald-50 dark:bg-emerald-900/15' : 'bg-gray-50/50 dark:bg-white/[0.02]'
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

      {/* Reps input */}
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Check button */}
      <button
        onClick={onComplete}
        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          set.completed
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
            : 'border-2 border-gray-200 dark:border-[#C6A45F]/25 text-gray-300 dark:text-[#d8e7de]/20 active:border-emerald-400 active:text-emerald-400'
        }`}
      >
        <Check className="w-5 h-5" />
      </button>
    </div>
  );
}
