import React, { useState } from 'react';
import { ref as dbRef, set, push, get } from 'firebase/database';
import { db } from '../../firebase'; 
import { Database, Check, AlertCircle } from 'lucide-react';

// This component provides a button to populate your database with 100+ exercises
// Add this to your admin dashboard and click once to populate

export default function ExercisePopulator() {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const exerciseDatabase = [
    // CHEST
    { name: 'Barbell Bench Press', category: 'chest', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg' },
    { name: 'Incline Barbell Bench Press', category: 'chest', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=SrqOu55lrYU' },
    { name: 'Decline Barbell Bench Press', category: 'chest', equipment: 'barbell', videoUrl: '' },
    { name: 'Dumbbell Bench Press', category: 'chest', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=VmB1G1K7v94' },
    { name: 'Incline Dumbbell Press', category: 'chest', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=8iPEnn-ltC8' },
    { name: 'Decline Dumbbell Press', category: 'chest', equipment: 'dumbbell', videoUrl: '' },
    { name: 'Dumbbell Flyes', category: 'chest', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=eozdVDA78K0' },
    { name: 'Incline Dumbbell Flyes', category: 'chest', equipment: 'dumbbell', videoUrl: '' },
    { name: 'Cable Crossover', category: 'chest', equipment: 'cable', videoUrl: 'https://www.youtube.com/watch?v=taI4XduLpTk' },
    { name: 'Chest Dips', category: 'chest', equipment: 'bodyweight', videoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As' },
    { name: 'Push-Ups', category: 'chest', equipment: 'bodyweight', videoUrl: 'https://www.youtube.com/watch?v=IODxDxX7oi4' },
    { name: 'Chest Press Machine', category: 'chest', equipment: 'machine', videoUrl: '' },
    { name: 'Pec Deck Fly', category: 'chest', equipment: 'machine', videoUrl: '' },

    // BACK
    { name: 'Deadlift', category: 'back', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q' },
    { name: 'Barbell Row', category: 'back', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ' },
    { name: 'Pendlay Row', category: 'back', equipment: 'barbell', videoUrl: '' },
    { name: 'T-Bar Row', category: 'back', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=j3Igk5nyZE4' },
    { name: 'Pull-Ups', category: 'back', equipment: 'bodyweight', videoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
    { name: 'Chin-Ups', category: 'back', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Lat Pulldown', category: 'back', equipment: 'machine', videoUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc' },
    { name: 'Seated Cable Row', category: 'back', equipment: 'cable', videoUrl: 'https://www.youtube.com/watch?v=xQNrFHEMhI4' },
    { name: 'Single-Arm Dumbbell Row', category: 'back', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=roCP6wCXPqo' },
    { name: 'Dumbbell Rows', category: 'back', equipment: 'dumbbell', videoUrl: '' },
    { name: 'Face Pulls', category: 'back', equipment: 'cable', videoUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk' },
    { name: 'Hyperextensions', category: 'back', equipment: 'machine', videoUrl: '' },
    { name: 'Romanian Deadlift', category: 'back', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM' },
    { name: 'Sumo Deadlift', category: 'back', equipment: 'barbell', videoUrl: '' },

    // SHOULDERS
    { name: 'Overhead Press (Barbell)', category: 'shoulders', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI' },
    { name: 'Seated Dumbbell Press', category: 'shoulders', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=qEwKCR5JCog' },
    { name: 'Arnold Press', category: 'shoulders', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=6Z15_WdXmVw' },
    { name: 'Lateral Raises', category: 'shoulders', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
    { name: 'Front Raises', category: 'shoulders', equipment: 'dumbbell', videoUrl: '' },
    { name: 'Rear Delt Flyes', category: 'shoulders', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=EA7u4Q_8qt0' },
    { name: 'Cable Lateral Raises', category: 'shoulders', equipment: 'cable', videoUrl: '' },
    { name: 'Upright Row', category: 'shoulders', equipment: 'barbell', videoUrl: '' },
    { name: 'Shoulder Press Machine', category: 'shoulders', equipment: 'machine', videoUrl: '' },
    { name: 'Barbell Shrugs', category: 'shoulders', equipment: 'barbell', videoUrl: '' },
    { name: 'Dumbbell Shrugs', category: 'shoulders', equipment: 'dumbbell', videoUrl: '' },

    // LEGS
    { name: 'Barbell Back Squat', category: 'legs', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8' },
    { name: 'Front Squat', category: 'legs', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=uYumuL_G_V0' },
    { name: 'Bulgarian Split Squat', category: 'legs', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE' },
    { name: 'Leg Press', category: 'legs', equipment: 'machine', videoUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ' },
    { name: 'Leg Extensions', category: 'legs', equipment: 'machine', videoUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0' },
    { name: 'Leg Curls', category: 'legs', equipment: 'machine', videoUrl: 'https://www.youtube.com/watch?v=ELOCsoDSmrg' },
    { name: 'Walking Lunges', category: 'legs', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs' },
    { name: 'Reverse Lunges', category: 'legs', equipment: 'dumbbell', videoUrl: '' },
    { name: 'Goblet Squat', category: 'legs', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=MeIiIdhvXT4' },
    { name: 'Hack Squat', category: 'legs', equipment: 'machine', videoUrl: '' },
    { name: 'Standing Calf Raises', category: 'legs', equipment: 'machine', videoUrl: 'https://www.youtube.com/watch?v=JbyjNymZx4Q' },
    { name: 'Seated Calf Raises', category: 'legs', equipment: 'machine', videoUrl: '' },
    { name: 'Glute Bridge', category: 'legs', equipment: 'bodyweight', videoUrl: 'https://www.youtube.com/watch?v=wPM8icPu6H8' },
    { name: 'Hip Thrusts', category: 'legs', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=xDmFkJxPzeM' },
    { name: 'Step-Ups', category: 'legs', equipment: 'dumbbell', videoUrl: '' },

    // ARMS - BICEPS
    { name: 'Barbell Curl', category: 'arms', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo' },
    { name: 'Dumbbell Curl', category: 'arms', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=sAq_ocpRh_I' },
    { name: 'Hammer Curl', category: 'arms', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=zC3nLlEvin4' },
    { name: 'Concentration Curl', category: 'arms', equipment: 'dumbbell', videoUrl: '' },
    { name: 'Cable Curl', category: 'arms', equipment: 'cable', videoUrl: '' },
    { name: 'Preacher Curl', category: 'arms', equipment: 'barbell', videoUrl: '' },
    { name: 'Incline Dumbbell Curl', category: 'arms', equipment: 'dumbbell', videoUrl: '' },

    // ARMS - TRICEPS
    { name: 'Tricep Dips', category: 'arms', equipment: 'bodyweight', videoUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As' },
    { name: 'Skull Crushers', category: 'arms', equipment: 'barbell', videoUrl: 'https://www.youtube.com/watch?v=d_KZxkY_0cM' },
    { name: 'Overhead Tricep Extension', category: 'arms', equipment: 'dumbbell', videoUrl: 'https://www.youtube.com/watch?v=nRiJVZDpdL0' },
    { name: 'Tricep Pushdown (Rope)', category: 'arms', equipment: 'cable', videoUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU' },
    { name: 'Tricep Pushdown (Bar)', category: 'arms', equipment: 'cable', videoUrl: '' },
    { name: 'Close-Grip Bench Press', category: 'arms', equipment: 'barbell', videoUrl: '' },
    { name: 'Diamond Push-Ups', category: 'arms', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Tricep Kickbacks', category: 'arms', equipment: 'dumbbell', videoUrl: '' },

    // CORE
    { name: 'Plank', category: 'core', equipment: 'bodyweight', videoUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c' },
    { name: 'Side Plank', category: 'core', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Crunches', category: 'core', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Bicycle Crunches', category: 'core', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Russian Twists', category: 'core', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Leg Raises', category: 'core', equipment: 'bodyweight', videoUrl: 'https://www.youtube.com/watch?v=JB2oyawG9KI' },
    { name: 'Mountain Climbers', category: 'core', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Cable Woodchops', category: 'core', equipment: 'cable', videoUrl: '' },
    { name: 'Ab Wheel Rollout', category: 'core', equipment: 'equipment', videoUrl: '' },
    { name: 'Hanging Knee Raises', category: 'core', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Dead Bug', category: 'core', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Pallof Press', category: 'core', equipment: 'cable', videoUrl: '' },
    { name: 'V-Ups', category: 'core', equipment: 'bodyweight', videoUrl: '' },

    // CARDIO
    { name: 'Treadmill Running', category: 'cardio', equipment: 'machine', videoUrl: '' },
    { name: 'Treadmill Incline Walk', category: 'cardio', equipment: 'machine', videoUrl: '' },
    { name: 'Stationary Bike', category: 'cardio', equipment: 'machine', videoUrl: '' },
    { name: 'Rowing Machine', category: 'cardio', equipment: 'machine', videoUrl: '' },
    { name: 'Elliptical', category: 'cardio', equipment: 'machine', videoUrl: '' },
    { name: 'Stair Climber', category: 'cardio', equipment: 'machine', videoUrl: '' },
    { name: 'Jump Rope', category: 'cardio', equipment: 'equipment', videoUrl: '' },
    { name: 'Burpees', category: 'cardio', equipment: 'bodyweight', videoUrl: '' },
    { name: 'High Knees', category: 'cardio', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Jumping Jacks', category: 'cardio', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Box Jumps', category: 'cardio', equipment: 'equipment', videoUrl: '' },
    { name: 'Battle Ropes', category: 'cardio', equipment: 'equipment', videoUrl: '' },

    // STRETCHING & MOBILITY
    { name: 'Hamstring Stretch', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Quad Stretch', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Hip Flexor Stretch', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Chest Doorway Stretch', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Shoulder Circles', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: "Child's Pose", category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Cat-Cow Stretch', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Pigeon Pose', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Spinal Twist', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Cobra Stretch', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Foam Rolling - IT Band', category: 'stretching', equipment: 'equipment', videoUrl: '' },
    { name: 'Foam Rolling - Quads', category: 'stretching', equipment: 'equipment', videoUrl: '' },
    { name: 'Foam Rolling - Back', category: 'stretching', equipment: 'equipment', videoUrl: '' },
    { name: 'Arm Circles', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },
    { name: 'Band Pull-Aparts', category: 'stretching', equipment: 'equipment', videoUrl: '' },
    { name: 'Bodyweight Squats', category: 'stretching', equipment: 'bodyweight', videoUrl: '' },

    // OLYMPIC LIFTS
    { name: 'Power Clean', category: 'olympic', equipment: 'barbell', videoUrl: '' },
    { name: 'Clean and Jerk', category: 'olympic', equipment: 'barbell', videoUrl: '' },
    { name: 'Snatch', category: 'olympic', equipment: 'barbell', videoUrl: '' },
    { name: 'Hang Clean', category: 'olympic', equipment: 'barbell', videoUrl: '' },
    { name: 'Push Press', category: 'olympic', equipment: 'barbell', videoUrl: '' },
  ];

  const handlePopulate = async () => {
    if (!confirm(`This will add ${exerciseDatabase.length} exercises to your database. Continue?`)) {
      return;
    }

    setStatus('loading');
    setMessage('Adding exercises to database...');

    try {
      // Check if exercises already exist
      const exercisesRef = dbRef(db, 'exercises');
      const snapshot = await get(exercisesRef);
      
      if (snapshot.exists()) {
        const existingCount = Object.keys(snapshot.val()).length;
        if (!confirm(`You already have ${existingCount} exercises. Add ${exerciseDatabase.length} more?`)) {
          setStatus('idle');
          setMessage('');
          return;
        }
      }

      let addedCount = 0;
      for (const exercise of exerciseDatabase) {
        const newExerciseRef = push(exercisesRef);
        await set(newExerciseRef, {
          ...exercise,
          createdAt: new Date().toISOString()
        });
        addedCount++;
        setMessage(`Adding exercises... ${addedCount}/${exerciseDatabase.length}`);
      }

      setStatus('success');
      setMessage(`Successfully added ${addedCount} exercises to your database!`);
    } catch (error) {
      console.error('Error populating exercises:', error);
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Exercise Database Populator</h3>
          <p className="text-sm text-gray-600 mb-4">
            Click the button below to add 100+ common gym exercises to your database. 
            This includes exercises for all muscle groups, cardio, stretching, and more.
          </p>
          
          <button
            onClick={handlePopulate}
            disabled={status === 'loading'}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="w-5 h-5" />
            {status === 'loading' ? 'Adding Exercises...' : 'Populate Exercise Database'}
          </button>

          {message && (
            <div className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
              status === 'success' ? 'bg-green-50 text-green-800' :
              status === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {status === 'success' && <Check className="w-5 h-5 flex-shrink-0" />}
              {status === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span className="text-sm font-medium">{message}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-800">
                ✅ Your exercise library is now ready! You can now create workouts using these exercises.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
