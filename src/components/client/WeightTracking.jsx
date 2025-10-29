import React, { useState, useEffect } from 'react';
import { ref as dbRef, push, set, get, remove } from 'firebase/database';
import { db } from '../../firebase';
import { Scale, TrendingDown, TrendingUp, Trash2, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  formatDate, 
  formatDateForInput,
  formatWeight,
  sortByDateDesc,
  getWeightChartData
} from '../../utils/measurementUtils';

export default function WeightTracking({ userId }) {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(formatDateForInput());
  const [units, setUnits] = useState('lbs');
  const [bodyFatPercentage, setBodyFatPercentage] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [weightHistory, setWeightHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadWeightHistory();
    loadUserPreferences();
  }, [userId]);

  const loadWeightHistory = async () => {
    try {
      const weightRef = dbRef(db, `weight-tracking/${userId}`);
      const snapshot = await get(weightRef);
      
      if (snapshot.exists()) {
        const allWeights = snapshot.val();
        const weightArray = Object.entries(allWeights)
          .map(([id, data]) => ({ id, ...data }));
        
        setWeightHistory(sortByDateDesc(weightArray));
      }
    } catch (error) {
      console.error('Error loading weight history:', error);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const prefsRef = dbRef(db, `user-preferences/${userId}`);
      const snapshot = await get(prefsRef);
      
      if (snapshot.exists()) {
        const prefs = snapshot.val();
        setUnits(prefs.weightUnits || 'lbs');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    if (!weight || parseFloat(weight) <= 0) {
      alert('Please enter a valid weight.');
      return;
    }

    setSaving(true);
    try {
      const weightRef = dbRef(db, `weight-tracking/${userId}`);
      const newWeightRef = push(weightRef);
      
      const weightData = {
        date: date,
        weight: parseFloat(weight),
        units: units,
        notes: notes,
        createdAt: new Date().toISOString()
      };

      if (bodyFatPercentage) {
        weightData.bodyFatPercentage = parseFloat(bodyFatPercentage);
      }
      
      await set(newWeightRef, weightData);

      // Reset form
      setWeight('');
      setBodyFatPercentage('');
      setNotes('');
      setDate(formatDateForInput());
      setShowForm(false);
      
      // Reload history
      loadWeightHistory();
      
      alert('✓ Weight logged successfully!');
    } catch (error) {
      console.error('Error saving weight:', error);
      alert('Failed to save weight. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId) => {
    if (!confirm('Are you sure you want to delete this weight entry?')) return;

    try {
      await remove(dbRef(db, `weight-tracking/${userId}/${entryId}`));
      loadWeightHistory();
    } catch (error) {
      console.error('Error deleting weight entry:', error);
      alert('Failed to delete entry.');
    }
  };

  const getWeightChange = () => {
    if (weightHistory.length < 2) return null;
    
    const latest = parseFloat(weightHistory[0].weight);
    const previous = parseFloat(weightHistory[1].weight);
    const change = latest - previous;
    
    return {
      value: Math.abs(change).toFixed(1),
      isLoss: change < 0,
      percentage: ((change / previous) * 100).toFixed(1)
    };
  };

  const getTotalChange = () => {
    if (weightHistory.length < 2) return null;
    
    const latest = parseFloat(weightHistory[0].weight);
    const starting = parseFloat(weightHistory[weightHistory.length - 1].weight);
    const change = latest - starting;
    
    return {
      value: Math.abs(change).toFixed(1),
      isLoss: change < 0,
      percentage: ((change / starting) * 100).toFixed(1)
    };
  };

  const chartData = getWeightChartData(weightHistory);
  const recentChange = getWeightChange();
  const totalChange = getTotalChange();
  const currentWeight = weightHistory.length > 0 ? weightHistory[0] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Weight Tracking</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor your weight trends over time
          </p>
        </div>
        <Scale className="w-8 h-8 text-emerald-500" />
      </div>

      {/* Current Stats */}
      {currentWeight && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Current Weight */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Weight</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatWeight(currentWeight.weight, currentWeight.units)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(currentWeight.date)}
            </div>
          </div>

          {/* Recent Change */}
          {recentChange && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Recent Change</div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${
                recentChange.isLoss ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {recentChange.isLoss ? (
                  <TrendingDown className="w-6 h-6" />
                ) : (
                  <TrendingUp className="w-6 h-6" />
                )}
                {recentChange.value} {units}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {recentChange.isLoss ? 'Lost' : 'Gained'} ({recentChange.percentage}%)
              </div>
            </div>
          )}

          {/* Total Change */}
          {totalChange && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Change</div>
              <div className={`text-2xl font-bold flex items-center gap-2 ${
                totalChange.isLoss ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {totalChange.isLoss ? (
                  <TrendingDown className="w-6 h-6" />
                ) : (
                  <TrendingUp className="w-6 h-6" />
                )}
                {totalChange.value} {units}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Since start ({totalChange.percentage}%)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Weight Trend</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#6B7280"
                style={{ fontSize: '12px' }}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#10B981" 
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add Weight Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Log Weight
        </button>
      )}

      {/* Weight Entry Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Log New Weight</h4>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={formatDateForInput()}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter weight"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              />
              <select
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          {/* Body Fat % (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Body Fat % (Optional)
            </label>
            <input
              type="number"
              step="0.1"
              value={bodyFatPercentage}
              onChange={(e) => setBodyFatPercentage(e.target.value)}
              placeholder="e.g., 18.5"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Weight'}
          </button>
        </div>
      )}

      {/* Weight History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Weight History ({weightHistory.length} entries)
        </h4>
        
        {weightHistory.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No weight entries yet. Log your first weight above!
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {weightHistory.map((entry, index) => {
              const prevEntry = weightHistory[index + 1];
              let change = null;
              
              if (prevEntry) {
                const diff = parseFloat(entry.weight) - parseFloat(prevEntry.weight);
                change = {
                  value: Math.abs(diff).toFixed(1),
                  isLoss: diff < 0
                };
              }

              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatWeight(entry.weight, entry.units)}
                      </div>
                      {change && (
                        <div className={`text-sm flex items-center gap-1 ${
                          change.isLoss ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {change.isLoss ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                          {change.value} {entry.units}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {formatDate(entry.date)}
                    </div>
                    {entry.bodyFatPercentage && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Body Fat: {entry.bodyFatPercentage}%
                      </div>
                    )}
                    {entry.notes && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                        "{entry.notes}"
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
