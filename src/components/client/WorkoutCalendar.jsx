import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Play, CheckCircle } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function WorkoutCalendar({ userId, onStartWorkout, onPreviewWorkout }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [assignments, setAssignments] = useState({});
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadWorkoutAssignments();
    loadCompletedWorkouts();
  }, [userId, currentDate]);

  const loadWorkoutAssignments = async () => {
    try {
      const assignmentsRef = dbRef(db, `workout-assignments/${userId}`);
      const snapshot = await get(assignmentsRef);
      if (snapshot.exists()) {
        setAssignments(snapshot.val());
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadCompletedWorkouts = async () => {
    try {
      const historyRef = dbRef(db, `workout-history/${userId}`);
      const snapshot = await get(historyRef);
      if (snapshot.exists()) {
        const completed = Object.values(snapshot.val())
          .filter(w => w.completed)
          .map(w => ({
            date: new Date(w.startTime).toDateString(),
            workoutId: w.workoutId
          }));
        setCompletedWorkouts(completed);
      }
    } catch (error) {
      console.error('Error loading completed workouts:', error);
    }
  };

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getWorkoutForDate = (date) => {
    if (!date) return null;
    const dayName = daysOfWeek[date.getDay()];
    return assignments[dayName];
  };

  const isWorkoutCompleted = (date) => {
    if (!date) return false;
    const dateString = date.toDateString();
    return completedWorkouts.some(w => w.date === dateString);
  };

  const isPastDate = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Workout Calendar</h1>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition"
            >
              Today
            </button>
          </div>
          <p className="text-emerald-100">Plan your week and stay on track</p>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold text-gray-900">{monthName}</h2>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {shortDays.map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, idx) => {
              const workout = getWorkoutForDate(date);
              const completed = isWorkoutCompleted(date);
              const past = isPastDate(date);
              const today = isToday(date);
              
              return (
                <div key={idx} className="aspect-square">
                  {date ? (
                    <button
                      onClick={() => handleDateClick(date)}
                      className={`w-full h-full rounded-lg p-2 flex flex-col items-center justify-center transition relative ${
                        today
                          ? 'bg-emerald-100 border-2 border-emerald-500'
                          : completed
                          ? 'bg-green-50 border border-green-200'
                          : workout && !past
                          ? 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                          : workout && past && !completed
                          ? 'bg-red-50 border border-red-200'
                          : 'hover:bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        today ? 'text-emerald-700' : 'text-gray-700'
                      }`}>
                        {date.getDate()}
                      </span>
                      
                      {completed && (
                        <CheckCircle className="w-4 h-4 text-green-600 absolute top-1 right-1" />
                      )}
                      
                      {workout && (
                        <div className="mt-1 w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 border-2 border-emerald-500" />
              <span className="text-gray-600">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
              <span className="text-gray-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200" />
              <span className="text-gray-600">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
              <span className="text-gray-600">Missed</span>
            </div>
          </div>
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            
            {(() => {
              const workout = getWorkoutForDate(selectedDate);
              const completed = isWorkoutCompleted(selectedDate);
              const today = isToday(selectedDate);
              const past = isPastDate(selectedDate);
              
              if (!workout) {
                return (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No workout scheduled for this day</p>
                  </div>
                );
              }
              
              return (
                <div>
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 mb-4">
                    <div className="font-semibold text-gray-900 mb-1">
                      {workout.workoutName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Assigned by your trainer
                    </div>
                  </div>
                  
                  {completed ? (
                    <div className="flex items-center gap-2 text-green-600 font-medium mb-4">
                      <CheckCircle className="w-5 h-5" />
                      Workout completed!
                    </div>
                  ) : past ? (
                    <div className="text-red-600 font-medium mb-4">
                      ⚠️ Missed workout
                    </div>
                  ) : today ? (
                    <div className="text-emerald-600 font-medium mb-4">
                      🎯 Today's workout
                    </div>
                  ) : (
                    <div className="text-blue-600 font-medium mb-4">
                      📅 Upcoming workout
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {!completed && (
                      <button
                        onClick={() => onStartWorkout(workout.workoutId)}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium hover:opacity-90 flex items-center justify-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Start Workout
                      </button>
                    )}
                    <button
                      onClick={() => onPreviewWorkout(workout.workoutId)}
                      className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <CalendarIcon className="w-5 h-5" />
                      Preview
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
