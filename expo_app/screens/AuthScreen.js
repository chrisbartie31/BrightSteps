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
  ActivityIndicator
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, collection, writeBatch } from 'firebase/firestore'; 
import { auth, db } from '../services/firebase';
import { Colors } from '../constants/Colors'; 

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

      // A. Create Parent Profile with Onboarding Flag
      const parentRef = doc(db, 'users', uid);
      batch.set(parentRef, {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        role: 'parent',
        onboardingComplete: false, // <--- CRITICAL FLAG
        createdAt: new Date()
      });

      // B. Create First Child Profile
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
          
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>BrightSteps</Text>
            <Text style={styles.headerSubtitle}>
              {isLogin ? 'Welcome back! Please sign in.' : 'Create a profile to start tracking progress.'}
            </Text>
          </View>

          {!isLogin && (
            <>
              <Text style={styles.sectionLabel}>YOUR DETAILS</Text>
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.inputTop} 
                  placeholder="First Name" 
                  value={firstName} 
                  onChangeText={setFirstName}
                  placeholderTextColor={Colors.placeholder}
                />
                <View style={styles.separator} />
                <TextInput 
                  style={styles.inputMiddle} 
                  placeholder="Last Name" 
                  value={lastName} 
                  onChangeText={setLastName}
                  placeholderTextColor={Colors.placeholder}
                />
                <View style={styles.separator} />
                <TextInput 
                  style={styles.inputBottom} 
                  placeholder="Phone Number" 
                  keyboardType="phone-pad"
                  value={phone} 
                  onChangeText={setPhone}
                  placeholderTextColor={Colors.placeholder}
                />
              </View>

              <Text style={styles.sectionLabel}>FIRST LEARNER</Text>
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.inputSingle} 
                  placeholder="Child's Name" 
                  value={childName} 
                  onChangeText={setChildName}
                  placeholderTextColor={Colors.placeholder}
                />
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>{isLogin ? 'ACCOUNT' : 'LOGIN DETAILS'}</Text>
          <View style={styles.inputGroup}>
            <TextInput 
              style={styles.inputTop} 
              placeholder="Email Address" 
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

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: 20, paddingBottom: 50 },
  
  headerContainer: { marginTop: 20, marginBottom: 30, alignItems: 'center' },
  headerTitle: { fontSize: 34, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 8, textAlign: 'center' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 16,
    textTransform: 'uppercase'
  },

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
  inputMiddle: {
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
  inputSingle: {
    height: 50,
    paddingHorizontal: 16,
    fontSize: 17,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.separator,
    marginLeft: 16, 
  },

  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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
  linkText: { color: Colors.primary, fontSize: 16, fontWeight: '500' },
});