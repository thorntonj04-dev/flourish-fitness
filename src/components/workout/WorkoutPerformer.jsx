import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, Plus, Minus, Video, Clock, ChevronRight, X, CheckCircle, SkipForward } from 'lucide-react';
import { ref as dbRef, set, push } from 'firebase/database';
import { db } from '../../firebase';

export default function WorkoutPerformer({ workout, userId, onComplete, onCancel }) {
  const [allExercises, setAllExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({});
  const [weights, setWeights] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  const [restTimer, setRestTimer] = useState(null);
  const [showRestOverlay, setShowRestOverlay] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);

  useEffect(() => {
    // Build unified exercise list from both new and legacy formats
    let exercises = [];
    
    if (workout.exercises && workout.exercises.length > 0) {
      // New format - single array with section property
      exercises = workout.exercises.sort((a, b) => {
        const sectionOrder = { warmup: 0, work: 1, cooldown: 2 };
        return sectionOrder[a.section] - sectionOrder[b.section];
      });
    } else {
      // Legacy format - separate arrays
      exercises = [
        ...(workout.warmup || []).map(ex => ({ ...ex, section: 'warmup' })),
        ...(workout.work || []).map(ex => ({ ...ex, section: 'work' })),
        ...(workout.cooldown || []).map(ex => ({ ...ex, section: 'cooldown' }))
      ];
    }
    
    setAllExercises(exercises);

    // Initialize weights with recommended weights
    const initialWeights = {};
    exercises.forEach((exercise, idx) => {
      initialWeights[idx] = exercise.recommendedWeight || 0;
    });
    setWeights(initialWeights);
  }, [workout]);

  useEffect(() => {
    let interval;
    if (!isPaused && !showRestOverlay) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, showRestOverlay, startTime]);

  useEffect(() => {
    if (restTimer !== null && restTimer > 0) {
      const interval = setInterval(() => {
        setRestTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (restTimer === 0) {
      setShowRestOverlay(false);
      setRestTimer(null);
    }
  }, [restTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentExercise = () => {
    return allExercises[currentExerciseIndex];
  };

  const handleSetComplete = (setNumber) => {
    const completed = completedSets[currentExerciseIndex] || [];
    
    if (completed.includes(setNumber)) {
      // Uncomplete set
      setCompletedSets({
        ...completedSets,
        [currentExerciseIndex]: completed.filter(s => s !== setNumber)
      });
    } else {
      // Complete set
      setCompletedSets({
        ...completedSets,
        [currentExerciseIndex]: [...completed, setNumber]
      });

      // Start rest timer if not the last set
      const exercise = getCurrentExercise();
      if (setNumber < exercise.sets && exercise.restSeconds > 0) {
        setRestTimer(exercise.restSeconds);
        setShowRestOverlay(true);
        setCurrentSet(setNumber + 1);
      }
    }
  };

  const handleWeightChange = (amount) => {
    const currentWeight = weights[currentExerciseIndex] || 0;
    const newWeight = Math.max(0, currentWeight + amount);
    setWeights({
      ...weights,
      [currentExerciseIndex]: newWeight
    });
  };

  const handleWeightInput = (value) => {
    const numValue = parseFloat(value) || 0;
    setWeights({
      ...weights,
      [currentExerciseIndex]: Math.max(0, numValue)
    });
  };

  const isExerciseComplete = () => {
    const exercise = getCurrentExercise();
    if (!exercise) return false;
    const completed = completedSets[currentExerciseIndex] || [];
    return completed.length === exercise.sets;
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < allExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setShowRestOverlay(false);
      setRestTimer(null);
    } else {
      handleCompleteWorkout();
    }
  };

  const handleSkipRest = () => {
    setShowRestOverlay(false);
    setRestTimer(null);
  };

  const handleCompleteWorkout = async () => {
    try {
      const workoutData = {
        workoutId: workout.id,
        workoutName: workout.name,
        userId: userId,
        completedAt: new Date().toISOString(),
        duration: elapsedTime,
        weights: weights,
        completedSets: completedSets,
        exercises: allExercises.map((ex, idx) => ({
          name: ex.name,
          section: ex.section,
          sets: ex.sets,
          reps: ex.reps,
          weightUsed: weights[idx] || 0,
          completed: (completedSets[idx] || []).length === ex.sets
        }))
      };

      const logsRef = dbRef(db, 'workout-logs');
      const newLogRef = push(logsRef);
      await set(newLogRef, workoutData);

      onComplete();
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  };

  const exercise = getCurrentExercise();
  
  if (!exercise) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading workout...</p>
        </div>
      </div>
    );
  }

  const currentWeight = weights[currentExerciseIndex] || 0;
  const completed = completedSets[currentExerciseIndex] || [];
  const progressPercent = ((currentExerciseIndex) / allExercises.length) * 100;
  const totalCompleted = Object.values(completedSets).reduce((sum, sets) => sum + sets.length, 0);
  const totalSets = allExercises.reduce((sum, ex) => sum + ex.sets, 0);

  const getSectionColor = (section) => {
    switch (section) {
      case 'warmup': return 'bg-yellow-500';
      case 'work': return 'bg-emerald-500';
      case 'cooldown': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSectionIcon = (section) => {
    switch (section) {
      case 'warmup': return '🔥';
      case 'work': return '💪';
      case 'cooldown': return '🧘';
      default: return '•';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Rest Timer Overlay */}
      {showRestOverlay && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-white mb-8">
              <div className="text-6xl font-bold mb-4">{restTimer}</div>
              <div className="text-2xl mb-2">Rest Time</div>
              <div className="text-gray-400">
                Prepare for Set {currentSet}
              </div>
            </div>
            <button
              onClick={handleSkipRest}
              className="px-8 py-4 bg-white text-gray-900 rounded-full font-semibold text-lg hover:bg-gray-100 flex items-center gap-2 mx-auto"
            >
              <SkipForward className="w-6 h-6" />
              Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className={`h-1 ${getSectionColor(exercise.section)} transition-all duration-300`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Workout Info */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{getSectionIcon(exercise.section)}</span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {exercise.section}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Exercise {currentExerciseIndex + 1} of {allExercises.length}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
                <Clock className="w-5 h-5" />
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {totalCompleted}/{totalSets} sets
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 font-medium"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Details */}
      <div className="p-4 space-y-4">
        {/* Exercise Name */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{exercise.name}</h2>
          <div className="flex items-center gap-4 text-gray-600 mb-4">
            <span className="font-semibold">{exercise.sets} sets</span>
            <span>•</span>
            <span className="font-semibold">{exercise.reps} reps</span>
            {exercise.restSeconds > 0 && (
              <>
                <span>•</span>
                <span className="font-semibold">{exercise.restSeconds}s rest</span>
              </>
            )}
          </div>

          {/* Notes */}
          {exercise.notes && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg">
              <div className="text-sm font-medium text-blue-900 mb-1">Coach's Notes:</div>
              <p className="text-blue-800">{exercise.notes}</p>
            </div>
          )}

          {/* Video Link */}
          {exercise.videoUrl && (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 font-medium"
            >
              <Video className="w-5 h-5" />
              Watch Form Video
            </a>
          )}
        </div>

        {/* Weight Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <label className="text-lg font-bold text-gray-900">Weight (lbs)</label>
            {exercise.recommendedWeight > 0 && currentWeight !== exercise.recommendedWeight && (
              <button
                onClick={() => handleWeightInput(exercise.recommendedWeight)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Use recommended: {exercise.recommendedWeight} lbs
              </button>
            )}
          </div>
          
          {exercise.recommendedWeight > 0 && (
            <div className="text-sm text-gray-600 mb-3">
              💡 Coach recommends: <span className="font-semibold">{exercise.recommendedWeight} lbs</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleWeightChange(-5)}
              className="w-14 h-14 bg-gray-100 border-2 border-gray-300 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition"
            >
              <Minus className="w-6 h-6 text-gray-700" />
            </button>
            <input
              type="number"
              value={currentWeight}
              onChange={(e) => handleWeightInput(e.target.value)}
              className="flex-1 px-4 py-4 border-2 border-gray-300 rounded-xl text-center text-3xl font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              min="0"
              step="5"
            />
            <button
              onClick={() => handleWeightChange(5)}
              className="w-14 h-14 bg-gray-100 border-2 border-gray-300 rounded-xl flex items-center justify-center hover:bg-gray-200 active:scale-95 transition"
            >
              <Plus className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3">
            <button
              onClick={() => handleWeightChange(-2.5)}
              className="py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium"
            >
              -2.5
            </button>
            <button
              onClick={() => handleWeightChange(-10)}
              className="py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium"
            >
              -10
            </button>
            <button
              onClick={() => handleWeightChange(10)}
              className="py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium"
            >
              +10
            </button>
          </div>
        </div>

        {/* Sets Tracker */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Complete Your Sets</h3>
          <div className="space-y-3">
            {Array.from({ length: exercise.sets }, (_, i) => i + 1).map(setNum => {
              const isCompleted = completed.includes(setNum);
              return (
                <button
                  key={setNum}
                  onClick={() => handleSetComplete(setNum)}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-lg scale-[1.02]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      Set {setNum} Complete
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-400" />
                      Set {setNum} - {exercise.reps} reps
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Progress indicator */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span className="font-semibold">{completed.length} of {exercise.sets} sets</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(completed.length / exercise.sets) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Next Exercise Button - Fixed at bottom */}
      {isExerciseComplete() && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
          <button
            onClick={handleNextExercise}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            {currentExerciseIndex < allExercises.length - 1 ? (
              <>
                Next Exercise
                <ChevronRight className="w-6 h-6" />
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                Complete Workout
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
