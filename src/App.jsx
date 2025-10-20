import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Plus, X, Trash2, Camera, ChevronRight, ChevronLeft, Play, Check, Edit, Save, Search, Filter, Calendar, Clock, Weight, BarChart3 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, orderBy, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCvishxOrmwvC2MhtiOhh1oLEEbLPamkrI",
  authDomain: "flourish-fitness.firebaseapp.com",
  projectId: "flourish-fitness",
  storageBucket: "flourish-fitness.firebasestorage.app",
  messagingSenderId: "941029788793",
  appId: "1:941029788793:web:b2474ccf5c356bcee898a8",
  measurementId: "G-YN9E3W7T70"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app);

// Sample exercises to populate database
const SAMPLE_EXERCISES = [
  { name: "Push-ups", muscleGroup: "Chest", equipment: "Bodyweight", description: "Classic upper body exercise" },
  { name: "Squats", muscleGroup: "Legs", equipment: "Bodyweight", description: "Fundamental lower body movement" },
  { name: "Bench Press", muscleGroup: "Chest", equipment: "Barbell", description: "Compound chest exercise" },
  { name: "Deadlift", muscleGroup: "Back", equipment: "Barbell", description: "Full body compound lift" },
  { name: "Bicep Curls", muscleGroup: "Arms", equipment: "Dumbbells", description: "Isolated bicep exercise" },
  { name: "Tricep Dips", muscleGroup: "Arms", equipment: "Bodyweight", description: "Tricep focused movement" },
  { name: "Lunges", muscleGroup: "Legs", equipment: "Bodyweight", description: "Unilateral leg exercise" },
  { name: "Plank", muscleGroup: "Core", equipment: "Bodyweight", description: "Core stabilization hold" },
  { name: "Pull-ups", muscleGroup: "Back", equipment: "Bodyweight", description: "Vertical pulling movement" },
  { name: "Shoulder Press", muscleGroup: "Shoulders", equipment: "Dumbbells", description: "Overhead pressing movement" }
];

function AuthScreen() {
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
        
        // Check if this is the first user (make them admin)
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const isFirstUser = usersSnapshot.empty;
        
        await setDoc(doc(db, 'users', userCredential.user.uid), {
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

// Exercise Library Management (Admin)
function ExerciseLibrary() {
  const [exercises, setExercises] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    muscleGroup: '',
    equipment: '',
    description: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const snapshot = await getDocs(collection(db, 'exercises'));
    const exerciseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setExercises(exerciseData);
  };

  const handleAddExercise = async () => {
    if (!newExercise.name || !newExercise.muscleGroup) {
      alert('Please fill in name and muscle group');
      return;
    }

    setUploading(true);
    try {
      let videoUrl = null;
      
      if (videoFile) {
        const videoRef = ref(storage, `exercise-videos/${Date.now()}_${videoFile.name}`);
        await uploadBytes(videoRef, videoFile);
        videoUrl = await getDownloadURL(videoRef);
      }

      await addDoc(collection(db, 'exercises'), {
        ...newExercise,
        videoUrl,
        createdAt: new Date().toISOString()
      });

      setNewExercise({ name: '', muscleGroup: '', equipment: '', description: '' });
      setVideoFile(null);
      setShowAddForm(false);
      loadExercises();
    } catch (error) {
      console.error('Error adding exercise:', error);
      alert('Failed to add exercise');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteExercise = async (exerciseId) => {
    if (!confirm('Delete this exercise?')) return;
    try {
      await deleteDoc(doc(db, 'exercises', exerciseId));
      loadExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const populateSampleExercises = async () => {
    if (!confirm('Add sample exercises to database?')) return;
    
    const batch = writeBatch(db);
    SAMPLE_EXERCISES.forEach(exercise => {
      const docRef = doc(collection(db, 'exercises'));
      batch.set(docRef, {
        ...exercise,
        createdAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
    loadExercises();
    alert('Sample exercises added!');
  };

  const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];
  
  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterGroup === 'All' || ex.muscleGroup === filterGroup;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Exercise Library</h2>
        <p className="text-emerald-100">{exercises.length} exercises available</p>
      </div>

      {exercises.length === 0 && (
        <button
          onClick={populateSampleExercises}
          className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
        >
          Populate Sample Exercises
        </button>
      )}

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />

        <div className="flex gap-2 overflow-x-auto pb-2">
          {muscleGroups.map(group => (
            <button
              key={group}
              onClick={() => setFilterGroup(group)}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition ${
                filterGroup === group
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Exercise
        </button>
      ) : (
        <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500">
          <h3 className="text-lg font-bold text-gray-900 mb-4">New Exercise</h3>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Exercise Name"
              value={newExercise.name}
              onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <select
              value={newExercise.muscleGroup}
              onChange={(e) => setNewExercise({...newExercise, muscleGroup: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">Select Muscle Group</option>
              {muscleGroups.filter(g => g !== 'All').map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Equipment (e.g., Dumbbells, Barbell, Bodyweight)"
              value={newExercise.equipment}
              onChange={(e) => setNewExercise({...newExercise, equipment: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <textarea
              placeholder="Description"
              value={newExercise.description}
              onChange={(e) => setNewExercise({...newExercise, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              rows="3"
            />

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
              <label className="cursor-pointer">
                <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <div className="text-sm text-gray-600">
                  {videoFile ? videoFile.name : 'Upload form video (10 sec)'}
                </div>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewExercise({ name: '', muscleGroup: '', equipment: '', description: '' });
                  setVideoFile(null);
                }}
                className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExercise}
                disabled={uploading}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50"
              >
                {uploading ? 'Saving...' : 'Add Exercise'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredExercises.map(exercise => (
          <div key={exercise.id} className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{exercise.name}</h3>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    {exercise.muscleGroup}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {exercise.equipment}
                  </span>
                </div>
                {exercise.description && (
                  <p className="text-sm text-gray-600 mt-2">{exercise.description}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteExercise(exercise.id)}
                className="text-red-600 hover:text-red-700 p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            {exercise.videoUrl && (
              <video
                src={exercise.videoUrl}
                controls
                className="w-full h-32 object-cover rounded-lg mt-2"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Workout Builder (Admin)
function WorkoutBuilder({ user }) {
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState({
    name: '',
    sections: [
      { name: 'Warm Up', exercises: [] },
      { name: 'Main Workout', exercises: [] },
      { name: 'Cool Down', exercises: [] }
    ]
  });
  const [currentSection, setCurrentSection] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  useEffect(() => {
    loadWorkouts();
    loadExercises();
  }, []);

  const loadWorkouts = async () => {
    const q = query(collection(db, 'workouts'), where('trainerId', '==', user.uid));
    const snapshot = await getDocs(q);
    const workoutData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWorkouts(workoutData);
  };

  const loadExercises = async () => {
    const snapshot = await getDocs(collection(db, 'exercises'));
    const exerciseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setExercises(exerciseData);
  };

  const addExerciseToSection = (exercise) => {
    const newWorkout = { ...currentWorkout };
    newWorkout.sections[currentSection].exercises.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 3,
      reps: 10,
      restSeconds: 60
    });
    setCurrentWorkout(newWorkout);
    setShowExercisePicker(false);
  };

  const removeExerciseFromSection = (sectionIdx, exerciseIdx) => {
    const newWorkout = { ...currentWorkout };
    newWorkout.sections[sectionIdx].exercises.splice(exerciseIdx, 1);
    setCurrentWorkout(newWorkout);
  };

  const updateExerciseDetails = (sectionIdx, exerciseIdx, field, value) => {
    const newWorkout = { ...currentWorkout };
    newWorkout.sections[sectionIdx].exercises[exerciseIdx][field] = parseInt(value) || 0;
    setCurrentWorkout(newWorkout);
  };

  const saveWorkout = async () => {
    if (!currentWorkout.name) {
      alert('Please enter a workout name');
      return;
    }

    try {
      await addDoc(collection(db, 'workouts'), {
        ...currentWorkout,
        trainerId: user.uid,
        createdAt: new Date().toISOString()
      });

      setCurrentWorkout({
        name: '',
        sections: [
          { name: 'Warm Up', exercises: [] },
          { name: 'Main Workout', exercises: [] },
          { name: 'Cool Down', exercises: [] }
        ]
      });
      setShowBuilder(false);
      loadWorkouts();
      alert('Workout saved!');
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout');
    }
  };

  const deleteWorkout = async (workoutId) => {
    if (!confirm('Delete this workout?')) return;
    try {
      await deleteDoc(doc(db, 'workouts', workoutId));
      loadWorkouts();
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  if (showExercisePicker) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowExercisePicker(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h3 className="text-lg font-bold">Pick Exercise</h3>
        </div>

        <div className="space-y-3">
          {exercises.map(exercise => (
            <button
              key={exercise.id}
              onClick={() => addExerciseToSection(exercise)}
              className="w-full p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-500 transition text-left"
            >
              <div className="font-bold text-gray-900">{exercise.name}</div>
              <div className="text-sm text-gray-600">{exercise.muscleGroup} • {exercise.equipment}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (showBuilder) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBuilder(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h3 className="text-lg font-bold flex-1">Build Workout</h3>
          <button
            onClick={saveWorkout}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>

        <input
          type="text"
          placeholder="Workout Name (e.g., Full Body Day 1)"
          value={currentWorkout.name}
          onChange={(e) => setCurrentWorkout({...currentWorkout, name: e.target.value})}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
        />

        <div className="flex gap-2 overflow-x-auto pb-2">
          {currentWorkout.sections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSection(idx)}
              className={`px-6 py-3 rounded-xl whitespace-nowrap font-medium transition ${
                currentSection === idx
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {section.name}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-900">
              {currentWorkout.sections[currentSection].name}
            </h4>
            <button
              onClick={() => setShowExercisePicker(true)}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Exercise
            </button>
          </div>

          <div className="space-y-4">
            {currentWorkout.sections[currentSection].exercises.map((ex, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-medium text-gray-900">{ex.exerciseName}</div>
                  <button
                    onClick={() => removeExerciseFromSection(currentSection, idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Sets</label>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => updateExerciseDetails(currentSection, idx, 'sets', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Reps</label>
                    <input
                      type="number"
                      value={ex.reps}
                      onChange={(e) => updateExerciseDetails(currentSection, idx, 'reps', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Rest (s)</label>
                    <input
                      type="number"
                      value={ex.restSeconds}
                      onChange={(e) => updateExerciseDetails(currentSection, idx, 'restSeconds', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-medium"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {currentWorkout.sections[currentSection].exercises.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No exercises added yet
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Workout Builder</h2>
        <p className="text-emerald-100">{workouts.length} workouts created</p>
      </div>

      <button
        onClick={() => setShowBuilder(true)}
        className="w-full py-4 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Create New Workout
      </button>

      <div className="space-y-3">
        {workouts.map(workout => {
          const totalExercises = workout.sections.reduce((sum, section) => sum + section.exercises.length, 0);
          
          return (
            <div key={workout.id} className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg">{workout.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    {totalExercises} exercises • {workout.sections.length} sections
                  </div>
                  <div className="flex gap-2 mt-2">
                    {workout.sections.map((section, idx) => (
                      <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {section.name}: {section.exercises.length}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => deleteWorkout(workout.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Workout Assignment (Admin)
function WorkoutAssignment({ user }) {
  const [clients, setClients] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    loadClients();
    loadWorkouts();
    loadAssignments();
  }, []);

  const loadClients = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const clientData = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(u => u.role === 'client');
    setClients(clientData);
  };

  const loadWorkouts = async () => {
    const q = query(collection(db, 'workouts'), where('trainerId', '==', user.uid));
    const snapshot = await getDocs(q);
    const workoutData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWorkouts(workoutData);
  };

  const loadAssignments = async () => {
    const snapshot = await getDocs(collection(db, 'workout-assignments'));
    const assignmentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAssignments(assignmentData);
  };

  const assignWorkout = async () => {
    if (!selectedClient || !selectedWorkout) {
      alert('Please select both a client and a workout');
      return;
    }

    try {
      await addDoc(collection(db, 'workout-assignments'), {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        workoutId: selectedWorkout.id,
        workoutName: selectedWorkout.name,
        assignedAt: new Date().toISOString(),
        status: 'active'
      });

      setSelectedClient(null);
      setSelectedWorkout(null);
      loadAssignments();
      alert('Workout assigned!');
    } catch (error) {
      console.error('Error assigning workout:', error);
      alert('Failed to assign workout');
    }
  };

  const removeAssignment = async (assignmentId) => {
    if (!confirm('Remove this assignment?')) return;
    try {
      await deleteDoc(doc(db, 'workout-assignments', assignmentId));
      loadAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Assign Workouts</h2>
        <p className="text-emerald-100">Assign workouts to your clients</p>
      </div>

      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 space-y-4">
        <h3 className="font-bold text-gray-900">New Assignment</h3>
        
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Select Client</label>
          <div className="grid grid-cols-1 gap-2">
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  selectedClient?.id === client.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{client.name}</div>
                <div className="text-sm text-gray-600">{client.email}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Select Workout</label>
          <div className="grid grid-cols-1 gap-2">
            {workouts.map(workout => (
              <button
                key={workout.id}
                onClick={() => setSelectedWorkout(workout)}
                className={`p-3 rounded-xl border-2 text-left transition ${
                  selectedWorkout?.id === workout.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium">{workout.name}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={assignWorkout}
          className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600"
        >
          Assign Workout
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
        <h3 className="font-bold text-gray-900 mb-4">Active Assignments</h3>
        
        <div className="space-y-3">
          {assignments.map(assignment => (
            <div key={assignment.id} className="p-4 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{assignment.clientName}</div>
                  <div className="text-sm text-emerald-600 font-medium">{assignment.workoutName}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => removeAssignment(assignment.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          
          {assignments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No active assignments
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Client Workout Viewer
function ClientWorkouts({ user }) {
  const [assignments, setAssignments] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [exercises, setExercises] = useState({});
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentWeight, setCurrentWeight] = useState('');
  const [completedSets, setCompletedSets] = useState([]);

  useEffect(() => {
    loadAssignments();
    loadExercises();
  }, [user]);

  const loadAssignments = async () => {
    const q = query(collection(db, 'workout-assignments'), where('clientId', '==', user.uid));
    const snapshot = await getDocs(q);
    const assignmentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAssignments(assignmentData);
  };

  const loadExercises = async () => {
    const snapshot = await getDocs(collection(db, 'exercises'));
    const exerciseMap = {};
    snapshot.docs.forEach(doc => {
      exerciseMap[doc.id] = { id: doc.id, ...doc.data() };
    });
    setExercises(exerciseMap);
  };

  const startWorkout = async (assignment) => {
    const workoutDoc = await getDoc(doc(db, 'workouts', assignment.workoutId));
    if (workoutDoc.exists()) {
      setWorkoutData(workoutDoc.data());
      setActiveWorkout(assignment);
      setCurrentExerciseIdx(0);
      setCurrentSet(1);
      setCompletedSets([]);
    }
  };

  const getAllExercises = () => {
    if (!workoutData) return [];
    
    const allExercises = [];
    workoutData.sections.forEach(section => {
      section.exercises.forEach(ex => {
        allExercises.push({ ...ex, sectionName: section.name });
      });
    });
    return allExercises;
  };

  const logSet = async () => {
    if (!currentWeight) {
      alert('Please enter weight');
      return;
    }

    const allExercises = getAllExercises();
    const currentEx = allExercises[currentExerciseIdx];

    try {
      await addDoc(collection(db, 'workout-logs'), {
        assignmentId: activeWorkout.id,
        clientId: user.uid,
        exerciseId: currentEx.exerciseId,
        exerciseName: currentEx.exerciseName,
        setNumber: currentSet,
        weight: parseFloat(currentWeight),
        reps: currentEx.reps,
        completedAt: new Date().toISOString()
      });

      const newCompleted = [...completedSets, { exerciseIdx: currentExerciseIdx, set: currentSet }];
      setCompletedSets(newCompleted);

      if (currentSet < currentEx.sets) {
        setCurrentSet(currentSet + 1);
        setCurrentWeight('');
      } else {
        if (currentExerciseIdx < allExercises.length - 1) {
          setCurrentExerciseIdx(currentExerciseIdx + 1);
          setCurrentSet(1);
          setCurrentWeight('');
        } else {
          alert('Workout complete! Great job! 💪');
          setActiveWorkout(null);
          setWorkoutData(null);
        }
      }
    } catch (error) {
      console.error('Error logging set:', error);
      alert('Failed to log set');
    }
  };

  const skipSet = () => {
    const allExercises = getAllExercises();
    const currentEx = allExercises[currentExerciseIdx];

    if (currentSet < currentEx.sets) {
      setCurrentSet(currentSet + 1);
      setCurrentWeight('');
    } else {
      if (currentExerciseIdx < allExercises.length - 1) {
        setCurrentExerciseIdx(currentExerciseIdx + 1);
        setCurrentSet(1);
        setCurrentWeight('');
      }
    }
  };

  if (activeWorkout && workoutData) {
    const allExercises = getAllExercises();
    const currentEx = allExercises[currentExerciseIdx];
    const exercise = exercises[currentEx.exerciseId];
    const progress = ((currentExerciseIdx * 100) / allExercises.length).toFixed(0);

    return (
      <div className="space-y-4 pb-24">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => {
                if (confirm('Exit workout? Progress will be saved.')) {
                  setActiveWorkout(null);
                  setWorkoutData(null);
                }
              }}
              className="p-2 hover:bg-white/20 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold">{workoutData.name}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="text-emerald-100 mt-2">
            Exercise {currentExerciseIdx + 1} of {allExercises.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
          <div className="text-sm text-emerald-600 font-medium mb-1">{currentEx.sectionName}</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{currentEx.exerciseName}</h3>

          {exercise?.videoUrl && (
            <video
              src={exercise.videoUrl}
              controls
              loop
              className="w-full rounded-xl mb-4"
            />
          )}

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{currentSet}/{currentEx.sets}</div>
              <div className="text-sm text-gray-600">Set</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{currentEx.reps}</div>
              <div className="text-sm text-gray-600">Reps</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{currentEx.restSeconds}s</div>
              <div className="text-sm text-gray-600">Rest</div>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">Weight Used (lbs)</label>
            <input
              type="number"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              placeholder="Enter weight"
              className="w-full px-4 py-4 text-2xl text-center border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={skipSet}
              className="py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50"
            >
              Skip Set
            </button>
            <button
              onClick={logSet}
              className="py-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Complete Set
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Completed Sets</h4>
          <div className="space-y-2">
            {completedSets.map((completed, idx) => {
              const ex = allExercises[completed.exerciseIdx];
              return (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-gray-600">
                    {ex.exerciseName} - Set {completed.set}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">My Workouts</h2>
        <p className="text-emerald-100">Start your training session</p>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
          <Dumbbell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Workouts Assigned</h3>
          <p className="text-gray-600">Your trainer will assign workouts for you</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(assignment => (
            <button
              key={assignment.id}
              onClick={() => startWorkout(assignment)}
              className="w-full bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-emerald-500 transition text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{assignment.workoutName}</h3>
                  <div className="text-sm text-gray-600">
                    Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NutritionLogger({ user }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ protein: '', carbs: '', fats: '', mealName: '' });
  const [todayEntries, setTodayEntries] = useState([]);
  const [macroGoals, setMacroGoals] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [todayTotals, setTodayTotals] = useState({ protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    loadUserData();
    loadTodayEntries();
  }, [user]);

  const loadUserData = async () => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists() && userDoc.data().macroGoals) {
      setMacroGoals(userDoc.data().macroGoals);
    }
  };

  const loadTodayEntries = async () => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'nutrition-logs'),
      where('userId', '==', user.uid),
      where('date', '==', today),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setTodayEntries(entries);
    
    const totals = entries.reduce((acc, entry) => ({
      protein: acc.protein + (entry.protein || 0),
      carbs: acc.carbs + (entry.carbs || 0),
      fats: acc.fats + (entry.fats || 0)
    }), { protein: 0, carbs: 0, fats: 0 });
    setTodayTotals(totals);
  };

  const handleSaveEntry = async () => {
    if (!newEntry.protein && !newEntry.carbs && !newEntry.fats) {
      alert('Please enter at least one macro value');
      return;
    }

    try {
      await addDoc(collection(db, 'nutrition-logs'), {
        userId: user.uid,
        userName: user.email,
        protein: parseFloat(newEntry.protein) || 0,
        carbs: parseFloat(newEntry.carbs) || 0,
        fats: parseFloat(newEntry.fats) || 0,
        mealName: newEntry.mealName || 'Meal',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      setNewEntry({ protein: '', carbs: '', fats: '', mealName: '' });
      setShowAddForm(false);
      loadTodayEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry.');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteDoc(doc(db, 'nutrition-logs', entryId));
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

      {!showAddForm ? (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Log Food Entry
        </button>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">New Food Entry</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Meal Name (optional)</label>
              <input
                type="text"
                value={newEntry.mealName}
                onChange={(e) => setNewEntry({...newEntry, mealName: e.target.value})}
                placeholder="e.g., Breakfast, Lunch, Snack"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={newEntry.protein}
                  onChange={(e) => setNewEntry({...newEntry, protein: e.target.value})}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={newEntry.carbs}
                  onChange={(e) => setNewEntry({...newEntry, carbs: e.target.value})}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Fats (g)</label>
                <input
                  type="number"
                  value={newEntry.fats}
                  onChange={(e) => setNewEntry({...newEntry, fats: e.target.value})}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewEntry({ protein: '', carbs: '', fats: '', mealName: '' });
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
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Entries ({todayEntries.length})</h3>
        {todayEntries.length === 0 ? (
          <p className="text-gray-600">No entries yet today. Log your first meal!</p>
        ) : (
          <div className="space-y-3">
            {todayEntries.map(entry => (
              <div key={entry.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  {entry.mealName && (
                    <div className="text-sm font-medium text-gray-900 mb-1">{entry.mealName}</div>
                  )}
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
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(entry.createdAt).toLocaleTimeString()}
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
      const q = query(
        collection(db, 'progress-photos'),
        where('userId', '==', user.uid),
        orderBy('uploadedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const photoData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPhotos(photoData);
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
      const storageRef = ref(storage, `progress-photos/${user.uid}/${fileName}`);
      
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'progress-photos'), {
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
      const storageRef = ref(storage, photo.storagePath);
      await deleteObject(storageRef);
      await deleteDoc(doc(db, 'progress-photos', photo.id));
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

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          console.log('🔍 User Role from Firebase:', role);
          console.log('📧 User Email:', firebaseUser.email);
          setUserRole(role);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-emerald-600 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const navItems = userRole === 'admin' ? [
    { id: 'dashboard', label: 'Overview', icon: Users },
    { id: 'exercises', label: 'Exercise Library', icon: Dumbbell },
    { id: 'workouts', label: 'Build Workouts', icon: BarChart3 },
    { id: 'assign', label: 'Assign Workouts', icon: Calendar },
    { id: 'nutrition', label: 'Client Nutrition', icon: Apple },
    { id: 'photos', label: 'Client Photos', icon: Image },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: User },
    { id: 'workouts', label: 'My Workouts', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'photos', label: 'My Progress', icon: Image },
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
              <div className="text-xs text-gray-500 capitalize">{userRole}</div>
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
              </div>
            )}

            {currentView === 'exercises' && userRole === 'admin' && <ExerciseLibrary />}
            {currentView === 'workouts' && userRole === 'admin' && <WorkoutBuilder user={user} />}
            {currentView === 'assign' && userRole === 'admin' && <WorkoutAssignment user={user} />}
            {currentView === 'workouts' && userRole === 'client' && <ClientWorkouts user={user} />}
            {currentView === 'nutrition' && <NutritionLogger user={user} />}
            {currentView === 'photos' && <PhotoUpload user={user} />}
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
