// expo_app/screens/LessonsList.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
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

    // 1. Listen to Lessons
    const lessonsQ = query(collection(db, 'lessons'), orderBy('createdAt', 'desc'));
    const lessonsUnsub = onSnapshot(lessonsQ, snap => {
      setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    // 2. Listen to Progress
    const progressQ = query(collection(db, 'progress'), where('childId', '==', childId));
    const progressUnsub = onSnapshot(progressQ, snap => {
      // Create a set of ID's that are marked true
      const completedIds = new Set(snap.docs.filter(d => d.data().completed).map(d => d.data().lessonId));
      setProgress(completedIds);
    });

    return () => {
      lessonsUnsub();
      progressUnsub();
    };
  }, [childId]);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4A90E2" />
    </View>
  );

  const renderItem = ({ item }) => {
    const isCompleted = progress.has(item.id);
    const isVideo = item.type === 'video';
    
    // Dynamic Styles based on status/type
    const cardStyle = isCompleted ? styles.cardCompleted : styles.card;
    const icon = isCompleted ? '✅' : (isVideo ? '📹' : '📄');
    const typeLabel = isVideo ? 'Video Lesson' : 'PDF Worksheet';
    const typeColor = isVideo ? '#4A90E2' : '#F39C12';

    return (
      <TouchableOpacity 
        style={cardStyle} 
        onPress={() => navigation.navigate('LessonDetail', { lesson: item, childId })}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isCompleted ? '#2ECC71' : typeColor }]}>
              <Text style={styles.badgeText}>
                {isCompleted ? 'COMPLETED' : typeLabel.toUpperCase()}
              </Text>
            </View>
            {item.ageRange && (
              <Text style={styles.ageText}>Ages {item.ageRange.join('-')}</Text>
            )}
          </View>
          
          <Text style={styles.lessonTitle}>{item.title}</Text>
        </View>
        
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subHeader}>Welcome back,</Text>
        <Text style={styles.headerTitle}>{selectedChild?.name || 'Student'}</Text>
      </View>

      <FlatList
        data={lessons}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No lessons found.</Text>
            <Text style={styles.emptySubText}>Ask your tutor to upload something!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: 20, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  subHeader: { fontSize: 14, color: '#7F8C8D', fontWeight: '600' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#2C3E50' },

  listContent: { padding: 16 },

  // Card Styles
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardCompleted: {
    backgroundColor: '#F0FFF4', // Very light green
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2ECC71',
  },

  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: { fontSize: 24 },

  infoContainer: { flex: 1 },
  
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  ageText: { marginLeft: 8, color: '#95A5A6', fontSize: 12, fontWeight: '600' },

  lessonTitle: { fontSize: 17, fontWeight: '700', color: '#2C3E50' },
  
  chevron: { fontSize: 24, color: '#BDC3C7', marginLeft: 10, fontWeight: '300' },

  // Empty State
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 10 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#2C3E50' },
  emptySubText: { fontSize: 14, color: '#7F8C8D', marginTop: 4 },
});