// expo_app/screens/LessonsList.js

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView, LayoutAnimation, UIManager, Platform } from 'react-native';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useChild } from '../contexts/ChildContext';
import { Colors } from '../constants/Colors'; 

export default function LessonsList({ navigation }) {
    const [lessons, setLessons] = useState([]);
    // CHANGE: progress is now an object { lessonId: 0.5 } (0 to 1 scale)
    const [progressMap, setProgressMap] = useState({}); 
    const [loading, setLoading] = useState(true);
    const { selectedChild } = useChild();

    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const childId = selectedChild?.id;

    useEffect(() => {
        if (!childId) {
            navigation.goBack();
            return;
        }

        const lessonsQ = query(
             collection(db, 'lessons'), 
             where('appTarget', '==', 'junior'),
             orderBy('createdAt', 'desc')
        );
        const lessonsUnsub = onSnapshot(lessonsQ, snap => {
             setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
             setLoading(false);
        });

        // 2. Listen to Progress
        const progressQ = query(collection(db, 'progress'), where('childId', '==', childId));
        const progressUnsub = onSnapshot(progressQ, snap => {
             const newMap = {};
             snap.docs.forEach(d => {
                 const data = d.data();
                 // Store progress (0 to 1). If 'completed' is true, force 1 (100%)
                 newMap[data.lessonId] = data.completed ? 1 : (data.progress || 0);
             });
             
             setProgressMap(newMap);
             LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
        // Get progress (defaults to 0)
        const itemProgress = progressMap[item.id] || 0; 
        const isCompleted = itemProgress >= 1; // Considered done if 100%
        const isVideo = item.type === 'video';
        
        const icon = isVideo ? '▶️' : '📖';
        
        return (
            <TouchableOpacity 
                style={[styles.card, isCompleted && styles.cardCompleted]} 
                onPress={() => navigation.navigate('LessonDetail', { lesson: item })}
                activeOpacity={0.8}
            >
                {isCompleted && <Text style={styles.completedBanner}>DONE! 🎉</Text>}
                <View style={[styles.iconContainer, { backgroundColor: isVideo ? '#A78BFA' : '#FBBF24' }]}>
                    <Text style={styles.iconText}>{icon}</Text>
                </View>
                
                <View style={styles.infoContainer}>
                    <Text style={styles.lessonTitle}>{item.title}</Text>
                    
                    {/* PROGRESS BAR */}
                    <View style={styles.progressBarContainer}>
                        <View style={[
                            styles.progressBar, 
                            // Convert 0-1 to 0%-100%
                            { width: `${Math.min(itemProgress * 100, 100)}%` } 
                        ]} />
                    </View>
                    
                    <Text style={styles.lessonMeta}>
                        {isCompleted ? 'Great job!' : itemProgress > 0 ? `${Math.round(itemProgress * 100)}% Complete` : 'Tap to start'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Let's Learn, {selectedChild?.name || 'Student'}!</Text>
                <Text style={styles.subHeader}>Pick a lesson to get started</Text>
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
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.secondary + '15' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    header: { paddingHorizontal: 25, paddingVertical: 20, backgroundColor: Colors.card },
    headerTitle: { fontSize: 28, fontWeight: '900', color: Colors.textPrimary, marginBottom: 4 }, 
    subHeader: { fontSize: 16, color: Colors.textSecondary, fontWeight: '500' },
    
    listContent: { padding: 20 },

    // Card Styles
    card: {
        backgroundColor: Colors.card,
        borderRadius: 20, 
        padding: 16,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, 
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 2,
        borderColor: Colors.card,
        overflow: 'hidden',
    },
    cardCompleted: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '0A',
    },
    completedBanner: {
        position: 'absolute',
        top: 12,
        right: -35,
        backgroundColor: Colors.primary,
        color: Colors.card,
        paddingHorizontal: 30,
        paddingVertical: 4,
        fontWeight: 'bold',
        fontSize: 12,
        transform: [{ rotate: '45deg' }],
        elevation: 6,
        zIndex: 1,
    },

    iconContainer: {
        width: 60, 
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconText: { fontSize: 28 }, 

    infoContainer: { flex: 1 },
    
    lessonTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 }, 
    
    // Updated Progress Bar Styles
    progressBarContainer: {
        height: 10,
        backgroundColor: '#E0E0E0', // Darker grey background for better contrast
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressBar: { 
        height: '100%', 
        backgroundColor: Colors.primary,
    },
    lessonMeta: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' }, 

    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyEmoji: { fontSize: 60, marginBottom: 10 },
    emptyText: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
});