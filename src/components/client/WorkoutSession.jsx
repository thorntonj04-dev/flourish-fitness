import React, { useState, useEffect } from 'react';
import { Play, Pause, Check, Plus, Minus, Video, Clock, ChevronRight, X, CheckCircle, SkipForward, TrendingUp, Award, History } from 'lucide-react';
import { ref as dbRef, set, push, get } from 'firebase/database';
import { db } from '../../firebase';
import RestTimer from '../workout/RestTimer';
import ExerciseHistoryCard from '../workout/ExerciseHistoryCard';
import WorkoutSummary from '../workout/WorkoutSummary';

export default function WorkoutSession({ workout, userId, onExit }) {
  // Core state
  const [allExercises, setAllExercises] = useState([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState({});
  const [weights, setWeights] = useState({});
  const [reps, setReps] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime] = useState(Date.now());
  
  // Enhanced features state
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [showHistory, setShowHistory] = useState({});
  const [personalRecords, setPersonalRecords] = useState({});
  const [newPRs, setNewPRs] = useState([]);
  const [workoutComplete, setWorkoutComplete] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  
  // Session persistence
  const [sessionId] = useState(`session-${Date.now()}`);

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    initializeWorkout();
    loadExerciseHistory();
    loadPersonalRecords();
    resumeSession();
  }, [workout, userId]);

  const initializeWorkout = () => {
    // Build unified exercise list
    let exercises = [];
    if (workout.exercises && workout.exercises.length > 0) {
      exercises = workout.exercises.sort((a, b) => {
        const sectionOrder = { warmup: 0, work: 1, cooldown: 2 };
        return sectionOrder[a.section] - sectionOrder[b.section];
      });
    } else {
      // Legacy format
      exercises = [
        ...(workout.warmup || []).map(ex => ({ ...ex, section: 'warmup' })),
        ...(workout.work || []).map(ex => ({ ...ex, section: 'work' })),
        ...(workout.cooldown || []).map(ex => ({ ...ex, section: 'cooldown' }))
      ];
    }
    setAllExercises(exercises);

    // Initialize weights with smart suggestions
    const initialWeights = {};
    const initialReps = {};
    exercises.forEach((exercise, idx) => {
      initialWeights[idx] = exercise.recommendedWeight || 0;
      initialReps[idx] = exercise.reps || 10;
    });
    setWeights(initialWeights);
    setReps(initialReps);
  };

  const loadExerciseHistory = async () => {
    try {
      const logsRef = dbRef(db, 'workout-logs');
      const snapshot = await get(logsRef);
      
      if (snapshot.exists()) {
        const logs = Object.values(snapshot.val())
          .filter(log => log.userId === userId)
          .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        const history = {};
        allExercises.forEach((exercise, idx) => {
          const exerciseLogs = logs
            .flatMap(log => log.exercises || [])
            .filter(ex => ex.name === exercise.name)
            .slice(0, 5); // Last 5 sessions
          
          if (exerciseLogs.length > 0) {
            history[idx] = exerciseLogs;
            
            // Smart weight suggestion - use most recent weight
            const lastWeight = exerciseLogs[0].weightUsed;
            if (lastWeight > 0) {
              setWeights(prev => ({ ...prev, [idx]: lastWeight }));
            }
          }
        });
        
        setExerciseHistory(history);
      }
    } catch (error) {
      console.error('Error loading exercise history:', error);
    }
  };

  const loadPersonalRecords = async () => {
    try {
      const prsRef = dbRef(db, `personal-records/${userId}`);
      const snapshot = await get(prsRef);
      
      if (snapshot.exists()) {
        setPersonalRecords(snapshot.val());
      }
    } catch (error) {
      console.error('Error loading PRs:', error);
    }
  };

  const resumeSession = () => {
    // Check for saved session in localStorage
    const savedSession = localStorage.getItem(`workout-session-${userId}-${workout.id}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const timeSinceLastActivity = Date.now() - session.lastActivity;
      
      // Resume if less than 30 minutes ago
      if (timeSinceLastActivity < 30 * 60 * 1000) {
        setCurrentExerciseIndex(session.currentExerciseIndex || 0);
        setCompletedSets(session.completedSets || {});
        setWeights(session.weights || {});
        setReps(session.reps || {});
        setElapsedTime(session.elapsedTime || 0);
      }
    }
  };

  const saveSession = () => {
    const session = {
      currentExerciseIndex,
      completedSets,
      weights,
      reps,
      elapsedTime,
      lastActivity: Date.now()
    };
    localStorage.setItem(`workout-session-${userId}-${workout.id}`, JSON.stringify(session));
  };

  // ============================================
  // TIMER
  // ============================================
  useEffect(() => {
    let interval;
    if (!isPaused && !showRestTimer) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused, showRestTimer, startTime]);

  // Save session periodically
  useEffect(() => {
    const interval = setInterval(saveSession, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [currentExerciseIndex, completedSets, weights, reps, elapsedTime]);

  // ============================================
  // SET COMPLETION & PR DETECTION
  // ============================================
  const handleSetComplete = async (setNumber) => {
    const exercise = getCurrentExercise();
    const completed = completedSets[currentExerciseIndex] || [];
    
    if (completed.includes(setNumber)) {
      // Uncomplete set
      setCompletedSets({
        ...completedSets,
        [currentExerciseIndex]: completed.filter(s => s !== setNumber)
      });
      return;
    }

    // Complete set
    const newCompleted = [...completed, setNumber];
    setCompletedSets({
      ...completedSets,
      [currentExerciseIndex]: newCompleted
    });

    // Check for PR
    await checkForPR(exercise, setNumber);

    // Start rest timer if not the last set
    if (setNumber < exercise.sets && exercise.restSeconds > 0) {
      setRestSeconds(exercise.restSeconds);
      setShowRestTimer(true);
      setCurrentSet(setNumber + 1);
    }

    // Haptic feedback (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const checkForPR = async (exercise, setNumber) => {
    const currentWeight = weights[currentExerciseIndex] || 0;
    const currentRepsValue = reps[currentExerciseIndex] || exercise.reps;
    
    // Skip PR check for bodyweight or stretching
    if (currentWeight === 0 || exercise.section !== 'work') return;

    const prKey = exercise.name;
    const currentPR = personalRecords[prKey];
    
    // Calculate one-rep max estimate: weight × (1 + reps/30)
    const currentOneRepMax = currentWeight * (1 + currentRepsValue / 30);
    const previousOneRepMax = currentPR ? currentPR.weight * (1 + currentPR.reps / 30) : 0;

    if (currentOneRepMax > previousOneRepMax) {
      // New PR!
      const prData = {
        weight: currentWeight,
        reps: currentRepsValue,
        date: new Date().toISOString(),
        workoutId: workout.id
      };

      // Save to Firebase
      const prRef = dbRef(db, `personal-records/${userId}/${prKey}`);
      await set(prRef, prData);

      // Update local state
      setPersonalRecords(prev => ({ ...prev, [prKey]: prData }));
      setNewPRs(prev => [...prev, { exercise: exercise.name, ...prData }]);

      // Celebrate!
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
    }
  };

  // ============================================
  // WEIGHT & REPS MANAGEMENT
  // ============================================
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

  const handleRepsChange = (amount) => {
    const exercise = getCurrentExercise();
    const currentRepsValue = reps[currentExerciseIndex] || exercise.reps;
    const newReps = Math.max(1, currentRepsValue + amount);
    setReps({
      ...reps,
      [currentExerciseIndex]: newReps
    });
  };

  const handleRepsInput = (value) => {
    const numValue = parseInt(value) || 1;
    setReps({
      ...reps,
      [currentExerciseIndex]: Math.max(1, numValue)
    });
  };

  // ============================================
  // NAVIGATION
  // ============================================
  const getCurrentExercise = () => {
    return allExercises[currentExerciseIndex];
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
      setShowRestTimer(false);
    } else {
      handleCompleteWorkout();
    }
  };

  const handleSkipExercise = () => {
    if (confirm('Skip this exercise? You can always come back to it.')) {
      handleNextExercise();
    }
  };

  // ============================================
  // WORKOUT COMPLETION
  // ============================================
  const handleCompleteWorkout = async () => {
    try {
      // Calculate workout stats
      const totalVolume = allExercises.reduce((sum, ex, idx) => {
        const weight = weights[idx] || 0;
        const completed = (completedSets[idx] || []).length;
        const repsPerSet = reps[idx] || ex.reps;
        return sum + (weight * completed * repsPerSet);
      }, 0);

      const workoutData = {
        workoutId: workout.id,
        workoutName: workout.name,
        userId: userId,
        completedAt: new Date().toISOString(),
        duration: elapsedTime,
        totalVolume,
        newPRs: newPRs.length,
        exercises: allExercises.map((ex, idx) => ({
          name: ex.name,
          section: ex.section,
          sets: ex.sets,
          targetReps: ex.reps,
          actualReps: reps[idx] || ex.reps,
          weightUsed: weights[idx] || 0,
          completedSets: (completedSets[idx] || []).length,
          completed: (completedSets[idx] || []).length === ex.sets
        }))
      };

      // Save to Firebase
      const logsRef = dbRef(db, 'workout-logs');
      const newLogRef = push(logsRef);
      await set(newLogRef, workoutData);

      // Clear session
      localStorage.removeItem(`workout-session-${userId}-${workout.id}`);

      // Show summary
      setWorkoutSummary(workoutData);
      setWorkoutComplete(true);
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  };

  const handleExit = () => {
    if (!workoutComplete) {
      if (confirm('Exit workout? Your progress will be saved and you can resume later.')) {
        saveSession();
        onExit();
      }
    } else {
      onExit();
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  // ============================================
  // RENDER
  // ============================================
  if (workoutComplete && workoutSummary) {
    return (
      <WorkoutSummary
        summary={workoutSummary}
        newPRs={newPRs}
        onClose={handleExit}
      />
    );
  }

  const exercise = getCurrentExercise();
  
  if (!exercise) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="text-center">
          <p className="text-gray-600 dark:text-[#d8e7de]/80 mb-4">Loading workout...</p>
        </div>
      </div>
    );
  }

  const currentWeight = weights[currentExerciseIndex] || 0;
  const currentRepsValue = reps[currentExerciseIndex] || exercise.reps;
  const completed = completedSets[currentExerciseIndex] || [];
  const progressPercent = ((currentExerciseIndex) / allExercises.length) * 100;
  const totalCompleted = Object.values(completedSets).reduce((sum, sets) => sum + sets.length, 0);
  const totalSets = allExercises.reduce((sum, ex) => sum + ex.sets, 0);
  const hasHistory = exerciseHistory[currentExerciseIndex]?.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-24">
      {/* Rest Timer Overlay */}
      {showRestTimer && (
        <RestTimer
          seconds={restSeconds}
          onComplete={() => setShowRestTimer(false)}
          onSkip={() => setShowRestTimer(false)}
          nextSet={currentSet}
        />
      )}

      {/* Header */}
      <div className="bg-white dark:bg-[#1E3328] border-b border-gray-200 dark:border-[#C6A45F]/25 sticky top-0 z-40 shadow-sm">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-[#0a0a0a]/50">
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
                <span className="text-xs font-bold text-gray-500 dark:text-[#d8e7de]/60 uppercase tracking-wide">
                  {exercise.section}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-[#d8e7de]/80">
                Exercise {currentExerciseIndex + 1} of {allExercises.length}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-[#FFD700] font-bold text-xl">
                <Clock className="w-5 h-5" />
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-gray-600 dark:text-[#d8e7de]/60 mt-1">
                {totalCompleted}/{totalSets} sets
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex-1 py-2 bg-gray-100 dark:bg-[#0a0a0a]/50 text-gray-700 dark:text-[#d8e7de] rounded-lg hover:bg-gray-200 dark:hover:bg-[#1E3328] flex items-center justify-center gap-2 font-medium transition"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={handleExit}
              className="px-4 py-2 border-2 border-gray-300 dark:border-[#C6A45F]/40 text-gray-700 dark:text-[#d8e7de] rounded-lg hover:bg-gray-50 dark:hover:bg-[#1E3328] font-medium transition"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* Exercise Details */}
      <div className="p-4 space-y-4">
        {/* Exercise Name & New PR Badge */}
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#C6A45F]/25">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-[#d8e7de]">{exercise.name}</h2>
            {newPRs.some(pr => pr.exercise === exercise.name) && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-sm font-bold animate-pulse">
                <Award className="w-4 h-4" />
                New PR!
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-gray-600 dark:text-[#d8e7de]/80 mb-4">
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-4 rounded-r-lg">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">Coach's Notes:</div>
              <p className="text-blue-800 dark:text-blue-200">{exercise.notes}</p>
            </div>
          )}

          {/* Video Link */}
          {exercise.videoUrl && (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 font-medium transition"
            >
              <Video className="w-5 h-5" />
              Watch Form Video
            </a>
          )}
        </div>

        {/* Exercise History Card */}
        {hasHistory && (
          <ExerciseHistoryCard
            history={exerciseHistory[currentExerciseIndex]}
            isExpanded={showHistory[currentExerciseIndex]}
            onToggle={() => setShowHistory({
              ...showHistory,
              [currentExerciseIndex]: !showHistory[currentExerciseIndex]
            })}
          />
        )}

        {/* Weight Selector */}
        {exercise.section === 'work' && (
          <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#C6A45F]/25">
            <div className="flex justify-between items-center mb-3">
              <label className="text-lg font-bold text-gray-900 dark:text-[#d8e7de]">Weight (lbs)</label>
              {exercise.recommendedWeight > 0 && currentWeight !== exercise.recommendedWeight && (
                <button
                  onClick={() => handleWeightInput(exercise.recommendedWeight)}
                  className="text-sm text-emerald-600 dark:text-[#FFD700] hover:text-emerald-700 dark:hover:text-[#FFD700]/80 font-medium"
                >
                  Use recommended: {exercise.recommendedWeight} lbs
                </button>
              )}
            </div>
            
            {hasHistory && exerciseHistory[currentExerciseIndex][0].weightUsed !== currentWeight && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#d8e7de]/80 mb-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Last time: <span className="font-semibold">{exerciseHistory[currentExerciseIndex][0].weightUsed} lbs</span></span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleWeightChange(-5)}
                className="w-14 h-14 bg-gray-100 dark:bg-[#0a0a0a]/50 border-2 border-gray-300 dark:border-[#C6A45F]/40 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#1E3328] active:scale-95 transition"
              >
                <Minus className="w-6 h-6 text-gray-700 dark:text-[#d8e7de]" />
              </button>
              <input
                type="number"
                value={currentWeight}
                onChange={(e) => handleWeightInput(e.target.value)}
                className="flex-1 px-4 py-4 border-2 border-gray-300 dark:border-[#C6A45F]/40 dark:bg-[#0a0a0a]/50 dark:text-[#d8e7de] rounded-xl text-center text-3xl font-bold focus:border-emerald-500 dark:focus:border-[#FFD700] focus:ring-2 focus:ring-emerald-500 dark:focus:ring-[#FFD700]/30"
                min="0"
                step="5"
              />
              <button
                onClick={() => handleWeightChange(5)}
                className="w-14 h-14 bg-gray-100 dark:bg-[#0a0a0a]/50 border-2 border-gray-300 dark:border-[#C6A45F]/40 rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#1E3328] active:scale-95 transition"
              >
                <Plus className="w-6 h-6 text-gray-700 dark:text-[#d8e7de]" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={() => handleWeightChange(-2.5)}
                className="py-2 bg-gray-50 dark:bg-[#0a0a0a]/30 text-gray-600 dark:text-[#d8e7de]/80 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E3328] text-sm font-medium transition"
              >
                -2.5
              </button>
              <button
                onClick={() => handleWeightChange(-10)}
                className="py-2 bg-gray-50 dark:bg-[#0a0a0a]/30 text-gray-600 dark:text-[#d8e7de]/80 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E3328] text-sm font-medium transition"
              >
                -10
              </button>
              <button
                onClick={() => handleWeightChange(10)}
                className="py-2 bg-gray-50 dark:bg-[#0a0a0a]/30 text-gray-600 dark:text-[#d8e7de]/80 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1E3328] text-sm font-medium transition"
              >
                +10
              </button>
            </div>
          </div>
        )}

        {/* Reps Adjuster */}
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#C6A45F]/25">
          <label className="text-lg font-bold text-gray-900 dark:text-[#d8e7de] mb-3 block">Reps per Set</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRepsChange(-1)}
              className="w-12 h-12 bg-gray-100 dark:bg-[#0a0a0a]/50 border-2 border-gray-300 dark:border-[#C6A45F]/40 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#1E3328] active:scale-95 transition"
            >
              <Minus className="w-5 h-5 text-gray-700 dark:text-[#d8e7de]" />
            </button>
            <input
              type="number"
              value={currentRepsValue}
              onChange={(e) => handleRepsInput(e.target.value)}
              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-[#C6A45F]/40 dark:bg-[#0a0a0a]/50 dark:text-[#d8e7de] rounded-lg text-center text-2xl font-bold focus:border-emerald-500 dark:focus:border-[#FFD700] focus:ring-2 focus:ring-emerald-500 dark:focus:ring-[#FFD700]/30"
              min="1"
            />
            <button
              onClick={() => handleRepsChange(1)}
              className="w-12 h-12 bg-gray-100 dark:bg-[#0a0a0a]/50 border-2 border-gray-300 dark:border-[#C6A45F]/40 rounded-lg flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#1E3328] active:scale-95 transition"
            >
              <Plus className="w-5 h-5 text-gray-700 dark:text-[#d8e7de]" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-2 text-center">
            Target: {exercise.reps} reps
          </p>
        </div>

        {/* Sets Tracker */}
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-[#C6A45F]/25">
          <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de] mb-4">Complete Your Sets</h3>
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
                      : 'bg-gray-100 dark:bg-[#0a0a0a]/50 text-gray-700 dark:text-[#d8e7de] hover:bg-gray-200 dark:hover:bg-[#1E3328] active:scale-95'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      Set {setNum} Complete
                    </>
                  ) : (
                    <>
                      <div className="w-6 h-6 rounded-full border-2 border-gray-400 dark:border-[#d8e7de]/40" />
                      Set {setNum} - {currentRepsValue} reps
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Progress indicator */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#C6A45F]/25">
            <div className="flex justify-between text-sm text-gray-600 dark:text-[#d8e7de]/80 mb-2">
              <span>Progress</span>
              <span className="font-semibold">{completed.length} of {exercise.sets} sets</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-[#0a0a0a]/50 rounded-full h-3">
              <div 
                className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(completed.length / exercise.sets) * 100}%` }}
              />
            </div>
          </div>

          {/* Skip Exercise Button */}
          <button
            onClick={handleSkipExercise}
            className="w-full mt-3 py-2 text-gray-500 dark:text-[#d8e7de]/60 hover:text-gray-700 dark:hover:text-[#d8e7de] text-sm font-medium"
          >
            Skip this exercise
          </button>
        </div>
      </div>

      {/* Next Exercise Button - Fixed at bottom */}
      {isExerciseComplete() && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1E3328] border-t border-gray-200 dark:border-[#C6A45F]/25 shadow-lg">
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
