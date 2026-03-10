import { doc, getDoc, updateDoc, setDoc, query, collection, where, getDocs, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from './config';
import { initialRiddles } from '../data/clues';

// Initialize a team's start state if not already set or heal missing/incorrect paths
export const initializeTeamState = async (teamId, teamName) => {
  const teamRef = doc(db, 'Teams', teamId);
  const snap = await getDoc(teamRef);

  const data = snap.exists() ? snap.data() : null;

  // Validate that path is exactly 7 clues long and ends at 13 (Seminar Hall)
  const hasValidPath = data && Array.isArray(data.path) && data.path.length === 7 && data.path[6] === 13;
  const hasRiddleIndex = data && typeof data.initialRiddleIndex === 'number';

  if (!data || !data.teamName || !hasValidPath || !hasRiddleIndex) {
    // Generate a new 7-length path if invalid
    let defaultPath = data?.path || [];
    if (!hasValidPath) {
      const cluePool = [2, 3, 7, 8, 10, 11, 14, 15, 17, 18, 19, 21, 23, 25];
      const shuffledPool = cluePool.sort(() => Math.random() - 0.5);
      defaultPath = [...shuffledPool.slice(0, 6), 13];
    }

    // Generate random riddle if missing
    let randomRiddleIndex = data?.initialRiddleIndex;
    if (!hasRiddleIndex) {
      randomRiddleIndex = Math.floor(Math.random() * initialRiddles.length);
    }

    await setDoc(teamRef, {
      teamName: data?.teamName || teamName,
      currentClueIndex: data?.currentClueIndex || 0,
      path: defaultPath,
      initialRiddleIndex: randomRiddleIndex,
      completedClues: data?.completedClues || [],
      lastActive: data?.lastActive || new Date().toISOString(),
      score: data?.score || 0
    }, { merge: true });
  }
};

// Fetch current team progress
export const getTeamProgress = async (teamId) => {
  const teamRef = doc(db, 'Teams', teamId);
  const snap = await getDoc(teamRef);
  return snap.exists() ? snap.data() : null;
};

// Advance to next clue
export const advanceClue = async (teamId, currentClueIndex, locationIdScanned) => {
  const teamRef = doc(db, 'Teams', teamId);
  await updateDoc(teamRef, {
    currentClueIndex: currentClueIndex + 1,
    completedClues: arrayUnion({
      locationId: locationIdScanned,
      timestamp: new Date().toISOString()
    }),
    lastActive: new Date().toISOString()
  });
};

// Log a QR Scan
export const logScan = async (teamId, locationScanned, result) => {
  const logRef = doc(collection(db, 'ScanLogs'));
  await setDoc(logRef, {
    timestamp: new Date().toISOString(),
    teamId,
    locationScanned,
    result
  });
};

// Admin: Listen to all teams for Leaderboard
export const listenToLeaderboard = (callback) => {
  return onSnapshot(collection(db, 'Teams'), (snapshot) => {
    const teams = [];
    snapshot.forEach(doc => {
      if (doc.data().teamName) {
        teams.push({ id: doc.id, ...doc.data() });
      }
    });

    // Ranking Logic: (1) higher currentClueIndex (2) earlier lastActive timestamp
    teams.sort((a, b) => {
      if (b.currentClueIndex !== a.currentClueIndex) {
        return b.currentClueIndex - a.currentClueIndex;
      }
      return new Date(a.lastActive) - new Date(b.lastActive);
    });

    callback(teams);
  });
};

// GPS Tracking Helpers
export const listenToGpsSettings = (callback) => {
  return onSnapshot(doc(db, 'Settings', 'config'), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().gpsTrackingEnabled || false);
    } else {
      callback(false);
    }
  });
};

export const updateGpsSettings = async (enabled) => {
  const configRef = doc(db, 'Settings', 'config');
  await setDoc(configRef, { gpsTrackingEnabled: enabled }, { merge: true });
};

export const updateTeamLocation = async (teamId, teamName, lat, lng, isOffline = false) => {
  const locRef = doc(db, 'TeamLocations', teamId);
  await setDoc(locRef, {
    teamId,
    teamName,
    lat,
    lng,
    status: isOffline ? 'offline' : 'online',
    timestamp: new Date().toISOString()
  }, { merge: true });
};

export const listenToTeamLocations = (callback) => {
  return onSnapshot(collection(db, 'TeamLocations'), (snapshot) => {
    const locations = [];
    snapshot.forEach(doc => locations.push(doc.data()));
    callback(locations);
  });
};

// Event State Helpers
export const listenToEventState = (callback) => {
  return onSnapshot(doc(db, 'Settings', 'eventState'), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().status || 'pending');
    } else {
      callback('pending');
    }
  });
};

export const updateEventState = async (status) => {
  const stateRef = doc(db, 'Settings', 'eventState');
  await setDoc(stateRef, { status }, { merge: true });
};


