import React, { useState, useEffect } from 'react';
import { createTeams } from '../scripts/generateTeams';
import AdminLogin from './AdminLogin';
import { updateGpsSettings, listenToGpsSettings, updateEventState, listenToEventState } from '../firebase/db';

export default function AdminPortal() {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [eventStatus, setEventStatus] = useState('pending');

  useEffect(() => {
    if (isAuthenticated) {
      const unsubGps = listenToGpsSettings((enabled) => {
        setGpsEnabled(enabled);
      });
      const unsubEvent = listenToEventState((status) => {
        setEventStatus(status);
      });
      return () => {
        unsubGps();
        unsubEvent();
      };
    }
  }, [isAuthenticated]);
  
  const handleGenerateTeams = async () => {
    setLoading(true);
    await createTeams();
    setLoading(false);
    alert('Finished generating teams! Check CSV download.');
  };

  const handleToggleGps = async () => {
    await updateGpsSettings(!gpsEnabled);
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
          <div className="flex space-x-4 mb-6">
            <button 
              onClick={() => updateEventState('active')}
              className={`px-4 py-2 rounded transition-colors ${eventStatus === 'active' ? 'bg-emerald-500 font-bold ring-2 ring-emerald-300' : 'bg-emerald-700 hover:bg-emerald-600'}`}
            >
              Start Event
            </button>
            <button 
              onClick={() => updateEventState('paused')}
              className={`px-4 py-2 rounded transition-colors ${eventStatus === 'paused' ? 'bg-yellow-500 font-bold ring-2 ring-yellow-300' : 'bg-yellow-700 hover:bg-yellow-600'}`}
            >
              Pause
            </button>
            <button 
              onClick={() => updateEventState('stopped')}
              className={`px-4 py-2 rounded transition-colors ${eventStatus === 'stopped' ? 'bg-red-500 font-bold ring-2 ring-red-300' : 'bg-red-700 hover:bg-red-600'}`}
            >
              Stop
            </button>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-lg flex items-center justify-between border border-slate-700">
            <div>
              <p className="font-bold text-slate-200">Live GPS Tracking</p>
              <p className="text-sm text-slate-400">Require participants to share location</p>
            </div>
            <button 
              onClick={handleToggleGps}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${gpsEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${gpsEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
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
