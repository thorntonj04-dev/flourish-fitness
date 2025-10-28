import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, Plus, Minus, Video, Clock, ChevronRight } from 'lucide-react';
import { ref as dbRef, set, push } from 'firebase/database';
import { db } from '../../firebase';

export default function WorkoutPerformer({ workout, userId, onComplete, onCancel }) {
  const [currentSection, setCurrentSection] = useState('warmup');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({});
  const [weights, setWeights] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    let interval;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, startTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSectionExercises = () => {
    return workout[currentSection] || [];
  };

  const getCurrentExercise = () => {
    const exercises = getSectionExercises();
    return exercises[currentExerciseIndex];
  };

  const getExerciseKey = () => {
    return `${currentSection}-${currentExerciseIndex}`;
  };

  const handleSetComplete = (setNumber) => {
    const key = getExerciseKey();
    const completed = completedSets[key] || [];
    
    if (completed.includes(setNumber)) {
      setCompletedSets({
        ...completedSets,
        [key]: completed.filter(s => s !== setNumber)
      });
    } else {
      setCompletedSets({
        ...completedSets,
        [key]: [...completed, setNumber]
      });
    }
  };

  const handleWeightChange = (amount) => {
    const key = getExerciseKey();
    const currentWeight = weights[key] || 0;
    const newWeight = Math.max(0, currentWeight + amount);
    setWeights({
      ...weights,
      [key]: newWeight
    });
  };

  const handleWeightInput = (value) => {
    const key = getExerciseKey();
    const numValue = parseFloat(value) || 0;
    setWeights({
      ...weights,
      [key]: Math.max(0, numValue)
    });
  };

  const isExerciseComplete = () => {
    const exercise = getCurrentExercise();
    if (!exercise) return false;
    const key = getExerciseKey();
    const completed = completedSets[key] || [];
    return completed.length === exercise.sets;
  };

  const handleNextExercise = () => {
    const exercises = getSectionExercises();
    
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      // Move to next section
      if (currentSection === 'warmup' && workout.work.length > 0) {
        setCurrentSection('work');
        setCurrentExerciseIndex(0);
      } else if (currentSection === 'work' && workout.cooldown.length > 0) {
        setCurrentSection('cooldown');
        setCurrentExerciseIndex(0);
      } else {
        // Workout complete
        handleCompleteWorkout();
      }
    }
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
        completedSets: completedSets
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
      <div className="text-center py-8">
        <p className="text-gray-600">No exercises in this section.</p>
        <button
          onClick={handleNextExercise}
          className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-lg"
        >
          Continue
        </button>
      </div>
    );
  }

  const key = getExerciseKey();
  const currentWeight = weights[key] || 0;
  const completed = completedSets[key] || [];

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Timer */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-600 capitalize">{currentSection}</div>
            <div className="text-xl font-bold text-gray-900">
              Exercise {currentExerciseIndex + 1} of {getSectionExercises().length}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Time</div>
            <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Current Exercise */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{exercise.name}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span>{exercise.sets} sets</span>
          <span>•</span>
          <span>{exercise.reps} reps</span>
          <span>•</span>
          <span>{exercise.restSeconds}s rest</span>
        </div>

        {exercise.notes && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-900">{exercise.notes}</p>
          </div>
        )}

        {exercise.videoUrl && (
          <a
            href={exercise.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 mb-4"
          >
            <Video className="w-5 h-5" />
            Watch form video
          </a>
        )}

        {/* Weight Input */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Weight Used (lbs)</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleWeightChange(-5)}
              className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
            >
              <Minus className="w-5 h-5 text-gray-700" />
            </button>
            <input
              type="number"
              value={currentWeight}
              onChange={(e) => handleWeightInput(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl font-bold"
            />
            <button
              onClick={() => handleWeightChange(5)}
              className="w-12 h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
            >
              <Plus className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Sets Tracker */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Complete Sets</label>
          {Array.from({ length: exercise.sets }, (_, i) => i + 1).map(setNum => (
            <button
              key={setNum}
              onClick={() => handleSetComplete(setNum)}
              className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                completed.includes(setNum)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {completed.includes(setNum) && <Check className="w-5 h-5" />}
              Set {setNum}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      {isExerciseComplete() && (
        <button
          onClick={handleNextExercise}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2"
        >
          {currentExerciseIndex < getSectionExercises().length - 1
            ? 'Next Exercise'
            : currentSection === 'warmup' && workout.work.length > 0
            ? 'Start Main Workout'
            : currentSection === 'work' && workout.cooldown.length > 0
            ? 'Start Cooldown'
            : 'Complete Workout'}
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
