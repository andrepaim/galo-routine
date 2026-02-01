import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth } from 'firebase/auth';
// @ts-ignore - getReactNativePersistence is available at runtime in RN
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these values with your Firebase project config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'YOUR_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'YOUR_PROJECT.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'YOUR_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? 'YOUR_SENDER_ID',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? 'YOUR_APP_ID',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
