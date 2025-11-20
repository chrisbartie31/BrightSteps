// expo_app/screens/LessonsList.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function LessonsList({ navigation, route }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const childId = route.params?.childId ?? null;

  useEffect(() => {
    const q = query(collection(db, 'lessons'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q, snap => {
      setLessons(snap.docs.map(d=>({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.error(err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <ActivityIndicator style={{flex:1}} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lessons</Text>
      <FlatList data={lessons} keyExtractor={i=>i.id} renderItem={({item})=>(
        <TouchableOpacity style={styles.card} onPress={()=> navigation.navigate('LessonDetail', { lesson: item, childId })}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.type} • Ages {item.ageRange ? item.ageRange.join('-') : 'All'}</Text>
        </TouchableOpacity>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:16},
  header:{fontSize:20, fontWeight:'700', marginBottom:12},
  card:{padding:12, borderWidth:1, borderRadius:8, marginBottom:10},
  title:{fontSize:16, fontWeight:'600'},
  meta:{color:'#555', marginTop:6}
});
