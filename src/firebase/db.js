import { doc, getDoc, updateDoc, setDoc, query, collection, where, getDocs, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from './config';

// Initialize a team's start state if not already set
export const initializeTeamState = async (teamId, teamName) => {
  const teamRef = doc(db, 'Teams', teamId);
  const snap = await getDoc(teamRef);
  
  if (!snap.exists() || !snap.data().teamName) {
    // Determine path randomizer if not set
    const defaultPath = Array.from({length: 23}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    defaultPath.push(24, 25); // 24 and 25 are fixed at the end

    await setDoc(teamRef, {
      teamName: teamName,
      currentClueIndex: 0,
      path: defaultPath,
      completedClues: [],
      lastActive: new Date().toISOString(),
      score: 0
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

