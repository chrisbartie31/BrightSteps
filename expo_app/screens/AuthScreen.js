// expo_app/screens/AuthScreen.js

import React, { useState } from 'react';
import { View, TextInput, Text, Alert, StyleSheet, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Colors } from '../constants/Colors'; 

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleAuth(authFunction) {
    setLoading(true);
    try {
      await authFunction(auth, email.trim(), password);
      // Auth listener in App.js handles the rest
    } catch (e) {
      Alert.alert('Action Failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>BrightSteps</Text>
          <Text style={styles.headerSubtitle}>{isLogin ? 'Sign in to your account' : 'Create a new account'}</Text>
        </View>

        {/* iOS "Inset Grouped" Container */}
        <View style={styles.inputGroup}>
          <TextInput 
            style={styles.inputTop} 
            placeholder="Email" 
            keyboardType="email-address" 
            autoCapitalize="none"
            value={email} 
            onChangeText={setEmail}
            placeholderTextColor={Colors.placeholder}
          />
          <View style={styles.separator} />
          <TextInput 
            style={styles.inputBottom}
            placeholder="Password" 
            secureTextEntry 
            value={password} 
            onChangeText={setPassword} 
            placeholderTextColor={Colors.placeholder}
          />
        </View>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => handleAuth(isLogin ? signInWithEmailAndPassword : createUserWithEmailAndPassword)}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.linkButton}>
          <Text style={styles.linkText}>
            {isLogin ? 'New here? Create Account' : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  keyboardView: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  
  headerContainer: { marginBottom: 30, alignItems: 'center' },
  headerTitle: { fontSize: 34, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 17, color: Colors.textSecondary, marginTop: 5 },

  // The "Apple Settings" Look
  inputGroup: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 25,
  },
  inputTop: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
  },
  inputBottom: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.separator,
    marginLeft: 16, // Standard iOS left inset for separators
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: Colors.primary, fontSize: 16 },
});