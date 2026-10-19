// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyBLMO3Rv4VxtR3VUQKcRnVR3nnEvT3GOzU",
  authDomain: "urja-fest.firebaseapp.com",
  projectId: "urja-fest",
  storageBucket: "urja-fest.firebasestorage.app",
  messagingSenderId: "268021063104",
  appId: "1:268021063104:web:1cbfea6d61dfe69e66fc25",
  measurementId: "G-Z3LL6KKZ4K"
};

const personalStorageConfig = {
    storageBucket: "idea-matcher.firebasestorage.app",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Rehearse against the local Firebase emulators instead of the live project:
// NEXT_PUBLIC_FIREBASE_EMULATORS=1 npm run dev (Firestore on 8080, Auth on 9099).
if (process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "1" && typeof window !== "undefined") {
  const win = window as typeof window & { __urjaEmulators?: boolean };
  if (!win.__urjaEmulators) {
    win.__urjaEmulators = true;
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
}

let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialization for Storage from Personal account
const personalApp = getApps().find(app => app.name === 'personal') || initializeApp(personalStorageConfig, 'personal');
export const storage = getStorage(personalApp);