import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Plus, X, Trash2, Camera, ChevronRight, ChevronLeft, Play, Check, Edit, Save, Search, Filter, Calendar, Clock, BarChart3, Shield } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, doc, getDoc, setDoc, orderBy, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, db, storage } from './firebase';

// ADMIN SETUP COMPONENT - Add this first!
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
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setDebugInfo({
          exists: true,
          data: data,
          hasRole: !!data.role,
          role: data.role || 'NONE'
        });
        console.log('📄 User Document Data:', data);
      } else {
        setDebugInfo({
          exists: false,
          data: null,
          hasRole: false,
          role: 'NONE'
        });
        console.log('❌ User document does not exist');
      }
    } catch (error) {
      console.error('❌ Error reading document:', error);
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
      console.log('🔧 Attempting to set admin role...');
      console.log('User ID:', user.uid);
      console.log('User Email:', user.email);
      
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: user.email.split('@')[0],
        role: 'admin',
        createdAt: new Date().toISOString(),
        macroGoals: { protein: 150, carbs: 200, fats: 50 }
      }, { merge: true });
      
      console.log('✅ Document written successfully');
      
      // Verify it was written
      const verifyDoc = await getDoc(doc(db, 'users', user.uid));
      console.log('🔍 Verification - Document data:', verifyDoc.data());
      
      setMessage('✅ Success! Refreshing in 2 seconds...');
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
                  {debugInfo.exists && debugInfo.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-yellow-700 cursor-pointer hover:underline">
                        Show raw data
                      </summary>
                      <pre className="text-xs mt-2 bg-yellow-100 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(debugInfo.data, null, 2)}
                      </pre>
                    </details>
                  )}
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

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>⚠️ Note:</strong> If you just clicked "Make Account Admin" and it succeeded, 
            the page should auto-refresh. If not, click the "Refresh Status" button or manually refresh your browser.
          </p>
        </div>

        <button
          onClick={() => signOut(auth)}
          className="w-full mt-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          Sign Out
        </button>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-blue-900 mb-2">🔍 Debugging Steps:</p>
          <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
            <li>Open browser console (F12)</li>
            <li>Look for console.log messages</li>
            <li>Click "Make Account Admin"</li>
            <li>Check if document was written successfully</li>
            <li>Page should auto-refresh after 2 seconds</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

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

// Sample exercises data
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

// Rest of your components remain exactly the same...
// (ExerciseLibrary, WorkoutBuilder, WorkoutAssignment, ClientWorkouts, NutritionLogger, PhotoUpload)

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth State Changed');
      
      if (firebaseUser) {
        console.log('✅ User logged in:', firebaseUser.email);
        console.log('🆔 User ID:', firebaseUser.uid);
        setUser(firebaseUser);
        
        try {
          console.log('📖 Attempting to read user document...');
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('✅ User document exists');
            console.log('📄 User data:', userData);
            
            const role = userData.role;
            console.log('👤 Role found:', role);
            
            if (!role) {
              console.log('⚠️ NO ROLE - showing setup screen');
              setNeedsSetup(true);
              setUserRole(null);
            } else {
              console.log('✅ Role is set:', role);
              console.log('🎯 Setting userRole state to:', role);
              setUserRole(role);
              setNeedsSetup(false);
            }
          } else {
            console.log('❌ User document DOES NOT EXIST - showing setup screen');
            setNeedsSetup(true);
            setUserRole(null);
          }
        } catch (error) {
          console.error('❌ ERROR loading user data:', error);
          console.error('Error details:', error.message);
          setNeedsSetup(true);
        }
      } else {
        console.log('🚪 User logged out');
        setUser(null);
        setUserRole(null);
        setNeedsSetup(false);
      }
      
      console.log('✅ Auth state change complete');
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
        <div className="text-center">
          <Dumbbell className="w-12 h-12 mx-auto text-emerald-600 animate-pulse mb-4" />
          <div className="text-emerald-600 text-xl font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Show setup screen if user needs role assignment
  if (needsSetup) {
    return <AdminSetup user={user} />;
  }

  // Show error if somehow we still don't have a role
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="text-red-600 text-xl font-bold mb-4">Configuration Error</div>
          <p className="text-gray-600 mb-4">Unable to load user role. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 mr-2"
          >
            Refresh Page
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

  // Debug log for nav items
  console.log('🧭 Navigation Items Generated');
  console.log('Current userRole:', userRole);
  console.log('Is Admin?', userRole === 'admin');
  console.log('Nav Items Count:', navItems.length);
  console.log('Nav Items:', navItems.map(item => item.label));

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
                  
                  {/* Debug Panel */}
                  <details className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                      🔍 Debug Information (Click to expand)
                    </summary>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">User ID:</span>
                        <span className="font-mono text-xs text-gray-900">{user.uid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role:</span>
                        <span className="font-medium text-gray-900">{userRole || 'NONE'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Setup Needed:</span>
                        <span className="font-medium text-gray-900">{needsSetup ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-600 mb-2">
                          If your role shows "admin" but you don't see admin menu items, try:
                        </p>
                        <button
                          onClick={() => window.location.reload()}
                          className="w-full py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
                        >
                          🔄 Hard Refresh Page
                        </button>
                      </div>
                    </div>
                  </details>
                </div>
                
                {userRole === 'admin' && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-emerald-900 mb-2">🎉 Admin Features Active</h3>
                    <p className="text-sm text-emerald-700 mb-4">
                      You have access to all admin features. Check the sidebar for:
                    </p>
                    <ul className="space-y-2 text-sm text-emerald-800">
                      <li>• 📚 Exercise Library</li>
                      <li>• 💪 Build Workouts</li>
                      <li>• 📅 Assign Workouts</li>
                      <li>• 🍎 Client Nutrition</li>
                      <li>• 📸 Client Photos</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Add your other view components here */}
            {currentView !== 'dashboard' && (
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <p className="text-gray-600">Content for {currentView} coming soon...</p>
              </div>
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
