import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function WeeklyNutritionDashboard({ user }) {
  const [weekData, setWeekData] = useState([]);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [userGoals, setUserGoals] = useState({ protein: 150, carbs: 200, fats: 50, calories: 2000 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserGoals();
    loadWeekData();
  }, [weekStart, user]);

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  const loadUserGoals = async () => {
    try {
      const userRef = dbRef(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists() && snapshot.val().macroGoals) {
        setUserGoals(snapshot.val().macroGoals);
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadWeekData = async () => {
    setLoading(true);
    try {
      const logsRef = dbRef(db, 'nutrition-logs');
      const snapshot = await get(logsRef);
      
      if (!snapshot.exists()) {
        setWeekData([]);
        setLoading(false);
        return;
      }

      const allLogs = snapshot.val();
      const weekDays = [];

      // Get 7 days starting from weekStart
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        const dateString = currentDate.toISOString().split('T')[0];

        // Get logs for this date
        const dayLogs = Object.values(allLogs).filter(
          log => log.userId === user.uid && log.date === dateString
        );

        // Calculate totals
        const totals = dayLogs.reduce((acc, log) => ({
          protein: acc.protein + (log.protein || 0),
          carbs: acc.carbs + (log.carbs || 0),
          fats: acc.fats + (log.fats || 0),
          calories: acc.calories + (log.calories || 0),
        }), { protein: 0, carbs: 0, fats: 0, calories: 0 });

        weekDays.push({
          date: currentDate,
          dateString,
          dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          totals,
          logsCount: dayLogs.length,
        });
      }

      setWeekData(weekDays);
    } catch (error) {
      console.error('Error loading week data:', error);
    } finally {
      setLoading(false);
    }
  };

  const previousWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStart(getMonday(newDate));
  };

  const nextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStart(getMonday(newDate));
  };

  const currentWeek = () => {
    setWeekStart(getMonday(new Date()));
  };

  // Calculate weekly averages
  const weeklyAverages = weekData.reduce((acc, day) => ({
    protein: acc.protein + day.totals.protein,
    carbs: acc.carbs + day.totals.carbs,
    fats: acc.fats + day.totals.fats,
    calories: acc.calories + day.totals.calories,
    loggedDays: acc.loggedDays + (day.logsCount > 0 ? 1 : 0),
  }), { protein: 0, carbs: 0, fats: 0, calories: 0, loggedDays: 0 });

  const avgProtein = weeklyAverages.loggedDays > 0 ? weeklyAverages.protein / weeklyAverages.loggedDays : 0;
  const avgCarbs = weeklyAverages.loggedDays > 0 ? weeklyAverages.carbs / weeklyAverages.loggedDays : 0;
  const avgFats = weeklyAverages.loggedDays > 0 ? weeklyAverages.fats / weeklyAverages.loggedDays : 0;
  const avgCalories = weeklyAverages.loggedDays > 0 ? weeklyAverages.calories / weeklyAverages.loggedDays : 0;

  // Calculate consistency score
  const consistencyScore = Math.round((weeklyAverages.loggedDays / 7) * 100);

  // Goal achievement percentages
  const getGoalPercentage = (actual, goal) => goal > 0 ? Math.round((actual / goal) * 100) : 0;

  const weekDateRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${
    new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Weekly Nutrition</h2>
            <p className="text-emerald-100">{weekDateRange}</p>
          </div>
          <Calendar className="w-8 h-8 opacity-80" />
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={previousWeek}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={currentWeek}
            className="flex-1 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition"
          >
            This Week
          </button>
          <button
            onClick={nextWeek}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Consistency Score */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Consistency Score</h3>
        </div>
        
        <div className="flex items-end gap-6">
          <div className="flex-1">
            <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              {consistencyScore}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {weeklyAverages.loggedDays} of 7 days logged
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-4">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all"
                style={{ width: `${consistencyScore}%` }}
              />
            </div>
          </div>
          
          {consistencyScore >= 80 && (
            <div className="text-6xl">🔥</div>
          )}
          {consistencyScore >= 60 && consistencyScore < 80 && (
            <div className="text-6xl">💪</div>
          )}
          {consistencyScore < 60 && consistencyScore > 0 && (
            <div className="text-6xl">📊</div>
          )}
        </div>
      </div>

      {/* Weekly Averages */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Daily Averages</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Calories */}
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
            <div className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">Calories</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{Math.round(avgCalories)}</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Goal: {userGoals.calories} ({getGoalPercentage(avgCalories, userGoals.calories)}%)
            </div>
          </div>

          {/* Protein */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
            <div className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">Protein</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{Math.round(avgProtein)}g</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Goal: {userGoals.protein}g ({getGoalPercentage(avgProtein, userGoals.protein)}%)
            </div>
          </div>

          {/* Carbs */}
          <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl">
            <div className="text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-1">Carbs</div>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{Math.round(avgCarbs)}g</div>
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Goal: {userGoals.carbs}g ({getGoalPercentage(avgCarbs, userGoals.carbs)}%)
            </div>
          </div>

          {/* Fats */}
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl">
            <div className="text-sm text-orange-700 dark:text-orange-300 font-medium mb-1">Fats</div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{Math.round(avgFats)}g</div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Goal: {userGoals.fats}g ({getGoalPercentage(avgFats, userGoals.fats)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Daily Breakdown Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Daily Breakdown</h3>
        </div>

        {/* Calories Chart */}
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Calories</div>
          <div className="space-y-2">
            {weekData.map((day, idx) => {
              const percentage = (day.totals.calories / userGoals.calories) * 100;
              const isToday = day.dateString === new Date().toISOString().split('T')[0];
              
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-12 text-sm font-medium ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
                    {day.dayName}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentage >= 100 ? 'bg-emerald-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900 dark:text-white">
                      {day.logsCount > 0 ? `${Math.round(day.totals.calories)} cal` : 'No data'}
                    </div>
                  </div>
                  <div className="w-16 text-sm text-right text-gray-600 dark:text-gray-400">
                    {day.logsCount > 0 ? `${Math.round(percentage)}%` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Macros Mini Chart */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Protein */}
          <div>
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">Protein</div>
            <div className="space-y-1">
              {weekData.map((day, idx) => {
                const percentage = (day.totals.protein / userGoals.protein) * 100;
                return (
                  <div key={idx} className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-2">Carbs</div>
            <div className="space-y-1">
              {weekData.map((day, idx) => {
                const percentage = (day.totals.carbs / userGoals.carbs) * 100;
                return (
                  <div key={idx} className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fats */}
          <div>
            <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-2">Fats</div>
            <div className="space-y-1">
              {weekData.map((day, idx) => {
                const percentage = (day.totals.fats / userGoals.fats) * 100;
                return (
                  <div key={idx} className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {weeklyAverages.loggedDays >= 3 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">💡 Weekly Insights</h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {consistencyScore >= 85 && (
              <p>🔥 Amazing consistency! You logged {weeklyAverages.loggedDays} days this week!</p>
            )}
            {getGoalPercentage(avgProtein, userGoals.protein) >= 95 && getGoalPercentage(avgProtein, userGoals.protein) <= 105 && (
              <p>🎯 Perfect protein intake! You're right on target with {Math.round(avgProtein)}g daily.</p>
            )}
            {getGoalPercentage(avgCalories, userGoals.calories) < 85 && (
              <p>📊 You're averaging {Math.round(avgCalories)} calories per day, below your {userGoals.calories} cal goal. Consider increasing portion sizes.</p>
            )}
            {consistencyScore < 50 && weeklyAverages.loggedDays > 0 && (
              <p>💪 Try to log at least 5 days this week to get better insights and track your progress!</p>
            )}
            {weeklyAverages.loggedDays === 0 && (
              <p>📱 Start logging your meals to see your weekly nutrition insights here!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
