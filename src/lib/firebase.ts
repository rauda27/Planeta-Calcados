import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCNRrBVTj4uyjdrH0QNOTqF8hq-gwwuptc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "planetcal4b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "planetcal4b",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "planetcal4b.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "668592245821",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:668592245821:web:f976ed603b6d6dea086e54",
  measurementId: "G-RNH66TQHBE",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let dbInstance: Firestore | null = null;

try {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  dbInstance = getFirestore(app);
} catch (error) {
  console.warn('Firebase initialization error:', error);
}

export const db = dbInstance;
