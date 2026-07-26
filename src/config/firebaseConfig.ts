import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Direct Live Firebase Configuration for project digisewa-ac3c4
const firebaseConfig = {
  apiKey: "AIzaSyCZK4mCFHiBlCyU-7ROICitSes0krqyfLI",
  authDomain: "digisewa-ac3c4.firebaseapp.com",
  projectId: "digisewa-ac3c4",
  storageBucket: "digisewa-ac3c4.firebasestorage.app",
  messagingSenderId: "1064799817380",
  appId: "1:1064799817380:web:c42bb12b1a6f151dc72031",
  measurementId: "G-44P44K88ZQ"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
