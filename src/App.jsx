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
    <div className="min-h-screen bg-gray-50">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
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
        {/* ============================================ */}
        {/* SIDEBAR NAVIGATION (Desktop) */}
        {/* ============================================ */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 hidden md:block">
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
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ============================================ */}
        {/* MAIN CONTENT AREA */}
        {/* This is where different "views" are rendered */}
        {/* based on the currentView state */}
        {/* ============================================ */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            
            {/* ========== DASHBOARD VIEW ========== */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold">Welcome back!</h2>
                  <p className="text-emerald-100">Your fitness journey starts here</p>
                </div>
                
                {/* Quick Start Workout Button (Client Only) */}
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

            {/* ========== WORKOUT VIEWS ========== */}
            {currentView === 'workouts' && (
              userRole === 'admin' ? <WorkoutBuilder /> : <MyWorkouts user={user} />
            )}

            {/* ========== NEW: WEEKLY DASHBOARD (Client) ========== */}
            {currentView === 'weekly-dashboard' && userRole === 'client' && (
              <WeeklyDashboard userId={user.uid} />
            )}

            {/* ========== NEW: WORKOUT CALENDAR (Client) ========== */}
            {currentView === 'calendar' && userRole === 'client' && (
              <WorkoutCalendar 
                userId={user.uid}
                onStartWorkout={handleStartWorkout}
                onPreviewWorkout={(workoutId) => {
                  // Preview workout - could open a modal or navigate to a preview view
                  alert('Preview feature - you can add a preview modal here!');
                }}
              />
            )}

            {/* ========== PROGRESS & TRACKING VIEWS ========== */}
            {currentView === 'progress' && userRole === 'client' && (
              <ProgressDashboard user={user} />
            )}
            {currentView === 'history' && userRole === 'client' && (
              <WorkoutHistory user={user} />
            )}
            {currentView === 'records' && userRole === 'client' && (
              <PersonalRecords user={user} />
            )}

            {/* ========== ADMIN VIEWS ========== */}
            {currentView === 'analytics' && userRole === 'admin' && (
              <AdminClientAnalytics user={user} />
            )}
            {currentView === 'clients' && userRole === 'admin' && (
              <ManageClients />
            )}
            {currentView === 'reports' && userRole === 'admin' && (
              <Reports />
            )}
            {currentView === 'debug' && userRole === 'admin' && (
              <DebugClientList />
            )}
            {currentView === 'roles' && userRole === 'admin' && (
              <AssignUserRoles />
            )}

            {/* ========== GOALS VIEW ========== */}
            {currentView === 'goals' && userRole === 'client' && (
              <MyGoals user={user} />
            )}

            {/* ========== NUTRITION VIEWS ========== */}
            {currentView === 'nutrition' && (
              userRole === 'admin' ? <AdminNutrition /> : <NutritionLogger user={user} />
            )}

            {/* ========== PHOTO VIEWS ========== */}
            {currentView === 'photos' && (
              userRole === 'admin' ? <AdminPhotos /> : <PhotoUpload user={user} />
            )}
          </div>
        </main>
      </div>

      {/* ============================================ */}
      {/* MOBILE BOTTOM NAVIGATION */}
      {/* ============================================ */}
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
