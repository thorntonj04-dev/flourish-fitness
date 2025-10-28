import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Trash2, Camera, Shield, BarChart3, Target, Menu, X, ChevronRight, Award, Heart, TrendingUp, Play, Pause, Check, Plus, Minus, Video, Calendar, Clock, Trophy, Save, Edit2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove, update, query as dbQuery, orderByChild, equalTo, onValue } from 'firebase/database';
import { auth, db, storage } from '../../firebase';
import Tesseract from 'tesseract.js';


export default function AdminPhotos() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientPhotos, setClientPhotos] = useState([]);

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

  const loadClientPhotos = async (clientId) => {
    try {
      const photosRef = dbRef(db, 'progress-photos');
      const snapshot = await get(photosRef);
      
      if (snapshot.exists()) {
        const allPhotos = snapshot.val();
        const photoData = Object.entries(allPhotos)
          .filter(([key, photo]) => photo.userId === clientId)
          .map(([key, photo]) => ({ id: key, ...photo }))
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setClientPhotos(photoData);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    loadClientPhotos(client.id);
  };

  const getWeekComparison = () => {
    if (clientPhotos.length < 2) return null;
    return {
      first: clientPhotos[clientPhotos.length - 1],
      latest: clientPhotos[0]
    };
  };

  const comparison = getWeekComparison();

  if (!selectedClient) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">Client Progress Photos</h2>
          <p className="text-emerald-100">View and track all client transformations</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Select a Client</h3>
          {clients.length === 0 ? (
            <p className="text-gray-600">No clients yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className="p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 transition text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{client.name}</div>
                      <div className="text-sm text-gray-600">{client.email}</div>
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

  return (
    <div className="space-y-6">
      <button
        onClick={() => {
          setSelectedClient(null);
          setClientPhotos([]);
        }}
        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
      >
        ← Back to Clients
      </button>

      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">{selectedClient.name}'s Progress</h2>
        <p className="text-emerald-100">{clientPhotos.length} photos uploaded</p>
      </div>

      {comparison && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Progress Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Week 1</div>
              <img 
                src={comparison.first.imageUrl} 
                alt="Week 1" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-2">
                {new Date(comparison.first.uploadedAt).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">
                Week {comparison.latest.weekNumber} (Latest)
              </div>
              <img 
                src={comparison.latest.imageUrl} 
                alt="Latest" 
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="text-xs text-gray-500 mt-2">
                {new Date(comparison.latest.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Photos ({clientPhotos.length})</h3>
        {clientPhotos.length === 0 ? (
          <p className="text-gray-600">No photos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {clientPhotos.map((photo) => (
              <div key={photo.id}>
                <img 
                  src={photo.imageUrl} 
                  alt={`Week ${photo.weekNumber}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="text-xs text-gray-600 mt-1">
                  Week {photo.weekNumber}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(photo.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

