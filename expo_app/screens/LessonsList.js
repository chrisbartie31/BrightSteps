import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView, LayoutAnimation, UIManager, Platform, StatusBar } from 'react-native';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { useChild } from '../contexts/ChildContext';
import { Colors } from '../constants/Colors'; 
import { Ionicons } from '@expo/vector-icons';
import InfoModal from '../components/InfoModal';

export default function LessonsList({ navigation }) {
    const [lessons, setLessons] = useState([]);
    const [progressMap, setProgressMap] = useState({}); 
    const [loading, setLoading] = useState(true);
    const { selectedChild } = useChild();
    
    const [infoVisible, setInfoVisible] = useState(false);

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
             const allLessons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
             
             const filteredLessons = allLessons.filter(lesson => {
                 if (!lesson.assignedStudentIds || lesson.assignedStudentIds.length === 0) {
                     return true;
                 }
                 return lesson.assignedStudentIds.includes(childId);
             });

             setLessons(filteredLessons);
             setLoading(false);
        });

        const progressQ = query(collection(db, 'progress'), where('childId', '==', childId));
        const progressUnsub = onSnapshot(progressQ, snap => {
             const newMap = {};
             snap.docs.forEach(d => {
                 const data = d.data();
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
        const itemProgress = progressMap[item.id] || 0; 
        const isCompleted = itemProgress >= 1; 
        const isVideo = item.type === 'video';
        const percentDisplay = Math.round(itemProgress * 100);
        
        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => navigation.navigate('LessonDetail', { lesson: item })}
                activeOpacity={0.9} 
            >
                <View style={styles.cardInner}>
                    <View style={[styles.iconBox, { backgroundColor: isVideo ? Colors.secondary + '15' : Colors.mint + '15' }]}>
                        <Text style={styles.iconText}>{isVideo ? '▶️' : '📄'}</Text>
                    </View>

                    <View style={styles.textContainer}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.tag, { color: isVideo ? Colors.secondary : Colors.mint }]}>
                                {isVideo ? 'WATCH' : 'READ'}
                            </Text>
                            
                            {isCompleted ? (
                                <Text style={styles.checkMark}>✓</Text>
                            ) : itemProgress > 0 ? (
                                <Text style={styles.percentText}>{percentDisplay}%</Text>
                            ) : null}
                        </View>
                        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    </View>
                </View>
                
                <View style={styles.progressWrapper}>
                   <View style={styles.track}>
                      <View style={[
                          styles.fill, 
                          { width: `${Math.min(itemProgress * 100, 100)}%`, backgroundColor: isCompleted ? Colors.success : Colors.primary }
                      ]} />
                   </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.headerContainer}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                    <Text style={styles.dateTitle}>TODAY'S LESSONS</Text>
                    
                    <TouchableOpacity onPress={() => setInfoVisible(true)}>
                        <Ionicons name="information-circle-outline" size={26} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.largeTitle}>Hi, {selectedChild?.name || 'Student'}!</Text>
            </View>

            <FlatList
                data={lessons}
                keyExtractor={i => i.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>✅</Text>
                        <Text style={styles.emptyText}>All caught up!</Text>
                        <Text style={{color: Colors.textSecondary, marginTop:5}}>No lessons assigned yet.</Text>
                    </View>
                }
            />

            {/* REUSABLE MODAL WITH CUSTOM CONTENT */}
            <InfoModal 
                visible={infoVisible} 
                onClose={() => setInfoVisible(false)}
                title="Tracking Progress"
            >
                 {/* Legend Item 1: Videos */}
                <View style={styles.legendRow}>
                    <View style={[styles.iconBoxModal, { backgroundColor: Colors.secondary + '20' }]}>
                    <Text style={{fontSize: 18}}>▶️</Text>
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.legendTitle}>Watch</Text>
                        <Text style={styles.legendDesc}>Video lessons.</Text>
                    </View>
                </View>

                {/* Legend Item 2: Documents */}
                <View style={styles.legendRow}>
                    <View style={[styles.iconBoxModal, { backgroundColor: Colors.mint + '20' }]}>
                    <Text style={{fontSize: 18}}>📄</Text>
                    </View>
                    <View style={{flex: 1}}>
                        <Text style={styles.legendTitle}>Read</Text>
                        <Text style={styles.legendDesc}>Document / Worksheet lessons.</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoBlock}>
                    <Text style={styles.paragraph}>
                        <Text style={{fontWeight:'700'}}>Videos</Text> save your progress automatically as you watch.
                    </Text>
                    <Text style={styles.paragraph}>
                        For <Text style={{fontWeight:'700'}}>Documents</Text>, enter your page number below the file to save your spot!
                    </Text>
                </View>
            </InfoModal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerContainer: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  dateTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 4, letterSpacing: 1 },
  largeTitle: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary },

  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 22, 
    padding: 18,
    marginBottom: 18,
    shadowColor: Colors.primary, 
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardInner: { flexDirection: 'row', marginBottom: 15 },
  
  iconBox: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  iconText: { fontSize: 24 },

  textContainer: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  tag: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  
  checkMark: { color: Colors.success, fontWeight: '900', fontSize: 16 },
  percentText: { color: Colors.primary, fontWeight: '800', fontSize: 14 },

  cardTitle: { fontSize: 19, fontWeight: '800', color: Colors.textPrimary, lineHeight: 24 },

  progressWrapper: { marginTop: 0 },
  track: { height: 10, backgroundColor: Colors.inputBackground, borderRadius: 5 },
  fill: { height: 10, borderRadius: 5 },

  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 60, marginBottom: 10 },
  emptyText: { fontSize: 18, color: Colors.textSecondary, fontWeight: '700' },

  // Styles for Modal Content
  legendRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 12, width: '100%' },
  iconBoxModal: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  legendTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  legendDesc: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, width: '100%', backgroundColor: Colors.inputBackground, marginVertical: 15 },
  infoBlock: { alignSelf: 'flex-start', width: '100%', marginBottom: 10 },
  paragraph: { fontSize: 15, color: Colors.textPrimary, textAlign: 'left', marginBottom: 8, lineHeight: 22 },
});