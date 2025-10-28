import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Trash2, Camera, Shield, BarChart3, Target, Menu, X, ChevronRight, Award, Heart, TrendingUp, Play, Pause, Check, Plus, Minus, Video, Calendar, Clock, Trophy, Save, Edit2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove, update, query as dbQuery, orderByChild, equalTo, onValue } from 'firebase/database';
import { auth, db, storage } from '../../firebase';
import Tesseract from 'tesseract.js';

export default function MyWorkouts({ user }) {
  const [assignments, setAssignments] = useState({});
  const [workouts, setWorkouts] = useState({});
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [isPerforming, setIsPerforming] = useState(false);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadAssignments();
    loadCompletedWorkouts();
  }, [user]);

  const loadAssignments = async () => {
    try {
      const assignmentsRef = dbRef(db, `workout-assignments/${user.uid}`);
      const snapshot = await get(assignmentsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setAssignments(data);

        // Load full workout details
        const workoutIds = Object.values(data).map(a => a.workoutId);
        const uniqueIds = [...new Set(workoutIds)];
        
        const workoutData = {};
        for (const id of uniqueIds) {
          const workoutRef = dbRef(db, `workouts/${id}`);
          const workoutSnap = await get(workoutRef);
          if (workoutSnap.exists()) {
            workoutData[id] = { id, ...workoutSnap.val() };
          }
        }
        setWorkouts(workoutData);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadCompletedWorkouts = async () => {
    try {
      const logsRef = dbRef(db, 'workout-logs');
      const snapshot = await get(logsRef);
      
      if (snapshot.exists()) {
        const allLogs = Object.values(snapshot.val());
        const userLogs = allLogs.filter(log => log.userId === user.uid);
        setCompletedWorkouts(userLogs);

        // Calculate stats
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const thisWeek = userLogs.filter(log => new Date(log.completedAt) > weekAgo).length;
        const thisMonth = userLogs.filter(log => new Date(log.completedAt) > monthAgo).length;

        setStats({
          total: userLogs.length,
          thisWeek: thisWeek,
          thisMonth: thisMonth
        });
      }
    } catch (error) {
      console.error('Error loading workout logs:', error);
    }
  };

  const handleStartWorkout = (workoutId) => {
    const workout = workouts[workoutId];
    if (workout) {
      setSelectedWorkout(workout);
      setIsPerforming(true);
    }
  };

  const handleWorkoutComplete = () => {
    setIsPerforming(false);
    setSelectedWorkout(null);
    loadCompletedWorkouts();
    loadAssignments();
  };

  const isWorkoutCompleted = (day) => {
    const today = new Date().toISOString().split('T')[0];
    return completedWorkouts.some(log => {
      const logDate = new Date(log.completedAt).toISOString().split('T')[0];
      const logDay = new Date(log.completedAt).toLocaleDateString('en-US', { weekday: 'long' });
      return logDate === today && logDay === day;
    });
  };

  if (isPerforming && selectedWorkout) {
    return (
      <div className="max-w-2xl mx-auto">
        <WorkoutPerformer
          workout={selectedWorkout}
          userId={user.uid}
          onComplete={handleWorkoutComplete}
          onCancel={() => {
            if (confirm('Are you sure you want to exit? Your progress will not be saved.')) {
              setIsPerforming(false);
              setSelectedWorkout(null);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">My Workouts</h2>
        <p className="text-emerald-100">Track your training and smash your goals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.thisWeek}</div>
          <div className="text-sm text-gray-600">This Week</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.thisMonth}</div>
          <div className="text-sm text-gray-600">This Month</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">This Week's Schedule</h3>
        <div className="grid grid-cols-1 gap-3">
          {daysOfWeek.map(day => {
            const assignment = assignments[day];
            const isCompleted = isWorkoutCompleted(day);
            
            return (
              <div
                key={day}
                className={`p-4 rounded-xl border-2 transition ${
                  isCompleted
                    ? 'bg-green-50 border-green-500'
                    : assignment
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{day}</div>
                    {assignment ? (
                      <div className="text-sm text-gray-600">{assignment.workoutName}</div>
                    ) : (
                      <div className="text-sm text-gray-500">Rest day</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                        ✓ Done
                      </span>
                    )}
                    {assignment && !isCompleted && (
                      <button
                        onClick={() => handleStartWorkout(assignment.workoutId)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 text-sm"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Workouts</h3>
        {completedWorkouts.length === 0 ? (
          <p className="text-gray-600">No completed workouts yet. Start your first workout today!</p>
        ) : (
          <div className="space-y-3">
            {completedWorkouts.slice(0, 5).map((log, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{log.workoutName}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(log.completedAt).toLocaleDateString()} • {Math.floor(log.duration / 60)} min
                  </div>
                </div>
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// WORKOUT COMPONENTS - END
// ============================================

