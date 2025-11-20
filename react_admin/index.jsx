// react_admin/index.jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

function AdminApp() {
  const [title, setTitle] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  function onFileChange(e) {
    setFile(e.target.files[0]);
  }

  async function upload() {
    if (!title.trim()) return alert('Add title');
    if (!file) return alert('Choose file');
    setUploading(true);
    try {
      const sref = ref(storage, `lessons/${Date.now()}_${file.name}`);
      const task = uploadBytesResumable(sref, file);
      await new Promise((res, rej) => {
        task.on('state_changed', null, rej, res);
      });
      const url = await getDownloadURL(sref);
      const ageRange = (ageMin && ageMax) ? [Number(ageMin), Number(ageMax)] : null;
      await addDoc(collection(db, 'lessons'), {
        title: title.trim(),
        fileUrl: url,
        fileStoragePath: sref.fullPath,
        type: file.type.includes('pdf') ? 'pdf' : 'video',
        ageRange,
        createdAt: serverTimestamp()
      });
      alert('Uploaded');
      setTitle('');
      setFile(null);
      setAgeMin(''); setAgeMax('');
    } catch (e) {
      console.error(e);
      alert('Upload failed: ' + e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h1>BrightSteps Admin</h1>
      <div style={{maxWidth:560}}>
        <label>Title</label><br />
        <input value={title} onChange={e=>setTitle(e.target.value)} style={{width:'100%',padding:8,marginBottom:8}}/>
        <label>Age min</label><br/>
        <input value={ageMin} onChange={e=>setAgeMin(e.target.value)} style={{width:120,padding:8,marginRight:8}}/>
        <label>Age max</label><br/>
        <input value={ageMax} onChange={e=>setAgeMax(e.target.value)} style={{width:120,padding:8,marginBottom:8}}/>
        <div><input type="file" onChange={onFileChange} /></div>
        <div style={{height:12}} />
        <button onClick={upload} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload Lesson'}</button>
      </div>
    </div>
  );
}

ReactDOM.render(React.createElement(AdminApp), document.getElementById('root'));
