import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  Modal, 
  StatusBar, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView, 
  Platform
  // Removed Image import since we aren't using it
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { auth, db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useChild } from '../contexts/ChildContext';
import { Colors } from '../constants/Colors';
import InfoButton from '../components/InfoButton'; 

export default function ChildSelect({ navigation }) {
  const [children, setChildren] = useState([]);
  const [newName, setNewName] = useState('');
  const [passwordVerify, setPasswordVerify] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const { selectChild } = useChild();

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'children'), where('parentId', '==', auth.currentUser.uid));
    const unsub = onSnapshot(q, snap => {
      setChildren(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  async function addChild() {
    if (!newName.trim()) {
        Alert.alert("Missing Name", "Please enter the child's name.");
        return;
    }
    if (!passwordVerify) {
        Alert.alert("Security Check", "Please enter your password to confirm.");
        return;
    }

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

        setNewName('');
        setPasswordVerify('');
        setIsAdding(false);
        Alert.alert("Success", "New profile created!");

    } catch (error) {
        console.error(error);
        Alert.alert("Verification Failed", "Incorrect password. Please try again.");
    } finally {
        setLoading(false);
    }
  }

  function handleSelectChild(child) {
    selectChild({ id: child.id, name: child.name });
    navigation.navigate('Lessons');
  }

  function handleSignOut() {
    selectChild(null); 
    auth.signOut();
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
            {/* === TEXT LOGO REPLACEMENT === */}
            <View style={{marginBottom: 5}}>
                <Text style={styles.brandText}>BrightSteps</Text>
            </View>
            {/* ============================= */}

            <Text style={styles.subHeader}>Welcome,</Text>
            
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={styles.headerTitle}>Who's Learning?</Text>
                <InfoButton 
                    title="Student Profiles"
                    message="Tap a card to switch to that student's dashboard. Tap the '+' button below to create a new profile for a sibling."
                    style={{ marginLeft: 10 }}
                />
            </View>
        </View>

        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.headerAction}>Log Out</Text>
        </TouchableOpacity>
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
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
             <Text style={styles.emptyText}>No profiles yet.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setIsAdding(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Secure Add Modal */}
      <Modal animationType="fade" transparent={true} visible={isAdding} onRequestClose={() => setIsAdding(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Sibling</Text>
            <Text style={styles.modalSubtitle}>Verify it's you to create a new profile.</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Child's Name"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="Verify Parent Password"
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
  
  // New Brand Text Style
  brandText: {
      fontSize: 18,
      fontWeight: '900',
      color: Colors.primary,
      letterSpacing: -0.5,
  },

  subHeader: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  headerAction: { fontSize: 16, fontWeight: '600', color: Colors.danger, marginTop: 5 },

  listContent: { padding: 20 },

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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  
  cardName: { flex: 1, fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  chevron: { fontSize: 28, color: '#C7C7CC', fontWeight: '300', marginTop: -2 },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
});