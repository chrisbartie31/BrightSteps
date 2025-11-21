// expo_app/App.js

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initFirebase, auth } from './services/firebase';
import { firebaseConfig } from './services/firebaseConfig';
import { ChildProvider } from './contexts/ChildContext';

// screens
import AuthScreen from './screens/AuthScreen';
import ChildSelect from './screens/ChildSelect';
import LessonsList from './screens/LessonsList';
import LessonDetail from './screens/LessonDetail';

// Initialize Firebase configuration only once
initFirebase(firebaseConfig);

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = auth.onAuthStateChanged(u => {
      setUser(u);
      // Only set initializing to false after the listener has first run
      if (initializing) { 
        setInitializing(false);
      }
    });
    
    // Clean up the subscription on component unmount
    return unsubscribe;
  }, []); 

  if (initializing) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );

  return (
    <NavigationContainer>
      {/* Wrap the entire authenticated section with the ChildProvider */}
      <ChildProvider> 
        <Stack.Navigator>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown:false }} />
      ) : (
        <React.Fragment>
          <Stack.Screen name="ChildSelect" component={ChildSelect} options={{ title: 'Choose Child' }} /><Stack.Screen name="Lessons" component={LessonsList} /><Stack.Screen name="LessonDetail" component={LessonDetail} options={{ title:'Lesson' }} />
        </React.Fragment>
      )}
    </Stack.Navigator>
      </ChildProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  }
});