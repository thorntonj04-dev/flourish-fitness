import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Coffee, Sun, Moon, Apple } from 'lucide-react';
import { ref as dbRef, get, set, push, remove } from 'firebase/database';
import { db } from '../../firebase';
import FoodSearchModal from './FoodSearchModal';
import CreateCustomFoodModal from './CreateCustomFoodModal';
import { getFoodById } from '../../services/foodDatabaseService';

export default function NutritionLogger({ user }) {
  const [todayEntries, setTodayEntries] = useState([]);
  const [macroGoals, setMacroGoals] = useState({ protein: 0, carbs: 0, fats: 0, calories: 0 });
  const [todayTotals, setTodayTotals] = useState({ protein: 0, carbs: 0, fats: 0, calories: 0 });
  const [showFoodSearch, setShowFoodSearch] = useState(false);
  const [showCustomFoodModal, setShowCustomFoodModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [expandedMeals, setExpandedMeals] = useState({
    breakfast: true,
    lunch: true,
    dinner: true,
    snacks: true
  });

  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'yellow' },
    { id: 'lunch', label: 'Lunch', icon: Sun, color: 'orange' },
    { id: 'dinner', label: 'Dinner', icon: Moon, color: 'purple' },
    { id: 'snacks', label: 'Snacks', icon: Apple, color: 'green' }
  ];

  useEffect(() => {
    loadUserData();
    loadTodayEntries();
  }, [user]);

  const loadUserData = async () => {
    const userRef = dbRef(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists() && snapshot.val().macroGoals) {
      const goals = snapshot.val().macroGoals;
      // Calculate calories from macros if not set
      const calories = goals.calories || (goals.protein * 4 + goals.carbs * 4 + goals.fats * 9);
      setMacroGoals({ ...goals, calories });
    }
  };

  const loadTodayEntries = async () => {
    const today = new Date().toISOString().split('T')[0];
    const logsRef = dbRef(db, 'nutrition-logs');
    const snapshot = await get(logsRef);
    
    if (snapshot.exists()) {
      const allLogs = snapshot.val();
      const entries = await Promise.all(
        Object.entries(allLogs)
          .filter(([key, log]) => log.userId === user.uid && log.date === today)
          .map(async ([key, log]) => {
            // Load food details if foodId exists
            let foodDetails = null;
            if (log.foodId) {
              foodDetails = await getFoodById(log.foodId);
            }
            return { id: key, ...log, foodDetails };
          })
      );
      
      entries.sort((a, b) => {
        const mealOrder = { breakfast: 0, lunch: 1, dinner: 2, snacks: 3 };
        const orderA = mealOrder[a.mealType] ?? 999;
        const orderB = mealOrder[b.mealType] ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setTodayEntries(entries);
      
      const totals = entries.reduce((acc, entry) => ({
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fats: acc.fats + (entry.fats || 0),
        calories: acc.calories + (entry.calories || 0)
      }), { protein: 0, carbs: 0, fats: 0, calories: 0 });
      setTodayTotals(totals);
    } else {
      setTodayEntries([]);
      setTodayTotals({ protein: 0, carbs: 0, fats: 0, calories: 0 });
    }
  };

  const handleAddFood = (mealType) => {
    setSelectedMeal(mealType);
    setShowFoodSearch(true);
  };

  const handleFoodSelected = async (food, servings = 1) => {
    try {
      const logsRef = dbRef(db, 'nutrition-logs');
      const newLogRef = push(logsRef);
      
      // Calculate nutrition values based on servings
      const nutritionData = {
        userId: user.uid,
        userName: user.email,
        foodId: food.id,
        foodName: food.name,
        foodBrand: food.brand || '',
        servings: servings,
        servingSize: food.servingSize,
        mealType: selectedMeal,
        protein: (food.protein || 0) * servings,
        carbs: (food.carbs || 0) * servings,
        fats: (food.fats || 0) * servings,
        calories: (food.calories || 0) * servings,
        fiber: (food.fiber || 0) * servings,
        sugar: (food.sugar || 0) * servings,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      
      await set(newLogRef, nutritionData);
      setShowFoodSearch(false);
      setSelectedMeal(null);
      loadTodayEntries();
    } catch (error) {
      console.error('Error saving food entry:', error);
      alert('Failed to save food entry.');
    }
  };

  const handleCustomFoodCreated = (food) => {
    setShowCustomFoodModal(false);
    // Auto-select the newly created food
    handleFoodSelected(food, 1);
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await remove(dbRef(db, `nutrition-logs/${entryId}`));
      loadTodayEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const toggleMeal = (mealType) => {
    setExpandedMeals({ ...expandedMeals, [mealType]: !expandedMeals[mealType] });
  };

  const getProgress = (current, goal) => {
    return goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  };

  const getMealEntries = (mealType) => {
    return todayEntries.filter(entry => entry.mealType === mealType);
  };

  const getMealTotals = (mealType) => {
    const entries = getMealEntries(mealType);
    return entries.reduce((acc, entry) => ({
      protein: acc.protein + (entry.protein || 0),
      carbs: acc.carbs + (entry.carbs || 0),
      fats: acc.fats + (entry.fats || 0),
      calories: acc.calories + (entry.calories || 0)
    }), { protein: 0, carbs: 0, fats: 0, calories: 0 });
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Nutrition Tracking</h2>
        <p className="text-emerald-100">Track your daily macros and reach your goals</p>
      </div>

      {/* Daily Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Today's Progress</h3>
        
        {/* Calories */}
        <div className="mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">Calories</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(todayTotals.calories)}
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/ {macroGoals.calories}</span>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all"
              style={{ width: `${getProgress(todayTotals.calories, macroGoals.calories)}%` }}
            />
          </div>
        </div>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Protein</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(todayTotals.protein)}g</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Goal: {macroGoals.protein}g</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${getProgress(todayTotals.protein, macroGoals.protein)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Carbs</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(todayTotals.carbs)}g</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Goal: {macroGoals.carbs}g</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${getProgress(todayTotals.carbs, macroGoals.carbs)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Fats</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(todayTotals.fats)}g</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Goal: {macroGoals.fats}g</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${getProgress(todayTotals.fats, macroGoals.fats)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Meal Sections */}
      <div className="space-y-4">
        {mealTypes.map(meal => {
          const Icon = meal.icon;
          const entries = getMealEntries(meal.id);
          const totals = getMealTotals(meal.id);
          const isExpanded = expandedMeals[meal.id];

          return (
            <div key={meal.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Meal Header */}
              <button
                onClick={() => toggleMeal(meal.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${meal.color}-100 dark:bg-${meal.color}-900/30 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 text-${meal.color}-600 dark:text-${meal.color}-400`} />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">{meal.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {entries.length} {entries.length === 1 ? 'item' : 'items'} • {Math.round(totals.calories)} cal
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddFood(meal.id);
                    }}
                    className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Meal Entries */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {entries.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                      No foods logged for {meal.label.toLowerCase()} yet
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {entries.map(entry => (
                        <div key={entry.id} className="p-4 flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white">{entry.foodName}</div>
                            {entry.foodBrand && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{entry.foodBrand}</div>
                            )}
                            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              {entry.servings} × {entry.servingSize}
                            </div>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>{Math.round(entry.calories)} cal</span>
                              <span>P: {Math.round(entry.protein)}g</span>
                              <span>C: {Math.round(entry.carbs)}g</span>
                              <span>F: {Math.round(entry.fats)}g</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Food Search Modal */}
      {showFoodSearch && (
        <FoodSearchModal
          userId={user.uid}
          onSelectFood={(food) => handleFoodSelected(food, 1)}
          onClose={() => {
            setShowFoodSearch(false);
            setSelectedMeal(null);
          }}
          onCreateCustom={() => {
            setShowFoodSearch(false);
            setShowCustomFoodModal(true);
          }}
        />
      )}

      {/* Create Custom Food Modal */}
      {showCustomFoodModal && (
        <CreateCustomFoodModal
          userId={user.uid}
          onSave={handleCustomFoodCreated}
          onClose={() => {
            setShowCustomFoodModal(false);
            setSelectedMeal(null);
          }}
        />
      )}
    </div>
  );
}
