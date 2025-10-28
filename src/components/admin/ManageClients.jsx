import React, { useState, useEffect } from 'react';
import { ref as dbRef, get } from 'firebase/database';
import { db } from '../../firebase';

export default function ManageClients() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const usersRef = dbRef(db, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const usersData = snapshot.val();
      const clientData = Object.entries(usersData)
        .filter(([id, user]) => user.role === 'client')
        .map(([id, user]) => ({ id, ...user }));
      setClients(clientData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Manage Clients</h2>
        <p className="text-emerald-100">View and manage all your clients</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Clients ({clients.length})</h3>
        {clients.length === 0 ? (
          <p className="text-gray-600">No clients yet. Clients will appear here when they sign up.</p>
        ) : (
          <div className="space-y-3">
            {clients.map(client => (
              <div key={client.id} className="p-4 border border-gray-200 rounded-xl hover:border-emerald-500 transition">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-600">{client.email}</div>
                    <div className="text-xs text-gray-500">Joined: {new Date(client.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
