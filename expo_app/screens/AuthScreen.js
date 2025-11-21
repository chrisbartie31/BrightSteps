// expo_app/screens/AuthScreen.js

import React, { useState } from 'react';
import { View, TextInput, Text, Alert, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Colors } from '../constants/Colors'; 

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // === FIX: The handleAuth function required by the UI ===
  async function handleAuth(authFunction) {
    setLoading(true);
    try {
      // Use the provided Firebase auth function (signIn or createUser)
      await authFunction(auth, email.trim(), password);
      Alert.alert('Success', `${isLogin ? 'Signed in.' : 'Account created! You can now add your child.'}`);
    } catch (e) {
      Alert.alert('Authentication Error', e.message);
    } finally {
      setLoading(false);
    }
  }
  // =======================================================

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.header}>Parent Login</Text>
      <Text style={styles.subHeader}>Welcome to BrightSteps Junior. Please sign in to manage your child's learning profile.</Text>

      <TextInput 
          style={styles.input} 
          placeholder="Email Address" 
          keyboardType="email-address" 
          value={email} 
          onChangeText={setEmail}
          placeholderTextColor={Colors.textSecondary}
      />
      <TextInput 
          style={styles.input} 
          placeholder="Password" 
          secureTextEntry 
          value={password} 
          onChangeText={setPassword} 
          placeholderTextColor={Colors.textSecondary}
      />

      <TouchableOpacity 
          style={[styles.button, { backgroundColor: Colors.primary }]}
          onPress={() => handleAuth(isLogin ? signInWithEmailAndPassword : createUserWithEmailAndPassword)}
          disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Parent Account'}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setIsLogin(prev => !prev)}
      >
          <Text style={styles.switchText}>
              {isLogin ? "Need an account? Sign Up" : "Have an account? Go to Sign In"}
          </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, 
    padding: 30, 
    justifyContent: 'center', 
    backgroundColor: Colors.background
},
  emoji: { fontSize: 60, textAlign: 'center', marginBottom: 20, color: Colors.progress },
  header: {
    fontSize: 32, 
    fontWeight: '800', 
    marginBottom: 8, 
    textAlign: 'center', 
    color: Colors.textPrimary
},
  subHeader: {
    fontSize: 14, 
    marginBottom: 40, 
    textAlign: 'center', 
    color: Colors.textSecondary,
    paddingHorizontal: 10,
},
  input: {
    borderWidth: 2, 
    borderColor: Colors.secondary, 
    borderRadius: 12, 
    padding: 18, 
    marginBottom: 15, 
    backgroundColor: Colors.card,
    fontSize: 16,
    fontWeight: '600'
},
  button: {
    padding: 20, 
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
},
  buttonText: {
    color: Colors.card,
    fontSize: 20,
    fontWeight: 'bold',
},
  switchButton: {
    marginTop: 25,
    padding: 10,
    alignItems: 'center',
  },
  switchText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine: 'underline'
  }
});