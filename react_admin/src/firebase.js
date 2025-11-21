// react_admin/src/firebase.js
import { initializeApp } from 'firebase/app';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
// We don't strictly need Auth for the MVP admin, but good to have
import { getAuth, connectAuthEmulator } from 'firebase/auth'; 

const firebaseConfig = {
  apiKey: "AIzaSyDhw7OHLrXbek8vFOATqhiF-prK6ZjWdvY",
  authDomain: "brightsteps-dev.firebaseapp.com",
  projectId: "brightsteps-dev",
  storageBucket: "brightsteps-dev.firebasestorage.app",
  messagingSenderId: "620619350148",
  appId: "1:620619350148:web:aa14ca2527424ac2a6c2d1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// CONNECT TO EMULATORS (Localhost is fine for web)
if (window.location.hostname === "localhost") {
  console.log("🔥 Connecting to Emulators...");
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectStorageEmulator(storage, 'localhost', 9199);
  connectAuthEmulator(auth, "http://localhost:9099");
}

export { db, storage, auth };