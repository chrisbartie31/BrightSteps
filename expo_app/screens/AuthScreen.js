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
      <View style={styles.headerContainer}>
        <Text style={styles.emoji}>👋</Text>
        <Text style={styles.header}>Welcome to BrightSteps!</Text>
        <Text style={styles.subHeader}>Let's get a parent to sign in.</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput 
            style={styles.input} 
            placeholder="Parent Email" 
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
          <Text style={styles.buttonText}>{loading ? 'Checking...' : isLogin ? "Login 🚀" : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => setIsLogin(prev => !prev)}
        >
            <Text style={styles.switchText}>
                {isLogin ? "Need a new account? Tap here!" : "Already have an account? Sign In"}
            </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center', 
    backgroundColor: Colors.secondary + '15' // Light yellow background
},
  headerContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emoji: { fontSize: 60, marginBottom: 10 },
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
    color: Colors.textSecondary,
  },
  formContainer: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    padding: 25,
    borderRadius: 25,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
},
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12, 
    padding: 18, 
    marginBottom: 15, 
    borderWidth: 2,
    borderColor: Colors.background,
    fontSize: 16,
    fontWeight: '600'
},
  button: {
    padding: 20, 
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
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