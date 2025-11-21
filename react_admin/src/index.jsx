// react_admin/index.jsx (FINAL ADMIN IMPLEMENTATION)

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'; 
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app); 

// --- Admin Login Component ---
function AdminAuth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSignIn() {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged handles the transition to AdminAppContent
        } catch (e) {
            alert('Login Failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 400, margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#f0f0f0' }}>
            <h2>BrightSteps Admin Login</h2>
            <p>Tutor/Content Manager Access Only</p>
            <input 
                type="email" 
                placeholder="Admin Email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc' }}
            />
            <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                style={{ width: '100%', padding: '10px', marginBottom: '20px', border: '1px solid #ccc' }}
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
    const [appTarget, setAppTarget] = useState('junior'); // Default to Junior
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
            const sref = ref(storage, `lessons/${appTarget}/${Date.now()}_${file.name}`); // Use appTarget in path for organization
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
            
            // Better file type detection
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
                appTarget: appTarget, // CRITICAL: Tag content target for filtering
                createdBy: user.email, 
                createdAt: serverTimestamp()
            });

            alert('Lesson Uploaded Successfully!');
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '15px', borderBottom: '1px solid #ccc' }}>
                <h1>BrightSteps Content Manager</h1>
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
            
            <div style={{ marginTop: '20px', maxWidth: 600, padding: '20px', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9' }}>
                <h3>Upload New Lesson</h3>
                
                <label style={{ display: 'block', fontWeight: 'bold', marginTop: '10px' }}>Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 4, border: '1px solid #ccc' }} /><br />

                <label style={{ display: 'block', fontWeight: 'bold', marginTop: '10px' }}>Target App (Filtering)</label>
                <select value={appTarget} onChange={e => setAppTarget(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 8, borderRadius: 4, border: '1px solid #ccc' }}>
                    <option value="junior">BrightSteps Junior (Ages 5-10)</option>
                    <option value="next">BrightSteps Next (Ages 11-18)</option>
                </select><br />

                <label style={{ display: 'block', fontWeight: 'bold', marginTop: '10px' }}>Age Range (Optional)</label>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                    <input 
                        type="number" 
                        placeholder="Min Age" 
                        value={ageMin} 
                        onChange={e => setAgeMin(e.target.value)} 
                        style={{ width: 120, padding: 10, marginRight: 8, borderRadius: 4, border: '1px solid #ccc' }} 
                    />
                    <input 
                        type="number" 
                        placeholder="Max Age" 
                        value={ageMax} 
                        onChange={e => setAgeMax(e.target.value)} 
                        style={{ width: 120, padding: 10, borderRadius: 4, border: '1px solid #ccc' }} 
                    />
                </div>

                <label style={{ display: 'block', fontWeight: 'bold', marginTop: '10px' }}>Lesson File</label>
                <div style={{ marginBottom: '15px' }}>
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
                    style={{ width: '100%', padding: 15, background: '#2ecc71', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {uploading ? 'Uploading...' : 'Upload Lesson'}
                </button>
            </div>
            
            {/* TODO: Implement Lesson List/Edit/Delete here for a full CMS */}
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
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Admin Panel...</div>;
    }

    if (!user) {
        return <AdminAuth />;
    }

    return <AdminAppContent user={user} />;
}

ReactDOM.render(React.createElement(AdminApp), document.getElementById('root'));