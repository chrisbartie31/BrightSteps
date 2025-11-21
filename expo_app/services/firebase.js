import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; 

// 1. DECLARE VARIABLES AT THE TOP LEVEL (This fixes the export error)
let app, auth, db, storage;

export function initFirebase(config) {
  if (!app) {
    app = initializeApp(config);

    // 2. Initialize Auth with Persistence
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
      });
    } catch (e) {
      console.warn("Firebase Auth already initialized, getting existing instance.");
      auth = getAuth(app);
    }

    db = getFirestore(app);
    storage = getStorage(app);

    if (__DEV__) {
      try {
        // 3. YOUR COMPUTER IP ADDRESS
        // Replace this with the IP you found via ipconfig (e.g., 192.168.1.5)
        const machineIp = '192.168.86.22'; 

        connectFirestoreEmulator(db, machineIp, 8080);
        connectAuthEmulator(auth, `http://${machineIp}:9099`); 
        connectStorageEmulator(storage, machineIp, 9199);
        
        console.log('Connected to local emulators at', machineIp);
      } catch (e) {
        console.log('Emulator connect skipped', e.message);
      }
    }
  }
}

// 4. EXPORT THE VARIABLES
export { auth, db, storage };