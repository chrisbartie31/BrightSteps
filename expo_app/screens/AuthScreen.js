import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar, 
  ScrollView,
  ActivityIndicator,
  Image // Added Image
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, collection, writeBatch } from 'firebase/firestore'; 
import { auth, db } from '../services/firebase';
import { Colors } from '../constants/Colors'; 
import { Ionicons } from '@expo/vector-icons'; // Added Icons

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [childName, setChildName] = useState('');

  // === HANDLER: SIGN IN ===
  async function handleSignIn() {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      Alert.alert('Login Failed', e.message);
    } finally {
      setLoading(false);
    }
  }

  // === HANDLER: SIGN UP ===
  async function handleSignUp() {
    if (!email.trim() || !password || !firstName.trim() || !lastName.trim() || !phone.trim()) {
      return Alert.alert("Missing Details", "Please fill in all parent details.");
    }
    if (!childName.trim()) {
      return Alert.alert("Missing Child", "Please add the name of the first child you look after.");
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const uid = userCredential.user.uid;

      const batch = writeBatch(db);

      const parentRef = doc(db, 'users', uid);
      batch.set(parentRef, {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role: 'parent',
        onboardingComplete: false,
        createdAt: new Date()
      });

      const newChildRef = doc(collection(db, 'children')); 
      batch.set(newChildRef, {
        name: childName.trim(),
        parentId: uid,
        assignedTutorId: null, 
        createdAt: new Date()
      });

      await batch.commit();
      Alert.alert("Welcome!", "Account created successfully.");
      
    } catch (e) {
      Alert.alert("Signup Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 1. BRAND HEADER */}
          <View style={styles.headerContainer}>
            <Image 
                source={require('../assets/splash.png')} 
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.headerSubtitle}>
              {isLogin ? 'Welcome back. Please sign in.' : 'Create a profile to start tracking progress.'}
            </Text>
          </View>

          {!isLogin && (
            <>
              <Text style={styles.sectionLabel}>YOUR DETAILS</Text>
              <View style={styles.inputGroup}>
                {/* First Name */}
                <View style={styles.inputRow}>
                    <Ionicons name="person-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="First Name" 
                      value={firstName} 
                      onChangeText={setFirstName}
                      placeholderTextColor={Colors.placeholder}
                    />
                </View>
                <View style={styles.separator} />
                
                {/* Last Name */}
                <View style={styles.inputRow}>
                    <Ionicons name="person-outline" size={20} color="transparent" style={styles.icon} /> 
                    {/* Transparent icon to align text nicely */}
                    <TextInput 
                      style={styles.input} 
                      placeholder="Last Name" 
                      value={lastName} 
                      onChangeText={setLastName}
                      placeholderTextColor={Colors.placeholder}
                    />
                </View>
                <View style={styles.separator} />
                
                {/* Phone */}
                <View style={styles.inputRow}>
                    <Ionicons name="call-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Phone Number" 
                      keyboardType="phone-pad"
                      value={phone} 
                      onChangeText={setPhone}
                      placeholderTextColor={Colors.placeholder}
                    />
                </View>
              </View>

              <Text style={styles.sectionLabel}>FIRST LEARNER</Text>
              <View style={styles.inputGroup}>
                <View style={styles.inputRow}>
                    <Ionicons name="school-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
                    <TextInput 
                      style={styles.input} 
                      placeholder="Child's Name" 
                      value={childName} 
                      onChangeText={setChildName}
                      placeholderTextColor={Colors.placeholder}
                    />
                </View>
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>{isLogin ? 'ACCOUNT' : 'LOGIN DETAILS'}</Text>
          <View style={styles.inputGroup}>
            {/* Email */}
            <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Email Address" 
                  keyboardType="email-address" 
                  autoCapitalize="none"
                  value={email} 
                  onChangeText={setEmail}
                  placeholderTextColor={Colors.placeholder}
                />
            </View>
            <View style={styles.separator} />
            
            {/* Password */}
            <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.icon} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Password" 
                  secureTextEntry 
                  value={password} 
                  onChangeText={setPassword} 
                  placeholderTextColor={Colors.placeholder}
                />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={isLogin ? handleSignIn : handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.linkButton}>
            <Text style={styles.linkText}>
              {isLogin ? 'New here? Create Account' : 'Already have an account? Sign In'}
            </Text>
          </TouchableOpacity>

          {/* 3. TRUST FOOTER */}
          <View style={styles.footer}>
             <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textSecondary} />
             <Text style={styles.footerText}> Secure & Private Learning Environment</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  headerContainer: { marginTop: 40, marginBottom: 40, alignItems: 'center' },
  logo: { width: 180, height: 60, marginBottom: 15 },
  headerSubtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 5, textAlign: 'center' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  // Apple Settings Style Group
  inputGroup: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  
  // Row with Icon
  inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      paddingHorizontal: 16,
      backgroundColor: Colors.card,
  },
  icon: { marginRight: 12, width: 22, textAlign: 'center' },
  
  input: {
    flex: 1,
    fontSize: 17,
    color: Colors.textPrimary,
    height: '100%',
  },
  
  separator: {
    height: 1,
    backgroundColor: Colors.separator,
    marginLeft: 50, // Indent separator to align with text, not icon
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  linkButton: { marginTop: 25, alignItems: 'center' },
  linkText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },

  footer: { 
      marginTop: 40, 
      flexDirection: 'row', 
      justifyContent: 'center', 
      alignItems: 'center',
      opacity: 0.7 
  },
  footerText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' }
});