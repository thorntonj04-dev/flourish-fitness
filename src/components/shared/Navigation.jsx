import { User, Dumbbell, Users, Image, Apple, BarChart3, Target, Calendar, Trophy, TrendingUp } from 'lucide-react';

export const adminNavItems = [
  { id: 'dashboard', label: 'Overview', icon: Users },
  { id: 'workouts', label: 'Workout Builder', icon: Dumbbell },
  { id: 'analytics', label: 'Client Analytics', icon: BarChart3 },  // NEW
  { id: 'clients', label: 'Manage Clients', icon: Users },
  { id: 'nutrition', label: 'Client Nutrition', icon: Apple },
  { id: 'photos', label: 'Client Photos', icon: Image },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'debug', label: 'Debug Users', icon: Users },      // ADD THIS
  { id: 'roles', label: 'Assign Roles', icon: Users },     // ADD THIS
];

export const clientNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: User },
  { id: 'workouts', label: 'My Workouts', icon: Dumbbell },
  { id: 'progress', label: 'Progress', icon: TrendingUp },  // NEW
  { id: 'history', label: 'History', icon: Calendar },      // NEW
  { id: 'records', label: 'Records', icon: Trophy },        // NEW
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'photos', label: 'My Progress', icon: Image },
  { id: 'goals', label: 'My Goals', icon: Target },
];
