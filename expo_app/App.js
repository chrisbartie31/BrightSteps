import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initFirebase, auth } from './services/firebase';
import { firebaseConfig } from './services/firebaseConfig';
import { ChildProvider } from './contexts/ChildContext';

import AuthScreen from './screens/AuthScreen';
import ChildSelect from './screens/ChildSelect';
import LessonsList from './screens/LessonsList';
import LessonDetail from './screens/LessonDetail';

initFirebase(firebaseConfig);

const Stack = createNativeStackNavigator();

// helper to coerce boolean from string
const safeBool = v => v === true || v === 'true';

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

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

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

  return (
    <ChildProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: true,
            gestureEnabled: true,
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
