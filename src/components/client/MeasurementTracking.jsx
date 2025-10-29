import React, { useState } from 'react';
import { Ruler, Scale, Camera, TrendingUp, Target, History } from 'lucide-react';
import BodyMeasurements from './BodyMeasurements';
import WeightTracking from './WeightTracking';
import ProgressPhotos from './ProgressPhotos';
import MeasurementDashboard from './MeasurementDashboard';
import MeasurementHistory from './MeasurementHistory';
import MeasurementGoals from './MeasurementGoals';

export default function MeasurementTracking({ user }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'measurements', label: 'Measurements', icon: Ruler },
    { id: 'weight', label: 'Weight', icon: Scale },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'history', label: 'History', icon: History },
    { id: 'goals', label: 'Goals', icon: Target }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Measurement & Progress Tracking</h2>
        <p className="text-emerald-100">Track your transformation with precision</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-4 whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm md:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">
          {activeTab === 'dashboard' && <MeasurementDashboard userId={user.uid} />}
          {activeTab === 'measurements' && <BodyMeasurements userId={user.uid} />}
          {activeTab === 'weight' && <WeightTracking userId={user.uid} />}
          {activeTab === 'photos' && <ProgressPhotos userId={user.uid} />}
          {activeTab === 'history' && <MeasurementHistory userId={user.uid} />}
          {activeTab === 'goals' && <MeasurementGoals userId={user.uid} />}
        </div>
      </div>
    </div>
  );
}
