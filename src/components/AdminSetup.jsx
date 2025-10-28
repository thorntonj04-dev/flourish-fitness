import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Trash2, Camera, Shield, BarChart3, Target, Menu, X, ChevronRight, Award, Heart, TrendingUp, Play, Pause, Check, Plus, Minus, Video, Calendar, Clock, Trophy, Save, Edit2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove, update, query as dbQuery, orderByChild, equalTo, onValue } from 'firebase/database';
import { auth, db, storage } from '../firebase.js';
import Tesseract from 'tesseract.js';

export default function AdminSetup({ user }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkUserDocument();
  }, [user]);

  const checkUserDocument = async () => {
    setChecking(true);
    try {
      const userRef = dbRef(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setDebugInfo({
          exists: true,
          data: data,
          hasRole: !!data.role,
          role: data.role || 'NONE'
        });
        console.log('📄 User Data:', data);
      } else {
        setDebugInfo({
          exists: false,
          data: null,
          hasRole: false,
          role: 'NONE'
        });
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setDebugInfo({
        exists: false,
        error: error.message
      });
    } finally {
      setChecking(false);
    }
  };

  const makeUserAdmin = async () => {
    if (!confirm('Make this account an admin? This cannot be easily undone.')) return;
    
    setLoading(true);
    setMessage('');
    
    try {
      const userRef = dbRef(db, `users/${user.uid}`);
      await set(userRef, {
        email: user.email,
        name: user.email.split('@')[0],
        role: 'admin',
        createdAt: new Date().toISOString(),
        macroGoals: { protein: 150, carbs: 200, fats: 50 }
      });
      
      setMessage('✅ Success! Refreshing...');
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error('❌ Error:', error);
      setMessage('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        <div className="text-center mb-6">
          <Shield className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Setup Needed</h2>
          <p className="text-gray-600">Your account needs to be configured with a role.</p>
        </div>

        {checking ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Checking account status...</p>
          </div>
        ) : (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>📧 Email:</strong> {user.email}
              </p>
              {debugInfo && (
                <>
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>📄 Document Exists:</strong> {debugInfo.exists ? '✅ Yes' : '❌ No'}
                  </p>
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>👤 Current Role:</strong> {debugInfo.role}
                  </p>
                </>
              )}
            </div>

            <button
              onClick={makeUserAdmin}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition mb-4"
            >
              {loading ? 'Setting up...' : '👑 Make This Account Admin'}
            </button>

            {message && (
              <div className={`p-3 rounded-lg text-sm text-center mb-4 ${
                message.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <button
              onClick={checkUserDocument}
              disabled={loading}
              className="w-full py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 mb-4"
            >
              🔄 Refresh Status
            </button>
          </>
        )}

        <button
          onClick={() => signOut(auth)}
          className="w-full mt-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
