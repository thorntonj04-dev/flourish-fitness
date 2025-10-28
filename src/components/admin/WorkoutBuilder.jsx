import React, { useState, useEffect } from 'react';
import { Plus, Save, Calendar, Trash2, Video } from 'lucide-react';
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
