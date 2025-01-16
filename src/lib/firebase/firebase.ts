import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Ensure storage bucket is set
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
if (!storageBucket) {
  throw new Error('Firebase Storage bucket is not configured. Please check your environment variables.');
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Set CORS configuration for storage
if (process.env.NODE_ENV === 'development') {
  // Optional: Use storage emulator in development
  // connectStorageEmulator(storage, 'localhost', 9199);
}

// Set persistence to LOCAL to maintain the session
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Error setting auth persistence:", error);
  });

// Log initialization details for debugging
console.log('Firebase initialized:', {
  auth: !!auth,
  db: !!db,
  storage: !!storage,
  storageBucket,
  origin: typeof window !== 'undefined' ? window.location.origin : 'server-side'
});

export { app, auth, db, storage };
