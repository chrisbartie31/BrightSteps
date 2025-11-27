import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Modal, StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { auth, db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { useChild } from '../contexts/ChildContext';
import { Colors } from '../constants/Colors';
import InfoButton from '../components/InfoButton'; 
import { Ionicons } from '@expo/vector-icons'; 
import InfoModal from '../components/InfoModal'; // Ensure this import matches your file structure

export default function ChildSelect({ navigation }) {
  const [children, setChildren] = useState([]);
  const [newName, setNewName] = useState('');
  const [passwordVerify, setPasswordVerify] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State for the info modal
  const [infoVisible, setInfoVisible] = useState(false);
  
  const { selectChild } = useChild();

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'children'), where('parentId', '==', auth.currentUser.uid));
    const unsub = onSnapshot(q, snap => {
      setChildren(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // --- DELETE CHILD ---
  const deleteChildProfile = (childId, childName) => {
    Alert.alert(
      "Remove Profile?",
      `Are you sure you want to remove ${childName}? All progress for this child will be lost.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'children', childId));
            } catch (e) {
              Alert.alert("Error", e.message);
            }
          }
        }
      ]
    );
  };

  // --- DELETE PARENT ACCOUNT ---
  const deleteParentAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This action is permanent. It will delete your login, all child profiles, and all progress data.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Account", 
          style: "destructive", 
          onPress: performAccountDeletion
        }
      ]
    );
  };

  const performAccountDeletion = async () => {
    setLoading(true);
    const user = auth.currentUser;
    const uid = user.uid;

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', uid));
      children.forEach(child => {
        batch.delete(doc(db, 'children', child.id));
      });
      await batch.commit();
      await deleteUser(user);
    } catch (error) {
      setLoading(false);
      if (error.code === 'auth/requires-recent-login') {
        Alert.alert("Security Check", "Please log out and log back in to delete your account.");
      } else {
        Alert.alert("Error", "Could not delete account.");
      }
    }
  };

  // --- ADD CHILD ---
  async function addChild() {
    if (!newName.trim()) return Alert.alert("Missing Name", "Enter name.");
    if (!passwordVerify) return Alert.alert("Security", "Enter password.");

    setLoading(true);
    const user = auth.currentUser;

    try {
        const credential = EmailAuthProvider.credential(user.email, passwordVerify);
        await reauthenticateWithCredential(user, credential);

        await addDoc(collection(db, 'children'), { 
            name: newName.trim(), 
            parentId: user.uid, 
            createdAt: new Date() 
        });

        setNewName(''); setPasswordVerify(''); setIsAdding(false);
        Alert.alert("Success", "New profile created!");
    } catch (error) {
        Alert.alert("Verification Failed", "Incorrect password.");
    } finally {
        setLoading(false);
    }
  }

  function handleSelectChild(child) {
    selectChild({ id: child.id, name: child.name });
    navigation.navigate('Lessons');
  }

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  const getColor = (name) => {
    const colors = [Colors.primary, Colors.pink, Colors.mint, Colors.orange, Colors.secondary];
    return colors[name.length % colors.length];
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.headerContainer}>
        <View>
            {/* === CHANGED: TEXT LOGO === */}
            <Text style={styles.brandText}>BrightSteps Jr</Text>
            
            <Text style={styles.subHeader}>Welcome,</Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.headerTitle}>Who's playing?</Text>
                
                {/* Trigger for the new Info Modal */}
                <TouchableOpacity onPress={() => setInfoVisible(true)} style={{marginLeft: 10}}>
                    <Ionicons name="information-circle-outline" size={26} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
      </View>

      <FlatList
        data={children}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            onPress={() => handleSelectChild(item)} 
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, { backgroundColor: getColor(item.name) }]}>
              <Text style={styles.avatarText}>{getInitial(item.name)}</Text>
            </View>
            <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
            
            <TouchableOpacity 
                style={styles.trashBtn} 
                onPress={() => deleteChildProfile(item.id, item.name)}
                hitSlop={{top:10, bottom:10, left:10, right:10}}
            >
                <Ionicons name="trash-outline" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
             <Text style={styles.emptyText}>No profiles yet.</Text>
          </View>
        }
        ListFooterComponent={
            <View style={styles.footerContainer}>
                <TouchableOpacity onPress={() => auth.signOut()} style={styles.footerLink}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={deleteParentAccount} style={styles.footerLink}>
                    <Text style={styles.deleteText}>Delete Account</Text>
                </TouchableOpacity>
            </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setIsAdding(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Sibling Modal */}
      <Modal animationType="fade" transparent={true} visible={isAdding} onRequestClose={() => setIsAdding(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Sibling</Text>
            <Text style={styles.modalSubtitle}>Verify it's you to create a new profile.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Child's Name"
              placeholderTextColor={Colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Verify Parent Password"
              placeholderTextColor={Colors.textSecondary}
              value={passwordVerify}
              onChangeText={setPasswordVerify}
              secureTextEntry
            />

            <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setIsAdding(false)}>
                    <Text style={styles.btnTextCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalBtn} onPress={addChild} disabled={loading}>
                    {loading ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.btnTextAdd}>Create</Text>}
                </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Info Modal (Consistent Style) */}
      <InfoModal 
          visible={infoVisible} 
          onClose={() => setInfoVisible(false)} 
          title="Student Profiles"
      >
           <View style={styles.infoRow}>
               <View style={[styles.iconBox, {backgroundColor: Colors.primary + '20'}]}>
                   <Ionicons name="person" size={24} color={Colors.primary}/>
               </View>
               <Text style={styles.infoText}>
                   Tap a card to switch to that student's dashboard.
               </Text>
           </View>
           
           <View style={styles.divider} />

           <View style={styles.infoRow}>
                <View style={[styles.iconBox, {backgroundColor: Colors.primary + '20'}]}>
                   <Ionicons name="add" size={28} color={Colors.primary} />
               </View>
               <Text style={styles.infoText}>
                   Tap the '+' button below to create a new profile for a sibling.
               </Text>
           </View>
      </InfoModal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', 
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: Colors.background,
  },
  
  // NEW BRAND TEXT STYLE
  brandText: {
      fontSize: 24,
      fontWeight: '900',
      color: Colors.primary,
      marginBottom: 8,
      letterSpacing: -0.5,
  },

  subHeader: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },

  listContent: { padding: 20, paddingBottom: 100 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 16, 
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  cardName: { flex: 1, fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  
  trashBtn: { marginRight: 15, padding: 5 },
  chevron: { fontSize: 28, color: '#C7C7CC', fontWeight: '300', marginTop: -2 },

  footerContainer: { marginTop: 30, alignItems: 'center', gap: 15 },
  footerLink: { padding: 10 },
  logoutText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
  deleteText: { fontSize: 14, fontWeight: '500', color: Colors.danger },

  fab: {
    position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabIcon: { fontSize: 32, color: '#FFF', marginTop: -2 },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { width: 300, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 14, padding: 24, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 5, color: Colors.textPrimary },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 15, textAlign: 'center' },
  modalInput: { width: '100%', backgroundColor: Colors.inputBackground, padding: 12, borderRadius: 10, fontSize: 16, marginBottom: 15 },
  modalActions: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginTop: 5 },
  modalBtn: { flex: 1, alignItems: 'center', padding: 10 },
  btnTextCancel: { color: Colors.textSecondary, fontSize: 16, fontWeight: '600' },
  btnTextAdd: { color: Colors.primary, fontSize: 16, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },

  // Info Modal Styles
  infoRow: { flexDirection:'row', alignItems:'center', marginVertical: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  infoText: { flex:1, fontSize:15, color: Colors.textPrimary, lineHeight: 22 },
  divider: { height: 1, width: '100%', backgroundColor: Colors.inputBackground, marginVertical: 5 },
});