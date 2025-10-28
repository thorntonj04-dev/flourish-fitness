import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Trash2, Camera, Shield, BarChart3, Target, Menu, X, ChevronRight, Award, Heart, TrendingUp, Play, Pause, Check, Plus, Minus, Video, Calendar, Clock, Trophy, Save, Edit2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove, update, query as dbQuery, orderByChild, equalTo, onValue } from 'firebase/database';
import { auth, db, storage } from './firebase';
import Tesseract from 'tesseract.js';

// ============================================
// WORKOUT COMPONENTS - START
// ============================================

// Exercise Library Manager
function ExerciseLibrary({ onSelectExercise, selectedExercises = [] }) {
  const [exercises, setExercises] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    description: '',
    videoUrl: '',
    muscleGroup: 'chest'
  });
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const exercisesRef = dbRef(db, 'exercises');
      const snapshot = await get(exercisesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const exerciseList = Object.entries(data).map(([id, ex]) => ({ id, ...ex }));
        setExercises(exerciseList);
      }
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please upload a video file');
      return;
    }

    setUploadingVideo(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, `exercise-videos/${fileName}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      setNewExercise({ ...newExercise, videoUrl: downloadURL });
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) {
      alert('Please enter an exercise name');
      return;
    }

    try {
      const exercisesRef = dbRef(db, 'exercises');
      const newExerciseRef = push(exercisesRef);
      await set(newExerciseRef, {
        ...newExercise,
        createdAt: new Date().toISOString()
      });
      
      setNewExercise({ name: '', description: '', videoUrl: '', muscleGroup: 'chest' });
      setShowAddForm(false);
      loadExercises();
    } catch (error) {
      console.error('Error adding exercise:', error);
      alert('Failed to add exercise');
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (!confirm('Delete this exercise? This will affect all workouts using it.')) return;
    
    try {
      await remove(dbRef(db, `exercises/${exerciseId}`));
      loadExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      alert('Failed to delete exercise');
    }
  };

  const muscleGroups = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'mobility'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Exercise Library</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Exercise
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Exercise name"
            value={newExercise.name}
            onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            placeholder="Description / Instructions"
            value={newExercise.description}
            onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows="2"
          />
          <select
            value={newExercise.muscleGroup}
            onChange={(e) => setNewExercise({ ...newExercise, muscleGroup: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            {muscleGroups.map(group => (
              <option key={group} value={group}>{group.charAt(0).toUpperCase() + group.slice(1)}</option>
            ))}
          </select>
          <div>
            <label className="block text-sm text-gray-600 mb-2">How-to Video (optional)</label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="w-full text-sm"
              disabled={uploadingVideo}
            />
            {uploadingVideo && <p className="text-sm text-emerald-600 mt-1">Uploading...</p>}
            {newExercise.videoUrl && (
              <p className="text-sm text-green-600 mt-1">✓ Video uploaded</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddExercise}
              className="flex-1 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Save Exercise
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewExercise({ name: '', description: '', videoUrl: '', muscleGroup: 'chest' });
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
        {exercises.map(exercise => {
          const isSelected = selectedExercises.some(ex => ex.id === exercise.id);
          return (
            <div
              key={exercise.id}
              className={`p-3 border-2 rounded-lg transition cursor-pointer ${
                isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
              }`}
              onClick={() => onSelectExercise && onSelectExercise(exercise)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{exercise.name}</div>
                  <div className="text-xs text-gray-600 capitalize">{exercise.muscleGroup}</div>
                  {exercise.videoUrl && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                      <Video className="w-3 h-3" />
                      Has video
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteExercise(exercise.id);
                  }}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ADMIN WORKOUT BUILDER
function WorkoutBuilder() {
  const [view, setView] = useState('list');
  const [workouts, setWorkouts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [currentWorkout, setCurrentWorkout] = useState({
    name: '',
    description: '',
    warmup: [],
    work: [],
    cooldown: []
  });
  const [currentSection, setCurrentSection] = useState('warmup');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadWorkouts();
    loadClients();
  }, []);

  const loadWorkouts = async () => {
    try {
      const workoutsRef = dbRef(db, 'workouts');
      const snapshot = await get(workoutsRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const workoutList = Object.entries(data).map(([id, workout]) => ({ id, ...workout }));
        setWorkouts(workoutList);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const loadClients = async () => {
    try {
      const usersRef = dbRef(db, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const clientData = Object.entries(usersData)
          .filter(([id, user]) => user.role === 'client')
          .map(([id, user]) => ({ id, ...user }));
        setClients(clientData);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleSelectExercise = (exercise) => {
    const newExercise = {
      ...exercise,
      sets: 3,
      reps: 10,
      restSeconds: 60,
      notes: ''
    };

    setCurrentWorkout({
      ...currentWorkout,
      [currentSection]: [...currentWorkout[currentSection], newExercise]
    });
  };

  const handleRemoveExercise = (index) => {
    const updated = currentWorkout[currentSection].filter((_, i) => i !== index);
    setCurrentWorkout({
      ...currentWorkout,
      [currentSection]: updated
    });
  };

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...currentWorkout[currentSection]];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentWorkout({
      ...currentWorkout,
      [currentSection]: updated
    });
  };

  const handleSaveWorkout = async () => {
    if (!currentWorkout.name.trim()) {
      alert('Please enter a workout name');
      return;
    }

    try {
      const workoutsRef = dbRef(db, 'workouts');
      const newWorkoutRef = push(workoutsRef);
      await set(newWorkoutRef, {
        ...currentWorkout,
        createdAt: new Date().toISOString()
      });

      setView('list');
      setCurrentWorkout({ name: '', description: '', warmup: [], work: [], cooldown: [] });
      loadWorkouts();
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout');
    }
  };

  const handleAssignWorkout = async (clientId, day) => {
    if (!selectedWorkout) return;

    try {
      const assignmentRef = dbRef(db, `workout-assignments/${clientId}/${day}`);
      await set(assignmentRef, {
        workoutId: selectedWorkout.id,
        workoutName: selectedWorkout.name,
        assignedAt: new Date().toISOString()
      });
      alert(`Workout assigned to ${day}`);
    } catch (error) {
      console.error('Error assigning workout:', error);
      alert('Failed to assign workout');
    }
  };

  if (view === 'create') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setView('list');
            setCurrentWorkout({ name: '', description: '', warmup: [], work: [], cooldown: [] });
          }}
          className="text-emerald-600 hover:text-emerald-700"
        >
          ← Back to Workouts
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">Create New Workout</h2>
          <p className="text-emerald-100">Build a custom workout program</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="space-y-4 mb-6">
            <input
              type="text"
              placeholder="Workout name"
              value={currentWorkout.name}
              onChange={(e) => setCurrentWorkout({ ...currentWorkout, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-medium"
            />
            <textarea
              placeholder="Description (optional)"
              value={currentWorkout.description}
              onChange={(e) => setCurrentWorkout({ ...currentWorkout, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              rows="2"
            />
          </div>

          <button
            onClick={handleSaveWorkout}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save Workout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <ExerciseLibrary
              onSelectExercise={handleSelectExercise}
              selectedExercises={currentWorkout[currentSection]}
            />
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Workout Structure</h3>
              
              <div className="flex gap-2 mb-4">
                {['warmup', 'work', 'cooldown'].map(section => (
                  <button
                    key={section}
                    onClick={() => setCurrentSection(section)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                      currentSection === section
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)} ({currentWorkout[section].length})
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {currentWorkout[currentSection].length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    No exercises added to {currentSection}. Select exercises from the library.
                  </p>
                ) : (
                  currentWorkout[currentSection].map((exercise, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-gray-900">{exercise.name}</div>
                          {exercise.videoUrl && (
                            <a
                              href={exercise.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-emerald-600 flex items-center gap-1 mt-1"
                            >
                              <Video className="w-3 h-3" />
                              View form video
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveExercise(idx)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label className="text-xs text-gray-600">Sets</label>
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => handleUpdateExercise(idx, 'sets', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Reps</label>
                          <input
                            type="number"
                            value={exercise.reps}
                            onChange={(e) => handleUpdateExercise(idx, 'reps', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">Rest (sec)</label>
                          <input
                            type="number"
                            value={exercise.restSeconds}
                            onChange={(e) => handleUpdateExercise(idx, 'restSeconds', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            min="0"
                          />
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={exercise.notes || ''}
                        onChange={(e) => handleUpdateExercise(idx, 'notes', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'assign') {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setView('list');
            setSelectedWorkout(null);
          }}
          className="text-emerald-600 hover:text-emerald-700"
        >
          ← Back to Workouts
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">Assign Workout: {selectedWorkout?.name}</h2>
          <p className="text-emerald-100">Choose clients and days to assign this workout</p>
        </div>

        <div className="grid gap-4">
          {clients.map(client => (
            <div key={client.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{client.name}</div>
                  <div className="text-sm text-gray-600">{client.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    onClick={() => handleAssignWorkout(client.id, day)}
                    className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm"
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Workout Builder</h2>
        <p className="text-emerald-100">Create and manage workout programs for your clients</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setView('create')}
          className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Workout
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Workouts ({workouts.length})</h3>
        {workouts.length === 0 ? (
          <p className="text-gray-600">No workouts created yet. Create your first workout to get started!</p>
        ) : (
          <div className="grid gap-4">
            {workouts.map(workout => (
              <div key={workout.id} className="border border-gray-200 rounded-xl p-4 hover:border-emerald-500 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{workout.name}</h4>
                    {workout.description && (
                      <p className="text-sm text-gray-600 mt-1">{workout.description}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-600">
                      <span>Warmup: {workout.warmup?.length || 0} exercises</span>
                      <span>Work: {workout.work?.length || 0} exercises</span>
                      <span>Cooldown: {workout.cooldown?.length || 0} exercises</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedWorkout(workout);
                        setView('assign');
                      }}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Assign
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this workout?')) {
                          await remove(dbRef(db, `workouts/${workout.id}`));
                          loadWorkouts();
                        }
                      }}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// CLIENT WORKOUT PERFORMER
function WorkoutPerformer({ workout, userId, onComplete, onCancel }) {
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

// CLIENT WORKOUTS MAIN COMPONENT
function MyWorkouts({ user }) {
  const [assignments, setAssignments] = useState({});
  const [workouts, setWorkouts] = useState({});
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isPerforming, setIsPerforming] = useState(false);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadAssignments();
    loadCompletedWorkouts();
  }, [user]);

  const loadAssignments = async () => {
    try {
      const assignmentsRef = dbRef(db, `workout-assignments/${user.uid}`);
      const snapshot = await get(assignmentsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setAssignments(data);

        // Load full workout details
        const workoutIds = Object.values(data).map(a => a.workoutId);
        const uniqueIds = [...new Set(workoutIds)];
        
        const workoutData = {};
        for (const id of uniqueIds) {
          const workoutRef = dbRef(db, `workouts/${id}`);
          const workoutSnap = await get(workoutRef);
          if (workoutSnap.exists()) {
            workoutData[id] = { id, ...workoutSnap.val() };
          }
        }
        setWorkouts(workoutData);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadCompletedWorkouts = async () => {
    try {
      const logsRef = dbRef(db, 'workout-logs');
      const snapshot = await get(logsRef);
      
      if (snapshot.exists()) {
        const allLogs = Object.values(snapshot.val());
        const userLogs = allLogs.filter(log => log.userId === user.uid);
        setCompletedWorkouts(userLogs);

        // Calculate stats
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const thisWeek = userLogs.filter(log => new Date(log.completedAt) > weekAgo).length;
        const thisMonth = userLogs.filter(log => new Date(log.completedAt) > monthAgo).length;

        setStats({
          total: userLogs.length,
          thisWeek: thisWeek,
          thisMonth: thisMonth
        });
      }
    } catch (error) {
      console.error('Error loading workout logs:', error);
    }
  };

  const handleStartWorkout = (workoutId) => {
    const workout = workouts[workoutId];
    if (workout) {
      setSelectedWorkout(workout);
      setIsPerforming(true);
    }
  };

  const handleWorkoutComplete = () => {
    setIsPerforming(false);
    setSelectedWorkout(null);
    loadCompletedWorkouts();
    loadAssignments();
  };

  const isWorkoutCompleted = (day) => {
    const today = new Date().toISOString().split('T')[0];
    return completedWorkouts.some(log => {
      const logDate = new Date(log.completedAt).toISOString().split('T')[0];
      const logDay = new Date(log.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
      return logDate === today && logDay === day;
    });
  };

  if (isPerforming && selectedWorkout) {
    return (
      <div className="max-w-2xl mx-auto">
        <WorkoutPerformer
          workout={selectedWorkout}
          userId={user.uid}
          onComplete={handleWorkoutComplete}
          onCancel={() => {
            if (confirm('Are you sure you want to exit? Your progress will not be saved.')) {
              setIsPerforming(false);
              setSelectedWorkout(null);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">My Workouts</h2>
        <p className="text-emerald-100">Track your training and smash your goals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.thisWeek}</div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.thisMonth}</div>
          <div className="text-sm text-gray-600">This Month</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">This Week's Schedule</h3>
        <div className="grid grid-cols-1 gap-3">
          {daysOfWeek.map(day => {
            const assignment = assignments[day];
            const isCompleted = isWorkoutCompleted(day);
            
            return (
              <div
                key={day}
                className={`p-4 rounded-xl border-2 transition ${
                  isCompleted
                    ? 'bg-green-50 border-green-500'
                    : assignment
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{day}</div>
                    {assignment ? (
                      <div className="text-sm text-gray-600">{assignment.workoutName}</div>
                    ) : (
                      <div className="text-sm text-gray-500">Rest day</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                        ✓ Done
                      </span>
                    )}
                    {assignment && !isCompleted && (
                      <button
                        onClick={() => handleStartWorkout(assignment.workoutId)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Workouts</h3>
        {completedWorkouts.length === 0 ? (
          <p className="text-gray-600">No completed workouts yet. Start your first workout today!</p>
        ) : (
          <div className="space-y-3">
            {completedWorkouts.slice(0, 5).map((log, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{log.workoutName}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(log.completedAt).toLocaleDateString()} • {Math.floor(log.duration / 60)} min
                  </div>
                </div>
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// WORKOUT COMPONENTS - END
// ============================================

import { useState } from 'react';
import { User, Dumbbell, Users, Apple, ChevronRight, Award, Heart, TrendingUp, Menu, X } from 'lucide-react';

function LandingPage({ onLoginClick }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Flourish Fitness</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-gray-700 hover:text-emerald-600 transition">About</a>
              <a href="#services" className="text-gray-700 hover:text-emerald-600 transition">Services</a>
              <a href="#testimonials" className="text-gray-700 hover:text-emerald-600 transition">Success Stories</a>
              <a href="#approach" className="text-gray-700 hover:text-emerald-600 transition">Our Approach</a>
              <button
                onClick={onLoginClick}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:opacity-90 transition"
              >
                Client Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-3">
              <a href="#about" className="block text-gray-700 hover:text-emerald-600 py-2">About</a>
              <a href="#services" className="block text-gray-700 hover:text-emerald-600 py-2">Services</a>
              <a href="#testimonials" className="block text-gray-700 hover:text-emerald-600 py-2">Success Stories</a>
              <a href="#approach" className="block text-gray-700 hover:text-emerald-600 py-2">Our Approach</a>
              <button
                onClick={onLoginClick}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium"
              >
                Client Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="max-w-7xl mx-auto text-center max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Stronger. Healthier. Confident — for Life.
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Flourish Fitness empowers women to build lasting strength, endurance, and confidence through purposeful training, balanced nutrition, and genuine support — no quick fixes, just real transformation that lasts.
          </p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-lg hover:opacity-90 transition"
          >
            Start Your Journey
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">About Flourish Fitness</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Founded by <strong>Lindsey Thornton</strong>, a NASM Certified Personal Trainer and nutrition coach who believes true wellness begins with dedication, balance, and faith. Lindsey’s approach blends science-backed training with heart-led guidance — helping women push past limits, stay consistent, and celebrate every win along the way.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Expert Guidance</h3>
            <p className="text-gray-600">Personalized programs rooted in proven strength and endurance training.</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Whole-Person Wellness</h3>
            <p className="text-gray-600">Focus on physical, nutritional, and spiritual health for lifelong results.</p>
          </div>

          <div className="text-center p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Accountability & Progress</h3>
            <p className="text-gray-600">Stay motivated with structured tracking and encouraging mentorship.</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Training That Meets You Where You Are</h2>
          <p className="text-xl text-gray-600">Coaching designed to help women feel powerful, not pressured.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <User className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">1:1 Personal Training</h3>
            <p className="text-gray-600 mb-4">
              In-person sessions focused on building functional strength, confidence, and endurance — customized to your goals and pace.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <Dumbbell className="w-12 h-12 text-teal-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Online Coaching</h3>
            <p className="text-gray-600 mb-4">
              Fully tailored workouts and nutrition guidance delivered wherever you are, with regular check-ins and support to keep you progressing.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <Users className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Group Fitness</h3>
            <p className="text-gray-600 mb-4">
              Join a community of women chasing progress together. High-energy classes that challenge you and remind you that fitness can be fun.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <Apple className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Nutrition Coaching</h3>
            <p className="text-gray-600 mb-4">
              Learn how to fuel your body to perform, recover, and maintain your results for life — no crash diets, no extremes.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Real Women. Real Wins.</h2>
          <p className="text-xl text-gray-600">Behind every transformation is a story of courage, consistency, and belief.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8">
            <div className="text-4xl mb-4">💪</div>
            <p className="text-gray-700 mb-4 italic">
              "Lindsey changed the way I see fitness. I’ve never been this strong — inside and out."
            </p>
            <div className="font-bold text-gray-900">- Lily</div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-8">
            <div className="text-4xl mb-4">🌟</div>
            <p className="text-gray-700 mb-4 italic">
              "I finally found a routine I can stick with. Her guidance helped me lose weight and keep it off."
            </p>
            <div className="font-bold text-gray-900">- Sophia</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8">
            <div className="text-4xl mb-4">🏋️</div>
            <p className="text-gray-700 mb-4 italic">
              "She pushes hard but with purpose. I complained plenty, but I never quit — and I’ve never looked or felt better."
            </p>
            <div className="font-bold text-gray-900">- John</div>
          </div>
        </div>
      </section>

      {/* Approach Section */}
      <section id="approach" className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">The Flourish Method</h2>
          <p className="text-xl text-gray-600">Sustainable fitness built on strength, balance, and faith.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Progressive Training</h3>
            <p className="text-gray-600 mb-4">
              Rooted in the NASM OPT model, Lindsey helps clients progressively challenge their bodies to build lasting results — not burnout.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Spiritual Mentorship</h3>
            <p className="text-gray-600 mb-4">
              True transformation starts within. Lindsey brings faith and encouragement into every session, helping you find peace, purpose, and pride in your journey.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Flourish?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Start your transformation with a coach who believes in your strength, celebrates your progress, and guides you toward lifelong wellness.
          </p>
          <button
            onClick={onLoginClick}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-xl font-medium text-lg hover:bg-gray-50 transition"
          >
            Join Today
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Flourish Fitness</span>
          </div>
          <p className="text-gray-400">Empowering women through strength, nutrition, and faith-based coaching.</p>
          <div className="mt-4 text-sm text-gray-500">© 2025 Flourish Fitness. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;


// ADMIN SETUP COMPONENT
function AdminSetup({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkUserDocument();
  }, [user]);

  const checkUserDocument = async () => {
    setChecking(true);
    try {
      const userRef = dbRef(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDebugInfo({
          exists: true,
          data: data,
          hasRole: !!data.role,
          role: data.role || 'NONE'
        });
        console.log('📄 User Data:', data);
      } else {
        setDebugInfo({
          exists: false,
          data: null,
          hasRole: false,
          role: 'NONE'
        });
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setDebugInfo({
        exists: false,
        error: error.message
      });
    } finally {
      setChecking(false);
    }
  };

  const makeUserAdmin = async () => {
    if (!confirm('Make this account an admin? This cannot be easily undone.')) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const userRef = dbRef(db, `users/${user.uid}`);
      await set(userRef, {
        email: user.email,
        name: user.email.split('@')[0],
        role: 'admin',
        createdAt: new Date().toISOString(),
        macroGoals: { protein: 150, carbs: 200, fats: 50 }
      });
      
      setMessage('✅ Success! Refreshing...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('❌ Error:', error);
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        <div className="text-center mb-6">
          <Shield className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Needed</h2>
          <p className="text-gray-600">Your account needs to be configured with a role.</p>
        </div>

        {checking ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Checking account status...</p>
          </div>
        ) : (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>📧 Email:</strong> {user.email}
              </p>
              {debugInfo && (
                <>
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>📄 Document Exists:</strong> {debugInfo.exists ? '✅ Yes' : '❌ No'}
                  </p>
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>👤 Current Role:</strong> {debugInfo.role}
                  </p>
                </>
              )}
            </div>

            <button
              onClick={makeUserAdmin}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition mb-4"
            >
              {loading ? 'Setting up...' : '👑 Make This Account Admin'}
            </button>

            {message && (
              <div className={`p-3 rounded-lg text-sm text-center mb-4 ${
                message.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <button
              onClick={checkUserDocument}
              disabled={loading}
              className="w-full py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 mb-4"
            >
              🔄 Refresh Status
            </button>
          </>
        )}

        <button
          onClick={() => signOut(auth)}
          className="w-full mt-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function AuthScreen({ onBackToLanding }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Check if this is the first user
        const usersRef = dbRef(db, 'users');
        const snapshot = await get(usersRef);
        const isFirstUser = !snapshot.exists();
        
        await set(dbRef(db, `users/${userCredential.user.uid}`), {
          email,
          name,
          role: isFirstUser ? 'admin' : 'client',
          createdAt: new Date().toISOString(),
          macroGoals: { protein: 150, carbs: 200, fats: 50 }
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBackToLanding}
          className="text-emerald-200 hover:text-white mb-4 flex items-center gap-2"
        >
          ← Back to Home
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Flourish Fitness</h1>
          <p className="text-gray-300">Transform your fitness journey</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>

          <div className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAuth();
              }}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-emerald-200 hover:text-white transition text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// MANAGE CLIENTS
function ManageClients() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const usersRef = dbRef(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const clientData = Object.entries(usersData)
        .filter(([id, user]) => user.role === 'client')
        .map(([id, user]) => ({ id, ...user }));
      setClients(clientData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Manage Clients</h2>
        <p className="text-emerald-100">View and manage all your clients</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Clients ({clients.length})</h3>
        {clients.length === 0 ? (
          <p className="text-gray-600">No clients yet. Clients will appear here when they sign up.</p>
        ) : (
          <div className="space-y-3">
            {clients.map(client => (
              <div key={client.id} className="p-4 border border-gray-200 rounded-xl hover:border-emerald-500 transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-600">{client.email}</div>
                    <div className="text-xs text-gray-500">Joined: {new Date(client.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// REPORTS
function Reports() {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ totalClients: 0, activeToday: 0, totalPhotos: 0, totalNutritionLogs: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load clients
      const usersRef = dbRef(db, 'users');
      const usersSnapshot = await get(usersRef);
      let clientCount = 0;
      
      if (usersSnapshot.exists()) {
        const usersData = usersSnapshot.val();
        clientCount = Object.values(usersData).filter(user => user.role === 'client').length;
      }

      // Load photos
      const photosRef = dbRef(db, 'progress-photos');
      const photosSnapshot = await get(photosRef);
      const photoCount = photosSnapshot.exists() ? Object.keys(photosSnapshot.val()).length : 0;

      // Load nutrition logs
      const logsRef = dbRef(db, 'nutrition-logs');
      const logsSnapshot = await get(logsRef);
      const logCount = logsSnapshot.exists() ? Object.keys(logsSnapshot.val()).length : 0;

      // Check active today (nutrition logs from today)
      const today = new Date().toISOString().split('T')[0];
      let activeToday = 0;
      if (logsSnapshot.exists()) {
        const logs = Object.values(logsSnapshot.val());
        const uniqueUsers = new Set(logs.filter(log => log.date === today).map(log => log.userId));
        activeToday = uniqueUsers.size;
      }

      setStats({
        totalClients: clientCount,
        activeToday: activeToday,
        totalPhotos: photoCount,
        totalNutritionLogs: logCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-emerald-100">Track client progress and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Clients</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalClients}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Active Today</div>
          <div className="text-3xl font-bold text-emerald-600">{stats.activeToday}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Photos</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalPhotos}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Nutrition Logs</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalNutritionLogs}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h3>
        <p className="text-gray-600">More detailed analytics and charts coming soon!</p>
      </div>
    </div>
  );
}

// CLIENT GOALS
function MyGoals({ user }) {
  const [macroGoals, setMacroGoals] = useState({ protein: 150, carbs: 200, fats: 50 });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    const userRef = dbRef(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists() && snapshot.val().macroGoals) {
      setMacroGoals(snapshot.val().macroGoals);
    }
  };

  const saveGoals = async () => {
    try {
      await update(dbRef(db, `users/${user.uid}`), {
        macroGoals: macroGoals
      });
      setEditing(false);
      alert('Goals updated!');
    } catch (error) {
      alert('Failed to update goals');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">My Goals</h2>
        <p className="text-emerald-100">Set and track your fitness goals</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Macro Goals</h3>
          <button
            onClick={() => setEditing(!editing)}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            {editing ? 'Cancel' : 'Edit Goals'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={macroGoals.protein}
                  onChange={(e) => setMacroGoals({...macroGoals, protein: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={macroGoals.carbs}
                  onChange={(e) => setMacroGoals({...macroGoals, carbs: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Fats (g)</label>
                <input
                  type="number"
                  value={macroGoals.fats}
                  onChange={(e) => setMacroGoals({...macroGoals, fats: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <button
              onClick={saveGoals}
              className="w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              Save Goals
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Protein Goal</div>
              <div className="text-3xl font-bold text-emerald-600">{macroGoals.protein}g</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Carbs Goal</div>
              <div className="text-3xl font-bold text-blue-600">{macroGoals.carbs}g</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Fats Goal</div>
              <div className="text-3xl font-bold text-yellow-600">{macroGoals.fats}g</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Tips for Success</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-1">✓</span>
            <span>Track your meals consistently in the Nutrition section</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-1">✓</span>
            <span>Take progress photos weekly to see your transformation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-1">✓</span>
            <span>Adjust your macro goals as you progress with your trainer</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// NUTRITION LOGGER
function NutritionLogger({ user }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [macroGoals, setMacroGoals] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [todayTotals, setTodayTotals] = useState({ protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    loadUserData();
    loadTodayEntries();
  }, [user]);

  const loadUserData = async () => {
    const userRef = dbRef(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists() && snapshot.val().macroGoals) {
      setMacroGoals(snapshot.val().macroGoals);
    }
  };

  const loadTodayEntries = async () => {
    const today = new Date().toISOString().split('T')[0];
    const logsRef = dbRef(db, 'nutrition-logs');
    const snapshot = await get(logsRef);
    
    if (snapshot.exists()) {
      const allLogs = snapshot.val();
      const entries = Object.entries(allLogs)
        .filter(([key, log]) => log.userId === user.uid && log.date === today)
        .map(([key, log]) => ({ id: key, ...log }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTodayEntries(entries);
      
      const totals = entries.reduce((acc, entry) => ({
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fats: acc.fats + (entry.fats || 0)
      }), { protein: 0, carbs: 0, fats: 0 });
      setTodayTotals(totals);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const extractMacros = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    try {
      const result = await Tesseract.recognize(selectedFile, 'eng');
      const text = result.data.text;
      const protein = extractNumber(text, ['protein', 'pro']);
      const carbs = extractNumber(text, ['carb', 'carbohydrate']);
      const fats = extractNumber(text, ['fat', 'fats']);

      setExtractedData({
        protein: protein || 0,
        carbs: carbs || 0,
        fats: fats || 0,
        rawText: text
      });
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to extract text. Please try again or enter manually.');
    } finally {
      setProcessing(false);
    }
  };

  const extractNumber = (text, keywords) => {
    const lines = text.toLowerCase().split('\n');
    for (const keyword of keywords) {
      for (const line of lines) {
        if (line.includes(keyword)) {
          const numbers = line.match(/\d+(\.\d+)?/g);
          if (numbers && numbers.length > 0) {
            return parseFloat(numbers[0]);
          }
        }
      }
    }
    return 0;
  };

  const handleSaveEntry = async () => {
    if (!extractedData) return;

    try {
      const logsRef = dbRef(db, 'nutrition-logs');
      const newLogRef = push(logsRef);
      await set(newLogRef, {
        userId: user.uid,
        userName: user.email,
        protein: extractedData.protein,
        carbs: extractedData.carbs,
        fats: extractedData.fats,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      setExtractedData(null);
      loadTodayEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry.');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await remove(dbRef(db, `nutrition-logs/${entryId}`));
      loadTodayEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const getProgress = (current, goal) => {
    return goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Nutrition Tracking</h2>
        <p className="text-emerald-100">Track your daily macros and reach your goals</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Progress</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">Protein</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(todayTotals.protein)}g</div>
            <div className="text-xs text-gray-500">Goal: {macroGoals.protein}g</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${getProgress(todayTotals.protein, macroGoals.protein)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Carbs</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(todayTotals.carbs)}g</div>
            <div className="text-xs text-gray-500">Goal: {macroGoals.carbs}g</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${getProgress(todayTotals.carbs, macroGoals.carbs)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Fats</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(todayTotals.fats)}g</div>
            <div className="text-xs text-gray-500">Goal: {macroGoals.fats}g</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${getProgress(todayTotals.fats, macroGoals.fats)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Log Food Entry</h3>
        
        {!extractedData ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              {previewUrl ? (
                <div className="space-y-4">
                  <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="px-4 py-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                    <button
                      onClick={extractMacros}
                      disabled={processing}
                      className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Extract Macros'}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <div className="text-gray-600">Upload nutrition label</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-3">Extracted Macros</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={extractedData.protein}
                    onChange={(e) => setExtractedData({...extractedData, protein: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={extractedData.carbs}
                    onChange={(e) => setExtractedData({...extractedData, carbs: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={extractedData.fats}
                    onChange={(e) => setExtractedData({...extractedData, fats: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setExtractedData(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Save Entry
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Entries ({todayEntries.length})</h3>
        {todayEntries.length === 0 ? (
          <p className="text-gray-600">No entries yet today. Log your first meal!</p>
        ) : (
          <div className="space-y-3">
            {todayEntries.map(entry => (
              <div key={entry.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">Protein:</span>
                    <span className="font-medium text-gray-900 ml-1">{Math.round(entry.protein)}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Carbs:</span>
                    <span className="font-medium text-gray-900 ml-1">{Math.round(entry.carbs)}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fats:</span>
                    <span className="font-medium text-gray-900 ml-1">{Math.round(entry.fats)}g</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ADMIN NUTRITION VIEW
function AdminNutrition() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientLogs, setClientLogs] = useState([]);
  const [macroGoals, setMacroGoals] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [editingGoals, setEditingGoals] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const usersRef = dbRef(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const clientData = Object.entries(usersData)
        .filter(([id, user]) => user.role === 'client')
        .map(([id, user]) => ({ id, ...user }));
      setClients(clientData);
    }
  };

  const loadClientLogs = async (clientId, clientData) => {
    setSelectedClient(clientData);
    setMacroGoals(clientData.macroGoals || { protein: 150, carbs: 200, fats: 50 });
    
    const logsRef = dbRef(db, 'nutrition-logs');
    const snapshot = await get(logsRef);
    
    if (snapshot.exists()) {
      const allLogs = snapshot.val();
      const logs = Object.entries(allLogs)
        .filter(([key, log]) => log.userId === clientId)
        .map(([key, log]) => ({ id: key, ...log }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const groupedByDate = logs.reduce((acc, log) => {
        if (!acc[log.date]) {
          acc[log.date] = [];
        }
        acc[log.date].push(log);
        return acc;
      }, {});
      
      const dailyTotals = Object.keys(groupedByDate).map(date => ({
        date,
        entries: groupedByDate[date],
        totals: groupedByDate[date].reduce((acc, entry) => ({
          protein: acc.protein + (entry.protein || 0),
          carbs: acc.carbs + (entry.carbs || 0),
          fats: acc.fats + (entry.fats || 0)
        }), { protein: 0, carbs: 0, fats: 0 })
      }));
      
      setClientLogs(dailyTotals);
    }
  };

  const handleSaveGoals = async () => {
    if (!selectedClient) return;
    try {
      await update(dbRef(db, `users/${selectedClient.id}`), {
        macroGoals: macroGoals
      });
      setEditingGoals(false);
      alert('Macro goals updated!');
    } catch (error) {
      console.error('Error updating goals:', error);
      alert('Failed to update goals.');
    }
  };

  if (selectedClient) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedClient(null);
            setClientLogs([]);
          }}
          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
        >
          ← Back to Clients
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">{selectedClient.name}'s Nutrition</h2>
          <p className="text-emerald-100">{clientLogs.length} days logged</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Macro Goals</h3>
            <button
              onClick={() => setEditingGoals(!editingGoals)}
              className="text-emerald-600 hover:text-emerald-700 text-sm"
            >
              {editingGoals ? 'Cancel' : 'Edit Goals'}
            </button>
          </div>
          
          {editingGoals ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={macroGoals.protein}
                    onChange={(e) => setMacroGoals({...macroGoals, protein: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={macroGoals.carbs}
                    onChange={(e) => setMacroGoals({...macroGoals, carbs: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={macroGoals.fats}
                    onChange={(e) => setMacroGoals({...macroGoals, fats: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveGoals}
                className="w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Save Goals
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600">Protein Goal</div>
                <div className="text-2xl font-bold text-gray-900">{macroGoals.protein}g</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Carbs Goal</div>
                <div className="text-2xl font-bold text-gray-900">{macroGoals.carbs}g</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Fats Goal</div>
                <div className="text-2xl font-bold text-gray-900">{macroGoals.fats}g</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Daily Timeline</h3>
          {clientLogs.length === 0 ? (
            <p className="text-gray-600">No nutrition logs yet.</p>
          ) : (
            <div className="space-y-3">
              {clientLogs.map(dayLog => (
                <div key={dayLog.date} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">
                      {new Date(dayLog.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-600">{dayLog.entries.length} entries</div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Protein:</span>
                      <span className="font-medium text-gray-900 ml-1">{Math.round(dayLog.totals.protein)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Carbs:</span>
                      <span className="font-medium text-gray-900 ml-1">{Math.round(dayLog.totals.carbs)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fats:</span>
                      <span className="font-medium text-gray-900 ml-1">{Math.round(dayLog.totals.fats)}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Client Nutrition</h2>
        <p className="text-emerald-100">View and manage client macro tracking</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Select a Client</h3>
        {clients.length === 0 ? (
          <p className="text-gray-600">No clients yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => loadClientLogs(client.id, client)}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-600">{client.email}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// PHOTO UPLOAD
function PhotoUpload({ user }) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, [user]);

  const loadPhotos = async () => {
    try {
      const photosRef = dbRef(db, 'progress-photos');
      const snapshot = await get(photosRef);
      
      if (snapshot.exists()) {
        const allPhotos = snapshot.val();
        const photoData = Object.entries(allPhotos)
          .filter(([key, photo]) => photo.userId === user.uid)
          .map(([key, photo]) => ({ id: key, ...photo }))
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setPhotos(photoData);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const fileRef = storageRef(storage, `progress-photos/${user.uid}/${fileName}`);
      
      await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(fileRef);

      const photosRef = dbRef(db, 'progress-photos');
      const newPhotoRef = push(photosRef);
      await set(newPhotoRef, {
        userId: user.uid,
        userName: user.displayName || user.email,
        imageUrl: downloadURL,
        storagePath: `progress-photos/${user.uid}/${fileName}`,
        uploadedAt: new Date().toISOString(),
        weekNumber: photos.length + 1
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      loadPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const fileRef = storageRef(storage, photo.storagePath);
      await deleteObject(fileRef);
      await remove(dbRef(db, `progress-photos/${photo.id}`));
      loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo.');
    }
  };

  const getWeekComparison = () => {
    if (photos.length < 2) return null;
    return {
      first: photos[photos.length - 1],
      latest: photos[0]
    };
  };

  const comparison = getWeekComparison();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Progress Photos</h2>
        <p className="text-emerald-100">Track your transformation week by week</p>
      </div>

      {comparison && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Week 1</div>
              <img 
                src={comparison.first.imageUrl} 
                alt="Week 1" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-2">
                {new Date(comparison.first.uploadedAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">
                Week {comparison.latest.weekNumber} (Latest)
              </div>
              <img 
                src={comparison.latest.imageUrl} 
                alt="Latest" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-2">
                {new Date(comparison.latest.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upload New Photo</h3>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            {previewUrl ? (
              <div className="space-y-4">
                <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <div className="text-gray-600">Click to select a photo</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition"
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Your Photos ({photos.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img 
                src={photo.imageUrl} 
                alt={`Week ${photo.weekNumber}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition rounded-lg flex items-center justify-center">
                <button
                  onClick={() => handleDelete(photo)}
                  className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Week {photo.weekNumber}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(photo.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ADMIN PHOTOS
function AdminPhotos() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPhotos, setClientPhotos] = useState([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const usersRef = dbRef(db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const clientData = Object.entries(usersData)
          .filter(([id, user]) => user.role === 'client')
          .map(([id, user]) => ({ id, ...user }));
        setClients(clientData);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadClientPhotos = async (clientId) => {
    try {
      const photosRef = dbRef(db, 'progress-photos');
      const snapshot = await get(photosRef);
      
      if (snapshot.exists()) {
        const allPhotos = snapshot.val();
        const photoData = Object.entries(allPhotos)
          .filter(([key, photo]) => photo.userId === clientId)
          .map(([key, photo]) => ({ id: key, ...photo }))
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setClientPhotos(photoData);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    loadClientPhotos(client.id);
  };

  const getWeekComparison = () => {
    if (clientPhotos.length < 2) return null;
    return {
      first: clientPhotos[clientPhotos.length - 1],
      latest: clientPhotos[0]
    };
  };

  const comparison = getWeekComparison();

  if (!selectedClient) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">Client Progress Photos</h2>
          <p className="text-emerald-100">View and track all client transformations</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Select a Client</h3>
          {clients.length === 0 ? (
            <p className="text-gray-600">No clients yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-600">{client.email}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => {
          setSelectedClient(null);
          setClientPhotos([]);
        }}
        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
      >
        ← Back to Clients
      </button>

      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">{selectedClient.name}'s Progress</h2>
        <p className="text-emerald-100">{clientPhotos.length} photos uploaded</p>
      </div>

      {comparison && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Progress Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Week 1</div>
              <img 
                src={comparison.first.imageUrl} 
                alt="Week 1" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-2">
                {new Date(comparison.first.uploadedAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">
                Week {comparison.latest.weekNumber} (Latest)
              </div>
              <img 
                src={comparison.latest.imageUrl} 
                alt="Latest" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-2">
                {new Date(comparison.latest.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Photos ({clientPhotos.length})</h3>
        {clientPhotos.length === 0 ? (
          <p className="text-gray-600">No photos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {clientPhotos.map((photo) => (
              <div key={photo.id}>
                <img 
                  src={photo.imageUrl} 
                  alt={`Week ${photo.weekNumber}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="text-xs text-gray-600 mt-1">
                  Week {photo.weekNumber}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(photo.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// MAIN APP
export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setShowLanding(false);
        setShowAuth(false);
        
        try {
          const userRef = dbRef(db, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            const role = userData.role || 'admin';
            setUserRole(role);
            setNeedsSetup(false);
          } else {
            await set(userRef, {
              email: firebaseUser.email,
              name: firebaseUser.email.split('@')[0],
              role: 'admin',
              createdAt: new Date().toISOString(),
              macroGoals: { protein: 150, carbs: 200, fats: 50 }
            });
            setUserRole('admin');
            setNeedsSetup(false);
          }
        } catch (error) {
          console.error('ERROR:', error);
          setNeedsSetup(true);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setNeedsSetup(false);
        setShowLanding(true);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setCurrentView('dashboard');
    setShowLanding(true);
  };

  const handleLoginClick = () => {
    setShowLanding(false);
    setShowAuth(true);
  };

  const handleBackToLanding = () => {
    setShowAuth(false);
    setShowLanding(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 mx-auto text-emerald-600 animate-pulse mb-4" />
          <div className="text-emerald-600 text-xl font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (showLanding && !user) {
    return <LandingPage onLoginClick={handleLoginClick} />;
  }

  if (showAuth && !user) {
    return <AuthScreen onBackToLanding={handleBackToLanding} />;
  }

  if (needsSetup) {
    return <AdminSetup user={user} />;
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="text-red-600 text-xl font-bold mb-4">Configuration Error</div>
          <p className="text-gray-600 mb-4">Unable to load user role.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 mr-2"
          >
            Refresh
          </button>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const navItems = userRole === 'admin' ? [
    { id: 'dashboard', label: 'Overview', icon: Users },
    { id: 'workouts', label: 'Workout Builder', icon: Dumbbell },
    { id: 'clients', label: 'Manage Clients', icon: Users },
    { id: 'nutrition', label: 'Client Nutrition', icon: Apple },
    { id: 'photos', label: 'Client Photos', icon: Image },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: User },
    { id: 'workouts', label: 'My Workouts', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'photos', label: 'My Progress', icon: Image },
    { id: 'goals', label: 'My Goals', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Flourish Fitness</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user.email}</div>
              <div className="text-xs text-emerald-600 capitalize font-medium">
                {userRole === 'admin' ? '👑 Admin' : '💪 Client'}
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 hidden md:block">
          <nav className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    currentView === item.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold">Welcome back!</h2>
                  <p className="text-emerald-100">Your fitness journey starts here</p>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Account Status</div>
                  <div className="text-2xl font-bold text-gray-900 capitalize mb-4">
                    {userRole === 'admin' ? '👑 Admin/Trainer Account' : '💪 Client Account'}
                  </div>
                  <p className="text-gray-600">
                    {userRole === 'admin' 
                      ? 'You have full access to manage clients, create workouts, track nutrition, and view progress photos.'
                      : 'Track your workouts, nutrition, upload progress photos, and stay on top of your fitness goals.'}
                  </p>
                </div>
              </div>
            )}

            {currentView === 'workouts' && (
              userRole === 'admin' ? <WorkoutBuilder /> : <MyWorkouts user={user} />
            )}

            {currentView === 'clients' && userRole === 'admin' && <ManageClients />}
            {currentView === 'reports' && userRole === 'admin' && <Reports />}
            {currentView === 'goals' && userRole === 'client' && <MyGoals user={user} />}

            {currentView === 'nutrition' && (
              userRole === 'admin' ? <AdminNutrition /> : <NutritionLogger user={user} />
            )}

            {currentView === 'photos' && (
              userRole === 'admin' ? <AdminPhotos /> : <PhotoUpload user={user} />
            )}
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex justify-around">
          {navItems.slice(0, 4).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                  currentView === item.id ? 'text-emerald-500' : 'text-gray-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
