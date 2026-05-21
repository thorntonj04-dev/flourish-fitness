import React, { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref as dbRef, set } from 'firebase/database';
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

        await set(dbRef(db, `users/${userCredential.user.uid}`), {
          email,
          name,
          role: 'client',
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      {/* Gold Shimmer Button Styles */}
      <style>{`
        .gold-btn {
          position: relative;
          background: linear-gradient(135deg, #B8860B, #FFD700, #D4AF37);
          color: black;
          overflow: hidden;
          transition: all 0.5s ease;
        }
        .gold-btn:hover {
          transform: scale(1.02);
        }
        .gold-btn::before {
          content: "";
          position: absolute;
          top: 0; left: -100%;
          width: 200%; height: 100%;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%);
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          100% { left: 100%; }
        }

        .gold-heading {
          background: linear-gradient(135deg, #B8860B, #FFD700, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: inline-block;
          font-weight: 800;
        }
      `}</style>

      <div className="w-full max-w-md">
        <button
          onClick={onBackToLanding}
          className="text-[#d8e7de] hover:text-[#FFD700] mb-4 flex items-center gap-2 transition"
        >
          ← Back to Home
        </button>

        <div className="text-center mb-8">
          <img
            src="/images/logosmall.png"
            alt="Flourish Fitness"
            className="w-16 h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="gold-heading">Flourish Fitness</span>
          </h1>
          <p className="text-[#d8e7de]">Transform your fitness journey</p>
        </div>

        <div className="bg-[#1E3328]/40 backdrop-blur-lg rounded-2xl p-8 border border-[#C6A45F]/25 shadow-2xl">
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
                className="w-full px-4 py-3 bg-[#0a0a0a]/60 border border-[#C6A45F]/30 rounded-xl text-white placeholder-[#d8e7de]/50 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition"
              />
            )}
            
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 bg-[#0a0a0a]/60 border border-[#C6A45F]/30 rounded-xl text-white placeholder-[#d8e7de]/50 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition"
            />
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAuth();
              }}
              className="w-full px-4 py-3 bg-[#0a0a0a]/60 border border-[#C6A45F]/30 rounded-xl text-white placeholder-[#d8e7de]/50 focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition"
            />

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed gold-btn"
            >
              {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 text-[#d8e7de] hover:text-[#FFD700] transition text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
