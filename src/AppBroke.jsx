import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from './firebase';
// NOTE: Adjust these import paths based on your actual project structure
// If you get import errors, check where these components actually exist in your project

// ========== AUTH COMPONENTS ==========
// If you don't have a Login component at this path, update the path or comment this out
// and use your existing login solution
import Login from './components/Login';  // Adjusted - may need further adjustment

// ========== SHARED COMPONENTS ==========
import Sidebar from './components/shared/Sidebar';

// ========== CLIENT COMPONENTS ==========
import ClientDashboard from './components/client/ClientDashboard';
import MyWorkouts from './components/client/MyWorkouts';
import ClientNutrition from './components/client/ClientNutrition';
import MeasurementTracking from './components/client/MeasurementTracking';  // NEW - Replaces PhotoUpload
import ClientGoals from './components/client/ClientGoals';
import WeeklyDashboard from './components/client/WeeklyDashboard';
import ClientCalendar from './components/client/ClientCalendar';

// ========== ADMIN COMPONENTS ==========
import AdminDashboard from './components/admin/AdminDashboard';
import WorkoutBuilder from './components/admin/WorkoutBuilder';
import ManageClients from './components/admin/ManageClients';
import AdminNutrition from './components/admin/AdminNutrition';
import ClientMeasurements from './components/admin/ClientMeasurements';  // NEW - Replaces AdminPhotos
import AdminReports from './components/admin/AdminReports';
import DebugUsers from './components/admin/DebugUsers';
import AssignRoles from './components/admin/AssignRoles';
import ClientAnalytics from './components/admin/ClientAnalytics';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch user role from database
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const userData = snapshot.val();
          setUserRole(userData.role || 'client');
        } else {
          setUserRole('client'); // Default role
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Flourish Fitness...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Navigation */}
      <Sidebar 
        userRole={userRole} 
        currentView={currentView} 
        setCurrentView={setCurrentView}
        user={user}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* ========== CLIENT VIEWS ========== */}
          {userRole === 'client' && (
            <>
              {currentView === 'dashboard' && <ClientDashboard user={user} />}
              {currentView === 'weekly-dashboard' && <WeeklyDashboard user={user} />}
              {currentView === 'calendar' && <ClientCalendar user={user} />}
              {currentView === 'workouts' && <MyWorkouts user={user} />}
              {currentView === 'nutrition' && <ClientNutrition user={user} />}
              {currentView === 'photos' && <MeasurementTracking user={user} />}  {/* UPDATED - New measurement tracking */}
              {currentView === 'goals' && <ClientGoals user={user} />}
            </>
          )}

          {/* ========== ADMIN VIEWS ========== */}
          {userRole === 'admin' && (
            <>
              {currentView === 'dashboard' && <AdminDashboard />}
              {currentView === 'workouts' && <WorkoutBuilder />}
              {currentView === 'analytics' && <ClientAnalytics />}
              {currentView === 'clients' && <ManageClients />}
              {currentView === 'nutrition' && <AdminNutrition />}
              {currentView === 'photos' && <ClientMeasurements />}  {/* UPDATED - New client measurements viewer */}
              {currentView === 'reports' && <AdminReports />}
              {currentView === 'debug' && <DebugUsers />}
              {currentView === 'roles' && <AssignRoles />}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
