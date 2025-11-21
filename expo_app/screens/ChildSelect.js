// expo_app/screens/ChildSelect.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { auth, db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useChild } from '../contexts/ChildContext';

export default function ChildSelect({ navigation }) {
  const [children, setChildren] = useState([]);
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
          <Text style={styles.greeting}>Welcome,</Text>
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
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleSelectChild(item)}>
            <View style={[styles.avatar, { backgroundColor: getColor(item.name) }]}>
              <Text style={styles.avatarText}>{getInitial(item.name)}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardAction}>Tap to start →</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No children added yet. Add one below!</Text>
        }
      />

      {/* Bottom Action Sheet Style for Adding */}
      <View style={styles.addContainer}>
        {isAdding ? (
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input}
              placeholder="Child's Name"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TouchableOpacity style={styles.addConfirmBtn} onPress={addChild}>
              <Text style={styles.addConfirmText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
              <Text style={styles.cancelText}>X</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addNewBtn} onPress={() => setIsAdding(true)}>
            <Text style={styles.addNewText}>+ Add New Student</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  headerContainer: { 
    padding: 24, 
    paddingTop: 40,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  greeting: { fontSize: 14, color: '#7F8C8D', fontWeight: '600' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  signOutBtn: { padding: 8 },
  signOutText: { color: '#E74C3C', fontWeight: '600' },

  listContent: { padding: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#95A5A6', fontSize: 16 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    // Shadows
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 18, fontWeight: '700', color: '#34495E' },
  cardAction: { fontSize: 12, color: '#4A90E2', marginTop: 4 },

  addContainer: {
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addNewBtn: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addNewText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { 
    flex: 1, 
    backgroundColor: '#F5F7FA', 
    padding: 12, 
    borderRadius: 8, 
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  addConfirmBtn: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8
  },
  addConfirmText: { color: '#FFF', fontWeight: 'bold' },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#95A5A6', fontWeight: 'bold', fontSize: 16 }
});