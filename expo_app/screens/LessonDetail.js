// expo_app/screens/LessonDetail.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { Video } from 'expo-av';
import { WebView } from 'react-native-webview';
import { storage } from '../services/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, auth } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function LessonDetail({ route }) {
  const { lesson, childId } = route.params;
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchUrl() {
      try {
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
    // store simple progress doc
    const pdoc = doc(db, 'progress', `${childId}_${lesson.id}`);
    await setDoc(pdoc, { childId, lessonId: lesson.id, completed: true, completedAt: new Date() }, { merge:true });
    Alert.alert('Marked done');
  }

  if (loading) return <ActivityIndicator style={{flex:1}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{lesson.title}</Text>
      {lesson.type === 'video' && fileUrl ? (
        <Video source={{ uri: fileUrl }} style={{ width:'100%', height:220 }} useNativeControls resizeMode="contain" />
      ) : lesson.type === 'pdf' && fileUrl ? (
        <WebView source={{ uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}` }} style={{ flex:1 }} />
      ) : (
        <Text>No preview available</Text>
      )}
      <View style={{height:12}} />
      <Button title="Mark as done" onPress={markDone} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:16},
  title:{fontSize:20, fontWeight:'700', marginBottom:12}
});
