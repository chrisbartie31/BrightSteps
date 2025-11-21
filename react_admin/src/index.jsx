// react_admin/src/index.jsx
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from './firebase';

function AdminApp() {
  const [title, setTitle] = useState('');
  const [ageMin, setAgeMin] = useState('');
  const [ageMax, setAgeMax] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleUpload() {
    if (!file || !title) return alert("Please pick a file and title");
    
    setUploading(true);
    try {
      const storageRef = ref(storage, `lessons/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (error) => {
          console.error(error);
          alert("Upload failed! Check console.");
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const type = file.type.includes('pdf') ? 'pdf' : 'video';

          await addDoc(collection(db, 'lessons'), {
            title,
            type,
            fileUrl: downloadURL,
            fileStoragePath: storageRef.fullPath,
            ageRange: [Number(ageMin), Number(ageMax)],
            createdAt: serverTimestamp()
          });

          alert("✅ Lesson Uploaded Successfully!");
          setUploading(false);
          setProgress(0);
          setTitle('');
          setFile(null);
          setAgeMin('');
          setAgeMax('');
        }
      );
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>BrightSteps Tutor 🎓</h1>
          <p style={styles.subtitle}>Upload new lessons for your students</p>
        </div>

        <div style={styles.form}>
          {/* Title Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Lesson Title</label>
            <input 
              style={styles.input}
              placeholder="e.g. Introduction to Counting" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
          </div>
          
          {/* Age Range Inputs */}
          <div style={styles.row}>
            <div style={{...styles.inputGroup, flex: 1}}>
              <label style={styles.label}>Min Age</label>
              <input 
                style={styles.input} 
                placeholder="5" 
                value={ageMin} 
                onChange={e => setAgeMin(e.target.value)} 
                type="number" 
              />
            </div>
            <div style={{...styles.inputGroup, flex: 1}}>
              <label style={styles.label}>Max Age</label>
              <input 
                style={styles.input} 
                placeholder="10" 
                value={ageMax} 
                onChange={e => setAgeMax(e.target.value)} 
                type="number" 
              />
            </div>
          </div>

          {/* Custom File Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Lesson Content (Video or PDF)</label>
            <label htmlFor="file-upload" style={styles.fileDropZone}>
              {file ? (
                <span style={{color: '#2ECC71', fontWeight: 'bold'}}>📄 {file.name}</span>
              ) : (
                <span style={{color: '#7F8C8D'}}>Click to select a file...</span>
              )}
              <input 
                id="file-upload" 
                type="file" 
                onChange={e => setFile(e.target.files[0])} 
                style={{display: 'none'}} 
                accept="video/*,application/pdf"
              />
            </label>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div style={styles.progressBarContainer}>
              <div style={{...styles.progressBarFill, width: `${progress}%`}}></div>
            </div>
          )}

          {/* Submit Button */}
          <button 
            onClick={handleUpload} 
            disabled={uploading}
            style={uploading ? styles.buttonDisabled : styles.button}
          >
            {uploading ? `Uploading... ${Math.round(progress)}%` : '🚀 Upload Lesson'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#F5F7FA',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: '500px',
    padding: '40px',
    borderRadius: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    color: '#4A90E2',
    margin: 0,
    fontSize: '28px',
    fontWeight: '800',
  },
  subtitle: {
    color: '#7F8C8D',
    margin: '8px 0 0 0',
    fontSize: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  row: {
    display: 'flex',
    gap: '15px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#34495E',
  },
  input: {
    padding: '12px 15px',
    fontSize: '16px',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  fileDropZone: {
    border: '2px dashed #E0E0E0',
    borderRadius: '12px',
    padding: '30px',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#FAFAFA',
    transition: 'all 0.2s',
  },
  button: {
    padding: '16px',
    backgroundColor: '#4A90E2',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)',
    transition: 'transform 0.1s',
  },
  buttonDisabled: {
    padding: '16px',
    backgroundColor: '#BDC3C7',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'not-allowed',
  },
  progressBarContainer: {
    height: '8px',
    backgroundColor: '#F0F0F0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    transition: 'width 0.3s ease',
  },
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<AdminApp />);
} else {
  console.error("Failed to find root element");
}