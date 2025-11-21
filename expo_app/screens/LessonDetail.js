import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import SafeVideo from '../components/SafeVideo';
import SafeActivityIndicator from '../components/SafeActivityIndicator';
import { WebView } from 'react-native-webview';
import { storage, db, auth } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

export default function LessonDetail({ route }) {
  const { lesson, childId } = route.params || {};
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchUrl() {
      try {
        if (!lesson) {
          if (mounted) {
            Alert.alert('Error', 'Lesson not provided');
            setLoading(false);
          }
          return;
        }
        if (lesson.fileStoragePath) {
          const sref = ref(storage, lesson.fileStoragePath);
          const url = await getDownloadURL(sref);
          if (mounted) setFileUrl(url);
        } else if (lesson.fileUrl) {
          if (mounted) setFileUrl(lesson.fileUrl);
        }
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
    if (!auth.currentUser || !childId) return Alert.alert('Child not selected');
    try {
      const pdoc = doc(db, 'progress', `${childId}_${lesson.id}`);
      await setDoc(pdoc, { childId, lessonId: lesson.id, completed: true, completedAt: new Date() }, { merge: true });
      Alert.alert('Marked done', `Lesson '${lesson.title}' completed for child ${childId}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not mark done');
    }
  }

  if (loading) return <SafeActivityIndicator animating={true} style={{ flex: 1 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{lesson?.title ?? 'Lesson'}</Text>

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
        <WebView
          source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}` }}
          style={styles.webView}
        />
      ) : (
        <Text>No preview available for this lesson type.</Text>
      )}

      <View style={{ height: 12 }} />
      <Text onPress={markDone} accessibilityRole="button" style={styles.markDoneButton}>
        Mark as done
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  mediaPlayer: { width: '100%', height: 220 },
  webView: { flex: 1 },
  markDoneButton: { color: '#007bff', fontWeight: '600', marginTop: 8 }
});
