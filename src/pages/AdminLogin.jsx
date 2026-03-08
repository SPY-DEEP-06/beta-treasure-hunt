import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password === 'BETA-TH26') {
      setIsLoggingIn(true);
      setError('');
      try {
        // Log into Firebase as the permanent Admin
        await signInWithEmailAndPassword(auth, 'admin@beta.com', 'BETA-TH26');
        onLogin();
      } catch (err) {
        // If admin account doesn't exist yet, create it instantly
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
           try {
              await createUserWithEmailAndPassword(auth, 'admin@beta.com', 'BETA-TH26');
              onLogin();
           } catch (createErr) {
              setError('Admin Auth Failed: ' + createErr.message);
              setIsLoggingIn(false);
           }
        } else {
           setError('Firebase Error: ' + err.message);
           setIsLoggingIn(false);
        }
      }
    } else {
      setError('Invalid admin password.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 p-4">
      <div className="w-full max-w-sm p-8 glass-dark rounded-2xl text-center shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Admin Access</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter Admin Password"
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-pink-500 outline-none transition-all text-center"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button disabled={isLoggingIn} type="submit" className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-500/25">
            {isLoggingIn ? 'Authenticating...' : 'Verify'}
          </button>
        </form>
      </div>
    </div>
  );
}
