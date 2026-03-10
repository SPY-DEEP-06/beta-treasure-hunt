import { doc, getDoc, updateDoc, setDoc, query, collection, where, getDocs, onSnapshot, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from './config';

// Initialize a team's start state if not already set or heal missing/incorrect paths
export const initializeTeamState = async (teamId, teamName) => {
  const teamRef = doc(db, 'Teams', teamId);
  const snap = await getDoc(teamRef);
  
  const data = snap.exists() ? snap.data() : null;
  
  // Validate that path is exactly 7 clues long: 5 random + 24 + 25
  const hasValidPath = data && Array.isArray(data.path) && data.path.length === 7 && data.path[5] === 24 && data.path[6] === 25;
  
  if (!data || !data.teamName || !hasValidPath) {
    // Generate a new 7-length path if invalid
    let defaultPath = data?.path || [];
    if (!hasValidPath) {
      // Clues 1 through 23, excluding 13 (Seminar Hall)
      const cluePool = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
      const shuffledPool = cluePool.sort(() => Math.random() - 0.5);
      defaultPath = [...shuffledPool.slice(0, 5), 24, 25];
    }

    await setDoc(teamRef, {
      teamName: data?.teamName || teamName,
      currentClueIndex: data?.currentClueIndex || 0,
      path: defaultPath,
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

// Clues Management Helpers
export const uploadCluesToDb = async (cluesList) => {
  const batch = writeBatch(db);
  cluesList.forEach((clue) => {
    const clueRef = doc(db, 'Clues', clue.clueId.toString());
    batch.set(clueRef, clue);
  });
  await batch.commit();
};

export const fetchClueFromDb = async (clueId) => {
  const docRef = doc(db, 'Clues', clueId.toString());
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data();
  return null;
};

