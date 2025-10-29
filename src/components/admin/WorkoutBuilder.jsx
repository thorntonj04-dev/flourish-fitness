import React, { useState, useEffect } from 'react';
import { Plus, Save, Calendar, Trash2, Video, GripVertical, Copy, ChevronDown, ChevronUp, Edit, FileText, Star } from 'lucide-react';
import { ref as dbRef, get, set, push, remove, update } from 'firebase/database';
import { db } from '../../firebase';
import ExerciseLibrary from '../workout/ExerciseLibrary';

// WORKOUT TEMPLATES - Default templates
const DEFAULT_WORKOUT_TEMPLATES = [
  {
    name: 'Push Day (Chest, Shoulders, Triceps)',
    description: 'Classic push workout focusing on chest, shoulders, and triceps',
    isDefault: true,
    exercises: [
      { name: 'Treadmill Incline Walk', section: 'warmup', sets: 1, reps: 5, restSeconds: 0, recommendedWeight: 0, notes: '5 minutes at moderate pace' },
      { name: 'Arm Circles', section: 'warmup', sets: 2, reps: 15, restSeconds: 30, recommendedWeight: 0, notes: 'Forward and backward' },
      { name: 'Barbell Bench Press', section: 'work', sets: 4, reps: 8, restSeconds: 120, recommendedWeight: 135, notes: 'Primary chest exercise' },
      { name: 'Incline Dumbbell Press', section: 'work', sets: 3, reps: 10, restSeconds: 90, recommendedWeight: 50, notes: 'Upper chest focus' },
      { name: 'Overhead Press (Barbell)', section: 'work', sets: 3, reps: 8, restSeconds: 90, recommendedWeight: 95, notes: '' },
      { name: 'Lateral Raises', section: 'work', sets: 3, reps: 15, restSeconds: 60, recommendedWeight: 15, notes: 'Side delts' },
      { name: 'Tricep Pushdown (Rope)', section: 'work', sets: 3, reps: 12, restSeconds: 60, recommendedWeight: 0, notes: '' },
      { name: 'Overhead Tricep Extension', section: 'work', sets: 3, reps: 12, restSeconds: 60, recommendedWeight: 30, notes: '' },
      { name: 'Chest Stretch', section: 'cooldown', sets: 1, reps: 1, restSeconds: 0, recommendedWeight: 0, notes: 'Hold 30 seconds each side' },
    ]
  },
  {
    name: 'Pull Day (Back, Biceps)',
    description: 'Complete back and biceps workout',
    isDefault: true,
    exercises: [
      { name: 'Rowing Machine', section: 'warmup', sets: 1, reps: 5, restSeconds: 0, recommendedWeight: 0, notes: '5 minutes light rowing' },
      { name: 'Band Pull-Aparts', section: 'warmup', sets: 2, reps: 20, restSeconds: 30, recommendedWeight: 0, notes: 'Activate rear delts' },
      { name: 'Deadlift', section: 'work', sets: 4, reps: 6, restSeconds: 180, recommendedWeight: 225, notes: 'Maintain neutral spine' },
      { name: 'Pull-Ups', section: 'work', sets: 4, reps: 8, restSeconds: 120, recommendedWeight: 0, notes: 'Use assistance if needed' },
      { name: 'Barbell Row', section: 'work', sets: 3, reps: 10, restSeconds: 90, recommendedWeight: 135, notes: '' },
      { name: 'Face Pulls', section: 'work', sets: 3, reps: 15, restSeconds: 60, recommendedWeight: 0, notes: 'Focus on rear delts' },
      { name: 'Barbell Curl', section: 'work', sets: 3, reps: 10, restSeconds: 60, recommendedWeight: 60, notes: '' },
      { name: 'Hammer Curl', section: 'work', sets: 3, reps: 12, restSeconds: 60, recommendedWeight: 30, notes: '' },
      { name: "Child's Pose", section: 'cooldown', sets: 1, reps: 1, restSeconds: 0, recommendedWeight: 0, notes: 'Hold 60 seconds' },
    ]
  },
  {
    name: 'Leg Day',
    description: 'Complete lower body workout',
    isDefault: true,
    exercises: [
      { name: 'Stationary Bike', section: 'warmup', sets: 1, reps: 5, restSeconds: 0, recommendedWeight: 0, notes: '5 minutes light cycling' },
      { name: 'Bodyweight Squats', section: 'warmup', sets: 2, reps: 15, restSeconds: 30, recommendedWeight: 0, notes: 'Focus on form' },
      { name: 'Barbell Back Squat', section: 'work', sets: 4, reps: 8, restSeconds: 180, recommendedWeight: 185, notes: 'Go to parallel or below' },
      { name: 'Romanian Deadlift', section: 'work', sets: 3, reps: 10, restSeconds: 90, recommendedWeight: 135, notes: 'Hamstring focus' },
      { name: 'Leg Press', section: 'work', sets: 3, reps: 12, restSeconds: 90, recommendedWeight: 270, notes: '' },
      { name: 'Walking Lunges', section: 'work', sets: 3, reps: 12, restSeconds: 60, recommendedWeight: 25, notes: 'Each leg' },
      { name: 'Leg Curls', section: 'work', sets: 3, reps: 15, restSeconds: 60, recommendedWeight: 0, notes: '' },
      { name: 'Standing Calf Raises', section: 'work', sets: 4, reps: 15, restSeconds: 45, recommendedWeight: 0, notes: '' },
      { name: 'Hamstring Stretch', section: 'cooldown', sets: 1, reps: 1, restSeconds: 0, recommendedWeight: 0, notes: 'Hold 30 seconds each leg' },
      { name: 'Quad Stretch', section: 'cooldown', sets: 1, reps: 1, restSeconds: 0, recommendedWeight: 0, notes: 'Hold 30 seconds each leg' },
    ]
  },
  {
    name: 'Upper Body Strength',
    description: 'Compound upper body movements',
    isDefault: true,
    exercises: [
      { name: 'Arm Circles', section: 'warmup', sets: 2, reps: 20, restSeconds: 30, recommendedWeight: 0, notes: 'Dynamic warmup' },
      { name: 'Barbell Bench Press', section: 'work', sets: 5, reps: 5, restSeconds: 180, recommendedWeight: 155, notes: 'Heavy strength work' },
      { name: 'Overhead Press (Barbell)', section: 'work', sets: 4, reps: 6, restSeconds: 150, recommendedWeight: 95, notes: '' },
      { name: 'Barbell Row', section: 'work', sets: 4, reps: 8, restSeconds: 120, recommendedWeight: 135, notes: '' },
      { name: 'Pull-Ups', section: 'work', sets: 3, reps: 10, restSeconds: 120, recommendedWeight: 0, notes: '' },
      { name: 'Tricep Dips', section: 'work', sets: 3, reps: 12, restSeconds: 90, recommendedWeight: 0, notes: '' },
      { name: 'Chest Doorway Stretch', section: 'cooldown', sets: 1, reps: 1, restSeconds: 0, recommendedWeight: 0, notes: '30 seconds' },
    ]
  },
  {
    name: 'Full Body Beginner',
    description: 'Perfect introduction to strength training',
    isDefault: true,
    exercises: [
      { name: 'Jumping Jacks', section: 'warmup', sets: 2, reps: 20, restSeconds: 30, recommendedWeight: 0, notes: 'Get heart rate up' },
      { name: 'Goblet Squat', section: 'work', sets: 3, reps: 10, restSeconds: 90, recommendedWeight: 25, notes: 'Learn squat pattern' },
      { name: 'Push-Ups', section: 'work', sets: 3, reps: 10, restSeconds: 60, recommendedWeight: 0, notes: 'Modify on knees if needed' },
      { name: 'Dumbbell Rows', section: 'work', sets: 3, reps: 10, restSeconds: 60, recommendedWeight: 20, notes: 'Each arm' },
      { name: 'Dumbbell Shoulder Press', section: 'work', sets: 3, reps: 10, restSeconds: 60, recommendedWeight: 15, notes: '' },
      { name: 'Plank', section: 'work', sets: 3, reps: 1, restSeconds: 60, recommendedWeight: 0, notes: 'Hold 30-45 seconds' },
      { name: 'Glute Bridge', section: 'work', sets: 3, reps: 15, restSeconds: 45, recommendedWeight: 0, notes: '' },
      { name: 'Cat-Cow Stretch', section: 'cooldown', sets: 1, reps: 10, restSeconds: 0, recommendedWeight: 0, notes: 'Slow and controlled' },
    ]
  },
  {
    name: 'HIIT Cardio & Core',
    description: 'High intensity cardio with core work',
    isDefault: true,
    exercises: [
      { name: 'High Knees', section: 'warmup', sets: 2, reps: 30, restSeconds: 30, recommendedWeight: 0, notes: '30 seconds' },
      { name: 'Burpees', section: 'work', sets: 5, reps: 10, restSeconds: 60, recommendedWeight: 0, notes: 'Max effort' },
      { name: 'Mountain Climbers', section: 'work', sets: 4, reps: 20, restSeconds: 45, recommendedWeight: 0, notes: 'Each leg' },
      { name: 'Jump Rope', section: 'work', sets: 4, reps: 1, restSeconds: 60, recommendedWeight: 0, notes: '1 minute' },
      { name: 'Plank', section: 'work', sets: 3, reps: 1, restSeconds: 30, recommendedWeight: 0, notes: '45-60 seconds' },
      { name: 'Bicycle Crunches', section: 'work', sets: 3, reps: 20, restSeconds: 30, recommendedWeight: 0, notes: 'Each side' },
      { name: 'Russian Twists', section: 'work', sets: 3, reps: 30, restSeconds: 30, recommendedWeight: 0, notes: 'Total reps' },
      { name: 'Cobra Stretch', section: 'cooldown', sets: 1, reps: 1, restSeconds: 0, recommendedWeight: 0, notes: 'Hold 30 seconds' },
    ]
  },
];

export default function WorkoutBuilder() {
  const [view, setView] = useState('list');
  const [workouts, setWorkouts] = useState([]);
  const [clients, setClients] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [currentWorkout, setCurrentWorkout] = useState({
    name: '',
    description: '',
    exercises: []
  });
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState({});
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadWorkouts();
    loadClients();
    loadCustomTemplates();
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

  const loadCustomTemplates = async () => {
    try {
      const templatesRef = dbRef(db, 'workout-templates');
      const snapshot = await get(templatesRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const templateList = Object.entries(data).map(([id, template]) => ({ id, ...template }));
        setCustomTemplates(templateList);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (currentWorkout.exercises.length === 0) {
      alert('Cannot save an empty workout as a template');
      return;
    }

    try {
      const templatesRef = dbRef(db, 'workout-templates');
      const newTemplateRef = push(templatesRef);
      await set(newTemplateRef, {
        name: templateName,
        description: templateDescription,
        exercises: currentWorkout.exercises,
        isDefault: false,
        createdAt: new Date().toISOString()
      });

      alert('Template saved successfully!');
      setShowSaveAsTemplate(false);
      setTemplateName('');
      setTemplateDescription('');
      loadCustomTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;

    try {
      await remove(dbRef(db, `workout-templates/${templateId}`));
      loadCustomTemplates();
      alert('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
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
      useDuration: false,
      durationMinutes: 0,
      durationSeconds: 30,
      tempId: Date.now()
    };

    setCurrentWorkout({
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, newExercise]
    });
    setShowExerciseLibrary(false);
  };

  const handleUseTemplate = (template) => {
    if (currentWorkout.exercises.length > 0) {
      if (!confirm('This will replace your current workout. Continue?')) {
        return;
      }
    }
    
    const exercisesWithTempIds = template.exercises.map(ex => ({
      ...ex,
      tempId: Date.now() + Math.random()
    }));

    setCurrentWorkout({
      name: template.name,
      description: template.description,
      exercises: exercisesWithTempIds
    });
    setShowTemplates(false);
  };

  const handleEditWorkout = (workout) => {
    // Convert legacy format to new format if needed
    let exercises = [];
    if (workout.exercises && Array.isArray(workout.exercises)) {
      exercises = workout.exercises.map(ex => ({
        ...ex,
        tempId: Date.now() + Math.random()
      }));
    } else {
      // Legacy format conversion
      const warmup = (workout.warmup || []).map(ex => ({ ...ex, section: 'warmup', tempId: Date.now() + Math.random() }));
      const work = (workout.work || []).map(ex => ({ ...ex, section: 'work', tempId: Date.now() + Math.random() }));
      const cooldown = (workout.cooldown || []).map(ex => ({ ...ex, section: 'cooldown', tempId: Date.now() + Math.random() }));
      exercises = [...warmup, ...work, ...cooldown];
    }

    setCurrentWorkout({
      name: workout.name,
      description: workout.description || '',
      exercises: exercises
    });
    setEditingWorkoutId(workout.id);
    setView('create');
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

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Add a slight transparency to show it's being dragged
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    const newExercises = [...currentWorkout.exercises];
    const draggedExercise = newExercises[draggedIndex];
    
    // Remove from old position
    newExercises.splice(draggedIndex, 1);
    
    // Insert at new position
    newExercises.splice(dropIndex, 0, draggedExercise);
    
    setCurrentWorkout({
      ...currentWorkout,
      exercises: newExercises
    });
    
    setDraggedIndex(null);
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

      const workoutData = {
        name: currentWorkout.name,
        description: currentWorkout.description,
        exercises: currentWorkout.exercises, // New format
        warmup, // Legacy format
        work, // Legacy format
        cooldown, // Legacy format
        updatedAt: new Date().toISOString()
      };

      if (editingWorkoutId) {
        // Update existing workout
        const workoutRef = dbRef(db, `workouts/${editingWorkoutId}`);
        await update(workoutRef, workoutData);
        alert('Workout updated successfully!');
      } else {
        // Create new workout
        const workoutsRef = dbRef(db, 'workouts');
        const newWorkoutRef = push(workoutsRef);
        await set(newWorkoutRef, {
          ...workoutData,
          createdAt: new Date().toISOString()
        });
        alert('Workout saved successfully!');
      }

      setView('list');
      setCurrentWorkout({ name: '', description: '', exercises: [] });
      setEditingWorkoutId(null);
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

  // Combine default and custom templates
  const allTemplates = [...DEFAULT_WORKOUT_TEMPLATES, ...customTemplates];

  if (view === 'create') {
    return (
      <div className="space-y-6 pb-20">
        <button
          onClick={() => {
            if (currentWorkout.exercises.length > 0) {
              if (!confirm('Discard changes? All unsaved changes will be lost.')) {
                return;
              }
            }
            setView('list');
            setCurrentWorkout({ name: '', description: '', exercises: [] });
            setEditingWorkoutId(null);
          }}
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          ← Back to Workouts
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">
            {editingWorkoutId ? 'Edit Workout' : 'Create New Workout'}
          </h2>
          <p className="text-emerald-100">
            {editingWorkoutId ? 'Update your workout program' : 'Build a custom workout program'}
          </p>
        </div>

        {/* Workout Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Workout Details</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2 text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                Use Template
              </button>
              {currentWorkout.exercises.length > 0 && (
                <button
                  onClick={() => {
                    setTemplateName(currentWorkout.name);
                    setTemplateDescription(currentWorkout.description);
                    setShowSaveAsTemplate(true);
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 text-sm font-medium"
                >
                  <Star className="w-4 h-4" />
                  Save as Template
                </button>
              )}
            </div>
          </div>
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
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 inline-flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Start from Template
                </button>
                <button
                  onClick={() => setShowExerciseLibrary(true)}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Exercise
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {currentWorkout.exercises.map((exercise, idx) => (
                <div
                  key={exercise.tempId || idx}
                  className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-emerald-300 transition"
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                >
                  {/* Exercise Header */}
                  <div
                    className="p-4 bg-gray-50 cursor-move"
                    onClick={() => toggleExerciseExpanded(idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <GripVertical className="w-5 h-5 text-gray-400" title="Drag to reorder" />
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
                          {exercise.useDuration ? (
                            <>
                              {exercise.durationMinutes > 0 && `${exercise.durationMinutes}m `}
                              {exercise.durationSeconds}s duration
                            </>
                          ) : (
                            <>
                              {exercise.sets} sets × {exercise.reps} reps
                              {exercise.recommendedWeight > 0 && ` @ ${exercise.recommendedWeight} lbs`}
                            </>
                          )}
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

                      {/* Duration Mode Toggle */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exercise.useDuration || false}
                            onChange={(e) => handleUpdateExercise(idx, 'useDuration', e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Use Time Duration</div>
                            <div className="text-sm text-gray-600">
                              {exercise.useDuration 
                                ? 'Exercise is based on time duration' 
                                : 'Switch to time-based exercise (e.g., plank, running)'}
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Duration Inputs (shown when useDuration is true) */}
                      {exercise.useDuration ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Minutes</label>
                              <input
                                type="number"
                                value={exercise.durationMinutes || 0}
                                onChange={(e) => handleUpdateExercise(idx, 'durationMinutes', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500"
                                min="0"
                                max="60"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Seconds</label>
                              <input
                                type="number"
                                value={exercise.durationSeconds || 0}
                                onChange={(e) => handleUpdateExercise(idx, 'durationSeconds', parseInt(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500"
                                min="0"
                                max="59"
                              />
                            </div>
                          </div>
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rest Between Rounds (sec)</label>
                            <input
                              type="number"
                              value={exercise.restSeconds}
                              onChange={(e) => handleUpdateExercise(idx, 'restSeconds', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500"
                              min="0"
                              max="600"
                              step="15"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Sets, Reps, Rest (shown when useDuration is false) */}
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
                        </>
                      )}

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
            {editingWorkoutId ? 'Update Workout' : 'Save Workout'}
          </button>
        </div>

        {/* Save as Template Modal */}
        {showSaveAsTemplate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Save as Template</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., My Custom Push Day"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                  <textarea
                    placeholder="What makes this template special?"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                    rows="2"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveAsTemplate}
                    className="flex-1 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium"
                  >
                    Save Template
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveAsTemplate(false);
                      setTemplateName('');
                      setTemplateDescription('');
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Selection Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">Workout Templates</h3>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-gray-600 hover:text-gray-900 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Choose a pre-built template to get started quickly
                </p>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="grid gap-4">
                  {/* Custom Templates Section */}
                  {customTemplates.length > 0 && (
                    <>
                      <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Your Custom Templates
                      </h4>
                      {customTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="border-2 border-yellow-200 rounded-xl p-5 hover:border-yellow-400 transition"
                        >
                          <div className="flex justify-between items-start">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => handleUseTemplate(template)}
                            >
                              <h4 className="font-bold text-lg text-gray-900 mb-2">{template.name}</h4>
                              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                              <div className="flex gap-4 text-sm text-gray-500">
                                <span>🔥 {template.exercises.filter(e => e.section === 'warmup').length} warmup</span>
                                <span>💪 {template.exercises.filter(e => e.section === 'work').length} work</span>
                                <span>🧘 {template.exercises.filter(e => e.section === 'cooldown').length} cooldown</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete template"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-gray-300 my-4"></div>
                      <h4 className="font-bold text-lg text-gray-900">Default Templates</h4>
                    </>
                  )}

                  {/* Default Templates */}
                  {DEFAULT_WORKOUT_TEMPLATES.map((template, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-gray-200 rounded-xl p-5 hover:border-emerald-500 transition cursor-pointer"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <h4 className="font-bold text-lg text-gray-900 mb-2">{template.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>🔥 {template.exercises.filter(e => e.section === 'warmup').length} warmup</span>
                        <span>💪 {template.exercises.filter(e => e.section === 'work').length} work</span>
                        <span>🧘 {template.exercises.filter(e => e.section === 'cooldown').length} cooldown</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
                        onClick={() => handleEditWorkout(workout)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
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
