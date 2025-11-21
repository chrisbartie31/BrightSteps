// expo_app/screens/ChildSelect.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { auth, db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useChild } from '../contexts/ChildContext';
import { Colors } from '../constants/Colors';

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
  container: { flex: 1, backgroundColor: Colors.background }, // Use background constant
  headerContainer: { 
    padding: 24, 
    paddingTop: 40,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: Colors.card, // Use card constant
    borderBottomWidth: 1,
    borderBottomColor: Colors.background // Lighter separation
  },
  greeting: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.textPrimary },
  signOutBtn: { padding: 10, backgroundColor: Colors.danger + '20', borderRadius: 10 }, // Red background for contrast
  signOutText: { color: Colors.danger, fontWeight: '700', fontSize: 14 },

  listContent: { padding: 20 },
  emptyText: { textAlign: 'center', marginTop: 50, color: Colors.textSecondary, fontSize: 16 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 20, // More rounded for junior app
    padding: 20, // Large padding
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, // Softer shadow
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    width: 60, // Larger avatar
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  avatarText: { color: Colors.card, fontSize: 26, fontWeight: 'bold' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary }, // Bigger name
  cardAction: { fontSize: 14, color: Colors.primary, marginTop: 4, fontWeight: '600' }, // Primary color for action

  addContainer: {
    padding: 20,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  addNewBtn: {
    backgroundColor: Colors.primary, // Use primary color
    borderRadius: 16, // Larger button radius
    padding: 20, // Large touch target
    alignItems: 'center',
  },
  addNewText: { color: Colors.card, fontSize: 18, fontWeight: 'bold' },
  
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { 
    flex: 1, 
    backgroundColor: Colors.background, 
    padding: 15, 
    borderRadius: 10, 
    marginRight: 10,
    borderWidth: 2,
    borderColor: Colors.secondary // Highlighting input field
  },
  addConfirmBtn: {
    backgroundColor: Colors.progress, // Blue for confirmation
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 8
  },
  addConfirmText: { color: Colors.card, fontWeight: 'bold' },
  cancelBtn: { padding: 10 },
  cancelText: { color: Colors.textSecondary, fontWeight: 'bold', fontSize: 18 }
});