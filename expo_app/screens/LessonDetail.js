// expo_app/screens/LessonDetail.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import SafeVideo from '../components/SafeVideo'; 
import { WebView } from 'react-native-webview';
import { storage, db, auth } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

const LoadingView = () => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color="#4A90E2" />
  </View>
);

export default function LessonDetail({ route, navigation }) {
  const { lesson, childId } = route.params || {};
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchUrl() {
      try {
        if (!lesson) return;
        
        let url = lesson.fileUrl;
        if (lesson.fileStoragePath) {
          const sref = ref(storage, lesson.fileStoragePath);
          url = await getDownloadURL(sref);
        }
        
        if (mounted) setFileUrl(url);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not load file');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchUrl();
    return () => { mounted = false; };
  }, [lesson]);

  async function markDone() {
    if (!auth.currentUser || !childId) return;
    setMarking(true);
    try {
      const pdoc = doc(db, 'progress', `${childId}_${lesson.id}`);
      await setDoc(pdoc, { 
        childId, 
        lessonId: lesson.id, 
        completed: true, 
        completedAt: new Date() 
      }, { merge: true });
      
      Alert.alert('🎉 Great Job!', `You finished '${lesson.title}'!`, [
        { text: 'Back to Lessons', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save progress');
    } finally {
      setMarking(false);
    }
  }

  if (loading) return <LoadingView />;

  // DECISION LOGIC FOR PDF
  const renderPdf = () => {
    if (Platform.OS === 'ios') {
      // iOS renders PDFs natively! No Google Docs needed.
      return (
        <WebView
          source={{ uri: fileUrl }}
          style={styles.webView}
          startInLoadingState={true}
          renderLoading={() => <LoadingView />}
        />
      );
    } else {
      // Android WebViews struggle with local PDFs. 
      // For dev/emulator, it's safer to link out.
      return (
        <View style={styles.center}>
          <Text style={styles.errorText}>Tap below to view PDF</Text>
          <TouchableOpacity 
            style={styles.openButton} 
            onPress={() => Linking.openURL(fileUrl)}
          >
            <Text style={styles.openButtonText}>Open PDF 📄</Text>
          </TouchableOpacity>
        </View>
      );
    }
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
            shouldPlay={false} 
            isLooping={false}
            isMuted={false}
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
        <View>
          <Text style={styles.typeLabel}>{lesson?.type === 'pdf' ? '📄 READ & LEARN' : '📹 WATCH & LEARN'}</Text>
          <Text style={styles.title}>{lesson?.title}</Text>
        </View>

        <TouchableOpacity 
          style={styles.doneButton} 
          onPress={markDone}
          disabled={marking}
        >
          <Text style={styles.doneButtonText}>
            {marking ? 'Saving...' : '✅ Mark as Complete'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  contentArea: { flex: 1, justifyContent: 'center' },
  mediaPlayer: { width: '100%', height: '100%', backgroundColor: 'black' },
  webView: { flex: 1 },
  errorText: { color: 'white', marginBottom: 10 },

  openButton: { backgroundColor: '#34495E', padding: 12, borderRadius: 8 },
  openButtonText: { color: 'white', fontWeight: 'bold' },

  infoSheet: {
    backgroundColor: '#FFF',
    padding: 24,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  typeLabel: { color: '#95A5A6', fontSize: 12, fontWeight: '700', marginBottom: 4, letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#2C3E50', marginBottom: 24 },

  doneButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#2ECC71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  doneButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});