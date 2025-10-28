import React, { useState, useEffect } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function Reports() {
  const [stats, setStats] = useState({ totalClients: 0, activeToday: 0, totalPhotos: 0, totalNutritionLogs: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load clients
      const usersRef = dbRef(db, 'users');
      const usersSnapshot = await get(usersRef);
      let clientCount = 0;
      
      if (usersSnapshot.exists()) {
        const usersData = usersSnapshot.val();
        clientCount = Object.values(usersData).filter(user => user.role === 'client').length;
      }

      // Load photos
      const photosRef = dbRef(db, 'progress-photos');
      const photosSnapshot = await get(photosRef);
      const photoCount = photosSnapshot.exists() ? Object.keys(photosSnapshot.val()).length : 0;

      // Load nutrition logs
      const logsRef = dbRef(db, 'nutrition-logs');
      const logsSnapshot = await get(logsRef);
      const logCount = logsSnapshot.exists() ? Object.keys(logsSnapshot.val()).length : 0;

      // Check active today (nutrition logs from today)
      const today = new Date().toISOString().split('T')[0];
      let activeToday = 0;
      if (logsSnapshot.exists()) {
        const logs = Object.values(logsSnapshot.val());
        const uniqueUsers = new Set(logs.filter(log => log.date === today).map(log => log.userId));
        activeToday = uniqueUsers.size;
      }

      setStats({
        totalClients: clientCount,
        activeToday: activeToday,
        totalPhotos: photoCount,
        totalNutritionLogs: logCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <p className="text-emerald-100">Track client progress and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Clients</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalClients}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Active Today</div>
          <div className="text-3xl font-bold text-emerald-600">{stats.activeToday}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Total Photos</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalPhotos}</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Nutrition Logs</div>
          <div className="text-3xl font-bold text-gray-900">{stats.totalNutritionLogs}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h3>
        <p className="text-gray-600">More detailed analytics and charts coming soon!</p>
      </div>
    </div>
  );
}
