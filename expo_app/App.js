// expo_app/App.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { initFirebase, auth } from './services/firebase';

// screens
import AuthScreen from './screens/AuthScreen';
import ChildSelect from './screens/ChildSelect';
import LessonsList from './screens/LessonsList';
import LessonDetail from './screens/LessonDetail';

// import your firebaseConfig (should already be filled)
import { firebaseConfig } from './services/firebaseConfig';
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
  }, []);

  if (initializing) return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><ActivityIndicator /></View>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown:false }} />
        ) : (
          <>
            <Stack.Screen name="ChildSelect" component={ChildSelect} options={{ title: 'Choose Child' }} />
            <Stack.Screen name="Lessons" component={LessonsList} />
            <Stack.Screen name="LessonDetail" component={LessonDetail} options={{ title:'Lesson' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
