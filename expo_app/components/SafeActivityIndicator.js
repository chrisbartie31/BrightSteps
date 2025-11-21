import React from 'react';
import { ActivityIndicator } from 'react-native';

// Convert string "true"/"false" to boolean
const toBool = v => v === true || v === 'true';

export default function SafeActivityIndicator({ animating, ...rest }) {
  const safeAnim = animating === true || animating === 'true';
  return <ActivityIndicator animating={safeAnim} {...rest} />;
}

