import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, X, ChevronRight, Trophy, Timer, SkipForward } from 'lucide-react';
import { ref as dbRef, get, set, push, update } from 'firebase/database';
import { db } from '../../firebase';
import RestTimer from './RestTimer';
import WorkoutComplete from './WorkoutComplete';
import Confetti from 'react-confetti';

export default function WorkoutSession({ workout, userId, onExit }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [exerciseData, setExerciseData] = useState([]);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(60);
  const [sessionId, setSessionId] = useState(null);
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [previousWorkout, setPreviousWorkout] = useState(null);

  useEffect(() => {
    initializeWorkout();
    loadPreviousWorkout();
  }, []);

  const initializeWorkout = () => {
    // Initialize exercise data structure
    const data = workout.exercises.map(ex => ({
      ...ex,
      sets: Array(ex.sets || 1).fill(null).map((_, idx) => ({
        setNumber: idx + 1,
        weight: ex.recommendedWeight || 0,
        reps: ex.reps || 0,
        duration: ex.useDuration ? {
          minutes: ex.durationMinutes || 0,
          seconds: ex.durationSeconds || 0
        } : null,
        completed: false,
        notes: '',
        timestamp: null
      }))
    }));
    setExerciseData(data);

    // Create session in Firebase
    const sessionRef = push(dbRef(db, `workout-history/${userId}`));
    setSessionId(sessionRef.key);
    set(sessionRef, {
      workoutId: workout.id,
      workoutName: workout.name,
      startTime: startTime,
      completed: false,
      exercises: data
    });
  };

  const loadPreviousWorkout = async () => {
    try {
      const historyRef = dbRef(db, `workout-history/${userId}`);
      const snapshot = await get(historyRef);
      if (snapshot.exists()) {
        const history = Object.values(snapshot.val());
        const previous = history
          .filter(h => h.workoutId === workout.id && h.completed)
          .sort((a, b) => b.startTime - a.startTime)[0];
        
        if (previous) {
          setPreviousWorkout(previous);
        }
      }
    } catch (error) {
      console.error('Error loading previous workout:', error);
    }
  };

  const getCurrentExercise = () => exerciseData[currentExerciseIndex];
  const getCurrentSet = () => getCurrentExercise()?.sets[currentSetIndex];

  const calculateProgress = () => {
    const totalSets = exerciseData.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = exerciseData.reduce((sum, ex) => 
      sum + ex.sets.filter(s => s.completed).length, 0
    );
    return Math.round((completedSets / totalSets) * 100);
  };

  const handleSetComplete = async (weight, reps, notes = '') => {
    const updatedData = [...exerciseData];
    const currentSet = updatedData[currentExerciseIndex].sets[currentSetIndex];
    
    currentSet.weight = weight;
    currentSet.reps = reps;
    currentSet.notes = notes;
    currentSet.completed = true;
    currentSet.timestamp = Date.now();

    setExerciseData(updatedData);

    // Save to Firebase
    if (sessionId) {
      await update(dbRef(db, `workout-history/${userId}/${sessionId}`), {
        exercises: updatedData,
        lastUpdated: Date.now()
      });
    }

    // Check for PR
    await checkForPersonalRecord(
      updatedData[currentExerciseIndex].name,
      weight,
      reps
    );

    // Move to next set or exercise
    const currentExercise = updatedData[currentExerciseIndex];
    if (currentSetIndex < currentExercise.sets.length - 1) {
      // More sets in current exercise
      setCurrentSetIndex(currentSetIndex + 1);
      const restTime = currentExercise.restSeconds || 60;
      setRestDuration(restTime);
      setShowRestTimer(true);
    } else if (currentExerciseIndex < exerciseData.length - 1) {
      // Move to next exercise
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSetIndex(0);
      const nextExercise = updatedData[currentExerciseIndex + 1];
      const restTime = nextExercise.restSeconds || 60;
      setRestDuration(restTime);
      setShowRestTimer(true);
    } else {
      // Workout complete!
      handleWorkoutComplete();
    }
  };

  const checkForPersonalRecord = async (exerciseName, weight, reps) => {
    try {
      const exerciseKey = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const prRef = dbRef(db, `personal-records/${userId}/${exerciseKey}`);
      const snapshot = await get(prRef);
      
      let isNewPR = false;
      
      if (snapshot.exists()) {
        const currentPR = snapshot.val();
        // Simple PR check: higher weight, or same weight with more reps
        if (weight > currentPR.bestWeight || 
            (weight === currentPR.bestWeight && reps > currentPR.bestReps)) {
          isNewPR = true;
        }
      } else {
        isNewPR = true; // First time doing this exercise
      }

      if (isNewPR) {
        await set(prRef, {
          exerciseName: exerciseName,
          bestWeight: weight,
          bestReps: reps,
          date: Date.now()
        });
        // Show celebration toast
        alert(`🎉 New PR! ${exerciseName}: ${weight} lbs × ${reps} reps`);
      }
    } catch (error) {
      console.error('Error checking PR:', error);
    }
  };

  const handleWorkoutComplete = async () => {
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes

    // Update session
    if (sessionId) {
      await update(dbRef(db, `workout-history/${userId}/${sessionId}`), {
        completed: true,
        completionPercentage: 100,
        endTime: endTime,
        duration: duration
      });
    }

    // Update streak
    await updateStreak();

    // Show celebration
    setIsCompleted(true);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 5000);
  };

  const updateStreak = async () => {
    try {
      const statsRef = dbRef(db, `user-stats/${userId}`);
      const snapshot = await get(statsRef);
      
      const today = new Date().toDateString();
      let stats = snapshot.exists() ? snapshot.val() : {
        currentStreak: 0,
        longestStreak: 0,
        totalWorkouts: 0,
        lastWorkoutDate: null
      };

      const lastWorkoutDate = stats.lastWorkoutDate ? 
        new Date(stats.lastWorkoutDate).toDateString() : null;
      
      if (lastWorkoutDate === today) {
        // Already worked out today
        return;
      }

      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (lastWorkoutDate === yesterday) {
        // Continuing streak
        stats.currentStreak += 1;
      } else if (lastWorkoutDate !== today) {
        // New streak
        stats.currentStreak = 1;
      }

      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak);
      stats.totalWorkouts += 1;
      stats.lastWorkoutDate = Date.now();

      await set(statsRef, stats);
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const skipRest = () => {
    setShowRestTimer(false);
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
  };

  const getPreviousSetData = () => {
    if (!previousWorkout) return null;
    
    const prevExercise = previousWorkout.exercises.find(
      ex => ex.name === getCurrentExercise()?.name
    );
    
    if (!prevExercise) return null;
    
    const prevSet = prevExercise.sets[currentSetIndex];
    return prevSet;
  };

  if (isCompleted) {
    return <WorkoutComplete workout={workout} onClose={onExit} userId={userId} sessionId={sessionId} />;
  }

  if (!getCurrentExercise()) return null;

  const currentExercise = getCurrentExercise();
  const currentSet = getCurrentSet();
  const progress = calculateProgress();
  const prevSet = getPreviousSetData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
      {showCelebration && <Confetti recycle={false} numberOfPieces={500} />}
      
      {/* Header with Progress */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={onExit}
              className="text-gray-600 hover:text-gray-900 dark:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{workout.name}</h1>
            <div className="text-sm font-medium text-emerald-600">
              {progress}%
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-xs text-gray-600 mt-2 text-center">
            Exercise {currentExerciseIndex + 1} of {exerciseData.length} • 
            Set {currentSetIndex + 1} of {currentExercise.sets.length}
          </div>
        </div>
      </div>

      {/* Rest Timer Overlay */}
      {showRestTimer && (
        <RestTimer
          duration={restDuration}
          onComplete={handleRestComplete}
          onSkip={skipRest}
        />
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 pb-32">
        {/* Current Exercise Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {currentExercise.name}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">
                  {currentExercise.section}
                </span>
                {currentExercise.muscleGroup && (
                  <span className="capitalize">{currentExercise.muscleGroup}</span>
                )}
              </div>
            </div>
            {currentExercise.videoUrl && (
              <button className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100">
                <Play className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Previous Workout Comparison */}
          {prevSet && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="text-sm font-medium text-blue-900 mb-1">
                📊 Last Time:
              </div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {prevSet.weight} lbs × {prevSet.reps} reps
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Try to beat this! 💪
              </div>
            </div>
          )}

          {/* Current Set Display */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-6 text-white mb-4">
            <div className="text-center">
              <div className="text-sm font-medium mb-2">SET {currentSetIndex + 1}</div>
              {currentExercise.useDuration ? (
                <div className="text-4xl font-bold">
                  {currentExercise.durationMinutes > 0 && `${currentExercise.durationMinutes}m `}
                  {currentExercise.durationSeconds}s
                </div>
              ) : (
                <>
                  <div className="text-5xl font-bold mb-2">
                    {currentSet.reps}
                  </div>
                  <div className="text-xl">reps</div>
                  {currentSet.weight > 0 && (
                    <div className="text-3xl font-bold mt-2">
                      {currentSet.weight} lbs
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {currentExercise.notes && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <div className="text-sm font-medium text-yellow-900 mb-1">
                💡 Coach's Notes:
              </div>
              <div className="text-sm text-yellow-800 dark:text-yellow-300">{currentExercise.notes}</div>
            </div>
          )}

          {/* Quick Log Inputs */}
          <SetLogForm
            defaultWeight={currentSet.weight}
            defaultReps={currentSet.reps}
            useDuration={currentExercise.useDuration}
            onComplete={handleSetComplete}
          />
        </div>

        {/* Completed Sets */}
        {currentExercise.sets.some(s => s.completed) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
            <h3 className="font-bold text-gray-900 mb-3">Completed Sets</h3>
            <div className="space-y-2">
              {currentExercise.sets.map((set, idx) => (
                set.completed && (
                  <div key={idx} className="flex justify-between items-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-gray-900 dark:text-white">Set {idx + 1}</span>
                    </div>
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {set.weight} lbs × {set.reps} reps
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Set Logging Form Component
function SetLogForm({ defaultWeight, defaultReps, useDuration, onComplete }) {
  const [weight, setWeight] = useState(defaultWeight);
  const [reps, setReps] = useState(defaultReps);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  const handleSubmit = () => {
    onComplete(weight, reps, notes);
    setNotes('');
    setShowNotes(false);
  };

  if (useDuration) {
    return (
      <div className="space-y-3">
        <button
          onClick={() => onComplete(0, 0, notes)}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2"
        >
          <Check className="w-6 h-6" />
          Complete Set
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          />
        </div>
      </div>

      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did this set feel? Any notes..."
          className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
          rows="2"
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {showNotes ? 'Hide' : 'Add'} Notes
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2"
        >
          <Check className="w-6 h-6" />
          Complete Set
        </button>
      </div>
    </div>
  );
}
