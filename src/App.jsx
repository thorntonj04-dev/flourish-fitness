import React, { useState, useEffect } from 'react';
import { Dumbbell, LogOut, Play } from 'lucide-react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as dbRef, get, set } from 'firebase/database';
import { auth, db } from './firebase';

// Import all components
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import AdminSetup from './components/AdminSetup';

// ============================================
// ADMIN COMPONENTS
// ============================================
import WorkoutBuilder from './components/admin/WorkoutBuilder';
import ManageClients from './components/admin/ManageClients';
import Reports from './components/admin/Reports';
import AdminNutrition from './components/admin/AdminNutrition';
import AdminPhotos from './components/admin/AdminPhotos';
import AdminClientAnalytics from './components/admin/AdminClientAnalytics';
import DebugClientList from './components/admin/DebugClientList';
import AssignUserRoles from './components/admin/AssignUserRoles';

// ============================================
// CLIENT COMPONENTS - Original
// ============================================
import MyWorkouts from './components/client/MyWorkouts';
import MyGoals from './components/client/MyGoals';
import NutritionLogger from './components/client/NutritionLogger';
import PhotoUpload from './components/client/PhotoUpload';
import ProgressDashboard from './components/client/ProgressDashboard';
import WorkoutHistory from './components/client/WorkoutHistory';
import PersonalRecords from './components/client/PersonalRecords';

// ============================================
// CLIENT COMPONENTS - New Client Experience
// ============================================
import WorkoutSession from './components/client/WorkoutSession';
import WeeklyDashboard from './components/client/WeeklyDashboard';
import WorkoutCalendar from './components/client/WorkoutCalendar';

// ============================================
// SHARED COMPONENTS
// ============================================
import { adminNavItems, clientNavItems } from './components/shared/Navigation';
import DarkModeToggle from './components/shared/DarkModeToggle';

export default function App() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  
  // NEW: State for workout session
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isInWorkout, setIsInWorkout] = useState(false);

  // NEW: State for “Read Me” note
  const [showReadMe, setShowReadMe] = useState(false);

  // ============================================
  // AUTHENTICATION & USER DATA
  // ============================================
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

  // ============================================
  // EVENT HANDLERS
  // ============================================
  const handleSignOut = async () => {
    await signOut(auth);
    setCurrentView('dashboard');
    setShowLanding(true);
    setIsInWorkout(false);
    setActiveWorkout(null);
  };

  const handleLoginClick = () => {
    setShowLanding(false);
    setShowAuth(true);
  };

  const handleBackToLanding = () => {
    setShowAuth(false);
    setShowLanding(true);
  };

  // NEW: Start workout handler
  const handleStartWorkout = async (workoutId) => {
    try {
      const workoutRef = dbRef(db, `workouts/${workoutId}`);
      const snapshot = await get(workoutRef);
      
      if (snapshot.exists()) {
        setActiveWorkout({ id: workoutId, ...snapshot.val() });
        setIsInWorkout(true);
      } else {
        alert('Workout not found');
      }
    } catch (error) {
      console.error('Error loading workout:', error);
      alert('Failed to load workout');
    }
  };

  // NEW: Exit workout handler
  const handleExitWorkout = () => {
    setIsInWorkout(false);
    setActiveWorkout(null);
    setCurrentView('weekly-dashboard');
  };

  // NEW: Get today's assigned workout
  const getTodaysWorkout = async () => {
    if (!user) return null;
    
    try {
      const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const assignmentRef = dbRef(db, `workout-assignments/${user.uid}/${dayName}`);
      const snapshot = await get(assignmentRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Error getting today\'s workout:', error);
      return null;
    }
  };

  // NEW: Start today's workout
  const handleStartTodaysWorkout = async () => {
    const todaysWorkout = await getTodaysWorkout();
    if (todaysWorkout) {
      handleStartWorkout(todaysWorkout.workoutId);
    } else {
      alert('No workout assigned for today. Check your calendar!');
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
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

  // ============================================
  // UNAUTHENTICATED VIEWS
  // ============================================
  if (showLanding && !user) {
    return <LandingPage onLoginClick={handleLoginClick} />;
  }

  if (showAuth && !user) {
    return <AuthScreen onBackToLanding={handleBackToLanding} />;
  }

  // ============================================
  // SETUP & ERROR STATES
  // ============================================
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

  // ============================================
  // ACTIVE WORKOUT SESSION (FULL SCREEN)
  // ============================================
  if (isInWorkout && activeWorkout) {
    return (
      <WorkoutSession 
        workout={activeWorkout}
        userId={user.uid}
        onExit={handleExitWorkout}
      />
    );
  }

  // ============================================
  // MAIN APP INTERFACE
  // ============================================
  const navItems = userRole === 'admin' ? adminNavItems : clientNavItems;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* HEADER */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Flourish Fitness</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 capitalize font-medium">
                {userRole === 'admin' ? '👑 Admin' : '💪 Client'}
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen p-4 hidden md:block">
          <nav className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    currentView === item.id 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Dashboard View */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold">Welcome back!</h2>
                  <p className="text-emerald-100">Your fitness journey starts here</p>
                </div>

                {/* “Read Me” Button */}
                <button
                  onClick={() => setShowReadMe(true)}
                  className="mt-4 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-2xl shadow-md transition-all duration-200"
                >
                  💌 Read Me
                </button>

                {userRole === 'client' && (
                  <button
                    onClick={handleStartTodaysWorkout}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-lg hover:opacity-90 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Play className="w-6 h-6" />
                    Start Today's Workout
                  </button>
                )}

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

            {/* Modal for Read Me */}
            {showReadMe && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-xl relative overflow-y-auto max-h-[90vh]">
                  <button
                    className="absolute top-2 right-3 text-gray-500 text-2xl font-bold"
                    onClick={() => setShowReadMe(false)}
                  >
                    ×
                  </button>
                  <div className="prose max-w-none">
                    <h2>🌸 Flourish Fitness — Built Just for You, Babe</h2>
                    <p>
                      This entire platform was designed and built exclusively for you — a place where your passion for fitness, your care for clients, and your professional expertise all come together in one beautiful, seamless platform. I didn't think something existed that was good enough for you. This still isn’t, but... it will be over time.
                    </p>
                    <p>
                      This isn’t just an app. It’s your digital training home — built to reflect the way <em>you</em> coach, organize, and inspire people to become their strongest, healthiest selves.
                    </p>
                    <h3>💪 What Flourish Fitness Lets You Do</h3>
                    <ul>
                      <li><strong>A Personal Trainer’s Command Center</strong> - Everything you need to run your coaching — from managing clients to tracking their results — all in one place, made just for your workflow.</li>
                      <li><strong>Quick & Simple Client Onboarding</strong> - Add clients in seconds and get them started immediately with personalized training plans. No complicated setup, just clean and intuitive design.</li>
                      <li><strong>Program Templates Made for You</strong> - Build your signature programs once — like your transformation series or seasonal challenges — and reuse them whenever you want.</li>
                      <li><strong>Workout Builder That Speaks Your Language</strong> - Create detailed, customized workouts using your own structure: sets, reps, rest, tempo, and notes. Include exercise demos so clients always understand exactly what to do.</li>
                      <li><strong>Beautiful Progress Tracking</strong> - Track each client’s journey — from body metrics to workout consistency — and visualize their progress over time. It’s more than data; it’s motivation made visible.</li>
                      <li><strong>Built-In Scheduling Tools</strong> - Keep all your sessions, appointments, and program timelines organized. Your whole coaching week at a glance.</li>
                      <li><strong>Elegant, Branded Experience</strong> - Flourish Fitness looks and feels like <em>you</em>. It’s personalized, clean, and professional — just like the experience you give every client.</li>
                    </ul>
                    <h3>🌿 Why This Matters</h3>
                    <p>
                      Flourish Fitness was created to free up your time, simplify your workflow, and give your clients a smooth, engaging way to connect with your coaching. It’s not about doing more — it’s about doing what you love more easily.
                    </p>
                    <p>
                      This app mirrors the care, structure, and thoughtfulness you bring to every client — now in digital form.
                    </p>
                    <h3>✨ The Heart Behind It</h3>
                    <p>
                      You are not just another trainer, and you need more than a generic training platform for your clients. This isn’t a generic training platform. It’s a handcrafted, one-of-a-kind system — built just for <strong>you</strong>, to reflect your approach, your standards, and your passion for helping others flourish.  You'll see the features on this app continue to grow.  I've specifically been focused on the user experience with workouts and your experience with building them and being able to assign and see schedules... So I have a lot of work to do.  Coming up I will be working on the "my progress" section with progress picture uploads(adding in body measurements), and the nutrition portion where clients can upload macro's per meal and follow tracking over time, along with other feature upgrades here and there.  I'd like this to turn into an app the client opens every day to communicate with you when they save an update. I hope this makes your journey fun and exciting.  I need your help to continue to add things that make sense, and tell me when something doesn't so I can fix it! 
                    </p>
                    <p>I love you!<br/>John</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 z-40">
        <div className="flex justify-around">
          {navItems.slice(0, 4).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                  currentView === item.id ? 'text-emerald-500' : 'text-gray-600 dark:text-gray-300'
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

