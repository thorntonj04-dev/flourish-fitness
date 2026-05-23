import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Save, Trash2, Video, GripVertical, Copy, ChevronDown, ChevronUp, Edit, FileText, Star, X, Eye, Dumbbell, Search, ArrowUp, ArrowDown } from 'lucide-react';
import { ref as dbRef, get, set, push, remove, update } from 'firebase/database';
import { db, auth } from '../../firebase';
import ExerciseLibrary from '../workout/ExerciseLibrary';
import FormWorkoutSession from '../client/FormWorkoutSession';
import { EXERCISE_LIBRARY } from '../../data/exerciseLibrary';

const DEFAULT_WORKOUT_TEMPLATES = [
  {
    name: 'Push Day (Chest, Shoulders, Triceps)',
    description: 'Classic push workout focusing on chest, shoulders, and triceps',
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
  const [customTemplates, setCustomTemplates] = useState([]);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [currentWorkout, setCurrentWorkout] = useState({ name: '', description: '', exercises: [] });
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState({});
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [previewWorkout, setPreviewWorkout] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState('');
  const [quickAddMuscle, setQuickAddMuscle] = useState('all');
  const quickAddSearchRef = useRef(null);

  useEffect(() => {
    loadWorkouts();
    loadCustomTemplates();
  }, []);

  useEffect(() => {
    if (showQuickAdd) {
      setTimeout(() => quickAddSearchRef.current?.focus(), 150);
    }
  }, [showQuickAdd]);

  const filteredLibrary = useMemo(() => {
    let list = EXERCISE_LIBRARY;
    if (quickAddMuscle !== 'all') list = list.filter(ex => ex.group === quickAddMuscle);
    if (quickAddSearch.trim()) {
      const q = quickAddSearch.toLowerCase();
      list = list.filter(ex => ex.name.toLowerCase().includes(q));
    }
    return list;
  }, [quickAddSearch, quickAddMuscle]);

  const handleAddFromLibrary = (name, group) => {
    const newExercise = {
      name,
      muscleGroup: group,
      section: 'work',
      sets: 3,
      reps: 10,
      restSeconds: 60,
      recommendedWeight: 0,
      notes: '',
      useDuration: false,
      durationMinutes: 0,
      durationSeconds: 30,
      tempId: Date.now() + Math.random(),
    };
    setCurrentWorkout(prev => ({ ...prev, exercises: [...prev.exercises, newExercise] }));
    setQuickAddSearch('');
  };

  const loadWorkouts = async () => {
    try {
      const workoutsRef = dbRef(db, 'workouts');
      const snapshot = await get(workoutsRef);
      if (snapshot.exists()) {
        const workoutList = Object.entries(snapshot.val()).map(([id, w]) => ({ id, ...w }));
        setWorkouts(workoutList);
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
    }
  };

  const loadCustomTemplates = async () => {
    try {
      const templatesRef = dbRef(db, 'workout-templates');
      const snapshot = await get(templatesRef);
      if (snapshot.exists()) {
        const templateList = Object.entries(snapshot.val()).map(([id, t]) => ({ id, ...t }));
        setCustomTemplates(templateList);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) { alert('Please enter a template name'); return; }
    if (currentWorkout.exercises.length === 0) { alert('Cannot save an empty workout as a template'); return; }

    try {
      const newRef = push(dbRef(db, 'workout-templates'));
      await set(newRef, {
        name: templateName,
        description: templateDescription,
        exercises: currentWorkout.exercises,
        createdAt: new Date().toISOString()
      });
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
    if (!confirm('Delete this template?')) return;
    try {
      await remove(dbRef(db, `workout-templates/${templateId}`));
      loadCustomTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleSelectExercise = (exercise) => {
    const newExercise = {
      ...exercise,
      section: 'work',
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
    setCurrentWorkout({ ...currentWorkout, exercises: [...currentWorkout.exercises, newExercise] });
    setShowExerciseLibrary(false);
  };

  const handleUseTemplate = (template) => {
    if (currentWorkout.exercises.length > 0) {
      if (!confirm('This will replace your current workout. Continue?')) return;
    }
    setCurrentWorkout({
      name: template.name,
      description: template.description,
      exercises: template.exercises.map(ex => ({ ...ex, tempId: Date.now() + Math.random() }))
    });
    setShowTemplates(false);
  };

  const handleEditWorkout = (workout) => {
    let exercises = [];
    if (workout.exercises && Array.isArray(workout.exercises)) {
      exercises = workout.exercises.map(ex => ({ ...ex, tempId: Date.now() + Math.random() }));
    } else {
      exercises = [
        ...(workout.warmup || []).map(ex => ({ ...ex, section: 'warmup', tempId: Date.now() + Math.random() })),
        ...(workout.work || []).map(ex => ({ ...ex, section: 'work', tempId: Date.now() + Math.random() })),
        ...(workout.cooldown || []).map(ex => ({ ...ex, section: 'cooldown', tempId: Date.now() + Math.random() })),
      ];
    }
    setCurrentWorkout({ name: workout.name, description: workout.description || '', exercises });
    setEditingWorkoutId(workout.id);
    setView('create');
  };

  const moveExercise = (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= currentWorkout.exercises.length) return;
    const newExercises = [...currentWorkout.exercises];
    const [moved] = newExercises.splice(idx, 1);
    newExercises.splice(newIdx, 0, moved);
    setCurrentWorkout({ ...currentWorkout, exercises: newExercises });
  };

  const pairAsSuperset = (idxA, idxB) => {
    const groupId = `ss_${Date.now()}`;
    let updated = currentWorkout.exercises.map((ex, i) =>
      i === idxA || i === idxB ? { ...ex, supersetGroupId: groupId } : ex
    );
    // Pull the second exercise in the pair to sit right after the first
    const firstIdx = Math.min(idxA, idxB);
    const secondIdx = Math.max(idxA, idxB);
    if (secondIdx !== firstIdx + 1) {
      const [secondEx] = updated.splice(secondIdx, 1);
      updated.splice(firstIdx + 1, 0, secondEx);
    }
    setCurrentWorkout({ ...currentWorkout, exercises: updated });
  };

  const unpairSuperset = (idx) => {
    const groupId = currentWorkout.exercises[idx]?.supersetGroupId;
    if (!groupId) return;
    const updated = currentWorkout.exercises.map(ex =>
      ex.supersetGroupId === groupId ? { ...ex, supersetGroupId: undefined } : ex
    );
    setCurrentWorkout({ ...currentWorkout, exercises: updated });
  };

  const handleDuplicateExercise = (index) => {
    const newExercises = [...currentWorkout.exercises];
    newExercises.splice(index + 1, 0, { ...currentWorkout.exercises[index], tempId: Date.now() });
    setCurrentWorkout({ ...currentWorkout, exercises: newExercises });
  };

  const handleRemoveExercise = (index) => {
    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.filter((_, i) => i !== index)
    });
  };

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...currentWorkout.exercises];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentWorkout({ ...currentWorkout, exercises: updated });
  };

  const toggleExerciseExpanded = (index) => {
    setExpandedExercises({ ...expandedExercises, [index]: !expandedExercises[index] });
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const newExercises = [...currentWorkout.exercises];
    const [dragged] = newExercises.splice(draggedIndex, 1);
    newExercises.splice(dropIndex, 0, dragged);
    setCurrentWorkout({ ...currentWorkout, exercises: newExercises });
    setDraggedIndex(null);
  };

  const handleSaveWorkout = async () => {
    if (!currentWorkout.name.trim()) { alert('Please enter a workout name'); return; }
    if (currentWorkout.exercises.length === 0) { alert('Please add at least one exercise'); return; }

    try {
      const workoutData = {
        name: currentWorkout.name,
        description: currentWorkout.description,
        exercises: currentWorkout.exercises,
        warmup: currentWorkout.exercises.filter(ex => ex.section === 'warmup'),
        work: currentWorkout.exercises.filter(ex => ex.section === 'work'),
        cooldown: currentWorkout.exercises.filter(ex => ex.section === 'cooldown'),
        updatedAt: new Date().toISOString()
      };

      if (editingWorkoutId) {
        await update(dbRef(db, `workouts/${editingWorkoutId}`), workoutData);
      } else {
        const newRef = push(dbRef(db, 'workouts'));
        await set(newRef, { ...workoutData, createdAt: new Date().toISOString() });
      }

      setView('list');
      setCurrentWorkout({ name: '', description: '', exercises: [] });
      setEditingWorkoutId(null);
      loadWorkouts();
    } catch (error) {
      console.error('Error saving workout:', error);
      if (error?.code === 'PERMISSION_DENIED') {
        alert('Permission denied — Firebase rules may have expired. Go to Firebase Console → Realtime Database → Rules and re-publish them.');
      } else {
        alert(`Failed to save workout: ${error?.message || error}`);
      }
    }
  };

  const getSectionIcon = (section) => {
    if (section === 'warmup') return '🔥';
    if (section === 'work') return '💪';
    return '🧘';
  };

  const countBySection = (section) => currentWorkout.exercises.filter(ex => ex.section === section).length;

  // ─── CREATE / EDIT VIEW ──────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="space-y-4 pb-24">
        <button
          onClick={() => {
            if (currentWorkout.exercises.length > 0 && !confirm('Discard changes?')) return;
            setView('list');
            setCurrentWorkout({ name: '', description: '', exercises: [] });
            setEditingWorkoutId(null);
          }}
          className="text-emerald-600 dark:text-emerald-400 font-medium text-sm py-2"
        >
          ← Back to Workouts
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white">
          <h2 className="text-xl font-bold">{editingWorkoutId ? 'Edit Workout' : 'New Workout'}</h2>
          <p className="text-emerald-100 text-sm mt-1">Build the exercises for this training day</p>
        </div>

        {/* Name + Description */}
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-5 border border-gray-200 dark:border-[#C6A45F]/25">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">Details</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="px-3 py-2 bg-purple-500 text-white rounded-lg flex items-center gap-1.5 text-sm font-medium min-h-[44px]"
              >
                <FileText className="w-4 h-4" />
                Template
              </button>
              {currentWorkout.exercises.length > 0 && (
                <button
                  onClick={() => {
                    setTemplateName(currentWorkout.name);
                    setTemplateDescription(currentWorkout.description);
                    setShowSaveAsTemplate(true);
                  }}
                  className="px-3 py-2 bg-yellow-500 text-white rounded-lg flex items-center gap-1.5 text-sm font-medium min-h-[44px]"
                >
                  <Star className="w-4 h-4" />
                  Save
                </button>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Workout name (e.g., Push Day)"
              value={currentWorkout.name}
              onChange={(e) => setCurrentWorkout({ ...currentWorkout, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-base font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
            />
            <textarea
              placeholder="Description (optional)"
              value={currentWorkout.description}
              onChange={(e) => setCurrentWorkout({ ...currentWorkout, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
              rows="2"
            />
          </div>
        </div>

        {/* Exercises */}
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-5 border border-gray-200 dark:border-[#C6A45F]/25">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900 dark:text-[#d8e7de]">
              Exercises ({currentWorkout.exercises.length})
            </h3>
            <button
              onClick={() => { setShowQuickAdd(p => !p); setQuickAddSearch(''); setQuickAddMuscle('all'); }}
              className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium min-h-[44px] transition ${
                showQuickAdd
                  ? 'bg-gray-200 dark:bg-[#0a0a0a]/60 text-gray-700 dark:text-[#d8e7de]/80'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {showQuickAdd ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {showQuickAdd ? 'Close' : 'Add'}
            </button>
          </div>

          {/* ── Quick Add Panel ─────────────────────────────────── */}
          {showQuickAdd && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-[#0a0a0a]/40 rounded-2xl border border-gray-200 dark:border-[#C6A45F]/20 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  ref={quickAddSearchRef}
                  type="text"
                  placeholder="Search 500+ exercises…"
                  value={quickAddSearch}
                  onChange={e => setQuickAddSearch(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl dark:bg-[#0a0a0a] dark:text-[#d8e7de] dark:placeholder-[#d8e7de]/30 text-base focus:ring-2 focus:ring-emerald-500"
                />
                {quickAddSearch && (
                  <button onClick={() => setQuickAddSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Muscle group chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                {['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'mobility'].map(g => (
                  <button
                    key={g}
                    onClick={() => setQuickAddMuscle(g)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition min-h-[32px] ${
                      quickAddMuscle === g
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-[#1E3328] text-gray-600 dark:text-[#d8e7de]/60 border border-gray-200 dark:border-[#C6A45F]/25'
                    }`}
                  >
                    {g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>

              {/* Results */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {filteredLibrary.length === 0 ? (
                  quickAddSearch.trim() ? (
                    <button
                      onClick={() => handleAddFromLibrary(quickAddSearch.trim(), quickAddMuscle !== 'all' ? quickAddMuscle : 'core')}
                      className="w-full p-3 border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold text-left active:bg-emerald-50 dark:active:bg-emerald-900/20"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add "{quickAddSearch.trim()}" as custom exercise
                    </button>
                  ) : (
                    <p className="text-center text-xs text-gray-400 dark:text-[#d8e7de]/40 py-4">No exercises found</p>
                  )
                ) : (
                  <>
                    {filteredLibrary.slice(0, 25).map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => handleAddFromLibrary(ex.name, ex.group)}
                        className="w-full flex items-center gap-3 p-3 bg-white dark:bg-[#1E3328] border border-gray-200 dark:border-[#C6A45F]/20 rounded-xl active:bg-emerald-50 dark:active:bg-emerald-900/20 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-[#d8e7de] text-sm truncate">{ex.name}</div>
                          <div className="text-xs text-gray-400 dark:text-[#d8e7de]/40 capitalize mt-0.5">{ex.group}</div>
                        </div>
                        <Plus className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      </button>
                    ))}
                    {quickAddSearch.trim() && !filteredLibrary.some(ex => ex.name.toLowerCase() === quickAddSearch.toLowerCase()) && (
                      <button
                        onClick={() => handleAddFromLibrary(quickAddSearch.trim(), quickAddMuscle !== 'all' ? quickAddMuscle : 'core')}
                        className="w-full p-3 border border-dashed border-emerald-300 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold text-left active:bg-emerald-50 dark:active:bg-emerald-900/10"
                      >
                        <Plus className="w-3.5 h-3.5 inline mr-1.5" />
                        Add "{quickAddSearch.trim()}" as custom
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Secondary: open full library */}
              <button
                onClick={() => setShowExerciseLibrary(true)}
                className="w-full py-2 text-xs text-gray-400 dark:text-[#d8e7de]/40 font-medium underline underline-offset-2 text-center active:text-gray-600"
              >
                Browse saved library / add with video
              </button>
            </div>
          )}

          {currentWorkout.exercises.length === 0 && !showQuickAdd ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-[#C6A45F]/30 rounded-xl">
              <p className="text-gray-500 dark:text-[#d8e7de]/60 mb-4 text-sm">No exercises yet</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-5 py-3 bg-purple-500 text-white rounded-xl inline-flex items-center gap-2 font-medium min-h-[48px]"
                >
                  <FileText className="w-4 h-4" />
                  Start from Template
                </button>
                <button
                  onClick={() => { setShowQuickAdd(true); setQuickAddSearch(''); setQuickAddMuscle('all'); }}
                  className="px-5 py-3 bg-emerald-500 text-white rounded-xl inline-flex items-center gap-2 font-medium min-h-[48px]"
                >
                  <Plus className="w-4 h-4" />
                  Add Exercise
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {currentWorkout.exercises.map((exercise, idx) => (
                <div
                  key={exercise.tempId || idx}
                  className="border-2 border-gray-200 dark:border-[#C6A45F]/20 rounded-xl overflow-hidden"
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, idx)}
                >
                  {/* Exercise header row */}
                  <div
                    className="p-4 bg-gray-50 dark:bg-[#0a0a0a]/40 cursor-pointer active:bg-gray-100"
                    onClick={() => toggleExerciseExpanded(idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveExercise(idx, -1); }}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-20 flex items-center justify-center min-w-[32px] min-h-[28px]"
                        >
                          <ArrowUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveExercise(idx, 1); }}
                          disabled={idx === currentWorkout.exercises.length - 1}
                          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-20 flex items-center justify-center min-w-[32px] min-h-[28px]"
                        >
                          <ArrowDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span>{getSectionIcon(exercise.section)}</span>
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{exercise.section}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-[#d8e7de] truncate">{exercise.name}</span>
                          {exercise.supersetGroupId && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">SS</span>
                          )}
                          {exercise.dumbbells && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                              DB{exercise.dumbbells === 2 ? '×2' : '×1'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">
                          {exercise.useDuration
                            ? `${exercise.durationMinutes > 0 ? exercise.durationMinutes + 'm ' : ''}${exercise.durationSeconds}s`
                            : `${exercise.sets} sets × ${exercise.reps} reps${exercise.recommendedWeight > 0 ? ` @ ${exercise.recommendedWeight} lbs` : ''}`
                          }
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDuplicateExercise(idx); }}
                          className="p-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 min-w-[40px] min-h-[40px] flex items-center justify-center"
                        >
                          <Copy className="w-4 h-4 text-gray-500 dark:text-[#d8e7de]/60" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm('Remove this exercise?')) handleRemoveExercise(idx); }}
                          className="p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 min-w-[40px] min-h-[40px] flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                        {expandedExercises[idx]
                          ? <ChevronUp className="w-4 h-4 text-gray-400" />
                          : <ChevronDown className="w-4 h-4 text-gray-400" />
                        }
                      </div>
                    </div>
                  </div>

                  {/* Expanded editor */}
                  {expandedExercises[idx] && (
                    <div className="p-4 border-t border-gray-200 dark:border-[#C6A45F]/20 bg-white dark:bg-[#1E3328] space-y-4">

                      {/* Section picker */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 dark:text-[#d8e7de]/80 mb-2">Section</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['warmup', 'work', 'cooldown'].map(s => (
                            <button
                              key={s}
                              onClick={() => handleUpdateExercise(idx, 'section', s)}
                              className={`py-2.5 rounded-xl text-sm font-semibold min-h-[44px] transition ${
                                exercise.section === s
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-700 dark:text-[#d8e7de]/80'
                              }`}
                            >
                              {getSectionIcon(s)} {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration toggle */}
                      <label className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exercise.useDuration || false}
                          onChange={(e) => handleUpdateExercise(idx, 'useDuration', e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <div>
                          <div className="font-semibold text-sm text-gray-800 dark:text-[#d8e7de]">Time-based exercise</div>
                          <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60">Use for planks, running, etc.</div>
                        </div>
                      </label>

                      {exercise.useDuration ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 mb-1 uppercase tracking-wide">Min</label>
                              <input
                                type="number"
                                value={exercise.durationMinutes || 0}
                                onChange={(e) => handleUpdateExercise(idx, 'durationMinutes', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-center font-bold text-xl focus:ring-2 focus:ring-blue-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                                min="0" max="60"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 mb-1 uppercase tracking-wide">Sec</label>
                              <input
                                type="number"
                                value={exercise.durationSeconds || 0}
                                onChange={(e) => handleUpdateExercise(idx, 'durationSeconds', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-center font-bold text-xl focus:ring-2 focus:ring-blue-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                                min="0" max="59"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 mb-1 uppercase tracking-wide">Set Rest (s)</label>
                              <input
                                type="number"
                                value={exercise.restSeconds || 0}
                                onChange={(e) => handleUpdateExercise(idx, 'restSeconds', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-center font-bold text-xl focus:ring-2 focus:ring-blue-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                                min="0" max="600" step="15"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 mb-1 uppercase tracking-wide">After Exercise (s)</label>
                              <input
                                type="number"
                                value={exercise.restBetweenExercisesSeconds || 0}
                                onChange={(e) => handleUpdateExercise(idx, 'restBetweenExercisesSeconds', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-center font-bold text-xl focus:ring-2 focus:ring-blue-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                                min="0" max="600" step="15"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Quick scheme presets */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 mb-2 uppercase tracking-wide">Quick Scheme</label>
                            <div className="flex gap-2 flex-wrap">
                              {[
                                { label: '3×5', sets: 3, reps: 5 },
                                { label: '5×5', sets: 5, reps: 5 },
                                { label: '3×8-10', sets: 3, reps: '8-10' },
                                { label: '3×8-12', sets: 3, reps: '8-12' },
                                { label: '4×8-12', sets: 4, reps: '8-12' },
                                { label: '3×10-12', sets: 3, reps: '10-12' },
                                { label: '3×10-15', sets: 3, reps: '10-15' },
                                { label: '4×12-15', sets: 4, reps: '12-15' },
                              ].map(({ label, sets, reps }) => (
                                <button
                                  key={label}
                                  onClick={() => {
                                    const updated = [...currentWorkout.exercises];
                                    updated[idx] = { ...updated[idx], sets, reps };
                                    setCurrentWorkout({ ...currentWorkout, exercises: updated });
                                  }}
                                  className={`px-3.5 py-2 rounded-xl text-sm font-bold min-h-[40px] transition ${
                                    exercise.sets === sets && String(exercise.reps) === String(reps)
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 active:bg-emerald-100 dark:active:bg-emerald-900/30'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 mb-1 uppercase tracking-wide">Sets</label>
                              <input
                                type="number"
                                value={exercise.sets}
                                onChange={(e) => handleUpdateExercise(idx, 'sets', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-center font-bold text-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                                min="1" max="20"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 mb-1 uppercase tracking-wide">
                                Reps <span className="normal-case font-normal text-gray-400">(or range)</span>
                              </label>
                              <input
                                type="text"
                                value={exercise.reps}
                                onChange={(e) => handleUpdateExercise(idx, 'reps', e.target.value)}
                                placeholder="10 or 8-12"
                                className="w-full px-2 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-center font-bold text-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de] placeholder:text-sm placeholder:font-normal"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 mb-1 uppercase tracking-wide">Set Rest (s)</label>
                              <input
                                type="number"
                                value={exercise.restSeconds || 0}
                                onChange={(e) => handleUpdateExercise(idx, 'restSeconds', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-center font-bold text-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                                min="0" max="600" step="15"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 dark:text-[#d8e7de]/60 mb-1 uppercase tracking-wide">After Exercise (s)</label>
                              <input
                                type="number"
                                value={exercise.restBetweenExercisesSeconds || 0}
                                onChange={(e) => handleUpdateExercise(idx, 'restBetweenExercisesSeconds', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-center font-bold text-xl focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                                min="0" max="600" step="15"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-600 dark:text-[#d8e7de]/80 mb-1">Suggested weight (lbs)</label>
                            <input
                              type="number"
                              value={exercise.recommendedWeight || 0}
                              onChange={(e) => handleUpdateExercise(idx, 'recommendedWeight', parseInt(e.target.value) || 0)}
                              placeholder="0 = bodyweight / not applicable"
                              className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-base focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                              min="0" step="5"
                            />
                          </div>

                          {/* Dumbbell picker */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-600 dark:text-[#d8e7de]/80 mb-2">Equipment</label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { val: null, label: 'Barbell / Machine' },
                                { val: 1, label: '1 Dumbbell' },
                                { val: 2, label: '2 Dumbbells' },
                              ].map(({ val, label }) => (
                                <button
                                  key={String(val)}
                                  onClick={() => handleUpdateExercise(idx, 'dumbbells', val)}
                                  className={`py-2.5 rounded-xl text-xs font-semibold min-h-[44px] transition ${
                                    (exercise.dumbbells ?? null) === val
                                      ? 'bg-emerald-500 text-white'
                                      : 'bg-gray-100 dark:bg-[#0a0a0a]/40 text-gray-700 dark:text-[#d8e7de]/80'
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                            {exercise.dumbbells === 2 && (
                              <p className="text-xs text-blue-500 dark:text-blue-400 mt-1.5">Weight entered per dumbbell — total volume calculated ×2.</p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Video URL */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 dark:text-[#d8e7de]/80 mb-1">Form video URL (optional)</label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={exercise.videoUrl || ''}
                            onChange={(e) => handleUpdateExercise(idx, 'videoUrl', e.target.value)}
                            placeholder="https://youtube.com/..."
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                          />
                          {exercise.videoUrl && (
                            <button
                              onClick={() => handleUpdateExercise(idx, 'videoUrl', '')}
                              className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl min-h-[48px] min-w-[48px]"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        {exercise.videoUrl && (
                          <a
                            href={exercise.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium"
                          >
                            <Video className="w-4 h-4" />
                            Preview video
                          </a>
                        )}
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 dark:text-[#d8e7de]/80 mb-1">Notes / cues (optional)</label>
                        <textarea
                          value={exercise.notes || ''}
                          onChange={(e) => handleUpdateExercise(idx, 'notes', e.target.value)}
                          placeholder="Form cues, modifications, special instructions..."
                          className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                          rows="2"
                        />
                      </div>

                      {/* Superset pairing */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600 dark:text-[#d8e7de]/80 mb-2">Superset</label>
                        {exercise.supersetGroupId ? (
                          (() => {
                            const partnerIdx = currentWorkout.exercises.findIndex((ex, i) => i !== idx && ex.supersetGroupId === exercise.supersetGroupId);
                            const partner = partnerIdx !== -1 ? currentWorkout.exercises[partnerIdx] : null;
                            return (
                              <div>
                                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
                                  <div>
                                    <div className="text-xs font-bold text-purple-500 uppercase tracking-wide mb-0.5">Paired with</div>
                                    <div className="text-sm font-semibold text-purple-900 dark:text-purple-200">{partner?.name || 'Unknown'}</div>
                                  </div>
                                  <button
                                    onClick={() => unpairSuperset(idx)}
                                    className="text-xs text-red-500 font-bold px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg min-h-[36px]"
                                  >
                                    Unlink
                                  </button>
                                </div>
                                <p className="text-xs text-purple-500 dark:text-purple-400 mt-1.5">Both exercises must have the same number of sets.</p>
                              </div>
                            );
                          })()
                        ) : (
                          (() => {
                            const available = currentWorkout.exercises
                              .map((ex, i) => ({ ex, i }))
                              .filter(({ ex, i }) => i !== idx && !ex.supersetGroupId);
                            if (available.length === 0) {
                              return <p className="text-xs text-gray-400 dark:text-[#d8e7de]/40 italic">No available exercises to pair with.</p>;
                            }
                            return (
                              <select
                                value=""
                                onChange={(e) => { const pIdx = parseInt(e.target.value); if (!isNaN(pIdx)) pairAsSuperset(idx, pIdx); }}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl text-sm dark:bg-[#0a0a0a] dark:text-[#d8e7de] bg-white"
                              >
                                <option value="">↔ Pair with another exercise...</option>
                                {available.map(({ ex, i }) => (
                                  <option key={i} value={i}>{ex.name}</option>
                                ))}
                              </select>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary counts */}
        {currentWorkout.exercises.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { section: 'warmup', label: 'Warmup', bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: '🔥' },
              { section: 'work', label: 'Main Work', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: '💪' },
              { section: 'cooldown', label: 'Cooldown', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: '🧘' },
            ].map(({ section, label, bg, icon }) => (
              <div key={section} className={`${bg} rounded-2xl p-4 text-center`}>
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-[#d8e7de]">{countBySection(section)}</div>
                <div className="text-xs text-gray-500 dark:text-[#d8e7de]/60">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Fixed save button */}
        <div className="fixed bottom-24 left-0 right-0 p-4 bg-white dark:bg-[#1E3328] border-t border-gray-200 dark:border-[#C6A45F]/25 md:relative md:bottom-auto md:border-0 md:bg-transparent md:dark:bg-transparent md:p-0">
          <button
            onClick={handleSaveWorkout}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg min-h-[56px]"
          >
            <Save className="w-6 h-6" />
            {editingWorkoutId ? 'Update Workout' : 'Save Workout'}
          </button>
        </div>

        {/* Save as Template modal */}
        {showSaveAsTemplate && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1E3328] rounded-2xl w-full max-w-md p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de] mb-4">Save as Template</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 rounded-xl dark:bg-[#0a0a0a] dark:text-[#d8e7de]"
                  rows="2"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveAsTemplate} className="flex-1 py-3 bg-yellow-500 text-white rounded-xl font-semibold min-h-[48px]">Save Template</button>
                  <button onClick={() => setShowSaveAsTemplate(false)} className="px-4 py-3 border border-gray-300 dark:border-[#C6A45F]/40 text-gray-700 dark:text-[#d8e7de]/80 rounded-xl min-h-[48px]">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Templates modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1E3328] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="p-5 border-b border-gray-200 dark:border-[#C6A45F]/25 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de]">Workout Templates</h3>
                  <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">Pick a template to start from</p>
                </div>
                <button onClick={() => setShowTemplates(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0a0a0a]/40 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="w-5 h-5 text-gray-600 dark:text-[#d8e7de]/80" />
                </button>
              </div>
              <div className="overflow-y-auto p-5 space-y-3">
                {customTemplates.length > 0 && (
                  <>
                    <h4 className="font-bold text-gray-900 dark:text-[#d8e7de] flex items-center gap-2 text-sm uppercase tracking-wide">
                      <Star className="w-4 h-4 text-yellow-500" /> Your Templates
                    </h4>
                    {customTemplates.map((t) => (
                      <div key={t.id} className="border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                        <div className="flex justify-between items-start gap-3">
                          <button className="flex-1 text-left" onClick={() => handleUseTemplate(t)}>
                            <div className="font-bold text-gray-900 dark:text-[#d8e7de]">{t.name}</div>
                            {t.description && <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-1">{t.description}</p>}
                            <div className="flex gap-3 mt-2 text-xs text-gray-400">
                              <span>🔥 {t.exercises.filter(e => e.section === 'warmup').length}</span>
                              <span>💪 {t.exercises.filter(e => e.section === 'work').length}</span>
                              <span>🧘 {t.exercises.filter(e => e.section === 'cooldown').length}</span>
                            </div>
                          </button>
                          <button onClick={() => handleDeleteTemplate(t.id)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 dark:border-[#C6A45F]/25 pt-3">
                      <h4 className="font-bold text-gray-900 dark:text-[#d8e7de] text-sm uppercase tracking-wide mb-3">Default Templates</h4>
                    </div>
                  </>
                )}
                {DEFAULT_WORKOUT_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    className="w-full text-left border-2 border-gray-200 dark:border-[#C6A45F]/20 rounded-xl p-4 hover:border-emerald-400 active:bg-gray-50 transition"
                    onClick={() => handleUseTemplate(t)}
                  >
                    <div className="font-bold text-gray-900 dark:text-[#d8e7de]">{t.name}</div>
                    <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-1">{t.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>🔥 {t.exercises.filter(e => e.section === 'warmup').length}</span>
                      <span>💪 {t.exercises.filter(e => e.section === 'work').length}</span>
                      <span>🧘 {t.exercises.filter(e => e.section === 'cooldown').length}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Exercise Library modal */}
        {showExerciseLibrary && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1E3328] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
              <div className="p-5 border-b border-gray-200 dark:border-[#C6A45F]/25 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-[#d8e7de]">Exercise Library</h3>
                  <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5">Tap an exercise to add it</p>
                </div>
                <button onClick={() => setShowExerciseLibrary(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#0a0a0a]/40 min-h-[44px] min-w-[44px] flex items-center justify-center">
                  <X className="w-5 h-5 text-gray-600 dark:text-[#d8e7de]/80" />
                </button>
              </div>
              <div className="overflow-y-auto p-5">
                <ExerciseLibrary
                  onSelectExercise={handleSelectExercise}
                  selectedExercises={currentWorkout.exercises}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ───────────────────────────────────────────────────────────────

  if (previewWorkout) {
    return (
      <FormWorkoutSession
        workout={previewWorkout}
        userId={auth.currentUser?.uid || 'preview'}
        onExit={() => setPreviewWorkout(null)}
        previewMode={true}
      />
    );
  }

  return (
    <div className="space-y-4 pb-6">

      {/* Hero banner */}
      <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-44 h-44 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-4 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell className="w-4 h-4 text-yellow-200" />
            <span className="text-yellow-100 text-sm font-medium">Workout Builder</span>
          </div>
          <h2 className="text-2xl font-bold">Your Workouts</h2>
          <p className="text-orange-100 text-sm mt-0.5">
            {workouts.length} workout{workouts.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {/* Create new button */}
      <button
        onClick={() => setView('create')}
        className="w-full bg-white dark:bg-[#1E3328] rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-600/40 p-4 flex items-center gap-4 active:bg-orange-50 dark:active:bg-orange-900/10 min-h-[72px]"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <Plus className="w-6 h-6 text-white" />
        </div>
        <div className="text-left">
          <div className="font-bold text-gray-900 dark:text-[#d8e7de]">Create New Workout</div>
          <div className="text-sm text-gray-500 dark:text-[#d8e7de]/50">Build a training day from your exercise library</div>
        </div>
      </button>

      {/* Workout cards */}
      {workouts.length === 0 ? (
        <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-10 border border-gray-200 dark:border-[#C6A45F]/25 text-center">
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-orange-400" />
          </div>
          <p className="font-bold text-gray-700 dark:text-[#d8e7de] mb-1">No workouts yet</p>
          <p className="text-sm text-gray-400 dark:text-[#d8e7de]/40">Create your first workout to start building programs.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map(workout => {
            const warmupCount = workout.exercises?.filter(e => e.section === 'warmup').length ?? workout.warmup?.length ?? 0;
            const workCount = workout.exercises?.filter(e => e.section === 'work').length ?? workout.work?.length ?? 0;
            const cooldownCount = workout.exercises?.filter(e => e.section === 'cooldown').length ?? workout.cooldown?.length ?? 0;
            return (
              <div key={workout.id} className="bg-white dark:bg-[#1E3328] rounded-2xl border border-gray-200 dark:border-[#C6A45F]/25 overflow-hidden">
                <div className="p-4 flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 dark:text-[#d8e7de]">{workout.name}</div>
                    {workout.description && (
                      <p className="text-sm text-gray-500 dark:text-[#d8e7de]/60 mt-0.5 truncate">{workout.description}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {warmupCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/15 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-semibold">
                          🔥 {warmupCount} warmup
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold">
                        💪 {workCount} exercises
                      </span>
                      {cooldownCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/15 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold">
                          🧘 {cooldownCount} cooldown
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 px-4 pb-4 border-t border-gray-50 dark:border-[#C6A45F]/5 pt-3">
                  <button
                    onClick={() => setPreviewWorkout(workout)}
                    className="flex-1 py-2.5 bg-amber-50 dark:bg-amber-900/15 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold min-h-[44px] active:bg-amber-100 dark:active:bg-amber-900/25"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => handleEditWorkout(workout)}
                    className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/15 text-blue-700 dark:text-blue-400 rounded-xl flex items-center justify-center gap-1.5 text-sm font-semibold min-h-[44px] active:bg-blue-100 dark:active:bg-blue-900/25"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`Delete "${workout.name}"?`)) {
                        await remove(dbRef(db, `workouts/${workout.id}`));
                        loadWorkouts();
                      }
                    }}
                    className="p-2.5 text-red-400 active:bg-red-50 dark:active:bg-red-900/20 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
