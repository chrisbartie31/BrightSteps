import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getStorage, ref, uploadBytesResumable, getDownloadURL, connectStorageEmulator 
} from 'firebase/storage';
import { 
  getFirestore, collection, addDoc, serverTimestamp, connectFirestoreEmulator,
  query, onSnapshot, getDocs, doc, getDoc
} from 'firebase/firestore';
import { 
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, connectAuthEmulator 
} from 'firebase/auth'; 
import { firebaseConfig } from '../firebaseConfig';

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);
const auth = getAuth(app); 

// === EMULATOR CONNECTION ===
if (window.location.hostname === "localhost") {
  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
  } catch (e) {
    // Ignore
  }
}

// --- Admin Login Component (Premium UI) ---
function AdminAuth() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSignIn(e) {
        e.preventDefault(); 
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
        <div style={authStyles.pageBackground}>
            <div style={authStyles.loginCard}>
                <div style={authStyles.header}>
                    <h1 style={authStyles.title}>BrightSteps</h1>
                    <p style={authStyles.subtitle}>Tutor & Au Pair Portal</p>
                </div>
                
                <form onSubmit={handleSignIn} style={authStyles.form}>
                    <div style={authStyles.inputGroup}>
                        <label style={authStyles.label}>Email Address</label>
                        <input 
                            style={authStyles.input} 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                    
                    <div style={authStyles.inputGroup}>
                        <label style={authStyles.label}>Password</label>
                        <input 
                            style={authStyles.input} 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        style={loading ? {...authStyles.button, opacity: 0.7, cursor: 'not-allowed'} : authStyles.button}
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>
            <div style={authStyles.footer}>
                &copy; {new Date().getFullYear()} BrightSteps Education
            </div>
        </div>
    );
}

// --- TAB 1: UPLOAD LESSON (WITH ASSIGNMENT) ---
function UploadTab({ user, students }) {
    const [title, setTitle] = useState('');
    const [appTarget, setAppTarget] = useState('junior');
    const [file, setFile] = useState(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]); 
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0); 

    const toggleStudent = (id) => {
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(selectedStudentIds.filter(sid => sid !== id));
        } else {
            setSelectedStudentIds([...selectedStudentIds, id]);
        }
    };

    async function upload() {
        if (!title.trim() || !file) return alert('Missing fields');
        
        const assignments = selectedStudentIds.length > 0 ? selectedStudentIds : null;

        setUploading(true);
        try {
            const sref = ref(storage, `lessons/${appTarget}/${Date.now()}_${file.name}`); 
            const task = uploadBytesResumable(sref, file);
            task.on('state_changed', (snap) => setProgress((snap.bytesTransferred / snap.totalBytes) * 100));
            await task;
            const url = await getDownloadURL(sref);
            
            let lessonType = file.type.includes('video') ? 'video' : 'pdf';
            
            await addDoc(collection(db, 'lessons'), {
                title: title.trim(),
                fileUrl: url,
                fileStoragePath: sref.fullPath,
                type: lessonType, 
                appTarget: appTarget, 
                assignedStudentIds: assignments, 
                createdBy: user.email, 
                createdAt: serverTimestamp()
            });
            alert('Uploaded!');
            setTitle(''); setFile(null); setProgress(0); setSelectedStudentIds([]);
        } catch (e) {
            alert(e.message);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div style={styles.card}>
            <h3>Upload Content</h3>
            <label style={styles.label}>Title</label>
            <input style={styles.input} value={title} onChange={e => setTitle(e.target.value)} />
            
            <label style={styles.label}>Target App</label>
            <select style={styles.input} value={appTarget} onChange={e => setAppTarget(e.target.value)}>
                <option value="junior">BrightSteps Junior (Ages 5-10)</option>
                <option value="next">BrightSteps Next (Ages 11-18)</option>
            </select>

            <label style={styles.label}>Assign to Student (Optional - Leave blank for all)</label>
            <div style={styles.checkboxContainer}>
                {students.length === 0 && <p style={{fontSize:12, color:'#999'}}>No students found yet.</p>}
                {students.map(s => (
                    <div key={s.id} style={styles.checkboxItem}>
                        <input 
                            type="checkbox" 
                            checked={selectedStudentIds.includes(s.id)} 
                            onChange={() => toggleStudent(s.id)}
                            style={{marginRight: 10}}
                        />
                        <span>{s.name} <span style={{fontSize:12, color:'#888'}}>({s.parentName || 'Unknown Parent'})</span></span>
                    </div>
                ))}
            </div>

            <label style={styles.label}>File</label>
            <input type="file" onChange={e => setFile(e.target.files[0])} />
            
            {uploading && <progress value={progress} max="100" style={{width:'100%', marginTop:10}}/>}
            
            <button style={{...styles.btn, marginTop: 15}} onClick={upload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Lesson'}
            </button>
        </div>
    );
}

// --- TAB 2: STUDENT LIST (WITH PARENT NAMES) ---
function StudentsTab({ students }) {
    return (
        <div style={styles.card}>
            <h3>Student Roster</h3>
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                    <tr style={{textAlign:'left', borderBottom:'1px solid #ccc'}}>
                        <th style={{padding:10}}>Child Name</th>
                        <th style={{padding:10}}>Parent Name</th>
                        <th style={{padding:10}}>Phone</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => (
                        <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:10, fontWeight:'bold'}}>{s.name}</td>
                            <td style={{padding:10}}>{s.parentName || 'Loading...'}</td>
                            <td style={{padding:10, fontSize:12}}>{s.parentPhone || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {students.length === 0 && <p>No students found.</p>}
        </div>
    );
}

// --- MAIN DATA LOADER ---
function AdminAppContent({ user }) {
    const [activeTab, setActiveTab] = useState('upload');
    const [students, setStudents] = useState([]);

    useEffect(() => {
        async function fetchData() {
            const userSnapshot = await getDocs(collection(db, 'users'));
            const parentMap = {};
            userSnapshot.forEach(doc => {
                const d = doc.data();
                const fullName = d.firstName && d.lastName ? `${d.firstName} ${d.lastName}` : d.email;
                parentMap[doc.id] = { name: fullName, phone: d.phone };
            });

            const q = query(collection(db, 'children'));
            const unsub = onSnapshot(q, (snap) => {
                const list = snap.docs.map(d => {
                    const data = d.data();
                    const parent = parentMap[data.parentId] || {};
                    return { 
                        id: d.id, 
                        ...data,
                        parentName: parent.name, 
                        parentPhone: parent.phone 
                    };
                });
                setStudents(list);
            });
            return unsub;
        }
        fetchData();
    }, []);

    return (
        <div style={{fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: '#f5f5f7', minHeight: '100vh'}}>
            <div style={{background: '#fff', padding: '15px 30px', borderBottom: '1px solid #ddd', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h1 style={{margin:0, fontSize: 20, color:'#1c1c1e'}}>BrightSteps Manager</h1>
                <div>
                    <span style={{marginRight:15, fontSize:14, color:'#888'}}>{user.email}</span>
                    <button onClick={() => signOut(auth)} style={{...styles.btn, background:'#ff3b30', padding:'8px 12px', fontSize:12}}>Log Out</button>
                </div>
            </div>

            <div style={{display:'flex', justifyContent:'center', padding: 20}}>
                <button onClick={() => setActiveTab('upload')} style={activeTab === 'upload' ? styles.tabActive : styles.tab}>Upload</button>
                <button onClick={() => setActiveTab('students')} style={activeTab === 'students' ? styles.tabActive : styles.tab}>Students</button>
            </div>

            <div style={{maxWidth: 800, margin: '0 auto', padding: 20}}>
                {activeTab === 'upload' ? <UploadTab user={user} students={students} /> : <StudentsTab students={students} />}
            </div>
        </div>
    );
}

function AdminApp() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return onAuthStateChanged(auth, u => {
            setUser(u);
            setLoading(false);
        });
    }, []);

    if (loading) return <div>Loading...</div>;
    if (!user) return <AdminAuth />;
    return <AdminAppContent user={user} />;
}

// --- STYLES ---
const styles = {
    container: { display: 'flex', justifyContent: 'center', marginTop: 50, fontFamily: 'sans-serif' },
    card: { background: '#fff', padding: 30, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e5e5ea' },
    input: { display: 'block', width: '100%', padding: 10, marginBottom: 15, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' },
    label: { display:'block', marginBottom: 5, fontWeight:'600', fontSize: 14, color: '#333' },
    btn: { background: '#007AFF', color: '#fff', border: 'none', padding: '12px', borderRadius: 8, cursor: 'pointer', fontWeight: '600' },
    tab: { padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#8e8e93', fontWeight: '600', borderBottom: '2px solid transparent' },
    tabActive: { padding: '10px 20px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#007AFF', fontWeight: '600', borderBottom: '2px solid #007AFF' },
    checkboxContainer: { maxHeight: 200, overflowY: 'auto', border: '1px solid #ddd', padding: 10, borderRadius: 8, marginBottom: 15, background: '#f9f9f9' },
    checkboxItem: { padding: '8px 0', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }
};

// --- AUTH STYLES (PREMIUM LOGIN) ---
const authStyles = {
    pageBackground: {
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    loginCard: {
        background: '#ffffff',
        padding: '40px 50px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05), 0 2px 10px rgba(0,0,0,0.02)',
        width: '100%',
        maxWidth: '400px',
        boxSizing: 'border-box',
    },
    header: { textAlign: 'center', marginBottom: '30px' },
    title: { margin: 0, color: '#111827', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' },
    subtitle: { margin: '5px 0 0', color: '#6B7280', fontSize: '15px', fontWeight: '500' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
    input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '16px', outline: 'none', width: '100%', boxSizing: 'border-box' },
    button: { background: '#007AFF', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' },
    footer: { marginTop: '20px', color: '#6B7280', fontSize: '12px' }
};

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement); 
root.render(React.createElement(AdminApp));