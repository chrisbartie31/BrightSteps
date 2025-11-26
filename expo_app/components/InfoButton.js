// expo_app/components/InfoButton.js

import React from 'react';
import { TouchableOpacity, Alert, StyleSheet } from 'react-native';
// Expo comes with Ionicons, which fit the Apple look perfectly
import { Ionicons } from '@expo/vector-icons'; 
import { Colors } from '../constants/Colors';

export default function InfoButton({ title, message, style, color }) {
  
  const handlePress = () => {
    Alert.alert(
      title || "Help",
      message || "No information available.",
      [{ text: "Got it", style: "default" }]
    );
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      style={[styles.container, style]}
      activeOpacity={0.6}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Makes it easier to tap
    >
      <Ionicons 
        name="information-circle-outline" 
        size={26} 
        color={color || Colors.primary} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    // Optional: Add padding if needed, but hitSlop handles the touch area
    justifyContent: 'center',
    alignItems: 'center',
  }
});