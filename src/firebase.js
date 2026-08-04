// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Note: Firebase's *web* config values (apiKey, appId, etc.) are not secret —
// they identify your project to Google's servers, and real access control is
// enforced by your Firestore Security Rules (see /firestore.rules), not by
// hiding these values. We still read them from env vars so different
// environments (dev/staging/prod) can point at different Firebase projects
// without touching code.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  // Fail loudly in dev instead of a confusing Firebase "invalid config" error.
  console.error(
    "Firebase config is missing. Did you create a .env file from .env.example?"
  );
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
