// expo_app/screens/LessonsList.js (CLEANED)
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useChild } from '../contexts/ChildContext';

export default function LessonsList({ navigation }) {
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(new Set()); 
  const [loading, setLoading] = useState(true);
  const { selectedChild } = useChild();

  const childId = selectedChild?.id;

  useEffect(() => {
    if (!childId) {
      navigation.goBack(); 
      return;
    }

    const lessonsQ = query(collection(db, 'lessons'), orderBy('createdAt','desc'));
    const lessonsUnsub = onSnapshot(lessonsQ, snap => {
      setLessons(snap.docs.map(d=>({ id: d.id, ...d.data() })));
      setLoading(false);
    }, console.error);

    const progressQ = query(collection(db, 'progress'), where('childId', '==', childId));
    const progressUnsub = onSnapshot(progressQ, snap => {
      const completedIds = new Set(snap.docs.map(d => d.data().lessonId));
      setProgress(completedIds);
    }, console.error);

    return () => {
      lessonsUnsub();
      progressUnsub();
    };
  }, [childId]);

  if (loading) return <ActivityIndicator style={{flex:1}} />;
  
  const childName = selectedChild?.name || 'Child';

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lessons for {childName}</Text>
      <FlatList data={lessons} keyExtractor={i=>i.id} renderItem={({item})=>{
        const isCompleted = progress.has(item.id); 
        return (
          <TouchableOpacity 
            style={[styles.card, isCompleted && styles.cardCompleted]}
            onPress={()=> navigation.navigate('LessonDetail', { lesson: item, childId })}
          >
            <View style={styles.cardContent}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.type} • Ages {item.ageRange ? item.ageRange.join('-') : 'All'}</Text>
            </View>
            {isCompleted && <Text style={styles.statusText}>✅ Done</Text>} 
          </TouchableOpacity>
        );
      }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:16},
  header:{fontSize:24, fontWeight:'700', marginBottom:16},
  card:{padding:12, borderWidth:1, borderRadius:8, marginBottom:10, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderColor:'#ccc'},
  cardCompleted: {borderColor: '#28a745', backgroundColor: '#e6ffe6'},
  cardContent: {flex:1},
  title:{fontSize:16, fontWeight:'600'},
  meta:{color:'#555', marginTop:6, fontSize:12},
  statusText: {color:'#28a745', fontWeight:'bold', marginLeft: 10}
});