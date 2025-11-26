import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Platform, Linking, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { storage, db, auth } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Colors } from '../constants/Colors';
import { useChild } from '../contexts/ChildContext'; 
import SafeVideo from '../components/SafeVideo';
import InfoButton from '../components/InfoButton'; // NEW IMPORT

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
  const [saving, setSaving] = useState(false);
  
  const [currentProgress, setCurrentProgress] = useState(0); 
  const [pdfPage, setPdfPage] = useState('');
  const [pdfTotal, setPdfTotal] = useState('');

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

        if (auth.currentUser && childId) {
            const docRef = doc(db, 'progress', `${childId}_${lesson.id}`);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setCurrentProgress(data.progress || 0);
                if (data.pdfPage) setPdfPage(String(data.pdfPage));
                if (data.pdfTotal) setPdfTotal(String(data.pdfTotal));
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
        progress: safeProgress, 
        completed: isFinished, 
        lastUpdated: new Date(),
        ...extraData 
      }, { merge: true });
      
      setCurrentProgress(safeProgress);
    } catch (e) {
      console.error("Save error", e);
    }
  }

  const onPlaybackStatusUpdate = (status) => {
      if (!status.isLoaded) return;
      if (status.isPlaying && status.durationMillis > 0) {
          const percentage = status.positionMillis / status.durationMillis;
          if (Math.abs(percentage - currentProgress) > 0.05) {
              saveProgressToDb(percentage);
          }
      }
  };

  const savePdfPage = () => {
      const curr = parseInt(pdfPage);
      const tot = parseInt(pdfTotal);
      
      if (!curr || !tot || tot === 0) {
          return Alert.alert("Oops", "Please enter valid page numbers.");
      }
      setSaving(true);
      const percentage = curr / tot;
      saveProgressToDb(percentage, { pdfPage: curr, pdfTotal: tot })
        .then(() => {
            setSaving(false);
            Alert.alert("Saved!", `You are ${Math.round(percentage * 100)}% done.`);
        });
  };

  const markDone = () => {
      saveProgressToDb(1.0).then(() => {
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
            
            <View style={styles.pdfTracker}>
                <Text style={styles.trackerLabel}>I am on page</Text>
                <TextInput 
                    style={styles.pageInput} 
                    value={pdfPage} 
                    onChangeText={setPdfPage} 
                    keyboardType="numeric" 
                    placeholder="0"
                />
                <Text style={styles.trackerLabel}>of</Text>
                <TextInput 
                    style={styles.pageInput} 
                    value={pdfTotal} 
                    onChangeText={setPdfTotal} 
                    keyboardType="numeric" 
                    placeholder="50"
                />
                <TouchableOpacity style={styles.savePageBtn} onPress={savePdfPage}>
                    <Text style={styles.savePageText}>{saving ? '...' : 'Save'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
        {lesson?.type === 'video' && fileUrl ? (
          <SafeVideo
            source={{ uri: fileUrl }}
            style={styles.mediaPlayer}
            useNativeControls={true}
            resizeMode="contain"
            onPlaybackStatusUpdate={onPlaybackStatusUpdate} 
          />
        ) : lesson?.type === 'pdf' && fileUrl ? (
          renderPdf()
        ) : (
          <View style={styles.center}>
            <Text style={styles.errorText}>Content unavailable</Text>
          </View>
        )}
      </View>

      <View style={styles.infoSheet}>
        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 10}}>
            <View style={{flex: 1}}>
              <Text style={styles.typeLabel}>{lesson?.type === 'pdf' ? '📖 READING' : '▶️ VIDEO'}</Text>
              
              {/* TITLE + INFO BUTTON */}
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={styles.title} numberOfLines={1}>{lesson?.title}</Text>
                  <InfoButton 
                      title="Saving Progress"
                      message={lesson?.type === 'video' 
                        ? "Video progress saves automatically every few seconds while you watch." 
                        : "Enter your current page number below and tap 'Save' to track your reading."}
                      style={{marginLeft: 8}}
                      color={Colors.textSecondary}
                  />
              </View>
            </View>

            <View style={styles.progressBadge}>
                <Text style={styles.progressText}>{Math.round(currentProgress * 100)}%</Text>
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

  pdfTracker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFF',
      padding: 10,
      borderTopWidth: 1,
      borderColor: '#EEE'
  },
  trackerLabel: { fontSize: 16, fontWeight: '600', marginHorizontal: 5 },
  pageInput: { 
      width: 50, 
      height: 40, 
      borderWidth: 1, 
      borderColor: Colors.secondary, 
      borderRadius: 8, 
      textAlign: 'center',
      fontSize: 18,
      fontWeight: 'bold'
  },
  savePageBtn: {
      marginLeft: 15,
      backgroundColor: Colors.secondary,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 8
  },
  savePageText: { fontWeight: 'bold', color: '#000' },

  infoSheet: {
    backgroundColor: Colors.card,
    padding: 25,
    paddingBottom: 40,
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    elevation: 10
  },
  typeLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary, maxWidth: '80%' }, 

  progressBadge: {
      backgroundColor: Colors.background,
      height: 50,
      width: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.primary
  },
  progressText: { fontWeight: 'bold', color: Colors.primary },

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