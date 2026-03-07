import React, { useState } from 'react';
import { createTeams } from '../scripts/generateTeams';
import AdminLogin from './AdminLogin';

export default function AdminPortal() {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const handleGenerateTeams = async () => {
    setLoading(true);
    await createTeams();
    setLoading(false);
    alert('Finished generating teams! Check CSV download.');
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="p-8 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-blue-400">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-emerald-400">Event Controls</h2>
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-emerald-600 rounded">Start Event</button>
            <button className="px-4 py-2 bg-yellow-600 rounded">Pause</button>
            <button className="px-4 py-2 bg-red-600 rounded">Stop</button>
          </div>
        </div>
        
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-purple-400">Setup Tools</h2>
          <button 
            onClick={handleGenerateTeams} 
            disabled={loading}
            className="px-4 py-2 bg-purple-600 rounded disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate 45 Teams'}
          </button>
        </div>
      </div>

      <div className="mt-8 glass p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4 text-pink-400">QR Generator Tool</h2>
        <p className="mb-4 text-slate-300">Generate and print QR codes for all 25 locations.</p>
        <button 
          onClick={() => window.open('/qr-print', '_blank')}
          className="px-4 py-2 bg-pink-600 rounded shadow-lg transition hover:bg-pink-500"
        >
          Open QR Print View
        </button>
      </div>
    </div>
  );
}
