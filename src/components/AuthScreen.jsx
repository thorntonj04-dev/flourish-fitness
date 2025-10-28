import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref as dbRef, get, set } from 'firebase/database';
import { auth, db } from '../firebase';

export default function AuthScreen({ onBackToLanding }) {
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
        <button
          onClick={onBackToLanding}
          className="text-emerald-200 hover:text-white mb-4 flex items-center gap-2"
        >
          ← Back to Home
        </button>

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
