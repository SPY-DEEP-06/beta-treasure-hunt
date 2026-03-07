import React, { useEffect, useState } from 'react';
import { listenToLeaderboard, listenToGpsSettings } from '../firebase/db';
import LiveCampusMap from '../components/LiveCampusMap';

export default function LeaderboardPortal() {
  const [teams, setTeams] = useState([]);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  useEffect(() => {
    const unsubTeams = listenToLeaderboard((data) => {
      setTeams(data);
    });
    const unsubGps = listenToGpsSettings((enabled) => {
      setGpsEnabled(enabled);
    });
    
    return () => {
      unsubTeams();
      unsubGps();
    };
  }, []);

  return (
    <div className="min-h-screen p-8 text-white bg-slate-900">
      <h1 className="text-4xl font-black text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
        Live Event Tracking
      </h1>
      
      {gpsEnabled && (
        <div className="max-w-4xl mx-auto mb-8">
          <LiveCampusMap teamsData={teams} />
        </div>
      )}

      <div className="max-w-4xl mx-auto glass rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="p-4 font-semibold text-slate-300">Rank</th>
              <th className="p-4 font-semibold text-slate-300">Team Name</th>
              <th className="p-4 font-semibold text-slate-300">Current Clue</th>
              <th className="p-4 font-semibold text-slate-300">Progress</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  {index === 0 && <span className="text-2xl">🥇</span>}
                  {index === 1 && <span className="text-2xl">🥈</span>}
                  {index === 2 && <span className="text-2xl">🥉</span>}
                  {index > 2 && <span className="text-xl font-bold text-slate-400">#{index + 1}</span>}
                </td>
                <td className="p-4 font-bold text-lg">{team.teamName}</td>
                <td className="p-4 text-emerald-400 font-medium">Clue {team.currentClueIndex + 1} / 25</td>
                <td className="p-4">
                  <div className="w-full bg-slate-800 rounded-full h-2.5">
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2.5 rounded-full" style={{ width: `${(team.currentClueIndex / 25) * 100}%` }}></div>
                  </div>
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">Waiting for teams to start...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
