// expo_app/screens/ChildSelect.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, SafeAreaView, Modal } from 'react-native';
import { auth, db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useChild } from '../contexts/ChildContext';
import { Colors } from '../constants/Colors';

export default function ChildSelect({ navigation }) {
  const [children, setChildren] = useState([]); // This will still hold just the children data
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false); // Toggle for "Add" mode
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
      Alert.alert('Required', 'Please enter a name');
      return;
    }
    await addDoc(collection(db, 'children'), { 
      name: newName.trim(), 
      parentId: auth.currentUser.uid, 
      createdAt: new Date() 
    });
    setNewName('');
    setIsAdding(false);
  }

  function handleSelectChild(child) {
    selectChild({ id: child.id, name: child.name });
    navigation.navigate('Lessons');
  }

  function handleSignOut() {
    selectChild(null); 
    auth.signOut();
  }

  // Generate a nice initial for the avatar
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  // Generate a random-ish color based on name length (simple trick)
  const getColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
    return colors[name.length % colors.length];
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.greeting}>Hello there!</Text>
          <Text style={styles.title}>Who is learning?</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={children}
        keyExtractor={i => i.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          return (
            <TouchableOpacity style={styles.card} onPress={() => handleSelectChild(item)}>
              <View style={[styles.avatar, { backgroundColor: getColor(item.name) }]}>
                <Text style={styles.avatarText}>{getInitial(item.name)}</Text>
              </View>
              <Text style={styles.cardName}>{item.name}</Text>
              <View style={styles.goButton}>
                <Text style={styles.goButtonText}>➔</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No learners added yet. Tap below to start!</Text>
        }
      />

      {/* Modal for Adding a New Child */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAdding}
        onRequestClose={() => setIsAdding(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a New Learner</Text>
            <TextInput
              style={styles.input}
              placeholder="What's their name?"
              value={newName}
              onChangeText={setNewName}
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelBtn]} onPress={() => setIsAdding(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.addConfirmBtn]} onPress={addChild}>
                <Text style={styles.addConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Action Button to Add Child */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsAdding(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerContainer: { 
    padding: 24, 
    paddingTop: 40,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: Colors.card, // Use card constant
    borderBottomWidth: 2,
    borderBottomColor: Colors.background // Lighter separation
  },
  greeting: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  signOutBtn: { padding: 10, backgroundColor: Colors.danger, borderRadius: 10 },
  signOutText: { color: Colors.background, fontWeight: '700', fontSize: 14 },

  listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  emptyText: { textAlign: 'center', marginTop: 50, color: Colors.textSecondary, fontSize: 16 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: { color: Colors.card, fontSize: 28, fontWeight: 'bold' },
  cardName: { flex: 1, fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  goButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goButtonText: { fontSize: 20, color: Colors.primary, fontWeight: 'bold' },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  input: { 
    width: '100%',
    backgroundColor: Colors.background, 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 2,
    borderColor: Colors.secondary,
    fontSize: 16,
    marginBottom: 25,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: Colors.background, marginRight: 10 },
  cancelText: { color: Colors.textSecondary, fontWeight: 'bold', fontSize: 16 },
  addConfirmBtn: {
    backgroundColor: Colors.primary,
  },
  addConfirmText: { color: Colors.card, fontWeight: 'bold', fontSize: 16 },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  fabIcon: { color: Colors.card, fontSize: 32, fontWeight: 'bold', lineHeight: 34 },
});