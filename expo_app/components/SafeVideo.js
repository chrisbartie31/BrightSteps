import React from 'react';
import { Video } from 'expo-av';
import { StyleSheet } from 'react-native';

function toBool(v) {
  return v === true || v === 'true';
}

export default function SafeVideo({ source, style, useNativeControls, shouldPlay, isLooping, isMuted, resizeMode }) {
  return (
    <Video
      source={source}
      style={style}
      useNativeControls={toBool(useNativeControls)}
      shouldPlay={toBool(shouldPlay)}
      isLooping={toBool(isLooping)}
      isMuted={toBool(isMuted)}
      resizeMode={resizeMode || 'contain'}
    />
  );
}

const styles = StyleSheet.create({});
