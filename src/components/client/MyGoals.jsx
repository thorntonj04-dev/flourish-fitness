import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Trash2, Camera, Shield, BarChart3, Target, Menu, X, ChevronRight, Award, Heart, TrendingUp, Play, Pause, Check, Plus, Minus, Video, Calendar, Clock, Trophy, Save, Edit2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove, update, query as dbQuery, orderByChild, equalTo, onValue } from 'firebase/database';
import { auth, db, storage } from '../../firebase';
import Tesseract from 'tesseract.js';

export default function MyGoals({ user }) {
  const [macroGoals, setMacroGoals] = useState({ protein: 150, carbs: 200, fats: 50 });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [user]);

  const loadGoals = async () => {
    const userRef = dbRef(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists() && snapshot.val().macroGoals) {
      setMacroGoals(snapshot.val().macroGoals);
    }
  };

  const saveGoals = async () => {
    try {
      await update(dbRef(db, `users/${user.uid}`), {
        macroGoals: macroGoals
      });
      setEditing(false);
      alert('Goals updated!');
    } catch (error) {
      alert('Failed to update goals');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">My Goals</h2>
        <p className="text-emerald-100">Set and track your fitness goals</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Macro Goals</h3>
          <button
            onClick={() => setEditing(!editing)}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            {editing ? 'Cancel' : 'Edit Goals'}
          </button>
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={macroGoals.protein}
                  onChange={(e) => setMacroGoals({...macroGoals, protein: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={macroGoals.carbs}
                  onChange={(e) => setMacroGoals({...macroGoals, carbs: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Fats (g)</label>
                <input
                  type="number"
                  value={macroGoals.fats}
                  onChange={(e) => setMacroGoals({...macroGoals, fats: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <button
              onClick={saveGoals}
              className="w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
            >
              Save Goals
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Protein Goal</div>
              <div className="text-3xl font-bold text-emerald-600">{macroGoals.protein}g</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Carbs Goal</div>
              <div className="text-3xl font-bold text-blue-600">{macroGoals.carbs}g</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Fats Goal</div>
              <div className="text-3xl font-bold text-yellow-600">{macroGoals.fats}g</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Tips for Success</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-1">✓</span>
            <span>Track your meals consistently in the Nutrition section</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-1">✓</span>
            <span>Take progress photos weekly to see your transformation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-500 mt-1">✓</span>
            <span>Adjust your macro goals as you progress with your trainer</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

