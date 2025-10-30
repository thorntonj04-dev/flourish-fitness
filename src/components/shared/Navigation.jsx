import { User, Dumbbell, Users, Apple, BarChart3, Target, Calendar, Trophy, TrendingUp, Ruler, Database } from 'lucide-react';

export const adminNavItems = [
  { id: 'dashboard', label: 'Overview', icon: Users },
  { id: 'workouts', label: 'Workout Builder', icon: Dumbbell },
  { id: 'analytics', label: 'Client Analytics', icon: BarChart3 },  
  { id: 'clients', label: 'Manage Clients', icon: Users },
  { id: 'nutrition', label: 'Client Nutrition', icon: Apple },
    { id: 'food-database', label: 'Food Database', icon: Database }, 
  { id: 'photos', label: 'Client Progress', icon: Ruler },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'debug', label: 'Debug Users', icon: Users },      
  { id: 'roles', label: 'Assign Roles', icon: Users },     
];

export const clientNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: User },
  { id: 'weekly-dashboard', label: 'Progress', icon: TrendingUp },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'workouts', label: 'My Workouts', icon: Dumbbell },    
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'weekly-nutrition', label: 'Weekly Nutrition', icon: TrendingUp },
  { id: 'photos', label: 'Measurements', icon: Ruler }, 
  { id: 'goals', label: 'My Goals', icon: Target },
];
