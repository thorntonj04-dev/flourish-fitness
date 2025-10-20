import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, BookOpen, Target, Calendar, Image as ImageIcon, DollarSign, LogOut, Plus, X, Check, ChevronRight, Star, Clock, Edit, Trash2, Send, Award, Heart, TrendingUp, Minus, CheckCircle, Upload, Camera } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, orderBy, deleteDoc } from 'firebase/firestore';

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

const EXERCISE_DATABASE = [
  { id: 1, name: 'Barbell Bench Press', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Intermediate' },
  { id: 2, name: 'Incline Barbell Bench Press', category: 'Chest', muscleGroup: 'Upper Pectorals', difficulty: 'Intermediate' },
  { id: 3, name: 'Decline Barbell Bench Press', category: 'Chest', muscleGroup: 'Lower Pectorals', difficulty: 'Intermediate' },
  { id: 4, name: 'Dumbbell Bench Press', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Beginner' },
  { id: 5, name: 'Incline Dumbbell Press', category: 'Chest', muscleGroup: 'Upper Pectorals', difficulty: 'Beginner' },
  { id: 6, name: 'Push-ups', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Beginner' },
  { id: 7, name: 'Dumbbell Flyes', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Intermediate' },
  { id: 8, name: 'Cable Crossover', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Intermediate' },
  { id: 9, name: 'Deadlift', category: 'Back', muscleGroup: 'Lower Back', difficulty: 'Advanced' },
  { id: 10, name: 'Barbell Rows', category: 'Back', muscleGroup: 'Lats', difficulty: 'Intermediate' },
  { id: 11, name: 'Pull-ups', category: 'Back', muscleGroup: 'Lats', difficulty: 'Advanced' },
  { id: 12, name: 'Lat Pulldown', category: 'Back', muscleGroup: 'Lats', difficulty: 'Beginner' },
  { id: 13, name: 'Barbell Squat', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Intermediate' },
  { id: 14, name: 'Leg Press', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Beginner' },
  { id: 15, name: 'Lunges', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Beginner' },
  { id: 16, name: 'Overhead Press', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Intermediate' },
  { id: 17, name: 'Lateral Raises', category: 'Shoulders', muscleGroup: 'Side Delts', difficulty: 'Beginner' },
  { id: 18, name: 'Barbell Curls', category: 'Arms', muscleGroup: 'Biceps', difficulty: 'Beginner' },
  { id: 19, name: 'Tricep Dips', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Intermediate' },
  { id: 20, name: 'Plank', category: 'Core', muscleGroup: 'Abs', difficulty: 'Beginner' },
];

function AuthScreen({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          name,
          role: 'client',
          createdAt: new Date().toISOString()
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

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

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

function PhotoUpload({ user, userRole }) {
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

function AdminPhotos({ user }) {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPhotos, setClientPhotos] = useState([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const clientData = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.role === 'client');
      setClients(clientData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadClientPhotos = async (clientId) => {
    try {
      const q = query(
        collection(db, 'progress-photos'),
        where('userId', '==', clientId),
        orderBy('uploadedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const photoData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClientPhotos(photoData);
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
          setUserRole(userDoc.data().role);
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
    return <AuthScreen onAuth={() => {}} />;
  }

  const navItems = userRole === 'admin' ? [
    { id: 'dashboard', label: 'Overview', icon: Users },
    { id: 'photos', label: 'Client Photos', icon: ImageIcon },
    { id: 'exercises', label: 'Exercise Database', icon: BookOpen },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: User },
    { id: 'photos', label: 'My Progress', icon: ImageIcon },
    { id: 'workouts', label: 'My Workouts', icon: Dumbbell }
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
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
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

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold">Welcome back!</h2>
                  <p className="text-emerald-100">Your fitness journey starts here</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-600 mb-1">Role</div>
                    <div className="text-2xl font-bold text-gray-900 capitalize">{userRole}</div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'photos' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                {userRole === 'admin' ? (
                  <AdminPhotos user={user} />
                ) : (
                  <PhotoUpload user={user} userRole={userRole} />
                )}
              </div>
            )}

            {currentView === 'exercises' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Exercise Database</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {EXERCISE_DATABASE.map(exercise => (
                    <div key={exercise.id} className="border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{exercise.name}</h3>
                      <div className="text-sm text-gray-600">
                        <div>Category: {exercise.category}</div>
                        <div>Muscle: {exercise.muscleGroup}</div>
                        <div className={`font-medium ${
                          exercise.difficulty === 'Beginner' ? 'text-green-600' :
                          exercise.difficulty === 'Intermediate' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          Level: {exercise.difficulty}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'workouts' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">My Workouts</h2>
                <p className="text-gray-600">Your assigned workouts will appear here.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
