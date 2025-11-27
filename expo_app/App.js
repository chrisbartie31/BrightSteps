import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen'; // IMPORT THIS

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
import OnboardingScreen from './screens/OnboardingScreen';

// 1. KEEP SPLASH SCREEN VISIBLE INITIALLY
// This prevents the white flash or instant login screen
SplashScreen.preventAutoHideAsync();

initFirebase(firebaseConfig);

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false); 
  const [appIsReady, setAppIsReady] = useState(false); // New state for splash control

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        try {
          const docRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.onboardingComplete === false) {
                setShowOnboarding(true);
            } else {
                setShowOnboarding(false);
            }
          }
        } catch (e) {
          console.error("Error fetching profile", e);
        }
        setUser(u);
      } else {
        setUser(null);
        setShowOnboarding(false);
      }
      
      if (initializing) setInitializing(false);
      
      // 2. TELL APP WE ARE READY
      // Add a small artificial delay (e.g. 2 seconds) to let the user see the branding
      setTimeout(() => {
          setAppIsReady(true); 
      }, 2000); 
    });
    return unsubscribe;
  }, [initializing]);

  // 3. HIDE SPLASH SCREEN WHEN READY
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null; // Keep showing Native Splash Screen
  }

  return (
    // Attach the layout handler to the root provider
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ChildProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: true }}>
            {!user ? (
              <Stack.Screen
                name="Auth"
                component={AuthScreen}
                options={{ headerShown: false }}
              />
            ) : (
              <>
                {showOnboarding && (
                  <Stack.Screen
                    name="Onboarding"
                    component={OnboardingScreen}
                    options={{ headerShown: false }}
                  />
                )}
                <Stack.Screen
                  name="ChildSelect"
                  component={ChildSelect}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Lessons"
                  component={LessonsList}
                  options={{
                    title: "Lessons",
                    headerBackTitle: "Profiles", // iOS: Changes "< Back" to "< Profiles"
                    headerTintColor: Colors.primary, // Make the back arrow blue
                  }}
                />
                <Stack.Screen
                  name="LessonDetail"
                  component={LessonDetail}
                  options={{ title: "Lesson" }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </ChildProvider>
    </View>
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