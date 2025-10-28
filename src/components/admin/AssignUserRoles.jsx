import React, { useState, useEffect } from 'react';
import { ref as dbRef, get, update } from 'firebase/database';
import { db } from '../../firebase';
import { Users, Shield, CheckCircle } from 'lucide-react';

export default function AssignUserRoles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersRef = dbRef(db, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersList = Object.entries(data).map(([id, user]) => ({
          id,
          ...user
        }));
        setUsers(usersList);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId, role) => {
    setUpdating(userId);
    try {
      const userRef = dbRef(db, `users/${userId}`);
      await update(userRef, { role: role });
      alert(`Successfully assigned ${role} role!`);
      await loadUsers(); // Reload to show updated data
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Error assigning role: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading users...</div>
      </div>
    );
  }

  const usersWithoutRole = users.filter(u => !u.role);
  const admins = users.filter(u => u.role === 'admin');
  const clients = users.filter(u => u.role === 'client');

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">User Role Manager</h2>
        <p className="text-blue-100">Assign roles to users in your system</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="text-3xl font-bold text-gray-900">{users.length}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <div className="text-3xl font-bold text-emerald-600">{clients.length}</div>
          <div className="text-sm text-gray-600">Clients</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="text-3xl font-bold text-purple-600">{admins.length}</div>
          <div className="text-sm text-gray-600">Admins</div>
        </div>
      </div>

      {/* Users Without Roles */}
      {usersWithoutRole.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-lg">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Users Without Roles ({usersWithoutRole.length})</h3>
          </div>
          
          <p className="text-gray-600 mb-4">These users need to be assigned a role:</p>
          
          <div className="space-y-3">
            {usersWithoutRole.map(user => (
              <div key={user.id} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-gray-900">{user.name || user.email || 'No name'}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    <div className="text-xs text-gray-500 mt-1">ID: {user.id}</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => assignRole(user.id, 'client')}
                    disabled={updating === user.id}
                    className="flex-1 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Assign as Client
                  </button>
                  <button
                    onClick={() => assignRole(user.id, 'admin')}
                    disabled={updating === user.id}
                    className="flex-1 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Assign as Admin
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clients */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-6 h-6 text-emerald-600" />
          <h3 className="text-xl font-bold text-gray-900">Clients ({clients.length})</h3>
        </div>
        
        {clients.length === 0 ? (
          <p className="text-gray-600">No clients yet</p>
        ) : (
          <div className="space-y-2">
            {clients.map(user => (
              <div key={user.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{user.name || user.email}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admins */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">Admins ({admins.length})</h3>
        </div>
        
        {admins.length === 0 ? (
          <p className="text-gray-600">No admins yet</p>
        ) : (
          <div className="space-y-2">
            {admins.map(user => (
              <div key={user.id} className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{user.name || user.email}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                </div>
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">📝 How Roles Work</h3>
        <div className="space-y-2 text-blue-800 text-sm">
          <div><strong>Client:</strong> Can view and complete their assigned workouts, track progress, log nutrition, upload photos</div>
          <div><strong>Admin:</strong> Can create workouts, assign them to clients, view all client data, manage the system</div>
        </div>
      </div>
    </div>
  );
}
