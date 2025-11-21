// expo_app/services/firebase.js

// ... imports ...

export function initFirebase(config) {
  if (!app) {
    app = initializeApp(config);

    // ... auth init ...

    db = getFirestore(app);
    storage = getStorage(app);

    if (__DEV__) {
      try {
        // REPLACE '192.168.X.X' WITH YOUR ACTUAL IP FROM STEP 1
        const machineIp = '192.168.86.22'; // <--- CHANGE THIS VALUE

        connectFirestoreEmulator(db, machineIp, 8080);
        // Note: Auth emulator usually requires the full URL with http://
        connectAuthEmulator(auth, `http://${machineIp}:9099`); 
        connectStorageEmulator(storage, machineIp, 9199);
        
        console.log('Connected to local emulators at', machineIp);
      } catch (e) {
        console.log('Emulator connect skipped', e.message);
      }
    }
  }
}

export { auth, db, storage };