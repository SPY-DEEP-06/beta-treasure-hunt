import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { initializeTeamState } from '../firebase/db';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Login with given email (e.g., Team01@beta-treasure-hunt.com) and password
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    let unsubDoc;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Listen to team progress from Firestore in real-time
        const teamDocRef = doc(db, 'Teams', user.uid);
        unsubDoc = onSnapshot(teamDocRef, async (teamDoc) => {
          if (teamDoc.exists()) {
            const data = teamDoc.data();

            // Critical Auto-Heal: If the active session is a legacy account or lacks the exact 7-clue format, heal it instantly.
            const hasValidPath = data.path && Array.isArray(data.path) && data.path.length === 7 && data.path[6] === 13;
            const hasRiddleIndex = typeof data.initialRiddleIndex === 'number';

            if (!hasValidPath || !hasRiddleIndex) {
              await initializeTeamState(teamDoc.id, data.teamName || `Team_${teamDoc.id.substring(0, 4)}`);
              // The setDoc inside initializeTeamState will immediately trigger this onSnapshot again.
              return;
            }

            setTeamData({ id: teamDoc.id, ...data });
          } else {
            // Document completely missing (corrupted or deleted manually). Recreate it instantly.
            await initializeTeamState(teamDoc.id, `Team_${teamDoc.id.substring(0, 4)}`);
            return;
          }
          setLoading(false); // Only stop loading auth state once we have the DB state checked
        });
      } else {
        setTeamData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const value = {
    currentUser,
    teamData,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
