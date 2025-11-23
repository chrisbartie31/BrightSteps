import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  connectStorageEmulator 
} from 'firebase/storage';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  connectFirestoreEmulator 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut, 
  connectAuthEmulator 
} from 'firebase/auth'; 
import { firebaseConfig } from '../firebaseConfig';

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app); 

// === 🔌 CONNECT TO EMULATORS (Local Development Only) ===
// This ensures the Admin App talks to the same "Local Database" as your Expo App
if (window.location.hostname === "localhost") {
  console.log("👉 Admin App connecting to Local Emulators...");
  try {
    // Note: We use 'localhost' here because the browser is on the same machine
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
  } catch (e) {
    console.log("Emulator connection skipped (already connected):", e.message);
  }
}
// ========================================================

// --- Admin Login Component ---
function AdminAuth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSignIn() {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
            alert('Login Failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f0f0f0', fontFamily: 'sans-serif' }}>
            <h2 style={{ textAlign: 'center', color: '#333' }}>BrightSteps Admin</h2>
            <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>Local Emulator Mode</p>
            
            <input 
                type="email" 
                placeholder="Admin Email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
            />
            <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '10px', marginBottom: '20px', boxSizing: 'border-box' }}
            />
            <button 
                onClick={handleSignIn} 
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                {loading ? 'Logging In...' : 'Sign In'}
            </button>
        </div>
    );
}

// --- Main Content Upload Component ---
function AdminAppContent({ user }) {
    const [title, setTitle] = useState('');
    const [ageMin, setAgeMin] = useState('');
    const [ageMax, setAgeMax] = useState('');
    const [appTarget, setAppTarget] = useState('junior'); 
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0); 

    function onFileChange(e) {
        setFile(e.target.files[0]);
    }

    async function upload() {
        if (!title.trim() || !file) {
            return alert('Please add a title and choose a file.');
        }
        setUploading(true);
        setProgress(0);

        try {
            // 1. Upload File
            const sref = ref(storage, `lessons/${appTarget}/${Date.now()}_${file.name}`); 
            const task = uploadBytesResumable(sref, file);

            await new Promise((res, rej) => {
                task.on('state_changed', 
                    (snapshot) => {
                        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setProgress(p); 
                    }, 
                    rej, 
                    res
                );
            });

            const url = await getDownloadURL(sref);
            const ageRange = (ageMin && ageMax) ? [Number(ageMin), Number(ageMax)] : null;
            
            let lessonType = 'other';
            if (file.type.includes('video')) {
                lessonType = 'video';
            } else if (file.type.includes('pdf')) {
                lessonType = 'pdf';
            }
            
            // 2. Add Firestore Document
            await addDoc(collection(db, 'lessons'), {
                title: title.trim(),
                fileUrl: url,
                fileStoragePath: sref.fullPath,
                type: lessonType, 
                ageRange,
                appTarget: appTarget, 
                createdBy: user.email, 
                createdAt: serverTimestamp()
            });

            alert('Lesson Uploaded Successfully to Emulator!');
            setTitle('');
            setFile(null);
            setAgeMin(''); setAgeMax('');
            setProgress(0);

        } catch (e) {
            console.error(e);
            alert('Upload failed: ' + e.message);
        } finally {
            setUploading(false);
        }
    }

    function handleSignOut() {
        signOut(auth);
    }

    return (
        <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #ccc' }}>
                <h1 style={{ margin: 0, color: '#2c3e50' }}>BrightSteps Manager <span style={{fontSize:'12px', color:'#e67e22'}}>(Emulator Connected)</span></h1>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '15px', fontSize: '14px' }}>Logged in as: <b>{user.email}</b></span>
                    <button 
                        onClick={handleSignOut} 
                        style={{ padding: '8px 15px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
            
            <div style={{ marginTop: '30px', maxWidth: 600, padding: '30px', border: '1px solid #e0e0e0', borderRadius: '12px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginTop: 0 }}>Upload New Lesson</h3>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Target App (Filtering)</label>
                    <select value={appTarget} onChange={e => setAppTarget(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}>
                        <option value="junior">BrightSteps Junior (Ages 5-10)</option>
                        <option value="next">BrightSteps Next (Ages 11-18)</option>
                    </select>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Age Range (Optional)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="number" 
                            placeholder="Min Age" 
                            value={ageMin} 
                            onChange={e => setAgeMin(e.target.value)} 
                            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
                        />
                        <input 
                            type="number" 
                            placeholder="Max Age" 
                            value={ageMax} 
                            onChange={e => setAgeMax(e.target.value)} 
                            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }} 
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Lesson File</label>
                    <input type="file" onChange={onFileChange} />
                </div>
                
                {uploading && (
                    <div style={{ margin: '15px 0' }}>
                        <progress value={progress} max="100" style={{ width: '100%', height: '15px' }} />
                        <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#555' }}>{progress.toFixed(2)}% Uploaded</p>
                    </div>
                )}
                
                <button 
                    onClick={upload} 
                    disabled={uploading}
                    style={{ width: '100%', padding: '15px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                >
                    {uploading ? 'Uploading...' : 'Upload Lesson'}
                </button>
            </div>
        </div>
    );
}

// --- Root App Component ---
function AdminApp() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, u => {
            setUser(u);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>Connecting to Admin Panel...</div>;
    }

    if (!user) {
        return <AdminAuth />;
    }

    return <AdminAppContent user={user} />;
}

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement); 
root.render(React.createElement(AdminApp));