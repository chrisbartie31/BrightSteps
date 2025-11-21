// expo_app/App.js (Final Production Version)

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initFirebase, auth } from './services/firebase';
import { firebaseConfig } from './services/firebaseConfig';
import { ChildProvider } from './contexts/ChildContext';

// Import your screens
import AuthScreen from './screens/AuthScreen';
import ChildSelect from './screens/ChildSelect';
import LessonsList from './screens/LessonsList';
import LessonDetail from './screens/LessonDetail';

// Initialize Firebase
initFirebase(firebaseConfig);

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(u => {
      setUser(u);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  // 1. Loading State
  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
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

  // 3. Authenticated State (The Main App)
  return (
    <ChildProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: true,
            // gestureEnabled removed to prevent crashes
          }}
        >
          <Stack.Screen
            name="ChildSelect"
            component={ChildSelect}
            options={{ title: 'Choose Child' }}
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
  },
});