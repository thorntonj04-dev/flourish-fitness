import React, { useState, useEffect } from 'react';
import { Plus, Save, Calendar, Trash2, Video, GripVertical, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { ref as dbRef, get, set, push, remove } from 'firebase/database';
import { db } from '../../firebase';
import ExerciseLibrary from '../workout/ExerciseLibrary';

export default function WorkoutBuilder() {
  const [view, setView] = useState('list');
  const [workouts, setWorkouts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [currentWorkout, setCurrentWorkout] = useState({
    name: '',
    description: '',
    exercises: [] // Changed to single array with section property
  });
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState({});

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

  const handleSelectExercise = (exercise, section = 'work') => {
    const newExercise = {
      ...exercise,
      section: section,
      sets: 3,
      reps: 10,
      restSeconds: 60,
      recommendedWeight: 0,
      notes: '',
      tempId: Date.now() // Temporary ID for tracking before save
    };

    setCurrentWorkout({
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, newExercise]
    });
    setShowExerciseLibrary(false);
  };

  const handleDuplicateExercise = (index) => {
    const exercise = currentWorkout.exercises[index];
    const duplicated = {
      ...exercise,
      tempId: Date.now()
    };
    const newExercises = [...currentWorkout.exercises];
    newExercises.splice(index + 1, 0, duplicated);
    setCurrentWorkout({
      ...currentWorkout,
      exercises: newExercises
    });
  };

  const handleRemoveExercise = (index) => {
    const updated = currentWorkout.exercises.filter((_, i) => i !== index);
    setCurrentWorkout({
      ...currentWorkout,
      exercises: updated
    });
  };

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...currentWorkout.exercises];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentWorkout({
      ...currentWorkout,
      exercises: updated
    });
  };

  const handleMoveExercise = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === currentWorkout.exercises.length - 1)
    ) {
      return;
    }

    const newExercises = [...currentWorkout.exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newExercises[index], newExercises[targetIndex]] = [newExercises[targetIndex], newExercises[index]];
    
    setCurrentWorkout({
      ...currentWorkout,
      exercises: newExercises
    });
  };

  const toggleExerciseExpanded = (index) => {
    setExpandedExercises({
      ...expandedExercises,
      [index]: !expandedExercises[index]
    });
  };

  const handleSaveWorkout = async () => {
    if (!currentWorkout.name.trim()) {
      alert('Please enter a workout name');
      return;
    }

    if (currentWorkout.exercises.length === 0) {
      alert('Please add at least one exercise');
      return;
    }

    try {
      // Convert exercises array to legacy format for backwards compatibility
      const warmup = currentWorkout.exercises.filter(ex => ex.section === 'warmup');
      const work = currentWorkout.exercises.filter(ex => ex.section === 'work');
      const cooldown = currentWorkout.exercises.filter(ex => ex.section === 'cooldown');

      const workoutsRef = dbRef(db, 'workouts');
      const newWorkoutRef = push(workoutsRef);
      await set(newWorkoutRef, {
        name: currentWorkout.name,
        description: currentWorkout.description,
        exercises: currentWorkout.exercises, // New format
        warmup, // Legacy format
        work, // Legacy format
        cooldown, // Legacy format
        createdAt: new Date().toISOString()
      });

      alert('Workout saved successfully!');
      setView('list');
      setCurrentWorkout({ name: '', description: '', exercises: [] });
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

  const getExercisesBySection = (section) => {
    return currentWorkout.exercises.filter(ex => ex.section === section);
  };

  const getSectionIcon = (section) => {
    switch (section) {
      case 'warmup': return '🔥';
      case 'work': return '💪';
      case 'cooldown': return '🧘';
      default: return '•';
    }
  };

  if (view === 'create') {
    return (
      <div className="space-y-6 pb-20">
        <button
          onClick={() => {
            if (currentWorkout.exercises.length > 0) {
              if (!confirm('Discard this workout? All unsaved changes will be lost.')) {
                return;
              }
            }
            setView('list');
            setCurrentWorkout({ name: '', description: '', exercises: [] });
          }}
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          ← Back to Workouts
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">Create New Workout</h2>
          <p className="text-emerald-100">Build a custom workout program</p>
        </div>

        {/* Workout Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Workout Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Workout Name *</label>
              <input
                type="text"
                placeholder="e.g., Upper Body Strength"
                value={currentWorkout.name}
                onChange={(e) => setCurrentWorkout({ ...currentWorkout, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
              <textarea
                placeholder="Brief description of workout focus or goals"
                value={currentWorkout.description}
                onChange={(e) => setCurrentWorkout({ ...currentWorkout, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows="2"
              />
            </div>
          </div>
        </div>

        {/* Exercise List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Exercises ({currentWorkout.exercises.length})
            </h3>
            <button
              onClick={() => setShowExerciseLibrary(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add Exercise
            </button>
          </div>

          {currentWorkout.exercises.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-600 mb-4">No exercises added yet</p>
              <button
                onClick={() => setShowExerciseLibrary(true)}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Exercise
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentWorkout.exercises.map((exercise, idx) => (
                <div
                  key={exercise.tempId || idx}
                  className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-emerald-300 transition"
                >
                  {/* Exercise Header */}
                  <div
                    className="p-4 bg-gray-50 cursor-pointer"
                    onClick={() => toggleExerciseExpanded(idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveExercise(idx, 'up');
                          }}
                          disabled={idx === 0}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveExercise(idx, 'down');
                          }}
                          disabled={idx === currentWorkout.exercises.length - 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getSectionIcon(exercise.section)}</span>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {exercise.section}
                          </span>
                        </div>
                        <div className="font-bold text-gray-900">{exercise.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.recommendedWeight > 0 && ` @ ${exercise.recommendedWeight} lbs`}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateExercise(idx);
                          }}
                          className="p-2 hover:bg-gray-200 rounded-lg"
                          title="Duplicate exercise"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Remove this exercise?')) {
                              handleRemoveExercise(idx);
                            }
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Exercise Details (Expanded) */}
                  {expandedExercises[idx] && (
                    <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                      {/* Section Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Workout Section
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {['warmup', 'work', 'cooldown'].map(section => (
                            <button
                              key={section}
                              onClick={() => handleUpdateExercise(idx, 'section', section)}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                                exercise.section === section
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {getSectionIcon(section)} {section.charAt(0).toUpperCase() + section.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sets, Reps, Rest */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Sets</label>
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) => handleUpdateExercise(idx, 'sets', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-emerald-500"
                            min="1"
                            max="20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Reps</label>
                          <input
                            type="number"
                            value={exercise.reps}
                            onChange={(e) => handleUpdateExercise(idx, 'reps', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-emerald-500"
                            min="1"
                            max="100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Rest (sec)</label>
                          <input
                            type="number"
                            value={exercise.restSeconds}
                            onChange={(e) => handleUpdateExercise(idx, 'restSeconds', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-emerald-500"
                            min="0"
                            max="600"
                            step="15"
                          />
                        </div>
                      </div>

                      {/* Recommended Weight */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recommended Weight (lbs) - Optional
                        </label>
                        <input
                          type="number"
                          value={exercise.recommendedWeight || 0}
                          onChange={(e) => handleUpdateExercise(idx, 'recommendedWeight', parseInt(e.target.value) || 0)}
                          placeholder="Leave at 0 if not applicable"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          min="0"
                          step="5"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Suggest a starting weight for this exercise (optional)
                        </p>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exercise Notes (optional)
                        </label>
                        <textarea
                          value={exercise.notes || ''}
                          onChange={(e) => handleUpdateExercise(idx, 'notes', e.target.value)}
                          placeholder="Special instructions, form cues, modifications..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                          rows="2"
                        />
                      </div>

                      {/* Video Link */}
                      {exercise.videoUrl && (
                        <a
                          href={exercise.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                          <Video className="w-4 h-4" />
                          View form video
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary by Section */}
        {currentWorkout.exercises.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Workout Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-2xl font-bold text-gray-900">
                  {getExercisesBySection('warmup').length}
                </div>
                <div className="text-sm text-gray-600">Warmup</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl mb-1">💪</div>
                <div className="text-2xl font-bold text-gray-900">
                  {getExercisesBySection('work').length}
                </div>
                <div className="text-sm text-gray-600">Main Work</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl mb-1">🧘</div>
                <div className="text-2xl font-bold text-gray-900">
                  {getExercisesBySection('cooldown').length}
                </div>
                <div className="text-sm text-gray-600">Cooldown</div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button - Fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:relative md:border-0">
          <button
            onClick={handleSaveWorkout}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2 shadow-lg"
          >
            <Save className="w-6 h-6" />
            Save Workout
          </button>
        </div>

        {/* Exercise Library Modal */}
        {showExerciseLibrary && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Exercise Library</h3>
                  <button
                    onClick={() => setShowExerciseLibrary(false)}
                    className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Select an exercise to add to your workout
                </p>
              </div>
              <div className="p-6 overflow-y-auto">
                <ExerciseLibrary
                  onSelectExercise={(exercise) => handleSelectExercise(exercise, 'work')}
                  selectedExercises={currentWorkout.exercises}
                />
              </div>
            </div>
          </div>
        )}
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
          className="text-emerald-600 hover:text-emerald-700 font-medium"
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
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
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
                    className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm font-medium transition"
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
          className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create New Workout
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Your Workouts ({workouts.length})</h3>
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No workouts created yet. Create your first workout to get started!</p>
            <button
              onClick={() => setView('create')}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Workout
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {workouts.map(workout => {
              const exerciseCount = workout.exercises?.length || 
                ((workout.warmup?.length || 0) + (workout.work?.length || 0) + (workout.cooldown?.length || 0));
              
              return (
                <div key={workout.id} className="border border-gray-200 rounded-xl p-4 hover:border-emerald-500 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg">{workout.name}</h4>
                      {workout.description && (
                        <p className="text-sm text-gray-600 mt-1">{workout.description}</p>
                      )}
                      <div className="flex gap-4 mt-3 text-sm">
                        <span className="text-gray-600">
                          🔥 Warmup: {workout.exercises?.filter(e => e.section === 'warmup').length || workout.warmup?.length || 0}
                        </span>
                        <span className="text-gray-600">
                          💪 Work: {workout.exercises?.filter(e => e.section === 'work').length || workout.work?.length || 0}
                        </span>
                        <span className="text-gray-600">
                          🧘 Cooldown: {workout.exercises?.filter(e => e.section === 'cooldown').length || workout.cooldown?.length || 0}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        Total exercises: {exerciseCount}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedWorkout(workout);
                          setView('assign');
                        }}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center gap-2 text-sm font-medium"
                      >
                        <Calendar className="w-4 h-4" />
                        Assign
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete "${workout.name}"? This cannot be undone.`)) {
                            await remove(dbRef(db, `workouts/${workout.id}`));
                            loadWorkouts();
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
