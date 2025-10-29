import React, { useState, useEffect } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';
import { Users, Ruler, Scale, Camera, TrendingDown, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  formatDate,
  sortByDateDesc,
  calculateTotalInches,
  getBiggestChanges,
  calculateChange,
  getChartData,
  getWeightChartData,
  formatWeight,
  measurementFields
} from '../../utils/measurementUtils';

export default function ClientMeasurements() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientData, setClientData] = useState({
    measurements: [],
    weight: [],
    photos: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const usersRef = dbRef(db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const clientData = Object.entries(usersData)
          .filter(([id, user]) => user.role === 'client')
          .map(([id, user]) => ({ id, ...user }));
        setClients(clientData);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadClientData = async (clientId) => {
    setLoading(true);
    try {
      // Load measurements
      const measurementsRef = dbRef(db, `body-measurements/${clientId}`);
      const measurementsSnapshot = await get(measurementsRef);
      let measurements = [];
      
      if (measurementsSnapshot.exists()) {
        const allMeasurements = measurementsSnapshot.val();
        measurements = Object.entries(allMeasurements)
          .map(([id, data]) => ({ id, ...data }));
      }

      // Load weight
      const weightRef = dbRef(db, `weight-tracking/${clientId}`);
      const weightSnapshot = await get(weightRef);
      let weight = [];
      
      if (weightSnapshot.exists()) {
        const allWeights = weightSnapshot.val();
        weight = Object.entries(allWeights)
          .map(([id, data]) => ({ id, ...data }));
      }

      // Load photos
      const photosRef = dbRef(db, 'progress-photos');
      const photosSnapshot = await get(photosRef);
      let photos = [];
      
      if (photosSnapshot.exists()) {
        const allPhotos = photosSnapshot.val();
        photos = Object.entries(allPhotos)
          .filter(([key, photo]) => photo.userId === clientId)
          .map(([key, photo]) => ({ id: key, ...photo }));
      }

      setClientData({
        measurements: sortByDateDesc(measurements),
        weight: sortByDateDesc(weight),
        photos: sortByDateDesc(photos)
      });
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setActiveTab('overview');
    loadClientData(client.id);
  };

  if (!selectedClient) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">Client Progress Tracking</h2>
          <p className="text-emerald-100">View measurements, weight, and photos for all clients</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select a Client</h3>
          {clients.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No clients yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-500 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                      {client.name?.charAt(0) || client.email?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {client.name || 'Unnamed Client'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{client.email}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const latestMeasurement = clientData.measurements[0];
  const previousMeasurement = clientData.measurements[1];
  const latestWeight = clientData.weight[0];
  const startingWeight = clientData.weight[clientData.weight.length - 1];
  const firstPhoto = clientData.photos[clientData.photos.length - 1];
  const latestPhoto = clientData.photos[0];

  const measurementChanges = latestMeasurement && previousMeasurement
    ? calculateChange(latestMeasurement.measurements, previousMeasurement.measurements)
    : null;

  const biggestChanges = measurementChanges ? getBiggestChanges(measurementChanges, 3) : [];

  const weightChange = latestWeight && startingWeight
    ? (parseFloat(latestWeight.weight) - parseFloat(startingWeight.weight)).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => {
          setSelectedClient(null);
          setClientData({ measurements: [], weight: [], photos: [] });
        }}
        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2"
      >
        ← Back to Clients
      </button>

      {/* Client Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold">
            {selectedClient.name?.charAt(0) || selectedClient.email?.charAt(0) || '?'}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{selectedClient.name || 'Client'}'s Progress</h2>
            <p className="text-emerald-100">{selectedClient.email}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: Users },
            { id: 'measurements', label: 'Measurements', icon: Ruler },
            { id: 'weight', label: 'Weight', icon: Scale },
            { id: 'photos', label: 'Photos', icon: Camera }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading client data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Total Measurements
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {clientData.measurements.length}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Weight Entries
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {clientData.weight.length}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Progress Photos
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {clientData.photos.length}
                      </div>
                    </div>
                  </div>

                  {/* Latest Data */}
                  {latestWeight && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Current Weight
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {formatWeight(latestWeight.weight, latestWeight.units)}
                        </div>
                        {weightChange && (
                          <div className={`flex items-center gap-1 ${
                            parseFloat(weightChange) < 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {parseFloat(weightChange) < 0 ? (
                              <TrendingDown className="w-5 h-5" />
                            ) : (
                              <TrendingUp className="w-5 h-5" />
                            )}
                            <span className="font-semibold">
                              {Math.abs(weightChange)} {latestWeight.units}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Last updated: {formatDate(latestWeight.date)}
                      </div>
                    </div>
                  )}

                  {/* Biggest Changes */}
                  {biggestChanges.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Recent Changes
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {biggestChanges.map((change, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {change.label}
                            </div>
                            <div className={`text-xl font-bold flex items-center gap-1 ${
                              change.change < 0 ? 'text-emerald-600' : 'text-red-600'
                            }`}>
                              {change.change < 0 ? (
                                <TrendingDown className="w-5 h-5" />
                              ) : (
                                <TrendingUp className="w-5 h-5" />
                              )}
                              {Math.abs(change.change)}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photo Comparison */}
                  {firstPhoto && latestPhoto && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Transformation
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            First Photo
                          </div>
                          <img
                            src={firstPhoto.imageUrl}
                            alt="First"
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {formatDate(firstPhoto.date)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Latest Photo
                          </div>
                          <img
                            src={latestPhoto.imageUrl}
                            alt="Latest"
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {formatDate(latestPhoto.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Measurements Tab */}
              {activeTab === 'measurements' && (
                <div className="space-y-6">
                  {clientData.measurements.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                      No measurements recorded yet.
                    </p>
                  ) : (
                    <>
                      {/* Chart */}
                      {clientData.measurements.length > 1 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Waist Measurement Trend
                          </h4>
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={getChartData(clientData.measurements, 'waistNatural')}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
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

                      {/* Latest Measurements */}
                      {latestMeasurement && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Latest Measurements ({formatDate(latestMeasurement.date)})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(measurementFields).map(([key, field]) => {
                              const value = latestMeasurement.measurements[key];
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
                        </div>
                      )}

                      {/* History */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Measurement History
                        </h4>
                        <div className="space-y-2">
                          {clientData.measurements.map((entry) => (
                            <div
                              key={entry.id}
                              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                            >
                              <div className="font-medium text-gray-900 dark:text-white mb-2">
                                {formatDate(entry.date)}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                Total: {calculateTotalInches(entry.measurements).toFixed(2)}"
                              </div>
                              {entry.notes && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                                  "{entry.notes}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Weight Tab */}
              {activeTab === 'weight' && (
                <div className="space-y-6">
                  {clientData.weight.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                      No weight entries recorded yet.
                    </p>
                  ) : (
                    <>
                      {/* Chart */}
                      {clientData.weight.length > 1 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                            Weight Trend
                          </h4>
                          <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={getWeightChartData(clientData.weight)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="date" stroke="#6B7280" style={{ fontSize: '12px' }} />
                              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
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

                      {/* History */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Weight History
                        </h4>
                        <div className="space-y-2">
                          {clientData.weight.map((entry) => (
                            <div
                              key={entry.id}
                              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex justify-between items-center"
                            >
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                  {formatWeight(entry.weight, entry.units)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(entry.date)}
                                </div>
                                {entry.bodyFatPercentage && (
                                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Body Fat: {entry.bodyFatPercentage}%
                                  </div>
                                )}
                              </div>
                              {entry.notes && (
                                <div className="text-xs text-gray-500 dark:text-gray-500 italic max-w-xs">
                                  "{entry.notes}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Photos Tab */}
              {activeTab === 'photos' && (
                <div className="space-y-6">
                  {clientData.photos.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                      No photos uploaded yet.
                    </p>
                  ) : (
                    <>
                      {/* Photo Grid */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          All Photos ({clientData.photos.length})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {clientData.photos.map((photo) => (
                            <div key={photo.id}>
                              <img
                                src={photo.imageUrl}
                                alt={`${photo.photoType} view`}
                                className="w-full h-40 object-cover rounded-lg"
                              />
                              <div className="mt-2">
                                <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                  {photo.photoType} View
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {formatDate(photo.date)}
                                </div>
                                {photo.weight && (
                                  <div className="text-xs text-gray-500 dark:text-gray-500">
                                    {photo.weight} lbs
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
