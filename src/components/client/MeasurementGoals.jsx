import React, { useState, useEffect } from 'react';
import { ref as dbRef, get, set } from 'firebase/database';
import { db } from '../../firebase';
import { Target, Save, TrendingDown, CheckCircle } from 'lucide-react';
import { 
  measurementFields,
  formatDate,
  formatDateForInput,
  calculateGoalProgress
} from '../../utils/measurementUtils';

export default function MeasurementGoals({ userId }) {
  const [goals, setGoals] = useState({
    targetWeight: '',
    targetDate: '',
    targetMeasurements: {}
  });
  const [currentData, setCurrentData] = useState({
    weight: null,
    measurements: null
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoalsAndCurrentData();
  }, [userId]);

  const loadGoalsAndCurrentData = async () => {
    setLoading(true);
    try {
      // Load existing goals
      const goalsRef = dbRef(db, `measurement-goals/${userId}`);
      const goalsSnapshot = await get(goalsRef);
      
      if (goalsSnapshot.exists()) {
        setGoals(goalsSnapshot.val());
      }

      // Load current weight
      const weightRef = dbRef(db, `weight-tracking/${userId}`);
      const weightSnapshot = await get(weightRef);
      
      if (weightSnapshot.exists()) {
        const allWeights = weightSnapshot.val();
        const weightArray = Object.entries(allWeights)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (weightArray.length > 0) {
          setCurrentData(prev => ({ ...prev, weight: weightArray[0].weight }));
        }
      }

      // Load current measurements
      const measurementsRef = dbRef(db, `body-measurements/${userId}`);
      const measurementsSnapshot = await get(measurementsRef);
      
      if (measurementsSnapshot.exists()) {
        const allMeasurements = measurementsSnapshot.val();
        const measurementArray = Object.entries(allMeasurements)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (measurementArray.length > 0) {
          setCurrentData(prev => ({ 
            ...prev, 
            measurements: measurementArray[0].measurements 
          }));
        }
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoals = async () => {
    setSaving(true);
    try {
      const goalsRef = dbRef(db, `measurement-goals/${userId}`);
      const goalsData = {
        ...goals,
        updatedAt: new Date().toISOString()
      };

      if (!goals.createdAt) {
        goalsData.createdAt = new Date().toISOString();
      }

      await set(goalsRef, goalsData);
      alert('✓ Goals saved successfully!');
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Failed to save goals. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMeasurementGoalChange = (field, value) => {
    setGoals(prev => ({
      ...prev,
      targetMeasurements: {
        ...prev.targetMeasurements,
        [field]: value
      }
    }));
  };

  const removeMeasurementGoal = (field) => {
    setGoals(prev => {
      const newTargets = { ...prev.targetMeasurements };
      delete newTargets[field];
      return {
        ...prev,
        targetMeasurements: newTargets
      };
    });
  };

  const getWeightProgress = () => {
    if (!currentData.weight || !goals.targetWeight) return null;
    
    const current = parseFloat(currentData.weight);
    const target = parseFloat(goals.targetWeight);
    const diff = current - target;
    const progress = Math.min(100, Math.max(0, 
      ((current - target) / current) * 100
    ));

    return {
      diff: Math.abs(diff).toFixed(1),
      isOnTrack: current > target, // Assuming weight loss goal
      progress: 100 - progress,
      remaining: Math.abs(diff).toFixed(1)
    };
  };

  const getMeasurementProgress = (field) => {
    if (!currentData.measurements || !goals.targetMeasurements[field]) return null;
    
    const current = parseFloat(currentData.measurements[field]);
    const target = parseFloat(goals.targetMeasurements[field]);
    
    if (isNaN(current) || isNaN(target)) return null;
    
    const diff = current - target;
    const progress = Math.min(100, Math.max(0,
      ((current - target) / current) * 100
    ));

    return {
      current: current.toFixed(2),
      target: target.toFixed(2),
      diff: Math.abs(diff).toFixed(2),
      isAchieved: current <= target,
      progress: 100 - progress,
      remaining: Math.abs(diff).toFixed(2)
    };
  };

  const getDaysRemaining = () => {
    if (!goals.targetDate) return null;
    
    const today = new Date();
    const target = new Date(goals.targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading goals...</p>
        </div>
      </div>
    );
  }

  const weightProgress = getWeightProgress();
  const daysRemaining = getDaysRemaining();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Goals</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set and track your fitness goals
          </p>
        </div>
        <Target className="w-8 h-8 text-emerald-500" />
      </div>

      {/* Goal Setting Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <h4 className="font-semibold text-gray-900 dark:text-white">Set Your Goals</h4>

        {/* Weight Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Weight (lbs)
          </label>
          <input
            type="number"
            step="0.1"
            value={goals.targetWeight}
            onChange={(e) => setGoals(prev => ({ ...prev, targetWeight: e.target.value }))}
            placeholder="Enter target weight"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
          />
          {currentData.weight && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current: {currentData.weight} lbs
            </p>
          )}
        </div>

        {/* Target Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Date
          </label>
          <input
            type="date"
            value={goals.targetDate}
            onChange={(e) => setGoals(prev => ({ ...prev, targetDate: e.target.value }))}
            min={formatDateForInput()}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Measurement Goals */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Measurements (inches)
          </label>
          <div className="space-y-3">
            {Object.entries(goals.targetMeasurements).map(([field, value]) => (
              <div key={field} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={value}
                      onChange={(e) => handleMeasurementGoalChange(field, e.target.value)}
                      placeholder={measurementFields[field]?.label}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
                      {measurementFields[field]?.label}
                    </span>
                  </div>
                  {currentData.measurements?.[field] && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Current: {currentData.measurements[field]}"
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeMeasurementGoal(field)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                >
                  Remove
                </button>
              </div>
            ))}

            {/* Add Measurement Goal */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleMeasurementGoalChange(e.target.value, '');
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">+ Add Measurement Goal</option>
              {Object.entries(measurementFields)
                .filter(([key]) => !goals.targetMeasurements[key])
                .map(([key, field]) => (
                  <option key={key} value={key}>
                    {field.label}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveGoals}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Goals'}
        </button>
      </div>

      {/* Progress Tracking */}
      {(weightProgress || Object.keys(goals.targetMeasurements).length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">Your Progress</h4>
            {daysRemaining !== null && (
              <div className="text-sm">
                {daysRemaining > 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {daysRemaining} days remaining
                  </span>
                ) : daysRemaining === 0 ? (
                  <span className="text-orange-600 dark:text-orange-400">
                    Target date is today!
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    {Math.abs(daysRemaining)} days past target
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Weight Progress */}
          {weightProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Weight Goal
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {weightProgress.remaining} lbs to go
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, weightProgress.progress)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {weightProgress.progress.toFixed(0)}% complete
              </div>
            </div>
          )}

          {/* Measurement Progress */}
          {Object.keys(goals.targetMeasurements).map(field => {
            const progress = getMeasurementProgress(field);
            if (!progress) return null;

            return (
              <div key={field} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {measurementFields[field]?.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {progress.isAchieved && (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {progress.remaining}" to go
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      progress.isAchieved
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${Math.min(100, progress.progress)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                  <span>{progress.progress.toFixed(0)}% complete</span>
                  <span>Current: {progress.current}" | Target: {progress.target}"</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Motivational Message */}
      {(weightProgress || Object.keys(goals.targetMeasurements).length > 0) && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium text-emerald-900 dark:text-emerald-100 mb-1">
                Keep Going! 💪
              </h5>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Stay consistent with your measurements and you'll reach your goals. Small progress is still progress!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!goals.targetWeight && Object.keys(goals.targetMeasurements).length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Set Your First Goal
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Define what you want to achieve to stay motivated and track your progress
          </p>
        </div>
      )}
    </div>
  );
}
