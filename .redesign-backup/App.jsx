import React, { useState, useEffect } from 'react';
import { LogOut, Play, Heart } from 'lucide-react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as dbRef, get, set } from 'firebase/database';
import { auth, db } from './firebase';

// Import all components
import LandingPage from './components/LandingPage';
import AuthScreen from './components/AuthScreen';
import AdminSetup from './components/AdminSetup';

// ADMIN COMPONENTS
import WorkoutBuilder from './components/admin/WorkoutBuilder';
import ManageClients from './components/admin/ManageClients';
import Reports from './components/admin/Reports';
import AdminNutrition from './components/admin/AdminNutrition';
import AdminClientAnalytics from './components/admin/AdminClientAnalytics';
import DebugClientList from './components/admin/DebugClientList';
import AssignUserRoles from './components/admin/AssignUserRoles';
import AboutModal from './components/admin/AboutModal';

// CLIENT COMPONENTS
import MyWorkouts from './components/client/MyWorkouts';
import MyGoals from './components/client/MyGoals';
import NutritionLogger from './components/client/NutritionLogger';
import MeasurementTracking from './components/client/MeasurementTracking';
import ClientMeasurements from './components/admin/ClientMeasurements';
import ProgressDashboard from './components/client/ProgressDashboard';
import WorkoutHistory from './components/client/WorkoutHistory';
import PersonalRecords from './components/client/PersonalRecords';
import WorkoutSession from './components/client/WorkoutSession';
import WeeklyDashboard from './components/client/WeeklyDashboard';
import WorkoutCalendar from './components/client/WorkoutCalendar';

// SHARED COMPONENTS
import { adminNavItems, clientNavItems } from './components/shared/Navigation';

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [needsSetup, setNeedsSetup] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isInWorkout, setIsInWorkout] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

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

  const handleExitWorkout = () => {
    setIsInWorkout(false);
    setActiveWorkout(null);
    setCurrentView('weekly-dashboard');
  };

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

  const handleStartTodaysWorkout = async () => {
    const todaysWorkout = await getTodaysWorkout();
    if (todaysWorkout) {
      handleStartWorkout(todaysWorkout.workoutId);
    } else {
      alert('No workout assigned for today. Check your calendar!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-center">
          <img src="/logos/logosmall2.png" alt="Loading" className="w-24 h-24 mx-auto animate-spin mb-4" style={{animationDuration: '2s'}} />
          <div className="text-gold text-xl font-display font-bold">Loading...</div>
        </div>
      </div>
    );
  }

  if (showLanding && !user) {
    return <LandingPage onLoginClick={handleLoginClick} />;
  }

  if (showAuth && !user) {
    return <AuthScreen onBackToLanding={handleBackToLanding} />;
  }

  if (needsSetup) {
    return <AdminSetup user={user} />;
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-charcoal-light rounded-2xl p-8 shadow-2xl border border-sage-dark text-center">
          <div className="text-gold text-xl font-display font-bold mb-4">Configuration Error</div>
          <p className="text-cream/70 mb-4">Unable to load user role.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-gold text-charcoal rounded-lg hover:bg-gold-light font-semibold mr-2"
          >
            Refresh
          </button>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 bg-sage text-cream rounded-lg hover:bg-sage-dark font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (isInWorkout && activeWorkout) {
    return (
      <WorkoutSession 
        workout={activeWorkout}
        userId={user.uid}
        onExit={handleExitWorkout}
      />
    );
  }

  const navItems = userRole === 'admin' ? adminNavItems : clientNavItems;

  return (
    <div className="min-h-screen bg-charcoal">
      {/* HEADER */}
      <header className="bg-charcoal-light border-b border-sage-dark/30 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/logos/logosmall.png" alt="Flourish Fitness" className="w-10 h-10" />
            <span className="font-display font-bold text-cream text-lg">Flourish Fitness</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-cream">{user.email}</div>
              <div className="text-xs text-gold font-bold capitalize">
                {userRole === 'admin' ? '👑 Admin' : '💪 Client'}
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 hover:bg-sage-dark/20 rounded-lg transition">
              <LogOut className="w-5 h-5 text-gold" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-64 bg-charcoal-light border-r border-sage-dark/30 min-h-screen p-4 hidden md:block">
          <nav className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-semibold ${
                    currentView === item.id 
                      ? 'bg-gradient-to-r from-gold to-gold-light text-charcoal shadow-lg' 
                      : 'text-cream/70 hover:bg-sage-dark/20 hover:text-cream'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-sage-dark to-sage rounded-2xl p-8 text-cream relative border border-gold/20 shadow-xl">
                  <h2 className="text-3xl font-display font-bold mb-2">Welcome back!</h2>
                  <p className="text-gold-light font-medium">Your fitness journey starts here</p>
                  
                  {userRole === 'admin' && (
                    <button
                      onClick={() => setShowAbout(true)}
                      className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-gold/20 hover:bg-gold/30 backdrop-blur-sm text-gold rounded-lg font-bold transition-all border border-gold/40"
                    >
                      <Heart className="w-4 h-4" />
                      <span className="hidden sm:inline">About</span>
                    </button>
                  )}
                </div>
                
                {userRole === 'client' && (
                  <button
                    onClick={handleStartTodaysWorkout}
                    className="w-full py-5 bg-gradient-to-r from-gold to-gold-light text-charcoal rounded-xl font-display font-bold text-lg hover:opacity-90 flex items-center justify-center gap-3 shadow-xl"
                  >
                    <Play className="w-6 h-6" />
                    Start Today's Workout
                  </button>
                )}
                
                <div className="bg-charcoal-light rounded-2xl p-6 border border-sage-dark/30 shadow-lg">
                  <div className="text-sm text-gold font-semibold mb-2">Account Status</div>
                  <div className="text-2xl font-display font-bold text-cream capitalize mb-4">
                    {userRole === 'admin' ? '👑 Admin/Trainer Account' : '💪 Client Account'}
                  </div>
                  <p className="text-cream/70">
                    {userRole === 'admin' 
                      ? 'You have full access to manage clients, create workouts, track nutrition, and view progress photos.'
                      : 'Track your workouts, nutrition, upload progress photos, and stay on top of your fitness goals.'}
                  </p>
                </div>
              </div>
            )}

            {currentView === 'workouts' && (
              userRole === 'admin' ? <WorkoutBuilder /> : <MyWorkouts user={user} />
            )}
            {currentView === 'weekly-dashboard' && userRole === 'client' && (
              <WeeklyDashboard userId={user.uid} />
            )}
            {currentView === 'calendar' && userRole === 'client' && (
              <WorkoutCalendar 
                userId={user.uid}
                onStartWorkout={handleStartWorkout}
                onPreviewWorkout={(workoutId) => {
                  alert('Preview feature - you can add a preview modal here!');
                }}
              />
            )}
            {currentView === 'progress' && userRole === 'client' && (
              <ProgressDashboard user={user} />
            )}
            {currentView === 'history' && userRole === 'client' && (
              <WorkoutHistory user={user} />
            )}
            {currentView === 'records' && userRole === 'client' && (
              <PersonalRecords user={user} />
            )}
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
            {currentView === 'photos' && userRole === 'admin' && (
              <ClientMeasurements />
            )}
            {currentView === 'nutrition' && userRole === 'admin' && (
              <AdminNutrition />
            )}
            {currentView === 'goals' && userRole === 'client' && (
              <MyGoals user={user} />
            )}
            {currentView === 'nutrition' && (
              userRole === 'client' && <NutritionLogger user={user} />
            )}
            {currentView === 'photos' && (
              userRole === 'client' && <MeasurementTracking user={user} />
            )}
          </div>
        </main>
      </div>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-charcoal-light border-t border-sage-dark/30 px-4 py-2 z-40">
        <div className="flex justify-around">
          {navItems.slice(0, 4).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                  currentView === item.id ? 'text-gold' : 'text-cream/70'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-semibold">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {userRole === 'admin' && (
        <AboutModal 
          isOpen={showAbout} 
          onClose={() => setShowAbout(false)} 
        />
      )}
    </div>
  );
}
