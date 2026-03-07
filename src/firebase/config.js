import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAauOTzBh-9Rg5voe4f3EGuLePUUgZ_Ptw",
  authDomain: "beta-treasure-hunt.firebaseapp.com",
  projectId: "beta-treasure-hunt",
  storageBucket: "beta-treasure-hunt.firebasestorage.app",
  messagingSenderId: "954995744918",
  appId: "1:954995744918:web:fb59ab4ee23138673822b7",
  measurementId: "G-SF5G2GP954"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
