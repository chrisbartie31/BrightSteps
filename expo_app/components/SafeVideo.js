// expo_app/components/SafeVideo.js

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
  // Guarantees a primitive boolean is returned for the native bridge.
  const getBool = (val) => {
    if (typeof val === 'boolean') return val;
    if (val === 'true') return true;
    return false; // Defaults to false for 'false', null, undefined, or empty strings
  };

  // 2. ResizeMode Mapper
  // Converts string inputs to the official Expo constants
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
      {...rest} 
    />
  );
}

const styles = StyleSheet.create({});