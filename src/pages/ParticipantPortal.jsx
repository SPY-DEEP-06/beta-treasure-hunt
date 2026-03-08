import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { eventLocations } from '../data/clues';
import QRScanner from '../components/QRScanner';
import { advanceClue, logScan, listenToGpsSettings, updateTeamLocation, listenToEventState } from '../firebase/db';
import { QrCode, MapPin } from 'lucide-react';
import PuzzleChallenge from '../components/PuzzleChallenge';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function ParticipantPortal() {
  const { currentUser, teamData } = useAuth();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [riddleAnswer, setRiddleAnswer] = useState('');
  const [riddleError, setRiddleError] = useState('');
  const [riddlePassed, setRiddlePassed] = useState(false);
  
  // Custom Name Setup State
  const [customName, setCustomName] = useState('');
  const [submittingName, setSubmittingName] = useState(false);
  
  // GPS Tracking State
  const [gpsRequired, setGpsRequired] = useState(false);
  const [locationAvailable, setLocationAvailable] = useState(false);

  // Global Event State
  const [eventStatus, setEventStatus] = useState('pending');

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
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );

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
          } catch(err) {
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

  // FORCE CUSTOM TEAM NAME PROMPT
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
          } catch(err) {
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

  const pathLength = teamData.path ? teamData.path.length : 25;
  const currentClueIndex = teamData.currentClueIndex || 0;
  
  const isFinished = currentClueIndex >= pathLength;
  const currentTargetId = !isFinished && teamData.path ? teamData.path[currentClueIndex] : null;
  const currentClue = currentTargetId ? eventLocations.find(l => l.id === currentTargetId) : null;

  // We enforce initial riddle only if they haven't advanced past clue 0 AND haven't passed in this session
  // In a robust implementation, 'riddlePassed' would be persisted in Firebase. For brevity, if index > 0, they passed.
  const needsInitialRiddle = currentClueIndex === 0 && !riddlePassed;

  const handleRiddleSubmit = (e) => {
    e.preventDefault();
    if (riddleAnswer.toLowerCase().trim() === 'echo') {
      setRiddlePassed(true);
      setRiddleError('');
    } else {
      setRiddleError('Incorrect answer. Try again!');
    }
  };

  const [activePuzzle, setActivePuzzle] = useState(null);

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
      if (currentClueIndex === 5) {
        setActivePuzzle('caesar');
      } else if (currentClueIndex === 10) {
        setActivePuzzle('rsa');
      } else if (currentClueIndex === 15) {
        setActivePuzzle('frequency');
      } else if (currentClueIndex === 20) {
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
        {needsInitialRiddle ? (
          <div className="w-full glass p-8 rounded-3xl transform transition-all">
            <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6">
              <MapPin size={24} />
            </div>
            <h2 className="text-xl font-bold mb-2">Gate Riddle</h2>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Before your journey begins, prove your wit:<br/><br/>
              <span className="italic text-white">"I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?"</span>
            </p>
            <form onSubmit={handleRiddleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Your Answer"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 outline-none"
                value={riddleAnswer}
                onChange={(e) => setRiddleAnswer(e.target.value)}
              />
              {riddleError && <p className="text-red-400 text-sm">{riddleError}</p>}
              <button className="w-full py-3 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl transition-colors shadow-lg shadow-purple-500/25">
                Unlock Clues
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full space-y-6">
            <div className="glass-dark p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 blur-[50px]"></div>
              <h2 className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">Current Clue</h2>
              <p className="text-2xl font-medium text-white leading-snug mb-8">
                "{currentClue?.clue || 'Loading... Please wait for synchronization.'}"
              </p>
              <button 
                onClick={() => setShowScanner(true)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
              >
                <div className="bg-white/20 p-2 rounded-full">
                  <QrCode size={28} />
                </div>
                <span>Scan QR at Location</span>
              </button>
            </div>
            
            {/* Optional mini challenge trigger could go here */}
          </div>
        )}
      </main>

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      {activePuzzle && <PuzzleChallenge puzzleType={activePuzzle} onSolve={() => proceedWithClue(currentTargetId)} />}
    </div>
  );
}
