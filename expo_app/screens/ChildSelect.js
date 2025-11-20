// expo_app/screens/ChildSelect.js
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { auth, db } from '../services/firebase';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';

export default function ChildSelect({ navigation }) {
  const [children, setChildren] = useState([]);
  const [newName, setNewName] = useState('');

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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Children</Text>
      <FlatList data={children} keyExtractor={i=>i.id} renderItem={({item})=>(
        <TouchableOpacity style={styles.card} onPress={()=> navigation.navigate('Lessons', { childId: item.id })}>
          <Text style={{fontSize:16, fontWeight:'600'}}>{item.name}</Text>
        </TouchableOpacity>
      )} />
      <TextInput placeholder="Add child name" value={newName} onChangeText={setNewName} style={styles.input} />
      <Button title="Add Child" onPress={addChild} />
      <View style={{height:8}} />
      <Button title="Sign out" onPress={() => auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:16},
  header:{fontSize:20, fontWeight:'700', marginBottom:12},
  card:{padding:12, borderWidth:1, borderRadius:8, marginBottom:8},
  input:{borderWidth:1, padding:8, borderRadius:6, marginTop:12}
});
