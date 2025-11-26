import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initFirebase, auth, db } from './services/firebase';
import { firebaseConfig } from './services/firebaseConfig';
import { ChildProvider } from './contexts/ChildContext';
import { Colors } from './constants/Colors';
import { doc, getDoc } from 'firebase/firestore';

// Import your screens
import AuthScreen from './screens/AuthScreen';
import ChildSelect from './screens/ChildSelect';
import LessonsList from './screens/LessonsList';
import LessonDetail from './screens/LessonDetail';
import OnboardingScreen from './screens/OnboardingScreen'; // NEW IMPORT

// Initialize Firebase
initFirebase(firebaseConfig);

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  
  // NEW: State to track if we should show onboarding
  const [showOnboarding, setShowOnboarding] = useState(false); 
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        // User is logged in, check their profile for onboarding flag
        setCheckingProfile(true);
        try {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            // If explicitly false, show onboarding. If true or undefined (legacy), skip.
            if (data.onboardingComplete === false) {
                setShowOnboarding(true);
            } else {
                setShowOnboarding(false);
            }
          }
        } catch (e) {
          console.error("Error fetching profile", e);
        } finally {
          setCheckingProfile(false);
        }
        setUser(u);
      } else {
        // User logged out
        setUser(null);
        setShowOnboarding(false);
        setCheckingProfile(false);
      }
      
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  // 1. Loading State
  if (initializing || checkingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // 2. Unauthenticated State (Login/Signup)
  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // 3. Authenticated State
  return (
    <ChildProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: true }}>
          
          {/* CONDITIONAL INITIAL ROUTE */}
          {showOnboarding ? (
             <Stack.Screen 
               name="Onboarding" 
               component={OnboardingScreen} 
               options={{ headerShown: false }} 
             />
          ) : null}

          <Stack.Screen 
            name="ChildSelect" 
            component={ChildSelect} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Lessons" 
            component={LessonsList} 
            options={{ title: 'Lessons' }} 
          />
          <Stack.Screen 
            name="LessonDetail" 
            component={LessonDetail} 
            options={{ title: 'Lesson' }} 
          />
        
        </Stack.Navigator>
      </NavigationContainer>
    </ChildProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background
  },
});