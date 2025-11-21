// expo_app/screens/LessonDetail.js

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
// NOTE: Make sure 'SafeVideo' component is available, or replace with 'Video' from 'expo-av' if using the original setup.
// import { Video } from 'expo-av'; 
import { WebView } from 'react-native-webview';
import { storage, db, auth } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { Colors } from '../constants/Colors';
import { useChild } from '../contexts/ChildContext'; // Get selected child context

const LoadingView = () => (
  <View style={styles.center}>
    <ActivityIndicator size="large" color={Colors.primary} />
  </View>
);

// Assuming SafeVideo is either expo-av's Video or a wrapper around it
const SafeVideo = (props) => {
    // Replace this with the actual Video component import if needed.
    return <View style={props.style}><Text style={{color: '#FFF'}}>Video Player Placeholder</Text></View> 
};


export default function LessonDetail({ route, navigation }) {
  const { lesson } = route.params || {};
  const { selectedChild } = useChild(); 
  const childId = selectedChild?.id; 

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
    if (!auth.currentUser || !childId || marking) return;
    setMarking(true);
    try {
      const pdoc = doc(db, 'progress', `${childId}_${lesson.id}`);
      await setDoc(pdoc, { 
        childId, 
        lessonId: lesson.id, 
        completed: true, 
        completedAt: new Date() 
      }, { merge: true });
      
      Alert.alert('🚀 YOU DID IT!', `Awesome job, ${selectedChild.name}! You finished this lesson!`, [
        { text: 'Next Lesson', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Uh oh!', 'We couldn\'t save your progress. Try again!');
    } finally {
      setMarking(false);
    }
  }

  if (loading) return <LoadingView />;

  // DECISION LOGIC FOR PDF (remains the same)
  const renderPdf = () => {
    if (Platform.OS === 'ios') {
      return (
        <WebView
          source={{ uri: fileUrl }}
          style={styles.webView}
          startInLoadingState={true}
          renderLoading={() => <LoadingView />}
        />
      );
    } else {
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
          <Text style={styles.typeLabel}>{lesson?.type === 'pdf' ? '📖 READING TIME!' : '▶️ VIDEO LESSON'}</Text>
          <Text style={styles.title}>{lesson?.title}</Text>
        </View>

        <TouchableOpacity 
          style={styles.doneButton} 
          onPress={markDone}
          disabled={marking}
        >
          <Text style={styles.doneButtonText}>
            {marking ? 'Saving Progress...' : '⭐ I Finished It!'}
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
  errorText: { color: Colors.card, marginBottom: 10 },

  openButton: { backgroundColor: Colors.progress, padding: 15, borderRadius: 10 },
  openButtonText: { color: Colors.card, fontWeight: 'bold', fontSize: 16 },

  infoSheet: {
    backgroundColor: Colors.card,
    padding: 25,
    paddingBottom: 50,
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
  },
  typeLabel: { color: Colors.textSecondary, fontSize: 14, fontWeight: '800', marginBottom: 6, letterSpacing: 1 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, marginBottom: 28 }, 

  doneButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 22, 
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  doneButtonText: { color: Colors.card, fontSize: 20, fontWeight: 'bold' }
});