import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Platform, Linking, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { storage, db, auth } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Colors } from '../constants/Colors';
import { useChild } from '../contexts/ChildContext'; 
import SafeVideo from '../components/SafeVideo';
import InfoButton from '../components/InfoButton'; 

const LoadingView = () => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={Colors.primary} />
  </View>
);

export default function LessonDetail({ route, navigation }) {
  const { lesson } = route.params || {};
  const { selectedChild } = useChild(); 
  const childId = selectedChild?.id; 

  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Progress State
  const [currentProgress, setCurrentProgress] = useState(0); 
  
  // Page Tracking State
  const [currentPage, setCurrentPage] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isVideo = lesson?.type === 'video';

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        if (!lesson) return;
        
        let url = lesson.fileUrl;
        if (lesson.fileStoragePath && !url) {
          const sref = ref(storage, lesson.fileStoragePath);
          url = await getDownloadURL(sref);
        }
        
        if (url && url.includes('localhost')) {
             url = url.replace('localhost', '192.168.86.22'); 
        }
        if (mounted) setFileUrl(url);

        // Load saved page numbers from DB
        if (auth.currentUser && childId) {
            const docRef = doc(db, 'progress', `${childId}_${lesson.id}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCurrentProgress(data.progress || 0);
                
                // Pre-fill the inputs if they saved them before
                if (data.pdfPage) setCurrentPage(String(data.pdfPage));
                if (data.pdfTotal) setTotalPages(String(data.pdfTotal));
            }
        }

      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [lesson]);

  async function saveProgressToDb(progressVal, extraData = {}) {
    if (!auth.currentUser || !childId) return;
    
    const safeProgress = Math.min(Math.max(progressVal, 0), 1);
    const isFinished = safeProgress >= 0.95; 

    try {
      const pdoc = doc(db, 'progress', `${childId}_${lesson.id}`);
      
      await setDoc(pdoc, { 
        childId, 
        lessonId: lesson.id,
        parentId: auth.currentUser.uid, 
        progress: safeProgress, 
        completed: isFinished, 
        lastUpdated: new Date(),
        ...extraData // This saves the page numbers
      }, { merge: true });
      
      setCurrentProgress(safeProgress);
    } catch (e) {
      console.error("Save error:", e);
      Alert.alert("Error", "Could not save progress.");
    }
  }

  // --- PDF: CALCULATE PERCENTAGE FROM PAGES ---
  const handleSavePages = async () => {
      const curr = parseInt(currentPage);
      const tot = parseInt(totalPages);

      if (!curr || !tot || tot === 0) {
          Alert.alert("Oops", "Please enter valid page numbers.");
          return;
      }
      if (curr > tot) {
          Alert.alert("Oops", "Current page cannot be higher than total pages.");
          return;
      }

      setIsSaving(true);
      
      // THE MATH: e.g., 5 / 67 = 0.074...
      const calculatedPercent = curr / tot;

      await saveProgressToDb(calculatedPercent, { 
          pdfPage: curr, 
          pdfTotal: tot 
      });
      
      setIsSaving(false);
      Alert.alert("Saved!", `You are ${Math.round(calculatedPercent * 100)}% done.`);
  };

  const onPlaybackStatusUpdate = (status) => {
      if (!status.isLoaded) return;
      if (status.isPlaying && status.durationMillis > 0) {
          const percentage = status.positionMillis / status.durationMillis;
          if (Math.abs(percentage - currentProgress) > 0.05) {
              saveProgressToDb(percentage);
          }
      }
  };

  const markDone = () => {
      // For PDF, if they mark done, we assume they reached the last page
      const extras = !isVideo && totalPages ? { pdfPage: parseInt(totalPages), pdfTotal: parseInt(totalPages) } : {};
      
      saveProgressToDb(1.0, extras).then(() => {
          Alert.alert('🚀 YOU DID IT!', `Awesome job! Lesson Complete!`, [
            { text: 'Back to Lessons', onPress: () => navigation.goBack() }
          ]);
      });
  };

  if (loading) return <LoadingView />;

  const renderPdf = () => {
    return (
        <View style={{flex: 1}}>
            {Platform.OS === 'ios' ? (
                <WebView source={{ uri: fileUrl }} style={{flex: 1}} />
            ) : (
                <View style={styles.center}>
                    <Text style={styles.errorText}>Tap below to open PDF</Text>
                    <TouchableOpacity style={styles.openButton} onPress={() => Linking.openURL(fileUrl)}>
                        <Text style={styles.openButtonText}>Open PDF 📄</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {/* --- PAGE TRACKER UI --- */}
            <View style={styles.trackerContainer}>
                <Text style={styles.trackerLabel}>I am on page</Text>
                
                <TextInput 
                    style={styles.pageInput} 
                    value={currentPage}
                    onChangeText={setCurrentPage}
                    keyboardType="number-pad"
                    placeholder="#"
                    placeholderTextColor={Colors.textSecondary}
                />
                
                <Text style={styles.trackerLabel}>of</Text>
                
                <TextInput 
                    style={styles.pageInput} 
                    value={totalPages}
                    onChangeText={setTotalPages}
                    keyboardType="number-pad"
                    placeholder="#"
                    placeholderTextColor={Colors.textSecondary}
                />

                <TouchableOpacity 
                    style={styles.saveBtn} 
                    onPress={handleSavePages}
                    disabled={isSaving}
                >
                    {isSaving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
        {isVideo && fileUrl ? (
          <SafeVideo
            source={{ uri: fileUrl }}
            style={styles.mediaPlayer}
            useNativeControls={true}
            resizeMode="contain"
            onPlaybackStatusUpdate={onPlaybackStatusUpdate} 
          />
        ) : !isVideo && fileUrl ? (
          renderPdf()
        ) : (
          <View style={styles.center}>
            <Text style={styles.errorText}>Content unavailable</Text>
          </View>
        )}
      </View>

      <View style={styles.infoSheet}>
        <View style={styles.cardInner}>
            <View style={[styles.iconBox, { backgroundColor: isVideo ? Colors.secondary + '15' : Colors.mint + '15' }]}>
                <Text style={styles.iconText}>{isVideo ? '▶️' : '📄'}</Text>
            </View>

            <View style={styles.textContainer}>
                <View style={styles.headerRow}>
                    <Text style={[styles.tag, { color: isVideo ? Colors.secondary : Colors.mint }]}>
                        {isVideo ? 'WATCHING NOW' : 'READING NOW'}
                    </Text>
                    <Text style={styles.percentText}>{Math.round(currentProgress * 100)}% Done</Text>
                </View>
                
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                    <Text style={styles.title} numberOfLines={2}>{lesson?.title}</Text>
                    <InfoButton 
                      title="Saving Progress"
                      message={isVideo 
                        ? "Video progress saves automatically." 
                        : "Enter your page number (e.g. Page 5 of 67) and tap 'Save'. The app will calculate the percentage for you!"}
                      style={{marginLeft: 10}}
                      color={Colors.textSecondary}
                    />
                </View>
            </View>
        </View>

        <TouchableOpacity style={styles.doneButton} onPress={markDone}>
          <Text style={styles.doneButtonText}>⭐ Mark Completed</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  contentArea: { flex: 1 }, 
  mediaPlayer: { width: '100%', height: '100%', backgroundColor: 'black' },
  errorText: { color: Colors.card, marginBottom: 10 },
  openButton: { backgroundColor: Colors.progress, padding: 15, borderRadius: 10 },
  openButtonText: { color: Colors.card, fontWeight: 'bold' },

  // --- NEW TRACKER STYLES ---
  trackerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F9FAFB', // Light gray background
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderTopWidth: 1,
      borderColor: '#EEE'
  },
  trackerLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: Colors.textSecondary,
      marginHorizontal: 8
  },
  pageInput: {
      backgroundColor: '#FFF',
      width: 50,
      height: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#DDD',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '700',
      color: Colors.textPrimary
  },
  saveBtn: {
      marginLeft: 15,
      backgroundColor: Colors.secondary, // Purple/Indigo to stand out
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      minWidth: 70,
      alignItems: 'center'
  },
  saveBtnText: {
      color: '#FFF',
      fontWeight: '700',
      fontSize: 14
  },

  infoSheet: {
    backgroundColor: Colors.card,
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardInner: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  iconBox: {
      width: 56,
      height: 56,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
  },
  iconText: { fontSize: 24 },
  textContainer: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  tag: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  percentText: { color: Colors.primary, fontWeight: '800', fontSize: 14 },
  title: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary, flex: 1 }, 
  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 20, 
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  doneButtonText: { color: Colors.card, fontSize: 18, fontWeight: 'bold' }
});