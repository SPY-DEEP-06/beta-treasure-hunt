import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { initializeTeamState } from '../firebase/db';
import { teamCredentials } from '../data/teamCredentials';

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

      if (user) {

        // Critical Security Check: Ensure the active session matches our hardcoded approved credentials or the admin.
        const isAdminSession = user.email?.toLowerCase() === 'admin@beta.com';
        const isAuthorizedSession = teamCredentials.some(
          cred => cred.email.toLowerCase() === user.email?.toLowerCase()
        );

        if (!isAuthorizedSession && !isAdminSession) {
          console.warn("Unauthorized cached session detected. Logging out.");
          await signOut(auth);
          setCurrentUser(null);
          setTeamData(null);
          setLoading(false);
          return;
        }

        setCurrentUser(user);

        // Do not initialize a Team profile for the Event Admin
        if (isAdminSession) {
          setTeamData(null);
          setLoading(false);
          return;
        }

        // Listen to team progress from Firestore in real-time
        const teamDocRef = doc(db, 'Teams', user.uid);
        unsubDoc = onSnapshot(teamDocRef, async (teamDoc) => {
          try {
            if (teamDoc.exists()) {
              const data = teamDoc.data();

              // Critical Auto-Heal: If the active session is a legacy account or lacks the exact new 7-clue format, heal it instantly.
              const hasValidPath = data.path && Array.isArray(data.path) && data.path.length === 7 && data.path[5] === 24 && data.path[6] === 25;

              if (!hasValidPath) {
                await initializeTeamState(teamDoc.id, data.teamName || user.email.split('@')[0]);
                // The setDoc inside initializeTeamState will immediately trigger this onSnapshot again.
                return;
              }

              setTeamData({ id: teamDoc.id, ...data });
            } else {
              // Document completely missing (corrupted or deleted manually). Recreate it instantly.
              await initializeTeamState(teamDoc.id, user.email.split('@')[0]);
              return;
            }
          } catch (err) {
            console.error("AuthContext DB Error:", err);
            // By setting teamData to this string, ParticipantPortal can detect the crash.
            setTeamData({ _authError: err.message });
          } finally {
            setLoading(false); // Only stop loading auth state once we have the DB state checked or failed
          }
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
      {loading ? (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent flex items-center justify-center rounded-full animate-spin mb-4"></div>
          <p className="text-blue-400 font-mono text-sm tracking-widest animate-pulse">ESTABLISHING SECURE CONNECTION...</p>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
