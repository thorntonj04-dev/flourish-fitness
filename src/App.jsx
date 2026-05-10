import React, { useState, useEffect } from 'react';
import { Dumbbell, LogOut, Heart, Sparkles } from 'lucide-react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as dbRef, get, set } from 'firebase/database';
import { auth, db } from './firebase';
import './styles/global.css';


// Import all components
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import AdminSetup from './components/AdminSetup';

// ============================================
// ADMIN COMPONENTS
// ============================================
import WorkoutBuilder from './components/admin/WorkoutBuilder';
import ProgramBuilder from './components/admin/ProgramBuilder';
import ManageClients from './components/admin/ManageClients';
import AboutModal from './components/admin/AboutModal';
import AppWalkthroughModal from './components/admin/AppWalkthroughModal';

// ============================================
// CLIENT COMPONENTS
// ============================================
import FormWorkoutSession from './components/client/FormWorkoutSession';
import WorkoutHistory from './components/client/WorkoutHistory';
import ProgramDashboard from './components/client/ProgramDashboard';

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

  // NEW: State for About modal
  const [showAbout, setShowAbout] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  

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
            if (role === 'client') setCurrentView('this-week');
            setNeedsSetup(false);
          } else {
            const pendingKey = firebaseUser.email.toLowerCase().replace(/\./g, ',');
            const pendingSnap = await get(dbRef(db, `pendingClients/${pendingKey}`));
            let role = 'admin';
            let name = firebaseUser.email.split('@')[0];
            if (pendingSnap.exists()) {
              const pending = pendingSnap.val();
              role = pending.role || 'client';
              name = pending.name || name;
              await set(dbRef(db, `pendingClients/${pendingKey}`), null);
            }
            await set(userRef, {
              email: firebaseUser.email,
              name,
              role,
              createdAt: new Date().toISOString(),
            });
            setUserRole(role);
            if (role === 'client') setCurrentView('this-week');
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
    setCurrentView('this-week');
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
      <FormWorkoutSession 
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      {/* ============================================ */}
      {/* HEADER */}
      {/* ============================================ */}
      <header className="bg-white dark:bg-[#1E3328] border-b border-gray-200 dark:border-[#C6A45F]/25 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
<div className="flex items-center gap-2">
  {/* Dark Mode Toggle */}
  <DarkModeToggle />
  
  <img
    src="/images/logosmall.png"
    alt="Flourish Fitness"
    className="w-10 h-10 object-contain rounded-md"
  />
  <span className="font-bold text-gray-900 dark:text-[#d8e7de]">Flourish Fitness</span>
</div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-[#d8e7de]">{user.email}</div>
              <div className="text-xs text-emerald-600 dark:text-[#FFD700] capitalize font-medium">
                {userRole === 'admin' ? '👑 Admin' : '💪 Client'}
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 hover:bg-gray-100 dark:hover:bg-[#1E3328] rounded-lg transition">
              <LogOut className="w-5 h-5 text-gray-600 dark:text-[#d8e7de]/80" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ============================================ */}
        {/* SIDEBAR NAVIGATION (Desktop) */}
        {/* ============================================ */}
        <aside className="w-64 bg-white dark:bg-[#1E3328] border-r border-gray-200 dark:border-[#C6A45F]/25 min-h-screen p-4 hidden md:block">
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
                      : 'text-gray-600 dark:text-[#d8e7de]/80 hover:bg-gray-100 dark:hover:bg-[#1E3328]'
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
                {/* Header with About Button (Admin Only) */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white relative">
                  <h2 className="text-2xl font-bold">Welcome back!</h2>
                  <p className="text-emerald-100">Your fitness journey starts here</p>
                  
                  {/* About Button - Only shows for admin */}
                  {userRole === 'admin' && (
                    <button
                      onClick={() => setShowAbout(true)}
                      className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-semibold transition-all border border-white/30"
                      title="Learn about Flourish Fitness"
                    >
                      <Heart className="w-4 h-4" />
                      <span className="hidden sm:inline">About</span>
                    </button>
                  )}
                </div>
                
                <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 border border-gray-200 dark:border-[#C6A45F]/25">
                  <div className="text-sm text-gray-600 dark:text-[#d8e7de]/60 mb-2">Account</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-[#d8e7de] capitalize mb-2">
                    👑 Admin / Trainer
                  </div>
                  <p className="text-gray-600 dark:text-[#d8e7de]/80 mb-5">
                    Build programs, manage workouts, and assign training to your clients.
                  </p>
                  <button
                    onClick={() => setShowWalkthrough(true)}
                    className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 min-h-[52px] active:opacity-90"
                  >
                    <Sparkles className="w-5 h-5" />
                    How to Use This App
                  </button>
                </div>
              </div>
            )}

            {/* ========== ADMIN: WORKOUT DAYS ========== */}
            {currentView === 'workout-days' && userRole === 'admin' && <WorkoutBuilder />}

            {/* ========== ADMIN: PROGRAMS ========== */}
            {currentView === 'programs' && userRole === 'admin' && <ProgramBuilder />}

            {/* ========== ADMIN: CLIENTS ========== */}
            {currentView === 'clients' && userRole === 'admin' && <ManageClients />}

            {/* ========== CLIENT: THIS WEEK ========== */}
            {currentView === 'this-week' && userRole === 'client' && (
              <ProgramDashboard user={user} onStartWorkout={handleStartWorkout} />
            )}

            {/* ========== CLIENT: HISTORY ========== */}
            {currentView === 'history' && userRole === 'client' && <WorkoutHistory user={user} />}

            {/* ========== CLIENT: PROFILE ========== */}
            {currentView === 'profile' && userRole === 'client' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold">Profile</h2>
                </div>
                <div className="bg-white dark:bg-[#1E3328] rounded-2xl p-6 border border-gray-200 dark:border-[#C6A45F]/25">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-[#d8e7de]">{user.email}</div>
                      <div className="text-sm text-emerald-600 dark:text-[#FFD700]">Client</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

{/* MOBILE BOTTOM NAVIGATION */}
<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1E3328] border-t border-gray-200 dark:border-[#C6A45F]/25 z-40">
  <div className="flex justify-around px-2 py-2">
    {navItems.map(item => {
      const Icon = item.icon;
      return (
        <button
          key={item.id}
          onClick={() => setCurrentView(item.id)}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
            currentView === item.id
              ? 'text-emerald-500 dark:text-[#FFD700]'
              : 'text-gray-600 dark:text-[#d8e7de]/80'
          }`}
        >
          <Icon className="w-6 h-6" />
          <span className="text-xs">{item.label.split(' ')[0]}</span>
        </button>
      );
    })}
  </div>
</nav>

      {/* ============================================ */}
      {/* ABOUT MODAL - Shows special message about Flourish Fitness */}
      {/* Only visible to admin users when showAbout is true */}
      {/* ============================================ */}
      {userRole === 'admin' && (
        <AboutModal
          isOpen={showAbout}
          onClose={() => setShowAbout(false)}
        />
      )}

      {userRole === 'admin' && showWalkthrough && (
        <AppWalkthroughModal onClose={() => setShowWalkthrough(false)} />
      )}
    </div>
  );
}
