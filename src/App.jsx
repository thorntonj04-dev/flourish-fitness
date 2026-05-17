import React, { useState, useEffect, useRef } from 'react';
import { Dumbbell, LogOut } from 'lucide-react';
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
import AdminDashboard from './components/admin/AdminDashboard';
import AdminInquiries from './components/admin/AdminInquiries';

// ============================================
// CLIENT COMPONENTS
// ============================================
import FormWorkoutSession from './components/client/FormWorkoutSession';
import WorkoutHistory from './components/client/WorkoutHistory';
import ProgramDashboard from './components/client/ProgramDashboard';
import ClientProfile from './components/client/ClientProfile';

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
  const [userName, setUserName] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  
  // NEW: State for workout session
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isInWorkout, setIsInWorkout] = useState(false);

  // Tab slide direction tracking
  const [slideDir, setSlideDir] = useState('forward');
  const prevViewRef = useRef('dashboard');

  const CLIENT_NAV = ['this-week', 'history', 'profile'];
  const ADMIN_NAV  = ['dashboard', 'workout-days', 'programs', 'clients', 'inquiries'];

  const navigateTo = (viewId) => {
    const order = userRole === 'client' ? CLIENT_NAV : ADMIN_NAV;
    const prevIdx = order.indexOf(prevViewRef.current);
    const nextIdx = order.indexOf(viewId);
    setSlideDir(nextIdx >= prevIdx ? 'forward' : 'back');
    prevViewRef.current = viewId;
    setCurrentView(viewId);
  };

  

  // ============================================
  // AUTHENTICATION & USER DATA
  // ============================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
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
            let resolvedName = userData.name || firebaseUser.email.split('@')[0];
            if (resolvedName === 'jlthornton07') {
              resolvedName = 'Lindsey';
              await set(dbRef(db, `users/${firebaseUser.uid}/name`), 'Lindsey');
            }
            setUserName(resolvedName);
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
            setUserName(name);
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
        setUserName(null);
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
  <span className="font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">Flourish Fitness</span>
</div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-[#d8e7de]">{userName}</div>
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
                  onClick={() => navigateTo(item.id)}
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
        <main className="flex-1 p-4 pb-32 md:p-6 md:pb-6">
          <div className="max-w-4xl mx-auto">
            <div key={currentView} className={slideDir === 'forward' ? 'slide-forward' : 'slide-back'}>

            {/* ========== DASHBOARD VIEW ========== */}
            {currentView === 'dashboard' && userRole === 'admin' && (
              <AdminDashboard user={user} onNavigate={navigateTo} />
            )}

            {/* ========== ADMIN: WORKOUT DAYS ========== */}
            {currentView === 'workout-days' && userRole === 'admin' && <WorkoutBuilder />}

            {/* ========== ADMIN: PROGRAMS ========== */}
            {currentView === 'programs' && userRole === 'admin' && <ProgramBuilder />}

            {/* ========== ADMIN: CLIENTS ========== */}
            {currentView === 'clients' && userRole === 'admin' && <ManageClients />}

            {/* ========== ADMIN: INQUIRIES ========== */}
            {currentView === 'inquiries' && userRole === 'admin' && <AdminInquiries />}

            {/* ========== CLIENT: THIS WEEK ========== */}
            {currentView === 'this-week' && userRole === 'client' && (
              <ProgramDashboard user={user} onStartWorkout={handleStartWorkout} />
            )}

            {/* ========== CLIENT: HISTORY ========== */}
            {currentView === 'history' && userRole === 'client' && <WorkoutHistory user={user} />}

            {/* ========== CLIENT: PROFILE ========== */}
            {currentView === 'profile' && userRole === 'client' && (
              <ClientProfile user={user} onProfileUpdate={name => setUserName(name)} />
            )}

            </div>{/* end slide wrapper */}
          </div>
        </main>
      </div>

{/* MOBILE FLOATING PILL NAVIGATION */}
<nav className="md:hidden fixed bottom-5 left-0 right-0 flex justify-center z-40 pointer-events-none">
  <div className="flex items-center gap-1 bg-white/85 dark:bg-[#142219]/90 backdrop-blur-2xl rounded-full px-1.5 py-1.5 shadow-2xl shadow-black/20 dark:shadow-black/60 border border-white/70 dark:border-[#C6A45F]/20 pointer-events-auto">
    {navItems.map(item => {
      const Icon = item.icon;
      const isActive = currentView === item.id;
      return (
        <button
          key={item.id}
          onClick={() => navigateTo(item.id)}
          className={`flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-full transition-all duration-200 min-w-[60px] ${
            isActive
              ? 'bg-gradient-to-b from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/40'
              : 'text-gray-400 dark:text-[#d8e7de]/50'
          }`}
        >
          <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-sm' : ''}`} />
          <span className="text-[10px] font-semibold leading-none tracking-wide">
            {item.label.split(' ')[0]}
          </span>
        </button>
      );
    })}
  </div>
</nav>

    </div>
  );
}
