import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, signInAnonymously } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize auth with persistence for React Native vs Web
let auth: any;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (e) {
    auth = getAuth(app);
  }
}

export { auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

export const ensureFirebaseAuth = async () => {
  try {
    if (auth && !auth.currentUser) {
      await signInAnonymously(auth);
      console.log('[Firebase Auth] Anonymous session active for Firestore cloud sync');
    }
  } catch (e) {
    console.warn('[Firebase Auth Note]:', e);
  }
};

export default app;
