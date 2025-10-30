import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Trash2, Camera, Shield, BarChart3, Target, Menu, X, ChevronRight, Award, Heart, TrendingUp, Play, Pause, Check, Plus, Minus, Video, Calendar, Clock, Trophy, Save, Edit2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove, update, query as dbQuery, orderByChild, equalTo, onValue } from 'firebase/database';
import { auth, db, storage } from '../../firebase';
import Tesseract from 'tesseract.js';

export default function AdminNutrition() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientLogs, setClientLogs] = useState([]);
  const [macroGoals, setMacroGoals] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [editingGoals, setEditingGoals] = useState(false);

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

  const loadClientLogs = async (clientId, clientData) => {
    setSelectedClient(clientData);
    setMacroGoals(clientData.macroGoals || { protein: 150, carbs: 200, fats: 50 });
    
    const logsRef = dbRef(db, 'nutrition-logs');
    const snapshot = await get(logsRef);
    
    if (snapshot.exists()) {
      const allLogs = snapshot.val();
      const logs = Object.entries(allLogs)
        .filter(([key, log]) => log.userId === clientId)
        .map(([key, log]) => ({ id: key, ...log }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const groupedByDate = logs.reduce((acc, log) => {
        if (!acc[log.date]) {
          acc[log.date] = [];
        }
        acc[log.date].push(log);
        return acc;
      }, {});
      
      const dailyTotals = Object.keys(groupedByDate).map(date => ({
        date,
        entries: groupedByDate[date],
        totals: groupedByDate[date].reduce((acc, entry) => ({
          protein: acc.protein + (entry.protein || 0),
          carbs: acc.carbs + (entry.carbs || 0),
          fats: acc.fats + (entry.fats || 0)
        }), { protein: 0, carbs: 0, fats: 0 })
      }));
      
      setClientLogs(dailyTotals);
    }
  };

  const handleSaveGoals = async () => {
    if (!selectedClient) return;
    try {
      await update(dbRef(db, `users/${selectedClient.id}`), {
        macroGoals: macroGoals
      });
      setEditingGoals(false);
      alert('Macro goals updated!');
    } catch (error) {
      console.error('Error updating goals:', error);
      alert('Failed to update goals.');
    }
  };

  if (selectedClient) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedClient(null);
            setClientLogs([]);
          }}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-2"
        >
          ← Back to Clients
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">{selectedClient.name}'s Nutrition</h2>
          <p className="text-emerald-100">{clientLogs.length} days logged</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Macro Goals</h3>
            <button
              onClick={() => setEditingGoals(!editingGoals)}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm"
            >
              {editingGoals ? 'Cancel' : 'Edit Goals'}
            </button>
          </div>
          
          {editingGoals ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={macroGoals.protein}
                    onChange={(e) => setMacroGoals({...macroGoals, protein: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={macroGoals.carbs}
                    onChange={(e) => setMacroGoals({...macroGoals, carbs: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={macroGoals.fats}
                    onChange={(e) => setMacroGoals({...macroGoals, fats: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveGoals}
                className="w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Save Goals
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Protein Goal</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{macroGoals.protein}g</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Carbs Goal</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{macroGoals.carbs}g</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Fats Goal</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{macroGoals.fats}g</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Daily Timeline</h3>
          {clientLogs.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300">No nutrition logs yet.</p>
          ) : (
            <div className="space-y-3">
              {clientLogs.map(dayLog => (
                <div key={dayLog.date} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {new Date(dayLog.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{dayLog.entries.length} entries</div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Protein:</span>
                      <span className="font-medium text-gray-900 dark:text-white ml-1">{Math.round(dayLog.totals.protein)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Carbs:</span>
                      <span className="font-medium text-gray-900 dark:text-white ml-1">{Math.round(dayLog.totals.carbs)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-300">Fats:</span>
                      <span className="font-medium text-gray-900 dark:text-white ml-1">{Math.round(dayLog.totals.fats)}g</span>
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

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Client Nutrition</h2>
        <p className="text-emerald-100">View and manage client macro tracking</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Select a Client</h3>
        {clients.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">No clients yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => loadClientLogs(client.id, client)}
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 dark:hover:border-emerald-400 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{client.email}</div>
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
