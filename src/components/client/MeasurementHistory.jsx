import React, { useState, useEffect } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';
import { History, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { 
  formatDate,
  sortByDateDesc,
  calculateTotalInches,
  measurementFields
} from '../../utils/measurementUtils';

export default function MeasurementHistory({ userId }) {
  const [measurements, setMeasurements] = useState([]);
  const [weightEntries, setWeightEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [viewMode, setViewMode] = useState('measurements'); // measurements, weight, all

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Load measurements
      const measurementsRef = dbRef(db, `body-measurements/${userId}`);
      const measurementsSnapshot = await get(measurementsRef);
      
      if (measurementsSnapshot.exists()) {
        const allMeasurements = measurementsSnapshot.val();
        const measurementArray = Object.entries(allMeasurements)
          .map(([id, data]) => ({ id, type: 'measurement', ...data }));
        setMeasurements(sortByDateDesc(measurementArray));
      }

      // Load weight
      const weightRef = dbRef(db, `weight-tracking/${userId}`);
      const weightSnapshot = await get(weightRef);
      
      if (weightSnapshot.exists()) {
        const allWeights = weightSnapshot.val();
        const weightArray = Object.entries(allWeights)
          .map(([id, data]) => ({ id, type: 'weight', ...data }));
        setWeightEntries(sortByDateDesc(weightArray));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (measurements.length === 0 && weightEntries.length === 0) {
      alert('No data to export');
      return;
    }

    let csvContent = '';

    if (measurements.length > 0) {
      // Measurements CSV
      const headers = ['Date', ...Object.keys(measurementFields).map(key => measurementFields[key].label), 'Total Inches', 'Notes'];
      csvContent += headers.join(',') + '\n';

      measurements.forEach(entry => {
        const row = [
          entry.date,
          ...Object.keys(measurementFields).map(key => entry.measurements[key] || ''),
          calculateTotalInches(entry.measurements).toFixed(2),
          entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : ''
        ];
        csvContent += row.join(',') + '\n';
      });
    }

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `measurement-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const toggleExpand = (entryId) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading history...</p>
        </div>
      </div>
    );
  }

  const combinedHistory = [...measurements, ...weightEntries].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  const filteredHistory = viewMode === 'all' 
    ? combinedHistory
    : viewMode === 'measurements'
    ? measurements
    : weightEntries;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">History</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View all your tracking data
          </p>
        </div>
        <History className="w-8 h-8 text-emerald-500" />
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setViewMode('measurements')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'measurements'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Measurements
          </button>
          <button
            onClick={() => setViewMode('weight')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              viewMode === 'weight'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Weight
          </button>
        </div>

        {measurements.length > 0 && (
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* History Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <History className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No History Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start tracking to see your history here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredHistory.map((entry) => (
              <div key={entry.id} className="p-4">
                <button
                  onClick={() => toggleExpand(entry.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        entry.type === 'measurement'
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {entry.type === 'measurement' ? 'Measurements' : 'Weight'}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatDate(entry.date)}
                      </div>
                    </div>
                    
                    {entry.type === 'measurement' && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Total: {calculateTotalInches(entry.measurements).toFixed(2)}" • {entry.units}
                      </div>
                    )}
                    
                    {entry.type === 'weight' && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {entry.weight} {entry.units}
                        {entry.bodyFatPercentage && ` • ${entry.bodyFatPercentage}% BF`}
                      </div>
                    )}
                  </div>
                  
                  {expandedEntry === entry.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Expanded Details */}
                {expandedEntry === entry.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {entry.type === 'measurement' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(measurementFields).map(([key, field]) => {
                          const value = entry.measurements[key];
                          if (!value) return null;
                          
                          return (
                            <div key={key} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {field.label}
                              </div>
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {value}"
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {entry.notes && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Notes:
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {entry.notes}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                      Recorded: {new Date(entry.createdAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {filteredHistory.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {measurements.length}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                Measurement Entries
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {weightEntries.length}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                Weight Entries
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {measurements.length > 0 ? (
                  Math.floor((new Date() - new Date(measurements[measurements.length - 1].date)) / (1000 * 60 * 60 * 24))
                ) : 0}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                Days Tracking
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {((measurements.length + weightEntries.length) / 
                  Math.max(1, Math.floor((new Date() - new Date(
                    measurements.length > 0 ? measurements[measurements.length - 1].date : 
                    weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].date : 
                    new Date()
                  )) / (1000 * 60 * 60 * 24 * 7)))).toFixed(1)}
              </div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                Entries/Week
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
