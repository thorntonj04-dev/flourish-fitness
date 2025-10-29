import React, { useState, useEffect } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';
import { TrendingUp, TrendingDown, Camera, Ruler, Scale, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  formatDate,
  calculateTotalInches,
  getBiggestChanges,
  calculateChange,
  sortByDateDesc,
  getChartData,
  getWeightChartData,
  formatWeight,
  getGreeting,
  getMeasurementReminder
} from '../../utils/measurementUtils';

export default function MeasurementDashboard({ userId }) {
  const [measurements, setMeasurements] = useState([]);
  const [weightEntries, setWeightEntries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState('waistNatural');

  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMeasurements(),
        loadWeightEntries(),
        loadPhotos()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMeasurements = async () => {
    try {
      const measurementsRef = dbRef(db, `body-measurements/${userId}`);
      const snapshot = await get(measurementsRef);
      
      if (snapshot.exists()) {
        const allMeasurements = snapshot.val();
        const measurementArray = Object.entries(allMeasurements)
          .map(([id, data]) => ({ id, ...data }));
        
        setMeasurements(sortByDateDesc(measurementArray));
      }
    } catch (error) {
      console.error('Error loading measurements:', error);
    }
  };

  const loadWeightEntries = async () => {
    try {
      const weightRef = dbRef(db, `weight-tracking/${userId}`);
      const snapshot = await get(weightRef);
      
      if (snapshot.exists()) {
        const allWeights = snapshot.val();
        const weightArray = Object.entries(allWeights)
          .map(([id, data]) => ({ id, ...data }));
        
        setWeightEntries(sortByDateDesc(weightArray));
      }
    } catch (error) {
      console.error('Error loading weight:', error);
    }
  };

  const loadPhotos = async () => {
    try {
      const photosRef = dbRef(db, 'progress-photos');
      const snapshot = await get(photosRef);
      
      if (snapshot.exists()) {
        const allPhotos = snapshot.val();
        const photoData = Object.entries(allPhotos)
          .filter(([key, photo]) => photo.userId === userId)
          .map(([key, photo]) => ({ id: key, ...photo }));
        
        setPhotos(sortByDateDesc(photoData));
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const latestMeasurement = measurements.length > 0 ? measurements[0] : null;
  const previousMeasurement = measurements.length > 1 ? measurements[1] : null;
  const latestWeight = weightEntries.length > 0 ? weightEntries[0] : null;
  const startingWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1] : null;
  const firstPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  const latestPhoto = photos.length > 0 ? photos[0] : null;

  // Calculate changes
  const measurementChanges = latestMeasurement && previousMeasurement 
    ? calculateChange(latestMeasurement.measurements, previousMeasurement.measurements)
    : null;

  const biggestChanges = measurementChanges ? getBiggestChanges(measurementChanges, 3) : [];

  const totalInchesChange = latestMeasurement && previousMeasurement
    ? (calculateTotalInches(latestMeasurement.measurements) - calculateTotalInches(previousMeasurement.measurements)).toFixed(2)
    : null;

  const weightChange = latestWeight && startingWeight
    ? (parseFloat(latestWeight.weight) - parseFloat(startingWeight.weight)).toFixed(1)
    : null;

  // Chart data
  const measurementChartData = getChartData(measurements, selectedChart);
  const weightChartData = getWeightChartData(weightEntries);

  const chartOptions = [
    { value: 'waistNatural', label: 'Waist' },
    { value: 'chest', label: 'Chest' },
    { value: 'hips', label: 'Hips' },
    { value: 'bicepRight', label: 'Bicep' },
    { value: 'thighRight', label: 'Thigh' }
  ];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}! 👋
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Here's your progress overview
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Measurements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Ruler className="w-5 h-5 text-emerald-500" />
            {totalInchesChange && (
              <span className={`text-sm font-medium ${
                parseFloat(totalInchesChange) < 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {totalInchesChange}"
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {measurements.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Measurement entries
          </div>
          {latestMeasurement && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {getMeasurementReminder(latestMeasurement.date)}
            </div>
          )}
        </div>

        {/* Current Weight */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Scale className="w-5 h-5 text-emerald-500" />
            {weightChange && (
              <span className={`text-sm font-medium flex items-center gap-1 ${
                parseFloat(weightChange) < 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {parseFloat(weightChange) < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                {Math.abs(weightChange)}
              </span>
            )}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {latestWeight ? formatWeight(latestWeight.weight, latestWeight.units) : '-'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Current weight
          </div>
          {latestWeight && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {formatDate(latestWeight.date)}
            </div>
          )}
        </div>

        {/* Progress Photos */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Camera className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {photos.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Progress photos
          </div>
          {latestPhoto && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Last: {formatDate(latestPhoto.date)}
            </div>
          )}
        </div>

        {/* Days Tracking */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {measurements.length > 0 || weightEntries.length > 0 ? (
              Math.floor((new Date() - new Date(
                measurements.length > 0 
                  ? measurements[measurements.length - 1].date 
                  : weightEntries[weightEntries.length - 1].date
              )) / (1000 * 60 * 60 * 24))
            ) : 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Days tracking
          </div>
        </div>
      </div>

      {/* Biggest Changes */}
      {biggestChanges.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Biggest Changes Since Last Measurement
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {biggestChanges.map((change, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {change.label}
                  </div>
                  <div className={`text-lg font-bold flex items-center gap-1 ${
                    change.change < 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {change.change < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    {Math.abs(change.change)}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Photos Section */}
      {firstPhoto && latestPhoto && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Photo Progress
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                First Photo
              </div>
              <img 
                src={firstPhoto.imageUrl} 
                alt="First" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {formatDate(firstPhoto.date)}
                {firstPhoto.weight && ` • ${firstPhoto.weight} lbs`}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Latest Photo
              </div>
              <img 
                src={latestPhoto.imageUrl} 
                alt="Latest" 
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {formatDate(latestPhoto.date)}
                {latestPhoto.weight && ` • ${latestPhoto.weight} lbs`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {(measurementChartData.length > 1 || weightChartData.length > 1) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Measurement Chart */}
          {measurementChartData.length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Measurement Trend
                </h4>
                <select
                  value={selectedChart}
                  onChange={(e) => setSelectedChart(e.target.value)}
                  className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  {chartOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={getChartData(measurements, selectedChart)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
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
                    dataKey="value" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Weight Chart */}
          {weightChartData.length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Weight Trend
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6B7280"
                    style={{ fontSize: '12px' }}
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
        </div>
      )}

      {/* Empty State */}
      {measurements.length === 0 && weightEntries.length === 0 && photos.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Ruler className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Start Your Journey
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Begin tracking your measurements, weight, and progress photos to see your transformation over time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => document.querySelector('[data-tab="measurements"]')?.click()}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
            >
              Add Measurements
            </button>
            <button
              onClick={() => document.querySelector('[data-tab="weight"]')?.click()}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Log Weight
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
