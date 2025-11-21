// expo_app/screens/AuthScreen.js (CLEANED)
import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSignUp() {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert('Signed up', `Welcome ${cred.user.email}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleSignIn() {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>BrightSteps — Parent Sign In</Text>
      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <View style={{height:12}} />
      <Button title="Sign in" onPress={handleSignIn} />
      <View style={{height:8}} />
      <Button title="Create account" onPress={handleSignUp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:20, justifyContent:'center'},
  input:{borderWidth:1, borderRadius:6, padding:10, marginBottom:8},
  header:{fontSize:18, fontWeight:'700', marginBottom:12}
});