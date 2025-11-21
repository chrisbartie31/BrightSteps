import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { useChild } from '../contexts/ChildContext';

export default function ChildSelect({ navigation }) {
  const [children, setChildren] = useState([]);
  const [newName, setNewName] = useState('');
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
    if (!newName.trim()) return Alert.alert('Name required');
    await addDoc(collection(db, 'children'), { name: newName.trim(), parentId: auth.currentUser.uid, createdAt: new Date() });
    setNewName('');
  }

  function handleSelectChild(child) {
    selectChild({ id: child.id, name: child.name });
    navigation.navigate('Lessons');
  }

  function handleSignOut() {
    selectChild(null);
    auth.signOut();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Children</Text>
      <FlatList
        data={children}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleSelectChild(item)}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle}>Tap to start lessons</Text>
          </TouchableOpacity>
        )}
      />

      <View style={styles.inputSection}>
        <TextInput
          placeholder="Add new child's name"
          value={newName}
          onChangeText={setNewName}
          style={styles.input}
        />
        <Button title="Add Child" onPress={addChild} />
      </View>

      <View style={styles.signOutButton}>
        <Button title="Sign out" onPress={handleSignOut} color="#dc3545" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: { padding: 16, borderWidth: 1, borderRadius: 8, marginBottom: 10, borderColor: '#007bff' },
  cardTitle: { fontSize: 18, fontWeight: '600' },
  cardSubtitle: { fontSize: 12, color: '#6c757d', marginTop: 4 },
  inputSection: { borderTopWidth: 1, borderTopColor: '#ccc', paddingVertical: 10, marginTop: 10 },
  input: { borderWidth: 1, padding: 10, borderRadius: 6, marginBottom: 8 },
  signOutButton: { marginTop: 20 },
});
