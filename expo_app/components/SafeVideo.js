import React from 'react';
import { Video, ResizeMode } from 'expo-av';
import { StyleSheet } from 'react-native';

export default function SafeVideo({ 
  source, 
  style, 
  useNativeControls, 
  shouldPlay, 
  isLooping, 
  isMuted, 
  resizeMode,
  ...rest 
}) {
  
  // 1. Strict Boolean Converter
  const getBool = (val) => {
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    return false; 
  };

  // 2. ResizeMode Mapper
  const getResizeMode = (mode) => {
    switch (mode) {
      case 'cover': return ResizeMode.COVER;
      case 'stretch': return ResizeMode.STRETCH;
      case 'contain': 
      default: return ResizeMode.CONTAIN;
    }
  };

  return (
    <Video
      source={source}
      style={style}
      // Pass strictly converted booleans
      useNativeControls={getBool(useNativeControls)}
      shouldPlay={getBool(shouldPlay)}
      isLooping={getBool(isLooping)}
      isMuted={getBool(isMuted)}
      // Pass the official Enum for resizeMode
      resizeMode={getResizeMode(resizeMode)}
      
      // === 🔍 DEBUGGING LOGS ADDED HERE ===
      onError={(error) => console.log("❌ VIDEO ERROR:", error)}
      onLoadStart={() => console.log("⏳ Video loading started...")}
      onLoad={(status) => console.log("✅ Video loaded successfully!", status)}
      // ====================================

      {...rest} 
    />
  );
}

const styles = StyleSheet.create({});