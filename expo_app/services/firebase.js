// expo_app/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import Constants from 'expo-constants';
import { firebaseConfig } from './firebaseConfig';

let app, auth, db, storage;

export function initFirebase(config) {
  if (!app) {
    app = initializeApp(config || firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    if (__DEV__) {
      // If you run emulator locally and test on a device, replace 'localhost' with your machine IP
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        connectAuthEmulator(auth, 'http://localhost:9099');
        connectStorageEmulator(storage, 'localhost', 9199);
      } catch (e) {
        // ignore if emulator not running
        console.log('emulator connect skipped', e.message);
      }
    }
  }
}

export { auth, db, storage };
