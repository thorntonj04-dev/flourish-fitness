import React, { useState } from 'react';
import { User, Dumbbell, Users, BookOpen, Target, Calendar, Image, DollarSign, LogOut, Plus, X, Check, ChevronRight, Star, Clock, Edit, Trash2, Send, Award, Heart, TrendingUp, Minus, CheckCircle } from 'lucide-react';

const CLIENTS = [
  { id: 1, name: 'Sarah Mitchell', email: 'sarah.m@email.com', avatar: 'SM' },
  { id: 2, name: 'Mike Rodriguez', email: 'mike.r@email.com', avatar: 'MR' },
  { id: 3, name: 'Jennifer Thompson', email: 'jen.t@email.com', avatar: 'JT' },
  { id: 4, name: 'David Chen', email: 'david.c@email.com', avatar: 'DC' },
  { id: 5, name: 'Emma Williams', email: 'emma.w@email.com', avatar: 'EW' }
];

const EXERCISE_DATABASE = [
  { id: 1, name: 'Barbell Bench Press', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Intermediate' },
  { id: 2, name: 'Incline Barbell Bench Press', category: 'Chest', muscleGroup: 'Upper Pectorals', difficulty: 'Intermediate' },
  { id: 3, name: 'Decline Barbell Bench Press', category: 'Chest', muscleGroup: 'Lower Pectorals', difficulty: 'Intermediate' },
  { id: 4, name: 'Dumbbell Bench Press', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Beginner' },
  { id: 5, name: 'Incline Dumbbell Press', category: 'Chest', muscleGroup: 'Upper Pectorals', difficulty: 'Beginner' },
  { id: 6, name: 'Decline Dumbbell Press', category: 'Chest', muscleGroup: 'Lower Pectorals', difficulty: 'Beginner' },
  { id: 7, name: 'Dumbbell Flyes', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Intermediate' },
  { id: 8, name: 'Incline Dumbbell Flyes', category: 'Chest', muscleGroup: 'Upper Pectorals', difficulty: 'Intermediate' },
  { id: 9, name: 'Cable Crossover', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Intermediate' },
  { id: 10, name: 'Chest Dips', category: 'Chest', muscleGroup: 'Lower Pectorals', difficulty: 'Advanced' },
  { id: 11, name: 'Push-ups', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Beginner' },
  { id: 12, name: 'Incline Push-ups', category: 'Chest', muscleGroup: 'Lower Pectorals', difficulty: 'Beginner' },
  { id: 13, name: 'Decline Push-ups', category: 'Chest', muscleGroup: 'Upper Pectorals', difficulty: 'Intermediate' },
  { id: 14, name: 'Pec Deck Machine', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Beginner' },
  { id: 15, name: 'Machine Chest Press', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Beginner' },
  { id: 16, name: 'Deadlift', category: 'Back', muscleGroup: 'Lower Back', difficulty: 'Advanced' },
  { id: 17, name: 'Barbell Rows', category: 'Back', muscleGroup: 'Lats', difficulty: 'Intermediate' },
  { id: 18, name: 'T-Bar Rows', category: 'Back', muscleGroup: 'Lats', difficulty: 'Intermediate' },
  { id: 19, name: 'Dumbbell Rows', category: 'Back', muscleGroup: 'Lats', difficulty: 'Beginner' },
  { id: 20, name: 'Seated Cable Rows', category: 'Back', muscleGroup: 'Mid Back', difficulty: 'Beginner' },
  { id: 21, name: 'Pull-ups', category: 'Back', muscleGroup: 'Lats', difficulty: 'Advanced' },
  { id: 22, name: 'Chin-ups', category: 'Back', muscleGroup: 'Lats', difficulty: 'Advanced' },
  { id: 23, name: 'Lat Pulldown', category: 'Back', muscleGroup: 'Lats', difficulty: 'Beginner' },
  { id: 24, name: 'Close-Grip Pulldown', category: 'Back', muscleGroup: 'Lats', difficulty: 'Beginner' },
  { id: 25, name: 'Wide-Grip Pulldown', category: 'Back', muscleGroup: 'Lats', difficulty: 'Beginner' },
  { id: 26, name: 'Face Pulls', category: 'Back', muscleGroup: 'Rear Delts', difficulty: 'Beginner' },
  { id: 27, name: 'Hyperextensions', category: 'Back', muscleGroup: 'Lower Back', difficulty: 'Beginner' },
  { id: 28, name: 'Good Mornings', category: 'Back', muscleGroup: 'Lower Back', difficulty: 'Intermediate' },
  { id: 29, name: 'Shrugs', category: 'Back', muscleGroup: 'Traps', difficulty: 'Beginner' },
  { id: 30, name: 'Reverse Flyes', category: 'Back', muscleGroup: 'Rear Delts', difficulty: 'Beginner' },
  { id: 31, name: 'Barbell Squat', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Intermediate' },
  { id: 32, name: 'Front Squat', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Advanced' },
  { id: 33, name: 'Goblet Squat', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Beginner' },
  { id: 34, name: 'Bulgarian Split Squat', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Intermediate' },
  { id: 35, name: 'Leg Press', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Beginner' },
  { id: 36, name: 'Leg Extensions', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Beginner' },
  { id: 37, name: 'Romanian Deadlift', category: 'Legs', muscleGroup: 'Hamstrings', difficulty: 'Intermediate' },
  { id: 38, name: 'Leg Curls', category: 'Legs', muscleGroup: 'Hamstrings', difficulty: 'Beginner' },
  { id: 39, name: 'Walking Lunges', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Beginner' },
  { id: 40, name: 'Reverse Lunges', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Beginner' },
  { id: 41, name: 'Lateral Lunges', category: 'Legs', muscleGroup: 'Adductors', difficulty: 'Beginner' },
  { id: 42, name: 'Step-ups', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Beginner' },
  { id: 43, name: 'Calf Raises', category: 'Legs', muscleGroup: 'Calves', difficulty: 'Beginner' },
  { id: 44, name: 'Seated Calf Raises', category: 'Legs', muscleGroup: 'Calves', difficulty: 'Beginner' },
  { id: 45, name: 'Hack Squat', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Intermediate' },
  { id: 46, name: 'Overhead Press', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Intermediate' },
  { id: 47, name: 'Dumbbell Shoulder Press', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Beginner' },
  { id: 48, name: 'Arnold Press', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Intermediate' },
  { id: 49, name: 'Lateral Raises', category: 'Shoulders', muscleGroup: 'Side Delts', difficulty: 'Beginner' },
  { id: 50, name: 'Front Raises', category: 'Shoulders', muscleGroup: 'Front Delts', difficulty: 'Beginner' },
  { id: 51, name: 'Rear Delt Flyes', category: 'Shoulders', muscleGroup: 'Rear Delts', difficulty: 'Beginner' },
  { id: 52, name: 'Upright Rows', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Intermediate' },
  { id: 53, name: 'Cable Lateral Raises', category: 'Shoulders', muscleGroup: 'Side Delts', difficulty: 'Beginner' },
  { id: 54, name: 'Machine Shoulder Press', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Beginner' },
  { id: 55, name: 'Pike Push-ups', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Intermediate' },
  { id: 56, name: 'Barbell Curls', category: 'Arms', muscleGroup: 'Biceps', difficulty: 'Beginner' },
  { id: 57, name: 'Dumbbell Curls', category: 'Arms', muscleGroup: 'Biceps', difficulty: 'Beginner' },
  { id: 58, name: 'Hammer Curls', category: 'Arms', muscleGroup: 'Biceps', difficulty: 'Beginner' },
  { id: 59, name: 'Preacher Curls', category: 'Arms', muscleGroup: 'Biceps', difficulty: 'Intermediate' },
  { id: 60, name: 'Cable Curls', category: 'Arms', muscleGroup: 'Biceps', difficulty: 'Beginner' },
  { id: 61, name: 'Concentration Curls', category: 'Arms', muscleGroup: 'Biceps', difficulty: 'Beginner' },
  { id: 62, name: 'Incline Dumbbell Curls', category: 'Arms', muscleGroup: 'Biceps', difficulty: 'Intermediate' },
  { id: 63, name: 'EZ-Bar Curls', category: 'Arms', muscleGroup: 'Biceps', difficulty: 'Beginner' },
  { id: 64, name: 'Reverse Curls', category: 'Arms', muscleGroup: 'Forearms', difficulty: 'Beginner' },
  { id: 65, name: 'Zottman Curls', category: 'Arms', muscleGroup: 'Biceps', difficulty: 'Intermediate' },
  { id: 66, name: 'Tricep Dips', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Intermediate' },
  { id: 67, name: 'Close-Grip Bench Press', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Intermediate' },
  { id: 68, name: 'Overhead Tricep Extension', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Beginner' },
  { id: 69, name: 'Tricep Pushdown', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Beginner' },
  { id: 70, name: 'Rope Pushdown', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Beginner' },
  { id: 71, name: 'Skull Crushers', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Intermediate' },
  { id: 72, name: 'Dumbbell Kickbacks', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Beginner' },
  { id: 73, name: 'Diamond Push-ups', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Intermediate' },
  { id: 74, name: 'Bench Dips', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Beginner' },
  { id: 75, name: 'Cable Overhead Extension', category: 'Arms', muscleGroup: 'Triceps', difficulty: 'Beginner' },
  { id: 76, name: 'Plank', category: 'Core', muscleGroup: 'Abs', difficulty: 'Beginner' },
  { id: 77, name: 'Side Plank', category: 'Core', muscleGroup: 'Obliques', difficulty: 'Beginner' },
  { id: 78, name: 'Crunches', category: 'Core', muscleGroup: 'Abs', difficulty: 'Beginner' },
  { id: 79, name: 'Bicycle Crunches', category: 'Core', muscleGroup: 'Abs', difficulty: 'Beginner' },
  { id: 80, name: 'Russian Twists', category: 'Core', muscleGroup: 'Obliques', difficulty: 'Beginner' },
  { id: 81, name: 'Hanging Leg Raises', category: 'Core', muscleGroup: 'Lower Abs', difficulty: 'Advanced' },
  { id: 82, name: 'Cable Crunches', category: 'Core', muscleGroup: 'Abs', difficulty: 'Intermediate' },
  { id: 83, name: 'Ab Wheel Rollout', category: 'Core', muscleGroup: 'Abs', difficulty: 'Advanced' },
  { id: 84, name: 'Mountain Climbers', category: 'Core', muscleGroup: 'Abs', difficulty: 'Intermediate' },
  { id: 85, name: 'Dead Bug', category: 'Core', muscleGroup: 'Abs', difficulty: 'Beginner' },
  { id: 86, name: 'Clean and Press', category: 'Full Body', muscleGroup: 'Full Body', difficulty: 'Advanced' },
  { id: 87, name: 'Thrusters', category: 'Full Body', muscleGroup: 'Full Body', difficulty: 'Intermediate' },
  { id: 88, name: 'Burpees', category: 'Full Body', muscleGroup: 'Full Body', difficulty: 'Intermediate' },
  { id: 89, name: 'Box Jumps', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Intermediate' },
  { id: 90, name: 'Kettlebell Swings', category: 'Full Body', muscleGroup: 'Posterior Chain', difficulty: 'Intermediate' },
  { id: 91, name: 'Wrist Curls', category: 'Arms', muscleGroup: 'Forearms', difficulty: 'Beginner' },
  { id: 92, name: 'Reverse Wrist Curls', category: 'Arms', muscleGroup: 'Forearms', difficulty: 'Beginner' },
  { id: 93, name: 'Hip Thrusts', category: 'Legs', muscleGroup: 'Glutes', difficulty: 'Beginner' },
  { id: 94, name: 'Glute Bridges', category: 'Legs', muscleGroup: 'Glutes', difficulty: 'Beginner' },
  { id: 95, name: 'Hip Abduction Machine', category: 'Legs', muscleGroup: 'Glutes', difficulty: 'Beginner' },
  { id: 96, name: 'Hip Adduction Machine', category: 'Legs', muscleGroup: 'Adductors', difficulty: 'Beginner' },
  { id: 97, name: 'Farmer Carries', category: 'Full Body', muscleGroup: 'Grip and Core', difficulty: 'Beginner' },
  { id: 98, name: 'Turkish Get-ups', category: 'Full Body', muscleGroup: 'Full Body', difficulty: 'Advanced' },
  { id: 99, name: 'Landmine Press', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Intermediate' },
  { id: 100, name: 'Landmine Rows', category: 'Back', muscleGroup: 'Lats', difficulty: 'Intermediate' },
  { id: 101, name: 'Wide-Grip Bench Press', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Intermediate' },
  { id: 102, name: 'Close-Grip Dumbbell Press', category: 'Chest', muscleGroup: 'Inner Pectorals', difficulty: 'Intermediate' },
  { id: 103, name: 'Svend Press', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Beginner' },
  { id: 104, name: 'Floor Press', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Intermediate' },
  { id: 105, name: 'Plate Press', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Beginner' },
  { id: 106, name: 'Single-Arm Dumbbell Row', category: 'Back', muscleGroup: 'Lats', difficulty: 'Beginner' },
  { id: 107, name: 'Chest-Supported Row', category: 'Back', muscleGroup: 'Lats', difficulty: 'Beginner' },
  { id: 108, name: 'Meadows Row', category: 'Back', muscleGroup: 'Lats', difficulty: 'Advanced' },
  { id: 109, name: 'Inverted Rows', category: 'Back', muscleGroup: 'Lats', difficulty: 'Intermediate' },
  { id: 110, name: 'Straight-Arm Pulldown', category: 'Back', muscleGroup: 'Lats', difficulty: 'Intermediate' },
  { id: 111, name: 'Sumo Deadlift', category: 'Legs', muscleGroup: 'Hamstrings', difficulty: 'Advanced' },
  { id: 112, name: 'Trap Bar Deadlift', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Intermediate' },
  { id: 113, name: 'Single-Leg Press', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Intermediate' },
  { id: 114, name: 'Sissy Squats', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Advanced' },
  { id: 115, name: 'Nordic Hamstring Curls', category: 'Legs', muscleGroup: 'Hamstrings', difficulty: 'Advanced' },
  { id: 116, name: 'Seated Dumbbell Press', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Beginner' },
  { id: 117, name: 'Standing Barbell Press', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Intermediate' },
  { id: 118, name: 'Behind-the-Neck Press', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Advanced' },
  { id: 119, name: 'Bradford Press', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Intermediate' },
  { id: 120, name: 'Bus Drivers', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Intermediate' },
  { id: 121, name: 'Pallof Press', category: 'Core', muscleGroup: 'Obliques', difficulty: 'Intermediate' },
  { id: 122, name: 'Woodchoppers', category: 'Core', muscleGroup: 'Obliques', difficulty: 'Beginner' },
  { id: 123, name: 'Leg Raises', category: 'Core', muscleGroup: 'Lower Abs', difficulty: 'Intermediate' },
  { id: 124, name: 'Decline Sit-ups', category: 'Core', muscleGroup: 'Abs', difficulty: 'Intermediate' },
  { id: 125, name: 'V-ups', category: 'Core', muscleGroup: 'Abs', difficulty: 'Advanced' },
  { id: 126, name: 'Medicine Ball Slams', category: 'Full Body', muscleGroup: 'Full Body', difficulty: 'Beginner' },
  { id: 127, name: 'Battle Ropes', category: 'Full Body', muscleGroup: 'Full Body', difficulty: 'Intermediate' },
  { id: 128, name: 'Sled Push', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Intermediate' },
  { id: 129, name: 'Sled Pull', category: 'Legs', muscleGroup: 'Hamstrings', difficulty: 'Intermediate' },
  { id: 130, name: 'Prowler Push', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Advanced' },
  { id: 131, name: 'Jump Squats', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Intermediate' },
  { id: 132, name: 'Broad Jumps', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Intermediate' },
  { id: 133, name: 'Depth Jumps', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Advanced' },
  { id: 134, name: 'Plyo Push-ups', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Advanced' },
  { id: 135, name: 'Clapping Push-ups', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Advanced' },
  { id: 136, name: 'Cat-Cow Stretch', category: 'Mobility', muscleGroup: 'Spine', difficulty: 'Beginner' },
  { id: 137, name: 'World Greatest Stretch', category: 'Mobility', muscleGroup: 'Full Body', difficulty: 'Beginner' },
  { id: 138, name: 'Shoulder Dislocations', category: 'Mobility', muscleGroup: 'Shoulders', difficulty: 'Beginner' },
  { id: 139, name: 'Band Pull-Aparts', category: 'Mobility', muscleGroup: 'Shoulders', difficulty: 'Beginner' },
  { id: 140, name: 'Arm Circles', category: 'Mobility', muscleGroup: 'Shoulders', difficulty: 'Beginner' },
  { id: 141, name: 'Pistol Squats', category: 'Legs', muscleGroup: 'Quads', difficulty: 'Advanced' },
  { id: 142, name: 'Archer Push-ups', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Advanced' },
  { id: 143, name: 'One-Arm Dumbbell Snatch', category: 'Full Body', muscleGroup: 'Full Body', difficulty: 'Advanced' },
  { id: 144, name: 'Dragon Flags', category: 'Core', muscleGroup: 'Abs', difficulty: 'Advanced' },
  { id: 145, name: 'L-Sit', category: 'Core', muscleGroup: 'Abs', difficulty: 'Advanced' },
  { id: 146, name: 'Handstand Push-ups', category: 'Shoulders', muscleGroup: 'Deltoids', difficulty: 'Advanced' },
  { id: 147, name: 'Muscle-ups', category: 'Full Body', muscleGroup: 'Full Body', difficulty: 'Advanced' },
  { id: 148, name: 'Ring Dips', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Advanced' },
  { id: 149, name: 'TRX Rows', category: 'Back', muscleGroup: 'Lats', difficulty: 'Intermediate' },
  { id: 150, name: 'TRX Push-ups', category: 'Chest', muscleGroup: 'Pectorals', difficulty: 'Intermediate' },
];

const PRESET_WORKOUTS = [
  {
    id: 'preset-1',
    name: 'Chest Day - High Weight Low Rep',
    exercises: [
      { ...EXERCISE_DATABASE[139], sets: 2, reps: 20, rest: 30, uniqueId: 1001 },
      { ...EXERCISE_DATABASE[138], sets: 2, reps: 15, rest: 30, uniqueId: 1002 },
      { ...EXERCISE_DATABASE[10], sets: 2, reps: 10, rest: 30, uniqueId: 1003 },
      { ...EXERCISE_DATABASE[0], sets: 4, reps: 5, rest: 180, uniqueId: 1004 },
      { ...EXERCISE_DATABASE[1], sets: 4, reps: 6, rest: 150, uniqueId: 1005 },
      { ...EXERCISE_DATABASE[3], sets: 3, reps: 8, rest: 120, uniqueId: 1006 },
      { ...EXERCISE_DATABASE[9], sets: 3, reps: 8, rest: 120, uniqueId: 1007 },
      { ...EXERCISE_DATABASE[8], sets: 3, reps: 15, rest: 60, uniqueId: 1008 },
      { ...EXERCISE_DATABASE[6], sets: 3, reps: 12, rest: 60, uniqueId: 1009 },
      { ...EXERCISE_DATABASE[13], sets: 2, reps: 20, rest: 45, uniqueId: 1010 },
    ]
  },
  {
    id: 'preset-2',
    name: 'Chest Day - Light Weight High Rep',
    exercises: [
      { ...EXERCISE_DATABASE[139], sets: 2, reps: 20, rest: 30, uniqueId: 2001 },
      { ...EXERCISE_DATABASE[138], sets: 2, reps: 15, rest: 30, uniqueId: 2002 },
      { ...EXERCISE_DATABASE[11], sets: 2, reps: 15, rest: 30, uniqueId: 2003 },
      { ...EXERCISE_DATABASE[3], sets: 4, reps: 15, rest: 60, uniqueId: 2004 },
      { ...EXERCISE_DATABASE[4], sets: 4, reps: 15, rest: 60, uniqueId: 2005 },
      { ...EXERCISE_DATABASE[14], sets: 3, reps: 20, rest: 45, uniqueId: 2006 },
      { ...EXERCISE_DATABASE[8], sets: 3, reps: 20, rest: 45, uniqueId: 2007 },
      { ...EXERCISE_DATABASE[6], sets: 3, reps: 20, rest: 45, uniqueId: 2008 },
      { ...EXERCISE_DATABASE[13], sets: 3, reps: 25, rest: 45, uniqueId: 2009 },
      { ...EXERCISE_DATABASE[10], sets: 3, reps: 20, rest: 60, uniqueId: 2010 },
    ]
  },
];

function LoginModal({ isOpen, onClose, onLogin }) {
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to continue</p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRole('trainer')}
              className={`p-4 rounded-xl border-2 transition ${
                role === 'trainer' 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                  : 'border-gray-200 text-gray-600 hover:border-emerald-300'
              }`}
            >
              <Users className="w-6 h-6 mx-auto mb-2" />
              <span className="font-medium">Trainer</span>
            </button>
            <button
              onClick={() => setRole('client')}
              className={`p-4 rounded-xl border-2 transition ${
                role === 'client' 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                  : 'border-gray-200 text-gray-600 hover:border-emerald-300'
              }`}
            >
              <User className="w-6 h-6 mx-auto mb-2" />
              <span className="font-medium">Client</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (userName.trim() && role) {
                onLogin(role, userName);
                onClose();
              }
            }}
            disabled={!userName.trim() || !role}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function AboutPage({ onOpenLogin }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Flourish Fitness</span>
          </div>
          <button
            onClick={onOpenLogin}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:opacity-90 transition"
          >
            Sign In
          </button>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 text-white py-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Transform Your Fitness Journey</h1>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              The complete platform for personal trainers and clients to connect, train, and achieve goals together.
            </p>
            <button
              onClick={onOpenLogin}
              className="px-8 py-4 bg-white text-emerald-700 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition inline-flex items-center gap-2"
            >
              Get Started
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need</h2>
              <p className="text-xl text-gray-600">Powerful tools for trainers and an intuitive experience for clients</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">150+ Exercise Database</h3>
                <p className="text-gray-600">
                  Access a comprehensive library of exercises with detailed instructions and difficulty levels.
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Workouts</h3>
                <p className="text-gray-600">
                  Build personalized workout plans with specific sets, reps, and rest periods.
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Tracking</h3>
                <p className="text-gray-600">
                  Track weight and rep history automatically, making progressive overload seamless.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-r from-emerald-500 to-teal-500">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-emerald-100 mb-8">
              Join Flourish Fitness today and take your training to the next level.
            </p>
            <button
              onClick={onOpenLogin}
              className="px-8 py-4 bg-white text-emerald-700 rounded-xl font-semibold text-lg hover:bg-emerald-50 transition inline-flex items-center gap-2"
            >
              Sign In Now
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        <footer className="bg-gray-900 text-gray-400 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Flourish Fitness</span>
            </div>
            <p className="text-sm">© 2025 Flourish Fitness. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ClientWorkoutView({ assignedWorkouts, exerciseHistory, onCompleteExercise }) {
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [exerciseStates, setExerciseStates] = useState({});

  const getLastWeight = (exerciseName) => {
    const history = exerciseHistory[exerciseName];
    if (history && history.length > 0) {
      return history[history.length - 1].weight;
    }
    return 0;
  };

  const updateExerciseWeight = (exerciseId, delta) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        weight: Math.max(0, (prev[exerciseId]?.weight || 0) + delta)
      }
    }));
  };

  const initializeExercise = (exercise) => {
    if (!exerciseStates[exercise.uniqueId]) {
      const lastWeight = getLastWeight(exercise.name);
      setExerciseStates(prev => ({
        ...prev,
        [exercise.uniqueId]: {
          weight: lastWeight,
          completed: false
        }
      }));
    }
  };

  const completeExercise = (exercise) => {
    const state = exerciseStates[exercise.uniqueId];
    if (state) {
      onCompleteExercise(exercise.name, state.weight);
      setExerciseStates(prev => ({
        ...prev,
        [exercise.uniqueId]: {
          ...prev[exercise.uniqueId],
          completed: true
        }
      }));
    }
  };

  if (!selectedWorkout) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">Your Workouts</h3>
        {assignedWorkouts.length === 0 ? (
          <p className="text-gray-600">No workouts assigned yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {assignedWorkouts.map(workout => (
              <button
                key={workout.id}
                onClick={() => {
                  setSelectedWorkout(workout);
                  workout.exercises.forEach(initializeExercise);
                }}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-500 transition text-left"
              >
                <h4 className="font-bold text-gray-900 text-lg mb-2">{workout.name}</h4>
                <p className="text-gray-600">{workout.exercises.length} exercises</p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => setSelectedWorkout(null)}
        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
      >
        ← Back to Workouts
      </button>

      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">{selectedWorkout.name}</h2>
        <p className="text-emerald-100">{selectedWorkout.exercises.length} exercises</p>
      </div>

      <div className="space-y-4">
        {selectedWorkout.exercises.map((exercise, idx) => {
          const state = exerciseStates[exercise.uniqueId] || { weight: getLastWeight(exercise.name), completed: false };
          const lastWeight = getLastWeight(exercise.name);

          return (
            <div key={exercise.uniqueId} className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">{idx + 1}. {exercise.name}</h4>
                  <p className="text-gray-600 text-sm">{exercise.category} • {exercise.muscleGroup}</p>
                </div>
                {state.completed && (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Sets</div>
                  <div className="text-2xl font-bold text-gray-900">{exercise.sets}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Reps</div>
                  <div className="text-2xl font-bold text-gray-900">{exercise.reps}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Rest</div>
                  <div className="text-2xl font-bold text-gray-900">{exercise.rest}s</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="mb-2">
                  <div className="text-sm text-gray-600 mb-1">Weight (lbs)</div>
                  {lastWeight > 0 && (
                    <div className="text-xs text-emerald-600 mb-2">Last: {lastWeight} lbs</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateExerciseWeight(exercise.uniqueId, -5)}
                    className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition"
                    disabled={state.completed}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-gray-900">{state.weight}</div>
                  </div>
                  <button
                    onClick={() => updateExerciseWeight(exercise.uniqueId, 5)}
                    className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition"
                    disabled={state.completed}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <button
                  onClick={() => completeExercise(exercise)}
                  disabled={state.completed}
                  className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                >
                  {state.completed ? 'Completed ✓' : 'Mark Complete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseDatabase({ exercises, onSelectExercise }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const categories = ['All', ...new Set(exercises.map(e => e.category))];
  
  const filteredExercises = exercises.filter(ex => 
    (filterCategory === 'All' || ex.category === filterCategory) &&
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {categories.map(cat => <option key={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map(exercise => (
          <div key={exercise.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
              {onSelectExercise && (
                <button
                  onClick={() => onSelectExercise(exercise)}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="text-gray-600">Category: <span className="font-medium">{exercise.category}</span></div>
              <div className="text-gray-600">Muscle: <span className="font-medium">{exercise.muscleGroup}</span></div>
              <div className="text-gray-600">Level: <span className={`font-medium ${
                exercise.difficulty === 'Beginner' ? 'text-green-600' :
                exercise.difficulty === 'Intermediate' ? 'text-yellow-600' : 'text-red-600'
              }`}>{exercise.difficulty}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BuildWorkout({ exercises, onSaveWorkout, presetWorkouts }) {
  const [workoutName, setWorkoutName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [showExercises, setShowExercises] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const addExercise = (exercise) => {
    setSelectedExercises([...selectedExercises, { 
      ...exercise, 
      sets: 3, 
      reps: 10, 
      rest: 60,
      uniqueId: Date.now() + Math.random()
    }]);
    setShowExercises(false);
  };

  const loadPreset = (preset) => {
    setWorkoutName(preset.name);
    setSelectedExercises(preset.exercises.map(ex => ({ ...ex, uniqueId: Date.now() + Math.random() })));
    setShowPresets(false);
  };

  const updateExercise = (uniqueId, field, value) => {
    setSelectedExercises(selectedExercises.map(ex => 
      ex.uniqueId === uniqueId ? { ...ex, [field]: parseInt(value) || 0 } : ex
    ));
  };

  const removeExercise = (uniqueId) => {
    setSelectedExercises(selectedExercises.filter(ex => ex.uniqueId !== uniqueId));
  };

  const saveWorkout = () => {
    if (workoutName.trim() && selectedExercises.length > 0) {
      onSaveWorkout({
        id: Date.now(),
        name: workoutName,
        exercises: selectedExercises,
        createdAt: new Date().toISOString()
      });
      setWorkoutName('');
      setSelectedExercises([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <input
          type="text"
          placeholder="Workout Name (e.g., Upper Body Strength)"
          value={workoutName}
          onChange={(e) => setWorkoutName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="py-3 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition flex items-center justify-center gap-2"
          >
            <Star className="w-5 h-5" />
            Load Preset
          </button>
          <button
            onClick={() => setShowExercises(!showExercises)}
            className="py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Exercise
          </button>
        </div>
      </div>

      {showPresets && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Preset Workouts</h3>
            <button onClick={() => setShowPresets(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            {presetWorkouts.map(preset => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 transition text-left"
              >
                <div className="font-medium text-gray-900">{preset.name}</div>
                <div className="text-sm text-gray-600">{preset.exercises.length} exercises</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showExercises && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Select Exercise</h3>
            <button onClick={() => setShowExercises(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <ExerciseDatabase exercises={exercises} onSelectExercise={addExercise} />
        </div>
      )}

      {selectedExercises.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Workout Plan</h3>
          <div className="space-y-4">
            {selectedExercises.map((ex, idx) => (
              <div key={ex.uniqueId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-gray-900">{idx + 1}. {ex.name}</div>
                    <div className="text-sm text-gray-600">{ex.category} • {ex.muscleGroup}</div>
                  </div>
                  <button onClick={() => removeExercise(ex.uniqueId)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Sets</label>
                    <input
                      type="number"
                      value={ex.sets}
                      onChange={(e) => updateExercise(ex.uniqueId, 'sets', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Reps</label>
                    <input
                      type="number"
                      value={ex.reps}
                      onChange={(e) => updateExercise(ex.uniqueId, 'reps', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Rest (s)</label>
                    <input
                      type="number"
                      value={ex.rest}
                      onChange={(e) => updateExercise(ex.uniqueId, 'rest', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveWorkout}
            className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            Save Workout
          </button>
        </div>
      )}
    </div>
  );
}

function AssignWorkouts({ workouts, clients, onAssignWorkout }) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [selectedDays, setSelectedDays] = useState([]);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const assignWorkout = () => {
    if (selectedClient && selectedWorkout && selectedDays.length > 0) {
      onAssignWorkout({
        clientId: selectedClient.id,
        workoutId: selectedWorkout.id,
        workout: selectedWorkout,
        days: selectedDays,
        assignedAt: new Date().toISOString()
      });
      setSelectedClient(null);
      setSelectedWorkout(null);
      setSelectedDays([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Select Client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clients.map(client => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`p-4 border-2 rounded-xl transition text-left ${
                selectedClient?.id === client.id 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                  {client.avatar}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{client.name}</div>
                  <div className="text-sm text-gray-600">{client.email}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedClient && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Select Workout</h3>
          {workouts.length === 0 ? (
            <p className="text-gray-600">No workouts available. Create a workout first.</p>
          ) : (
            <div className="space-y-3">
              {workouts.map(workout => (
                <button
                  key={workout.id}
                  onClick={() => setSelectedWorkout(workout)}
                  className={`w-full p-4 border-2 rounded-xl transition text-left ${
                    selectedWorkout?.id === workout.id 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{workout.name}</div>
                  <div className="text-sm text-gray-600">{workout.exercises.length} exercises</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedClient && selectedWorkout && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Select Days</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {days.map(day => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`p-3 border-2 rounded-xl transition ${
                  selectedDays.includes(day) 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          <button
            onClick={assignWorkout}
            disabled={selectedDays.length === 0}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
          >
            Assign to {selectedClient.name}
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState('');
  const [userName, setUserName] = useState('');
  const [currentView, setCurrentView] = useState('dashboard');
  const [workouts, setWorkouts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState({});

  const handleLogin = (selectedRole, name) => {
    setRole(selectedRole);
    setUserName(name);
  };

  const handleSignOut = () => {
    setRole('');
    setUserName('');
    setCurrentView('dashboard');
  };

  const handleSaveWorkout = (workout) => {
    setWorkouts([...workouts, workout]);
  };

  const handleAssignWorkout = (assignment) => {
    setAssignments([...assignments, assignment]);
  };

  const handleAddSession = (session) => {
    setSessions([...sessions, session]);
  };

  const handleAddPackage = (pkg) => {
    setPackages([...packages, pkg]);
  };

  const handleCompleteExercise = (exerciseName, weight) => {
    setExerciseHistory(prev => ({
      ...prev,
      [exerciseName]: [
        ...(prev[exerciseName] || []),
        {
          weight,
          date: new Date().toISOString(),
          timestamp: Date.now()
        }
      ]
    }));
  };

  if (!role) {
    return (
      <>
        <AboutPage onOpenLogin={() => setShowLoginModal(true)} />
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      </>
    );
  }

  const navItems = role === 'trainer' ? [
    { id: 'dashboard', label: 'Overview', icon: Users },
    { id: 'exercises', label: 'Exercise Database', icon: BookOpen },
    { id: 'workouts', label: 'Build Workout', icon: Dumbbell },
    { id: 'assign', label: 'Assign Workouts', icon: Target },
    { id: 'schedule', label: 'Calendar', icon: Calendar },
    { id: 'progress', label: 'Client Progress', icon: Image },
    { id: 'packages', label: 'Packages', icon: DollarSign }
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: User },
    { id: 'myworkouts', label: 'My Workouts', icon: Dumbbell }
  ];

  const clientWorkouts = role === 'client' ? assignments
    .filter(a => a.clientId === 1)
    .map(a => a.workout) : [];

  return (
    <div className="min-h-screen bg-gray-50">
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
              <div className="text-sm font-medium text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500 capitalize">{role}</div>
            </div>
            <button onClick={handleSignOut} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
          <nav className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    currentView === item.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold">Welcome back, {userName}!</h2>
                  <p className="text-emerald-100">Your fitness journey starts here</p>
                </div>
                
                {role === 'trainer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Total Clients</div>
                      <div className="text-3xl font-bold text-gray-900">{CLIENTS.length}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Workouts</div>
                      <div className="text-3xl font-bold text-gray-900">{workouts.length}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Sessions</div>
                      <div className="text-3xl font-bold text-gray-900">{sessions.length}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Active Programs</div>
                      <div className="text-3xl font-bold text-gray-900">{assignments.length}</div>
                    </div>
                  </div>
                )}

                {role === 'client' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Assigned Workouts</div>
                      <div className="text-3xl font-bold text-gray-900">{clientWorkouts.length}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Exercises Completed</div>
                      <div className="text-3xl font-bold text-gray-900">{Object.keys(exerciseHistory).length}</div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                      <div className="text-sm text-gray-600 mb-1">Upcoming Sessions</div>
                      <div className="text-3xl font-bold text-gray-900">0</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === 'myworkouts' && role === 'client' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">My Workouts</h2>
                <ClientWorkoutView 
                  assignedWorkouts={clientWorkouts}
                  exerciseHistory={exerciseHistory}
                  onCompleteExercise={handleCompleteExercise}
                />
              </div>
            )}

            {currentView === 'exercises' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Exercise Database</h2>
                <p className="text-gray-600 mb-4">Browse our comprehensive library of {EXERCISE_DATABASE.length} exercises</p>
                <ExerciseDatabase exercises={EXERCISE_DATABASE} />
              </div>
            )}

            {currentView === 'workouts' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Build Workout</h2>
                <BuildWorkout 
                  exercises={EXERCISE_DATABASE} 
                  onSaveWorkout={handleSaveWorkout}
                  presetWorkouts={PRESET_WORKOUTS}
                />
                
                {workouts.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Your Workouts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {workouts.map(workout => (
                        <div key={workout.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="font-medium text-gray-900">{workout.name}</div>
                          <div className="text-sm text-gray-600">{workout.exercises.length} exercises</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === 'assign' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Assign Workouts</h2>
                <AssignWorkouts 
                  workouts={workouts} 
                  clients={CLIENTS} 
                  onAssignWorkout={handleAssignWorkout}
                />
              </div>
            )}

            {currentView === 'schedule' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h2>
                <p className="text-gray-600">Schedule and manage training sessions with your clients.</p>
              </div>
            )}

            {currentView === 'progress' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Client Progress</h2>
                <p className="text-gray-600">Track client progress, photos, and performance metrics.</p>
              </div>
            )}

            {currentView === 'packages' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Packages</h2>
                <p className="text-gray-600">Create and manage training packages for your clients.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
