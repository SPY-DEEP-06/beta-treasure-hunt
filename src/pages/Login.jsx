import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { initializeTeamState } from '../firebase/db';
import { Lock } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);

      let userCredential;
      try {
        // First try to login
        userCredential = await login(email, password);
      } catch (loginError) {
        // If user doesn't exist (invalid-credential groups user-not-found in modern auth)
        // Try to create the account automatically!
        if (loginError.code === 'auth/invalid-credential' || loginError.code === 'auth/user-not-found') {
          try {
            userCredential = await signup(email, password);
            // Initialize team state in db for the FIRST time
            const teamName = email.split('@')[0];
            await initializeTeamState(userCredential.user.uid, teamName);
          } catch (signupError) {
            if (signupError.code === 'auth/email-already-in-use') {
              throw new Error('Incorrect password.');
            }
            throw signupError;
          }
        } else {
          throw loginError;
        }
      }

      navigate('/');
    } catch (err) {
      setError(err.message === 'Incorrect password.' ? 'Incorrect password. Try again.' : `Error: ${err.message || 'Unknown login error'}`);
      console.error("Login Error Details:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-8 glass-dark rounded-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/20 text-blue-400 mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Team Login</h2>
          <p className="mt-2 text-sm text-slate-400">Beta Treasure Hunt</p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/50 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300">Team Email or ID</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 mt-1 text-white bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Team01@beta.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 mt-1 text-white bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 focus:ring-4 focus:ring-blue-500/50 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Enter Event'}
          </button>
        </form>
      </div>
    </div>
  );
}
