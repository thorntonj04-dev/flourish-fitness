import { User, Dumbbell, Users, Image, Apple, BarChart3, Target } from 'lucide-react';

export const adminNavItems = [
  { id: 'dashboard', label: 'Overview', icon: Users },
  { id: 'workouts', label: 'Workout Builder', icon: Dumbbell },
  { id: 'clients', label: 'Manage Clients', icon: Users },
  { id: 'nutrition', label: 'Client Nutrition', icon: Apple },
  { id: 'photos', label: 'Client Photos', icon: Image },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

export const clientNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: User },
  { id: 'workouts', label: 'My Workouts', icon: Dumbbell },
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'photos', label: 'My Progress', icon: Image },
  { id: 'goals', label: 'My Goals', icon: Target },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'history', label: 'History', icon: Calendar },
  { id: 'records', label: 'Records', icon: Trophy },
];
