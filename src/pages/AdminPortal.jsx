import React, { useState, useEffect } from 'react';
import { createTeams } from '../scripts/generateTeams';
import AdminLogin from './AdminLogin';
import { updateGpsSettings, listenToGpsSettings, updateEventState, listenToEventState, listenToLeaderboard } from '../firebase/db';
import LiveCampusMap from '../components/LiveCampusMap';

export default function AdminPortal() {
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [eventStatus, setEventStatus] = useState('pending');
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      const unsubGps = listenToGpsSettings((enabled) => {
        setGpsEnabled(enabled);
      });
      const unsubEvent = listenToEventState((status) => {
        setEventStatus(status);
      });
      const unsubTeams = listenToLeaderboard((data) => {
        setTeams(data);
      });
      return () => {
        unsubGps();
        unsubEvent();
        unsubTeams();
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
            className="px-4 py-2 bg-purple-600 rounded disabled:opacity-50 transition hover:bg-purple-500 w-full mb-4 font-bold"
          >
            {loading ? 'Generating...' : 'Generate 45 Teams & Export CSV'}
          </button>
          
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h3 className="font-bold text-pink-400 mb-2">QR Generator Tool</h3>
            <p className="mb-4 text-sm text-slate-400">Print QR codes for all 25 event locations.</p>
            <button 
              onClick={() => window.open('/qr-print', '_blank')}
              className="px-4 py-2 w-full bg-pink-600 rounded transition hover:bg-pink-500 font-bold"
            >
              Open QR Print View
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-xl flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Live Progress Monitor</h2>
          <div className="flex-1 overflow-auto max-h-[400px] border border-slate-700/50 rounded-xl">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-800 sticky top-0">
                <tr>
                  <th className="p-3 border-b border-slate-700 text-blue-400">Rank</th>
                  <th className="p-3 border-b border-slate-700 text-blue-400">Team</th>
                  <th className="p-3 border-b border-slate-700 text-blue-400">Clue</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 && (
                  <tr>
                    <td colSpan="3" className="p-4 text-center text-slate-500">No teams registered yet.</td>
                  </tr>
                )}
                {teams.map((team, index) => (
                  <tr key={team.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-300">#{index + 1}</td>
                    <td className="p-3 font-semibold text-white">{team.teamName}</td>
                    <td className="p-3 text-emerald-400">{team.currentClueIndex} / 25</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-orange-400">Live Campus Map</h2>
          {gpsEnabled ? (
            <div className="rounded-xl overflow-hidden border border-slate-700 h-[400px]">
              <LiveCampusMap teamsData={teams} />
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center border border-slate-700 rounded-xl bg-slate-800/50 text-slate-400 flex-col">
              <p className="mb-2 text-lg">GPS Tracking is disabled.</p>
              <p className="text-sm">Toggle Live GPS Tracking above to view team locations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
