import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Users, Image, Apple, LogOut, Trash2, Camera, Shield, BarChart3, Target } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, get, set, push, remove, update, query as dbQuery, orderByChild, equalTo, onValue } from 'firebase/database';
import { auth, db, storage } from './firebase';
import Tesseract from 'tesseract.js';

// ADMIN SETUP COMPONENT
function AdminSetup({ user }) {
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

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !name)) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Check if this is the first user
        const usersRef = dbRef(db, 'users');
        const snapshot = await get(usersRef);
        const isFirstUser = !snapshot.exists();
        
        await set(dbRef(db, `users/${userCredential.user.uid}`), {
          email,
          name,
          role: isFirstUser ? 'admin' : 'client',
          createdAt: new Date().toISOString(),
          macroGoals: { protein: 150, carbs: 200, fats: 50 }
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-green-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Flourish Fitness</h1>
          <p className="text-gray-300">Transform your fitness journey</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>

          <div className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAuth();
              }}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-emerald-200 hover:text-white transition text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// MANAGE CLIENTS
function ManageClients() {
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

// REPORTS
function Reports() {
  const [clients, setClients] = useState([]);
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

// CLIENT GOALS
function MyGoals({ user }) {
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

// NUTRITION LOGGER
function NutritionLogger({ user }) {
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

// ADMIN NUTRITION VIEW
function AdminNutrition() {
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
          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-2"
        >
          ← Back to Clients
        </button>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
          <h2 className="text-2xl font-bold">{selectedClient.name}'s Nutrition</h2>
          <p className="text-emerald-100">{clientLogs.length} days logged</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-900">Macro Goals</h3>
            <button
              onClick={() => setEditingGoals(!editingGoals)}
              className="text-emerald-600 hover:text-emerald-700 text-sm"
            >
              {editingGoals ? 'Cancel' : 'Edit Goals'}
            </button>
          </div>
          
          {editingGoals ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={macroGoals.protein}
                    onChange={(e) => setMacroGoals({...macroGoals, protein: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={macroGoals.carbs}
                    onChange={(e) => setMacroGoals({...macroGoals, carbs: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">Fats (g)</label>
                  <input
                    type="number"
                    value={macroGoals.fats}
                    onChange={(e) => setMacroGoals({...macroGoals, fats: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                <div className="text-sm text-gray-600">Protein Goal</div>
                <div className="text-2xl font-bold text-gray-900">{macroGoals.protein}g</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Carbs Goal</div>
                <div className="text-2xl font-bold text-gray-900">{macroGoals.carbs}g</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Fats Goal</div>
                <div className="text-2xl font-bold text-gray-900">{macroGoals.fats}g</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Daily Timeline</h3>
          {clientLogs.length === 0 ? (
            <p className="text-gray-600">No nutrition logs yet.</p>
          ) : (
            <div className="space-y-3">
              {clientLogs.map(dayLog => (
                <div key={dayLog.date} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-900">
                      {new Date(dayLog.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-600">{dayLog.entries.length} entries</div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Protein:</span>
                      <span className="font-medium text-gray-900 ml-1">{Math.round(dayLog.totals.protein)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Carbs:</span>
                      <span className="font-medium text-gray-900 ml-1">{Math.round(dayLog.totals.carbs)}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fats:</span>
                      <span className="font-medium text-gray-900 ml-1">{Math.round(dayLog.totals.fats)}g</span>
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

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Select a Client</h3>
        {clients.length === 0 ? (
          <p className="text-gray-600">No clients yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map(client => (
              <button
                key={client.id}
                onClick={() => loadClientLogs(client.id, client)}
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

// PHOTO UPLOAD
function PhotoUpload({ user }) {
  const [uploading, setUploading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, [user]);

  const loadPhotos = async () => {
    try {
      const photosRef = dbRef(db, 'progress-photos');
      const snapshot = await get(photosRef);
      
      if (snapshot.exists()) {
        const allPhotos = snapshot.val();
        const photoData = Object.entries(allPhotos)
          .filter(([key, photo]) => photo.userId === user.uid)
          .map(([key, photo]) => ({ id: key, ...photo }))
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setPhotos(photoData);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const fileRef = storageRef(storage, `progress-photos/${user.uid}/${fileName}`);
      
      await uploadBytes(fileRef, selectedFile);
      const downloadURL = await getDownloadURL(fileRef);

      const photosRef = dbRef(db, 'progress-photos');
      const newPhotoRef = push(photosRef);
      await set(newPhotoRef, {
        userId: user.uid,
        userName: user.displayName || user.email,
        imageUrl: downloadURL,
        storagePath: `progress-photos/${user.uid}/${fileName}`,
        uploadedAt: new Date().toISOString(),
        weekNumber: photos.length + 1
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      loadPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      const fileRef = storageRef(storage, photo.storagePath);
      await deleteObject(fileRef);
      await remove(dbRef(db, `progress-photos/${photo.id}`));
      loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo.');
    }
  };

  const getWeekComparison = () => {
    if (photos.length < 2) return null;
    return {
      first: photos[photos.length - 1],
      latest: photos[0]
    };
  };

  const comparison = getWeekComparison();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Progress Photos</h2>
        <p className="text-emerald-100">Track your transformation week by week</p>
      </div>

      {comparison && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Progress</h3>
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
        <h3 className="text-xl font-bold text-gray-900 mb-4">Upload New Photo</h3>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            {previewUrl ? (
              <div className="space-y-4">
                <img src={previewUrl} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <div className="text-gray-600">Click to select a photo</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition"
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">All Your Photos ({photos.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img 
                src={photo.imageUrl} 
                alt={`Week ${photo.weekNumber}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition rounded-lg flex items-center justify-center">
                <button
                  onClick={() => handleDelete(photo)}
                  className="opacity-0 group-hover:opacity-100 bg-red-500 text-white p-2 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Week {photo.weekNumber}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(photo.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ADMIN PHOTOS
function AdminPhotos() {
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

// MAIN APP
export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          const userRef = dbRef(db, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            const role = userData.role || 'admin';
            setUserRole(role);
            setNeedsSetup(false);
          } else {
            await set(userRef, {
              email: firebaseUser.email,
              name: firebaseUser.email.split('@')[0],
              role: 'admin',
              createdAt: new Date().toISOString(),
              macroGoals: { protein: 150, carbs: 200, fats: 50 }
            });
            setUserRole('admin');
            setNeedsSetup(false);
          }
        } catch (error) {
          console.error('ERROR:', error);
          setNeedsSetup(true);
        }
      } else {
        setUser(null);
        setUserRole(null);
        setNeedsSetup(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="w-12 h-12 mx-auto text-emerald-600 animate-pulse mb-4" />
          <div className="text-emerald-600 text-xl font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (needsSetup) {
    return <AdminSetup user={user} />;
  }

  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="text-red-600 text-xl font-bold mb-4">Configuration Error</div>
          <p className="text-gray-600 mb-4">Unable to load user role.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 mr-2"
          >
            Refresh
          </button>
          <button
            onClick={handleSignOut}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const navItems = userRole === 'admin' ? [
    { id: 'dashboard', label: 'Overview', icon: Users },
    { id: 'clients', label: 'Manage Clients', icon: Users },
    { id: 'nutrition', label: 'Client Nutrition', icon: Apple },
    { id: 'photos', label: 'Client Photos', icon: Image },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ] : [
    { id: 'dashboard', label: 'Dashboard', icon: User },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'photos', label: 'My Progress', icon: Image },
    { id: 'goals', label: 'My Goals', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Flourish Fitness</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">{user.email}</div>
              <div className="text-xs text-emerald-600 capitalize font-medium">
                {userRole === 'admin' ? '👑 Admin' : '💪 Client'}
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 hidden md:block">
          <nav className="space-y-2">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    currentView === item.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                  <h2 className="text-2xl font-bold">Welcome back!</h2>
                  <p className="text-emerald-100">Your fitness journey starts here</p>
                </div>
                
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Account Status</div>
                  <div className="text-2xl font-bold text-gray-900 capitalize mb-4">
                    {userRole === 'admin' ? '👑 Admin/Trainer Account' : '💪 Client Account'}
                  </div>
                  <p className="text-gray-600">
                    {userRole === 'admin' 
                      ? 'You have full access to manage clients, track nutrition, and view progress photos.'
                      : 'Track your nutrition, upload progress photos, and stay on top of your fitness goals.'}
                  </p>
                </div>
              </div>
            )}

            {currentView === 'clients' && userRole === 'admin' && <ManageClients />}
            {currentView === 'reports' && userRole === 'admin' && <Reports />}
            {currentView === 'goals' && userRole === 'client' && <MyGoals user={user} />}

            {currentView === 'nutrition' && (
              userRole === 'admin' ? <AdminNutrition /> : <NutritionLogger user={user} />
            )}

            {currentView === 'photos' && (
              userRole === 'admin' ? <AdminPhotos /> : <PhotoUpload user={user} />
            )}
          </div>
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex justify-around">
          {navItems.slice(0, 4).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                  currentView === item.id ? 'text-emerald-500' : 'text-gray-600'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
