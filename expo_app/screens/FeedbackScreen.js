import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList, Linking, BackHandler 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native'; // Required for hardware back button
import { db, auth } from '../services/firebase';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function FeedbackScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('board'); 
  const [feedbackList, setFeedbackList] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  // --- 1. SAFE NAVIGATION LOGIC ---
  const handleBack = () => {
    // Force navigation to ChildSelect if we can't go back
    // This prevents the crash on reload
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'ChildSelect' }],
      });
    }
  };

  // --- 2. INTERCEPT ANDROID HARDWARE BACK BUTTON ---
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack(); // Call our safe function
        return true;  // Prevent default behavior (crash)
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );
  // --------------------------------------------------

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('upvotes', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFeedbackList(list);
    }, (error) => {
        console.error("Feedback listener error:", error);
    });
    return () => unsub();
  }, []);

  const handleVote = async (item) => {
    if (!user) return;
    const ref = doc(db, 'feedback', item.id);
    const hasVoted = item.votedBy?.includes(user.uid);

    try {
      if (hasVoted) {
        await updateDoc(ref, { upvotes: increment(-1), votedBy: arrayRemove(user.uid) });
      } else {
        await updateDoc(ref, { upvotes: increment(1), votedBy: arrayUnion(user.uid) });
      }
    } catch (e) {
      // Silent fail
    }
  };

  async function submitFeedback() {
    if (!text.trim()) return Alert.alert("Empty", "Please write your idea first.");
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        userId: user?.uid,
        email: user?.email,
        message: text.trim(),
        createdAt: new Date(),
        upvotes: 1,
        votedBy: [user?.uid],
        status: 'new'
      });

      const subject = encodeURIComponent("New BrightSteps Feedback");
      const body = encodeURIComponent(`User: ${user?.email}\n\nIdea:\n${text.trim()}`);
      const mailtoUrl = `mailto:chrisbartie31@gmail.com?subject=${subject}&body=${body}`;
      
      Linking.openURL(mailtoUrl).catch(() => null);

      setText('');
      setActiveTab('board');
      Alert.alert("Posted!", "Your idea is now on the board.");
    } catch (e) {
      Alert.alert("Error", "Could not submit.");
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item }) => {
    const hasVoted = item.votedBy?.includes(user?.uid);
    return (
      <View style={styles.card}>
        <TouchableOpacity 
            style={[styles.voteBox, hasVoted && styles.voteBoxActive]} 
            onPress={() => handleVote(item)}
        >
            <Ionicons name="caret-up" size={24} color={hasVoted ? '#FFF' : Colors.textSecondary} />
            <Text style={[styles.voteCount, hasVoted && {color:'#FFF'}]}>{item.upvotes || 0}</Text>
        </TouchableOpacity>
        <View style={styles.contentBox}>
            <Text style={styles.message}>{item.message}</Text>
            <View style={styles.metaRow}>
                <Text style={styles.author}>{item.email?.split('@')[0]}</Text>
                {item.status === 'done' && <Text style={styles.tagDone}>Completed</Text>}
                {item.status === 'planned' && <Text style={styles.tagPlanned}>Planned</Text>}
            </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBack} 
            style={styles.backBtn}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Community Ideas</Text>
          <TouchableOpacity onPress={() => setActiveTab(activeTab === 'board' ? 'submit' : 'board')}>
              <Ionicons name={activeTab === 'board' ? "add-circle" : "list"} size={28} color={Colors.primary} />
          </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
          <TouchableOpacity 
              style={[styles.tab, activeTab === 'board' && styles.tabActive]} 
              onPress={() => setActiveTab('board')}
          >
              <Text style={[styles.tabText, activeTab === 'board' && styles.tabTextActive]}>Top Ideas</Text>
          </TouchableOpacity>
          <TouchableOpacity 
              style={[styles.tab, activeTab === 'submit' && styles.tabActive]} 
              onPress={() => setActiveTab('submit')}
          >
              <Text style={[styles.tabText, activeTab === 'submit' && styles.tabTextActive]}>Submit New</Text>
          </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {activeTab === 'board' ? (
            <FlatList 
                data={feedbackList}
                keyExtractor={i => i.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No ideas yet. Be the first!</Text>
                    </View>
                }
            />
        ) : (
            <View style={styles.formContent}>
                <Text style={styles.label}>What should we build next?</Text>
                <TextInput 
                    style={styles.input}
                    multiline
                    placeholder="I wish the app could..."
                    placeholderTextColor={Colors.textSecondary}
                    value={text}
                    onChangeText={setText}
                    textAlignVertical="top"
                />
                <Text style={styles.note}>
                    Posting this will add it to the public board and open your email app.
                </Text>

                <TouchableOpacity 
                    style={styles.submitBtn} 
                    onPress={submitFeedback} 
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Post & Email Idea</Text>}
                </TouchableOpacity>
            </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  header: { 
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
      paddingHorizontal: 20, paddingVertical: 15, backgroundColor: Colors.background,
      borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  backBtn: { padding: 5 },
  
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, marginBottom: 5 },
  tab: { paddingVertical: 8, marginRight: 25, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  listContent: { padding: 20, paddingBottom: 50 },
  
  card: {
      backgroundColor: Colors.card,
      borderRadius: 16,
      padding: 15,
      marginBottom: 15,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  voteBox: {
      backgroundColor: Colors.background,
      borderRadius: 12,
      width: 50, height: 60,
      justifyContent: 'center', alignItems: 'center',
      marginRight: 15,
      borderWidth: 1, borderColor: 'transparent'
  },
  voteBoxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  voteCount: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },
  
  contentBox: { flex: 1 },
  message: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  author: { fontSize: 12, color: Colors.textSecondary, marginRight: 10 },
  
  tagDone: { fontSize: 10, fontWeight:'700', color: Colors.success, backgroundColor: Colors.success+'20', paddingHorizontal:6, paddingVertical:2, borderRadius:4, overflow: 'hidden' },
  tagPlanned: { fontSize: 10, fontWeight:'700', color: Colors.secondary, backgroundColor: Colors.secondary+'20', paddingHorizontal:6, paddingVertical:2, borderRadius:4, overflow: 'hidden' },

  formContent: { padding: 20 },
  label: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 15 },
  input: {
      backgroundColor: Colors.card, borderRadius: 16, padding: 15, height: 150, fontSize: 16, color: Colors.textPrimary, marginBottom: 15,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  note: { fontSize: 13, color: Colors.textSecondary, marginBottom: 25, lineHeight: 18 },
  submitBtn: {
      backgroundColor: Colors.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
      shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, fontSize: 16 }
});