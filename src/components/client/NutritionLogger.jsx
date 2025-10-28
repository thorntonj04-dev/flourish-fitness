import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Trash2, Camera, Shield, BarChart3, Target, Menu, X, ChevronRight, Award, Heart, TrendingUp, Play, Pause, Check, Plus, Minus, Video, Calendar, Clock, Trophy, Save, Edit2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove, update, query as dbQuery, orderByChild, equalTo, onValue } from 'firebase/database';
import { auth, db, storage } from '../../firebase';
import Tesseract from 'tesseract.js';

export default function NutritionLogger({ user }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [macroGoals, setMacroGoals] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [todayTotals, setTodayTotals] = useState({ protein: 0, carbs: 0, fats: 0 });

  useEffect(() => {
    loadUserData();
    loadTodayEntries();
  }, [user]);

  const loadUserData = async () => {
    const userRef = dbRef(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists() && snapshot.val().macroGoals) {
      setMacroGoals(snapshot.val().macroGoals);
    }
  };

  const loadTodayEntries = async () => {
    const today = new Date().toISOString().split('T')[0];
    const logsRef = dbRef(db, 'nutrition-logs');
    const snapshot = await get(logsRef);
    
    if (snapshot.exists()) {
      const allLogs = snapshot.val();
      const entries = Object.entries(allLogs)
        .filter(([key, log]) => log.userId === user.uid && log.date === today)
        .map(([key, log]) => ({ id: key, ...log }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setTodayEntries(entries);
      
      const totals = entries.reduce((acc, entry) => ({
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fats: acc.fats + (entry.fats || 0)
      }), { protein: 0, carbs: 0, fats: 0 });
      setTodayTotals(totals);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const extractMacros = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    try {
      const result = await Tesseract.recognize(selectedFile, 'eng');
      const text = result.data.text;
      const protein = extractNumber(text, ['protein', 'pro']);
      const carbs = extractNumber(text, ['carb', 'carbohydrate']);
      const fats = extractNumber(text, ['fat', 'fats']);

      setExtractedData({
        protein: protein || 0,
        carbs: carbs || 0,
        fats: fats || 0,
        rawText: text
      });
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to extract text. Please try again or enter manually.');
    } finally {
      setProcessing(false);
    }
  };

  const extractNumber = (text, keywords) => {
    const lines = text.toLowerCase().split('\n');
    for (const keyword of keywords) {
      for (const line of lines) {
        if (line.includes(keyword)) {
          const numbers = line.match(/\d+(\.\d+)?/g);
          if (numbers && numbers.length > 0) {
            return parseFloat(numbers[0]);
          }
        }
      }
    }
    return 0;
  };

  const handleSaveEntry = async () => {
    if (!extractedData) return;

    try {
      const logsRef = dbRef(db, 'nutrition-logs');
      const newLogRef = push(logsRef);
      await set(newLogRef, {
        userId: user.uid,
        userName: user.email,
        protein: extractedData.protein,
        carbs: extractedData.carbs,
        fats: extractedData.fats,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      setExtractedData(null);
      loadTodayEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry.');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await remove(dbRef(db, `nutrition-logs/${entryId}`));
      loadTodayEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const getProgress = (current, goal) => {
    return goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Nutrition Tracking</h2>
        <p className="text-emerald-100">Track your daily macros and reach your goals</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Progress</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-2">Protein</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(todayTotals.protein)}g</div>
            <div className="text-xs text-gray-500">Goal: {macroGoals.protein}g</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${getProgress(todayTotals.protein, macroGoals.protein)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Carbs</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(todayTotals.carbs)}g</div>
            <div className="text-xs text-gray-500">Goal: {macroGoals.carbs}g</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${getProgress(todayTotals.carbs, macroGoals.carbs)}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-2">Fats</div>
            <div className="text-2xl font-bold text-gray-900">{Math.round(todayTotals.fats)}g</div>
            <div className="text-xs text-gray-500">Goal: {macroGoals.fats}g</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${getProgress(todayTotals.fats, macroGoals.fats)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Log Food Entry</h3>
        
        {!extractedData ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              {previewUrl ? (
                <div className="space-y-4">
                  <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="px-4 py-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                    <button
                      onClick={extractMacros}
                      disabled={processing}
                      className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Extract Macros'}
                    </button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <div className="text-gray-600">Upload nutrition label</div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-3">Extracted Macros</div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={extractedData.protein}
                    onChange={(e) => setExtractedData({...extractedData, protein: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={extractedData.carbs}
                    onChange={(e) => setExtractedData({...extractedData, carbs: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={extractedData.fats}
                    onChange={(e) => setExtractedData({...extractedData, fats: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setExtractedData(null);
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Save Entry
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Today's Entries ({todayEntries.length})</h3>
        {todayEntries.length === 0 ? (
          <p className="text-gray-600">No entries yet today. Log your first meal!</p>
        ) : (
          <div className="space-y-3">
            {todayEntries.map(entry => (
              <div key={entry.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">Protein:</span>
                    <span className="font-medium text-gray-900 ml-1">{Math.round(entry.protein)}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Carbs:</span>
                    <span className="font-medium text-gray-900 ml-1">{Math.round(entry.carbs)}g</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fats:</span>
                    <span className="font-medium text-gray-900 ml-1">{Math.round(entry.fats)}g</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

