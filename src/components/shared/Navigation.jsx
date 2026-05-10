import { LayoutDashboard, Layers, Dumbbell, Users, CalendarDays, Clock, User, Inbox } from 'lucide-react';

export const adminNavItems = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'programs', label: 'Programs', icon: Layers },
  { id: 'workout-days', label: 'Workouts', icon: Dumbbell },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'inquiries', label: 'Inquiries', icon: Inbox },
];

export const clientNavItems = [
  { id: 'this-week', label: 'This Week', icon: CalendarDays },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'profile', label: 'Profile', icon: User },
];
