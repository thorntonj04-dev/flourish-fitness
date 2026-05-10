import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, X, Trophy, Clock, History, Save, Plus, Minus } from 'lucide-react';
import { ref as dbRef, get, set, push, update } from 'firebase/database';
import { db } from '../../firebase';
import WorkoutComplete from './WorkoutComplete';

export default function FormWorkoutSession({ workout, userId, onExit, previewMode = false }) {
  const [exercises, setExercises] = useState([]);
  const [expandedExercise, setExpandedExercise] = useState(0);
  const [sessionData, setSessionData] = useState({});
  const [lastWorkoutData, setLastWorkoutData] = useState({}); // { exerciseName: { weight, reps } }
  const [sessionId, setSessionId] = useState(null);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [saveAsDefaultFor, setSaveAsDefaultFor] = useState({}); // { exIdx: 'pending' | 'saved' | 'skipped' }
  const [savingDefault, setSavingDefault] = useState({});
  const [exitConfirm, setExitConfirm] = useState(false);

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
    setSessionData(prev => {
      const next = { ...prev };
      next[exIdx] = { ...next[exIdx] };
      const sets = next[exIdx].sets.map((s, i) => {
        if (i !== setIdx) return s;
        const nowComplete = !s.completed;
        return { ...s, completed: nowComplete, timestamp: nowComplete ? Date.now() : null };
      });
      next[exIdx] = { ...next[exIdx], sets };

      // Check if all sets just became complete → prompt save-as-default
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

      // Update the workout template in Firebase
      const workoutSnap = await get(dbRef(db, `workouts/${workout.id}`));
      if (workoutSnap.exists()) {
        const workoutData = workoutSnap.val();
        if (!workoutData.exercises) return; // old-format workout, skip
        const updatedExercises = workoutData.exercises.map((ex, i) =>
          i === exIdx
            ? { ...ex, recommendedWeight: avgWeight, reps: avgReps }
            : ex
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
    if (section === 'warmup') return 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    if (section === 'work') return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
    return 'border-blue-400 bg-blue-50 dark:bg-blue-900/20';
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
    return <WorkoutComplete workout={workout} onClose={onExit} userId={userId} sessionId={sessionId} />;
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
                isAllDone
                  ? 'border-emerald-500 dark:border-emerald-600'
                  : getSectionColor(exercise.section)
              }`}
            >
              {/* Exercise header */}
              <button
                onClick={() => setExpandedExercise(isExpanded ? null : exIdx)}
                className="w-full p-4 text-left active:bg-gray-50 dark:active:bg-[#0a0a0a]/20"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getSectionIcon(exercise.section)}</span>
                      <span className="text-xs font-bold text-gray-400 dark:text-[#d8e7de]/50 uppercase tracking-wide">
                        {exercise.section}
                      </span>
                      {isAllDone && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="font-bold text-gray-900 dark:text-[#d8e7de] truncate">{exercise.name}</div>
                    <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">
                      {completedSets}/{totalSets} sets completed
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-2xl font-bold ${isAllDone ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'}`}>
                      {completedSets}/{totalSets}
                    </span>
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
                <div className="border-t border-gray-200 dark:border-[#C6A45F]/20 bg-gray-50 dark:bg-[#0a0a0a]/30 p-4 space-y-3">

                  {/* Video link */}
                  {exercise.videoUrl && (
                    <a
                      href={exercise.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                      <div>
                        <div className="font-bold text-sm">Watch Form Video</div>
                        <div className="text-xs text-blue-100">Proper technique</div>
                      </div>
                    </a>
                  )}

                  {/* Coach's notes */}
                  {exercise.notes && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-3 text-sm">
                      <span className="font-bold text-blue-700 dark:text-blue-300">💡 Coach: </span>
                      <span className="text-blue-800 dark:text-blue-200">{exercise.notes}</span>
                    </div>
                  )}

                  {/* Last time reference */}
                  {last && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-purple-500 flex-shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Last time</div>
                            <div className="font-bold text-purple-700 dark:text-purple-300">
                              {last.weight} lbs × {last.reps} reps
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => useLastValues(exIdx)}
                          className="px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold min-h-[44px]"
                        >
                          Use These
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sets */}
                  <div className="space-y-2">
                    {exData.sets.map((set, setIdx) => (
                      <SetRow
                        key={setIdx}
                        set={set}
                        setIdx={setIdx}
                        onComplete={() => completeSet(exIdx, setIdx)}
                        onWeightChange={(v) => updateSet(exIdx, setIdx, 'weight', v)}
                        onRepsChange={(v) => updateSet(exIdx, setIdx, 'reps', v)}
                      />
                    ))}
                  </div>

                  {/* Add / remove set */}
                  <div className="flex gap-2">
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

                  {/* Save as default prompt */}
                  {defaultStatus === 'pending' && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Save className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">Save these weights as your starting defaults?</span>
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
                    <div className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold py-1">
                      ✓ Defaults saved for next time
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Complete workout — always visible, disabled until all done */}
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

// ─── Set row sub-component ────────────────────────────────────────────────────

function SetRow({ set, setIdx, onComplete, onWeightChange, onRepsChange }) {
  if (set.completed) {
    return (
      <button
        onClick={onComplete}
        className="w-full p-4 bg-emerald-500 dark:bg-emerald-600 text-white rounded-xl flex items-center justify-between min-h-[56px]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-white/50 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <span className="font-bold">Set {set.setNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-emerald-100 font-semibold">{set.weight} lbs × {set.reps} reps</span>
          <Trophy className="w-5 h-5 text-yellow-300" />
        </div>
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1E3328] rounded-xl border-2 border-gray-200 dark:border-[#C6A45F]/20 overflow-hidden">
      {/* Set label */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-600 dark:text-[#d8e7de]/70">Set {set.setNumber}</span>
        <button
          onClick={onComplete}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold min-h-[44px]"
        >
          <Check className="w-3.5 h-3.5" /> Mark Done
        </button>
      </div>

      {/* Weight + Reps steppers */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-3">
        {/* Weight */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 dark:text-[#d8e7de]/50 uppercase tracking-wide mb-1.5 text-center">
            lbs
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onWeightChange(Math.max(0, set.weight - 5))}
              className="w-12 h-12 bg-gray-100 dark:bg-[#0a0a0a]/40 rounded-xl flex items-center justify-center font-bold text-xl text-gray-600 dark:text-[#d8e7de]/80 min-w-[48px]"
            >−</button>
            <input
              type="number"
              value={set.weight}
              onChange={e => onWeightChange(Math.max(0, parseInt(e.target.value) || 0))}
              onClick={e => e.target.select()}
              className="flex-1 py-3 border-2 border-gray-200 dark:border-[#C6A45F]/30 rounded-xl text-center text-xl font-bold focus:border-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] min-w-0"
              min="0" step="5"
            />
            <button
              onClick={() => onWeightChange(set.weight + 5)}
              className="w-12 h-12 bg-gray-100 dark:bg-[#0a0a0a]/40 rounded-xl flex items-center justify-center font-bold text-xl text-gray-600 dark:text-[#d8e7de]/80 min-w-[48px]"
            >+</button>
          </div>
          {/* Quick adjust chips */}
          <div className="grid grid-cols-4 gap-1 mt-1.5">
            {[-10, -5, 5, 10].map(n => (
              <button
                key={n}
                onClick={() => onWeightChange(Math.max(0, set.weight + n))}
                className="py-2 bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-600 dark:text-[#d8e7de]/60 rounded-lg text-xs font-semibold min-h-[36px]"
              >
                {n > 0 ? '+' : ''}{n}
              </button>
            ))}
          </div>
        </div>

        {/* Reps */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 dark:text-[#d8e7de]/50 uppercase tracking-wide mb-1.5 text-center">
            reps
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onRepsChange(Math.max(1, set.reps - 1))}
              className="w-12 h-12 bg-gray-100 dark:bg-[#0a0a0a]/40 rounded-xl flex items-center justify-center font-bold text-xl text-gray-600 dark:text-[#d8e7de]/80 min-w-[48px]"
            >−</button>
            <input
              type="number"
              value={set.reps}
              onChange={e => onRepsChange(Math.max(1, parseInt(e.target.value) || 1))}
              onClick={e => e.target.select()}
              className="flex-1 py-3 border-2 border-gray-200 dark:border-[#C6A45F]/30 rounded-xl text-center text-xl font-bold focus:border-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] min-w-0"
              min="1"
            />
            <button
              onClick={() => onRepsChange(set.reps + 1)}
              className="w-12 h-12 bg-gray-100 dark:bg-[#0a0a0a]/40 rounded-xl flex items-center justify-center font-bold text-xl text-gray-600 dark:text-[#d8e7de]/80 min-w-[48px]"
            >+</button>
          </div>
          {/* Quick adjust chips */}
          <div className="grid grid-cols-4 gap-1 mt-1.5">
            {[-3, -1, 1, 3].map(n => (
              <button
                key={n}
                onClick={() => onRepsChange(Math.max(1, set.reps + n))}
                className="py-2 bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-600 dark:text-[#d8e7de]/60 rounded-lg text-xs font-semibold min-h-[36px]"
              >
                {n > 0 ? '+' : ''}{n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
