import { LayoutDashboard, Layers, Dumbbell, Users, CalendarDays, Clock, User } from 'lucide-react';

export const adminNavItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'programs', label: 'Programs', icon: Layers },
  { id: 'workout-days', label: 'Workouts', icon: Dumbbell },
  { id: 'clients', label: 'Clients', icon: Users },
];

export const clientNavItems = [
  { id: 'this-week', label: 'This Week', icon: CalendarDays },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'profile', label: 'Profile', icon: User },
];
