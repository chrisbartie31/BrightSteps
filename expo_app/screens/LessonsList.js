// expo_app/screens/LessonsList.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useChild } from '../contexts/ChildContext';
import { Colors } from '../constants/Colors'; 

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

        // 1. Listen to Lessons (Filter for Junior App content)
        const lessonsQ = query(
             collection(db, 'lessons'), 
             where('appTarget', '==', 'junior'), // Filter for Junior content (CRITICAL)
             orderBy('createdAt', 'desc')
        );
        const lessonsUnsub = onSnapshot(lessonsQ, snap => {
             setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
             setLoading(false);
        });

        // 2. Listen to Progress
        const progressQ = query(collection(db, 'progress'), where('childId', '==', childId));
        const progressUnsub = onSnapshot(progressQ, snap => {
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
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );

    const renderItem = ({ item }) => {
        const isCompleted = progress.has(item.id);
        const isVideo = item.type === 'video';
        
        // Use emojis for clear, visual cues
        const icon = isCompleted ? '🎉' : (isVideo ? '📺' : '🖍️');
        
        return (
            <TouchableOpacity 
                style={[styles.card, isCompleted ? styles.cardCompleted : styles.cardDefault]} 
                onPress={() => navigation.navigate('LessonDetail', { lesson: item })} // childId is retrieved via context in LessonDetail
                activeOpacity={0.8}
            >
                <View style={[styles.iconContainer, { backgroundColor: isCompleted ? Colors.primary + '30' : Colors.secondary + '60' }]}>
                    <Text style={styles.iconText}>{icon}</Text>
                </View>
                
                <View style={styles.infoContainer}>
                    <Text style={styles.lessonTitle}>{item.title}</Text>
                    <Text style={styles.lessonMeta}>
                        {isCompleted ? 'Finished!' : isVideo ? 'Watch Lesson' : 'Activity Sheet'}
                    </Text>
                </View>
                
                <View style={styles.statusIndicator}>
                    {isCompleted ? (
                        <Text style={styles.completedCheck}>⭐</Text>
                    ) : (
                        <Text style={styles.arrowIcon}>👉</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.subHeader}>Time to Learn,</Text>
                <Text style={styles.headerTitle}>{selectedChild?.name || 'Student'}</Text>
            </View>

            <FlatList
                data={lessons}
                keyExtractor={i => i.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>😴</Text>
                        <Text style={styles.emptyText}>No Lessons!</Text>
                        <Text style={styles.emptySubText}>Ask a grown-up to check for new content.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    header: { padding: 25, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.background },
    subHeader: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
    headerTitle: { fontSize: 36, fontWeight: '900', color: Colors.textPrimary }, 
    
    listContent: { padding: 16 },

    // Card Styles
    card: {
        borderRadius: 20, 
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 3,
    },
    cardDefault: {
        backgroundColor: Colors.card,
        borderColor: Colors.progress + '40', 
    },
    cardCompleted: {
        backgroundColor: Colors.primary + '10', 
        borderColor: Colors.primary, 
    },

    iconContainer: {
        width: 70, 
        height: 70,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    iconText: { fontSize: 36 }, 

    infoContainer: { flex: 1 },
    
    lessonTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary }, 
    lessonMeta: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' }, 

    statusIndicator: { width: 40, alignItems: 'flex-end' },
    completedCheck: { fontSize: 30 }, 
    arrowIcon: { fontSize: 30, color: Colors.progress }, 

    // Empty State
    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyEmoji: { fontSize: 60, marginBottom: 10 },
    emptyText: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
    emptySubText: { fontSize: 16, color: Colors.textSecondary, marginTop: 8 },
});