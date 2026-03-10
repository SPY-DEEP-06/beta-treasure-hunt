import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import { advanceClue, logScan, listenToGpsSettings, updateTeamLocation, listenToEventState, fetchClueFromDb } from '../firebase/db';
import { QrCode, MapPin } from 'lucide-react';
import PuzzleChallenge from '../components/PuzzleChallenge';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function ParticipantPortal() {
  const { currentUser, teamData } = useAuth();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [currentClueData, setCurrentClueData] = useState(null);
  const [fetchingClue, setFetchingClue] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Custom Name Setup State
  const [customName, setCustomName] = useState('');
  const [submittingName, setSubmittingName] = useState(false);

  // GPS Tracking State
  const [gpsRequired, setGpsRequired] = useState(false);
  const [locationAvailable, setLocationAvailable] = useState(false);

  // Global Event State
  const [eventStatus, setEventStatus] = useState('pending');
  const [activePuzzle, setActivePuzzle] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const unsubEvent = listenToEventState((status) => {
      setEventStatus(status);
    });
    return () => unsubEvent();
  }, []);

  // GPS Settings & Tracking Effect
  useEffect(() => {
    if (!currentUser || !teamData) return;

    let watchId;
    let lastUpdate = 0;

    const unsubscribeSettings = listenToGpsSettings((enabled) => {
      setGpsRequired(enabled);

      if (enabled) {
        if ("geolocation" in navigator) {
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              setLocationAvailable(true);
              const now = Date.now();
              // Throttle to 5 seconds
              if (now - lastUpdate > 5000) {
                lastUpdate = now;
                updateTeamLocation(
                  currentUser.uid,
                  teamData.teamName,
                  position.coords.latitude,
                  position.coords.longitude
                );
              }
            },
            (err) => {
              console.error("GPS Error:", err);
              setLocationAvailable(false);
              updateTeamLocation(currentUser.uid, teamData.teamName, 0, 0, true);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          // Browser does not support Geolocation
          setLocationAvailable(false);
        }
      } else {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        setLocationAvailable(true); // Treat as available if not required
      }
    });

    return () => {
      unsubscribeSettings();
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentUser, teamData]);

  if (!currentUser || !teamData) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6">
      <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
      <p className="text-emerald-500 font-mono text-xs tracking-widest animate-pulse">SYNCING WITH DATABASE...</p>
    </div>
  );

  if (teamData._authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-center">
        <h1 className="text-3xl font-black text-red-500 mb-4">INITIALIZATION FAILED</h1>
        <p className="text-red-300 font-mono mb-6 text-sm">{teamData._authError}</p>
        <p className="text-slate-400">The game database could not properly load your team's path. Please ask the Admin to check the Teams index or Firebase rules.</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-red-600 font-bold rounded-xl text-white">Retry Connection</button>
      </div>
    );
  }

  // FORCE CUSTOM TEAM NAME PROMPT (Must be before eventStatus blocks so they can register early!)
  if (!teamData.hasCustomName) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <form className="glass-dark border border-blue-500/30 p-8 rounded-3xl w-full max-w-sm" onSubmit={async (e) => {
          e.preventDefault();
          if (!customName.trim()) return;
          setSubmittingName(true);
          try {
            await updateDoc(doc(db, 'Teams', currentUser.uid), {
              teamName: customName.trim(),
              hasCustomName: true
            });
          } catch (err) {
            console.error(err);
            alert("Failed to update name");
          }
          setSubmittingName(false);
        }}>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 mb-4 text-center">Set Your Team Name</h2>
          <p className="text-slate-400 text-sm mb-6 text-center">Choose a unique squad name to represent your team on the live leaderboard.</p>
          <input
            type="text"
            required
            className="w-full px-4 py-3 bg-black/50 border border-slate-700 rounded-xl text-white mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. The Cryptic Coders"
            maxLength={25}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <button disabled={submittingName} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-xl text-white transition-all shadow-lg shadow-blue-500/20">
            {submittingName ? 'Saving...' : 'Start Adventure'}
          </button>
        </form>
      </div>
    );
  }

  if (eventStatus === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-center">
        <h1 className="text-3xl font-black text-white mb-4 animate-pulse">Event Starting Soon</h1>
        <p className="text-slate-400">Please wait for the organizers to begin the treasure hunt.</p>
      </div>
    );
  }

  if (eventStatus === 'paused') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-center">
        <h1 className="text-3xl font-black text-yellow-400 mb-4">Event Paused</h1>
        <p className="text-slate-400">The game has been temporarily paused by the organizers.</p>
      </div>
    );
  }

  if (eventStatus === 'stopped') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-center">
        <h1 className="text-3xl font-black text-red-500 mb-4">Event Ended</h1>
        <p className="text-slate-400">The treasure hunt is now over. Please check the Leaderboard or return to the Seminar Hall!</p>
        <button
          onClick={() => navigate('/leaderboard')}
          className="mt-6 px-6 py-3 bg-red-600 font-bold rounded-xl text-white shadow-lg shadow-red-500/20"
        >
          View Leaderboard
        </button>
      </div>
    );
  }



  const pathLength = teamData.path ? teamData.path.length : 7;
  const currentClueIndex = teamData.currentClueIndex || 0;

  const isFinished = currentClueIndex >= pathLength;
  const currentTargetId = !isFinished && teamData.path ? teamData.path[currentClueIndex] : null;

  useEffect(() => {
    if (currentTargetId) {
      setFetchingClue(true);
      setFetchError('');
      fetchClueFromDb(currentTargetId).then(data => {
        if (!data) {
          setFetchError("CLUE MISSING FROM DATABASE. PLEASE TELL ADMIN TO CLICK 'UPLOAD CLUE CARDS' ON DASHBOARD.");
        } else {
          setCurrentClueData(data);
        }
        setFetchingClue(false);
      }).catch(err => {
        console.error("Clue Fetch Error:", err);
        setFetchError("DATABASE CONNECTION ERROR: " + err.message);
        setFetchingClue(false);
      });
    }
  }, [currentTargetId]);


  const handleScan = async (scannedText) => {
    setShowScanner(false);
    let scannedId;
    try {
      const parsed = JSON.parse(scannedText);
      scannedId = parsed.locationId;
    } catch {
      scannedId = parseInt(scannedText);
    }

    if (scannedId === currentTargetId) {
      if (scannedId === 25) {
        setActivePuzzle('finalCipherPhase1');
      } else if (currentClueIndex === 2) {
        setActivePuzzle('caesar');
      } else if (currentClueIndex === 4) {
        setActivePuzzle('rsa');
      } else if (currentClueIndex === 5) {
        setActivePuzzle('passcode');
      } else {
        await proceedWithClue(scannedId);
      }
    } else {
      alert("Wrong location! Keep searching.");
      await logScan(currentUser.uid, scannedId, 'failed');
    }
  };

  const proceedWithClue = async (scannedId) => {
    alert("Location found! Proceeding to next clue.");
    await advanceClue(currentUser.uid, currentClueIndex, currentTargetId);
    await logScan(currentUser.uid, scannedId, 'success');
    setActivePuzzle(null);
  };

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-center">
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500 mb-4 animate-bounce">
          CONGRATULATIONS!
        </h1>
        <p className="text-xl text-slate-300">You have completed all clues and reached the Seminar Hall!</p>
        <p className="mt-8 text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 rounded-xl">
          Head to the Admin desk to record your final time.
        </p>
      </div>
    );
  }

  if (gpsRequired && !locationAvailable) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-center">
        <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <MapPin size={32} />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Location Required</h1>
        <p className="text-slate-400 mb-6">
          Location access is required to participate in the treasure hunt. Please allow GPS permission in your browser to continue.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 font-bold rounded-xl text-white shadow-lg shadow-red-500/20"
        >
          I've granted permission (Reload)
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center max-w-md mx-auto relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-96 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full transform -translate-y-1/2"></div>

      <header className="w-full flex justify-between items-center py-4 mb-6 z-10">
        <h1 className="text-2xl font-black tracking-tight text-white">
          Beta<span className="text-blue-500">Hunt</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold px-3 py-1.5 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
            {currentClueIndex} / {pathLength}
          </div>
          <div className="text-sm font-bold px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-500/20">
            {teamData.teamName || 'Team'}
          </div>
        </div>
      </header>

      <main className="w-full flex-1 flex flex-col items-center justify-center z-10 w-full">
        {fetchError ? (
          <div className="w-full bg-red-900/50 border border-red-500 p-8 rounded-3xl text-center">
            <h2 className="text-xl font-black text-red-500 mb-2">CRITICAL SYSTEM FAILURE</h2>
            <p className="text-red-300 text-sm font-mono">{fetchError}</p>
          </div>
        ) : fetchingClue || !currentClueData ? (
          <div className="w-full glass p-8 rounded-3xl text-center">
            <h2 className="text-xl font-mono text-emerald-400 animate-pulse">DECRYPTING CLUE...</h2>
          </div>
        ) : (
          <div className="w-full space-y-6">
            <div className="bg-black/80 border border-emerald-500/50 p-6 rounded-md relative overflow-hidden font-mono shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-green-400 to-emerald-600"></div>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest">SYSTEM ALERT</h2>
              </div>

              <h3 className="text-lg font-bold text-emerald-400 mb-4 border-b border-emerald-500/30 pb-2">
                {currentClueData.title || `NODE ${currentClueData.clueId}`}
              </h3>

              <div className="text-white text-sm mb-6 whitespace-pre-line leading-relaxed border-l-2 border-emerald-500/30 pl-4 py-2 bg-emerald-900/10">
                {currentClueData.description}
              </div>

              <div className="text-xs text-emerald-500/70 mb-6 uppercase tracking-wider">
                NODE LOCATION DETECTED
              </div>

              <button
                onClick={() => setShowScanner(true)}
                className="w-full py-4 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500 text-emerald-400 font-bold rounded-sm flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-500/10 relative overflow-hidden group"
              >
                <div className="absolute inset-0 w-0 bg-emerald-500 transition-all duration-300 ease-out group-hover:w-full opacity-10"></div>
                <QrCode size={20} className="relative z-10" />
                <span className="relative z-10 font-mono tracking-widest">INITIATE SCAN</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      {activePuzzle && <PuzzleChallenge
        puzzleType={activePuzzle}
        onSolve={() => {
          if (activePuzzle === 'finalCipherPhase1') {
            setActivePuzzle('finalCipherPhase2');
          } else {
            proceedWithClue(currentTargetId);
          }
        }}
      />}
    </div>
  );
}
