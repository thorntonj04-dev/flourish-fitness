import React, { useState, useEffect } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function DebugClientList() {
  const [allUsers, setAllUsers] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      const usersRef = dbRef(db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setRawData(data);
        
        const usersList = Object.entries(data).map(([id, user]) => ({
          id,
          ...user
        }));
        
        setAllUsers(usersList);
      } else {
        setError('No users found in database');
      }
    } catch (err) {
      setError(`Error loading users: ${err.message}`);
      console.error('Error:', err);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Debug: User Database</h2>
        <p className="text-purple-100">Checking what's in your Firebase database</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-3xl font-bold text-gray-900">{allUsers.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-600">
              {allUsers.filter(u => u.role === 'client').length}
            </div>
            <div className="text-sm text-gray-600">Clients</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {allUsers.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-600">Admins</div>
          </div>
        </div>
      </div>

      {/* All Users */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Users in Database</h3>
        {allUsers.length === 0 ? (
          <p className="text-gray-600">No users found</p>
        ) : (
          <div className="space-y-3">
            {allUsers.map(user => (
              <div key={user.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-gray-900">{user.name || user.email || 'No name'}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : user.role === 'client'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role || 'No role'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div><strong>ID:</strong> {user.id}</div>
                  {user.createdAt && <div><strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw Data */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Raw Database Data</h3>
        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
          {JSON.stringify(rawData, null, 2)}
        </pre>
      </div>

      {/* Fix Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">🔧 Common Issues & Fixes</h3>
        <div className="space-y-3 text-blue-800">
          <div>
            <strong>Issue: No users showing</strong>
            <p className="text-sm">Users might not have a 'role' field. Check if role is 'client' or 'admin' in the raw data above.</p>
          </div>
          <div>
            <strong>Issue: Role is missing</strong>
            <p className="text-sm">When creating users, make sure to set role: 'client' or role: 'admin' in the database.</p>
          </div>
          <div>
            <strong>Issue: Different field names</strong>
            <p className="text-sm">Check if your database uses 'userType', 'type', or another field instead of 'role'.</p>
          </div>
        </div>
      </div>

      {/* Quick Fix Button */}
      {allUsers.some(u => !u.role) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-yellow-900 mb-3">⚠️ Found users without 'role' field</h3>
          <p className="text-yellow-800 mb-4">
            Some users don't have a role assigned. You need to manually set their role in Firebase.
          </p>
          <div className="text-sm text-yellow-700">
            <strong>To fix:</strong>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Go to Firebase Console → Realtime Database</li>
              <li>Find each user under 'users/'</li>
              <li>Add a field: role: "client" or role: "admin"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
