// expo_app/services/firebase.js (UPDATED)
import { initializeApp } from 'firebase/app';
// UPDATED IMPORTS for modern auth setup
import { getAuth, connectAuthEmulator, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
// NEW: Import AsyncStorage to persist auth state
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; 

let app, auth, db, storage;

export function initFirebase(config) {
  if (!app) {
    app = initializeApp(config);

    // --- NEW/UPDATED AUTH INITIALIZATION ---
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
      });
    } catch (e) {
      // Handle case where initializeAuth might be called multiple times in fast refresh
      console.warn("Firebase Auth already initialized, getting existing instance.");
      auth = getAuth(app);
    }

    db = getFirestore(app);
    storage = getStorage(app);

    if (__DEV__) {
      // If you run emulator locally and test on a device, replace 'localhost' with your machine IP
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectStorageEmulator(storage, 'localhost', 9199);
      } catch (e) {
        console.log('Emulator connect skipped', e.message);
      }
    }
  }
}

export { auth, db, storage };