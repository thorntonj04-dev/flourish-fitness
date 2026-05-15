import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, X, Trophy, Clock, Save, Plus, Minus } from 'lucide-react';
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
  const [restTimer, setRestTimer] = useState(null); // { seconds, label, type: 'set'|'exercise', nextExIdx }
  const [restSettings, setRestSettings] = useState({}); // { [exIdx]: { betweenSets: N, betweenExercises: N } }

  useEffect(() => {
    initializeWorkout();
    loadLastWorkout();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setElapsedTime(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Auto-save every 10 seconds when data changes
  useEffect(() => {
    if (!sessionId || Object.keys(sessionData).length === 0) return;
    const t = setTimeout(() => saveProgress(), 10000);
    return () => clearTimeout(t);
  }, [sessionData, sessionId]);

  const adjustRest = (exIdx, type, delta) => {
    setRestSettings(prev => {
      const curr = prev[exIdx] || { betweenSets: 0, betweenExercises: 0 };
      return { ...prev, [exIdx]: { ...curr, [type]: Math.max(0, (curr[type] || 0) + delta) } };
    });
  };

  const findNextIncompleteExercise = (afterIdx) =>
    Object.keys(sessionData)
      .map(Number)
      .find(i => i > afterIdx && sessionData[i] && !(sessionData[i].sets || []).every(s => s.completed));

  const handleRestDone = () => {
    const { type, nextExIdx } = restTimer || {};
    setRestTimer(null);
    if (type === 'exercise' && nextExIdx !== undefined) {
      setExpandedExercise(nextExIdx);
    }
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
            lastData[exData.exerciseName] = {
              weight: firstDone.weight ?? 0,
              reps: firstDone.reps ?? exData.sets[0]?.reps ?? 0,
            };
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
      await update(dbRef(db, `workout-history/${userId}/${sessionId}`), {
        exercises: sessionData,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  // ─── Set data mutators ────────────────────────────────────────────────────

  const updateSet = (exIdx, setIdx, field, value) => {
    setSessionData(prev => {
      const next = { ...prev };
      next[exIdx] = { ...next[exIdx] };
      next[exIdx].sets = next[exIdx].sets.map((s, i) =>
        i === setIdx ? { ...s, [field]: value } : s
      );
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
        // ── SUPERSET LOGIC ──────────────────────────────────────
        const partnerSets = sessionData[partnerIdx]?.sets || [];
        const partnerSetDone = partnerSets[setIdx]?.completed;

        if (!partnerSetDone) {
          // Partner hasn't done this round yet — move to partner immediately
          setTimeout(() => setExpandedExercise(partnerIdx), 400);
        } else {
          // Both have completed round setIdx — check what's next
          const willAllThisDone = currentSets.every((s, i) => i === setIdx ? true : s.completed);
          const allPartnerDone = partnerSets.every(s => s.completed);
          if (willAllThisDone && allPartnerDone) {
            // Entire superset complete — rest then next exercise
            const restAfter = restSettings[exIdx]?.betweenExercises ?? exercise?.restBetweenExercisesSeconds ?? 0;
            const nextExIdx = findNextIncompleteExercise(Math.max(exIdx, partnerIdx));
            if (restAfter > 0 && nextExIdx !== undefined) {
              setTimeout(() => setRestTimer({ seconds: restAfter, label: 'Rest after superset', type: 'exercise', nextExIdx }), 400);
            } else if (nextExIdx !== undefined) {
              setTimeout(() => setExpandedExercise(nextExIdx), 700);
            }
          } else {
            // More rounds to go — rest then return to first exercise in pair
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
        // ── REGULAR EXERCISE LOGIC ──────────────────────────────
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
        if (avgWeight !== (ex.recommendedWeight || 0)) {
          setSaveAsDefaultFor(p => ({ ...p, [exIdx]: 'pending' }));
        }
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
        sets: [
          ...next[exIdx].sets,
          {
            setNumber: next[exIdx].sets.length + 1,
            weight: lastSet?.weight ?? 0,
            reps: lastSet?.reps ?? 10,
            completed: false,
            timestamp: null,
          },
        ],
      };
      return next;
    });
  };

  const removeSet = (exIdx) => {
    setSessionData(prev => {
      const next = { ...prev };
      if (next[exIdx].sets.length <= 1) return prev;
      next[exIdx] = {
        ...next[exIdx],
        sets: next[exIdx].sets.slice(0, -1),
      };
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
        sets: next[exIdx].sets.map(s =>
          s.completed ? s : { ...s, weight: last.weight, reps: last.reps }
        ),
      };
      return next;
    });
  };

  // ─── Save as default ──────────────────────────────────────────────────────

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

  // ─── Complete workout ─────────────────────────────────────────────────────

  const handleCompleteWorkout = async () => {
    if (!previewMode) {
      const endTime = Date.now();
      if (sessionId) {
        await update(dbRef(db, `workout-history/${userId}/${sessionId}`), {
          completed: true,
          endTime,
          duration: Math.round((endTime - startTime) / 1000),
          exercises: sessionData,
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

  // ─── Progress calculation ─────────────────────────────────────────────────

  const progress = (() => {
    const totalSets = Object.values(sessionData).reduce((sum, ex) => sum + ex.sets.length, 0);
    if (totalSets === 0) return 0;
    const done = Object.values(sessionData).reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
    return Math.round((done / totalSets) * 100);
  })();

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const getSectionColor = (section) => {
    if (section === 'warmup') return 'border-yellow-400';
    if (section === 'work') return 'border-emerald-500';
    return 'border-blue-400';
  };

  const getSectionIcon = (section) => section === 'warmup' ? '🔥' : section === 'work' ? '💪' : '🧘';

  // ─── Render ───────────────────────────────────────────────────────────────

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
            <button
              onClick={onExit}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold min-h-[56px]"
            >
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a] pb-32">

      {/* Preview mode banner */}
      {previewMode && (
        <div className="bg-amber-500 text-white text-center py-2.5 px-4 text-sm font-bold sticky top-0 z-50 flex items-center justify-center gap-2">
          <span>👁</span>
          Preview Mode — nothing is saved to Firebase
        </div>
      )}

      {/* Sticky header */}
      <div className={`bg-white dark:bg-[#1E3328] border-b border-gray-200 dark:border-[#C6A45F]/25 sticky z-40 shadow-sm ${previewMode ? 'top-[42px]' : 'top-0'}`}>
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={() => previewMode ? onExit() : setExitConfirm(true)}
              className="p-2.5 text-gray-500 dark:text-[#d8e7de]/60 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-base font-bold text-gray-900 dark:text-[#d8e7de] truncate mx-2">{workout.name}</h1>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-[#FFD700] font-bold">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{formatTime(elapsedTime)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60 mt-1.5 text-center">
            {progress}% complete · {exercises.length} exercises
          </div>
        </div>
      </div>

      {/* Exercise cards */}
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

          return (
            <div
              key={exIdx}
              className={`bg-white dark:bg-[#1E3328] rounded-2xl border-2 overflow-hidden transition-all ${
                isAllDone ? 'border-emerald-500 dark:border-emerald-600' : getSectionColor(exercise.section)
              }`}
            >
              {/* Exercise header */}
              <button
                onClick={() => setExpandedExercise(isExpanded ? null : exIdx)}
                className="w-full p-4 text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span>{getSectionIcon(exercise.section)}</span>
                      <span className="text-xs font-bold text-gray-400 dark:text-[#d8e7de]/50 uppercase tracking-wide">
                        {exercise.section}
                      </span>
                      {isAllDone && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-[#d8e7de] truncate">{exercise.name}</span>
                      {exercise.supersetGroupId && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">SS</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-sm text-gray-500 dark:text-[#d8e7de]/60">
                        {completedSets}/{totalSets} sets
                      </span>
                      {last && (
                        <>
                          <span className="text-gray-300 dark:text-[#d8e7de]/20">·</span>
                          <span className="text-xs text-gray-400 dark:text-[#d8e7de]/40">
                            Last: {last.weight}{exercise.dumbbells === 2 ? ' ea.' : ' lbs'} × {last.reps}
                          </span>
                          {!isAllDone && (
                            <button
                              onClick={e => { e.stopPropagation(); useLastValues(exIdx); }}
                              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold"
                            >
                              Use last
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isExpanded
                      ? <ChevronUp className="w-5 h-5 text-gray-400" />
                      : <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="mt-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${isAllDone ? 'bg-emerald-500' : 'bg-gray-400'}`}
                    style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
                  />
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-[#C6A45F]/15">

                  {/* Video link */}
                  {exercise.videoUrl && (
                    <div className="px-4 pt-3">
                      <a
                        href={exercise.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl"
                      >
                        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                        <div>
                          <div className="font-bold text-sm">Watch Form Video</div>
                          <div className="text-xs text-blue-100">Proper technique</div>
                        </div>
                      </a>
                    </div>
                  )}

                  {/* Coach's notes */}
                  {exercise.notes && (
                    <div className="px-4 pt-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 text-sm">
                        <span className="font-bold text-blue-700 dark:text-blue-300">💡 Coach: </span>
                        <span className="text-blue-800 dark:text-blue-200">{exercise.notes}</span>
                      </div>
                    </div>
                  )}

                  {/* Set table */}
                  <div className="p-4 space-y-1">
                    {/* Column headers */}
                    <div className="flex items-center gap-2 px-2 pb-1">
                      <span className="w-7 flex-shrink-0" />
                      <span className="flex-1 text-center text-xs font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wide">
                        {exercise.dumbbells === 2 ? 'lbs ea.' : 'lbs'}
                      </span>
                      <span className="w-5 flex-shrink-0" />
                      <span className="w-16 text-center text-xs font-bold text-gray-400 dark:text-[#d8e7de]/40 uppercase tracking-wide">reps</span>
                      <span className="w-11 flex-shrink-0" />
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

                    {/* Add / remove set */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => addSet(exIdx)}
                        className="flex-1 py-2.5 border border-dashed border-emerald-400 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <Plus className="w-4 h-4" /> Add Set
                      </button>
                      {exData.sets.length > 1 && (
                        <button
                          onClick={() => removeSet(exIdx)}
                          className="py-2.5 px-4 border border-dashed border-red-300 dark:border-red-700 text-red-500 dark:text-red-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 min-h-[44px]"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rest time settings */}
                  {restSettings[exIdx] !== undefined && (
                    <div className="px-4 pb-3 flex gap-2">
                      <RestControl
                        label="Rest/set"
                        value={restSettings[exIdx].betweenSets}
                        onAdjust={delta => adjustRest(exIdx, 'betweenSets', delta)}
                      />
                      <RestControl
                        label="Rest after"
                        value={restSettings[exIdx].betweenExercises}
                        onAdjust={delta => adjustRest(exIdx, 'betweenExercises', delta)}
                      />
                    </div>
                  )}

                  {/* Save as default prompt */}
                  {defaultStatus === 'pending' && (
                    <div className="mx-4 mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Save className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">Save as starting defaults?</span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleSaveDefault(exIdx)}
                          disabled={savingDefault[exIdx]}
                          className="px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold min-h-[44px] disabled:opacity-50"
                        >
                          {savingDefault[exIdx] ? '…' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setSaveAsDefaultFor(p => ({ ...p, [exIdx]: 'skipped' }))}
                          className="px-3 py-2 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold min-h-[44px]"
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

      {/* Complete workout button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1E3328] border-t border-gray-200 dark:border-[#C6A45F]/25 shadow-lg">
        <button
          onClick={handleCompleteWorkout}
          disabled={progress < 100}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 min-h-[56px] transition ${
            progress === 100
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
          }`}
        >
          <Trophy className="w-6 h-6" />
          {progress === 100 ? 'Complete Workout 🎉' : `${progress}% — keep going!`}
        </button>
      </div>

      {/* Rest timer overlay */}
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de] mb-2">Leave workout?</h3>
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

// ─── Rest time control ────────────────────────────────────────────────────────

function RestControl({ label, value, onAdjust }) {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-[#0a0a0a]/40 rounded-xl px-3 py-2">
      <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 mb-1.5">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => onAdjust(-15)}
          className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-[#d8e7de]/70 font-bold flex items-center justify-center text-sm active:bg-gray-300"
        >
          −
        </button>
        <span className="text-sm font-bold text-gray-800 dark:text-[#d8e7de] tabular-nums">
          {value > 0 ? `${value}s` : 'off'}
        </span>
        <button
          onClick={() => onAdjust(+15)}
          className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-[#d8e7de]/70 font-bold flex items-center justify-center text-sm active:bg-gray-300"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Compact set row ──────────────────────────────────────────────────────────

function SetRow({ set, onComplete, onWeightChange, onRepsChange, dumbbells }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl px-2 py-2 transition ${
      set.completed ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
    }`}>
      {/* Set number */}
      <span className={`w-7 text-center text-sm font-bold flex-shrink-0 ${
        set.completed ? 'text-emerald-500' : 'text-gray-400 dark:text-[#d8e7de]/40'
      }`}>
        {set.setNumber}
      </span>

      {/* Weight input */}
      <div className="flex-1 min-w-0 relative">
        <input
          type="number"
          inputMode="decimal"
          value={set.weight}
          onChange={e => onWeightChange(Math.max(0, parseFloat(e.target.value) || 0))}
          onClick={e => e.target.select()}
          disabled={set.completed}
          className={`w-full py-2.5 text-center text-lg font-bold rounded-xl border-2 transition ${
            set.completed
              ? 'border-transparent bg-transparent text-emerald-600 dark:text-emerald-400'
              : 'border-gray-200 dark:border-[#C6A45F]/25 dark:bg-[#0a0a0a] dark:text-[#d8e7de] focus:border-emerald-500 focus:outline-none'
          }`}
          min="0"
          step="5"
        />
        {dumbbells && !set.completed && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400 dark:text-blue-400 pointer-events-none">
            {dumbbells === 2 ? '×2' : '×1'}
          </span>
        )}
      </div>

      {/* × separator */}
      <span className={`text-sm font-bold flex-shrink-0 w-5 text-center ${
        set.completed ? 'text-emerald-300 dark:text-emerald-600' : 'text-gray-300 dark:text-[#d8e7de]/30'
      }`}>×</span>

      {/* Reps input */}
      <input
        type="number"
        inputMode="numeric"
        value={set.reps}
        onChange={e => onRepsChange(Math.max(1, parseInt(e.target.value) || 1))}
        onClick={e => e.target.select()}
        disabled={set.completed}
        className={`w-16 py-2.5 text-center text-lg font-bold rounded-xl border-2 transition min-w-0 ${
          set.completed
            ? 'border-transparent bg-transparent text-emerald-600 dark:text-emerald-400'
            : 'border-gray-200 dark:border-[#C6A45F]/25 dark:bg-[#0a0a0a] dark:text-[#d8e7de] focus:border-emerald-500 focus:outline-none'
        }`}
        min="1"
      />

      {/* Check button */}
      <button
        onClick={onComplete}
        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition active:scale-95 ${
          set.completed
            ? 'bg-emerald-500 text-white shadow-sm'
            : 'border-2 border-gray-200 dark:border-[#C6A45F]/30 text-gray-300 dark:text-[#d8e7de]/20'
        }`}
      >
        <Check className="w-5 h-5" />
      </button>
    </div>
  );
}
