import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ComponentType } from 'react';

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -5,
  },
});

export const BackgroundGradient = () => {
  const backgroundColor = useThemeColor({}, 'background');
  const secondaryColor = useThemeColor({}, 'secondary');
  const whiteOrBlackColor = useThemeColor({}, 'whiteOrBlack');

  return (
    <LinearGradient
      colors={[whiteOrBlackColor, secondaryColor, backgroundColor]}
      style={styles.fill}
    />
  );
};

export const HomeScreenGradient = () => {
  const { width, height } = useWindowDimensions();
  const whiteOrBlackColor = useThemeColor({}, 'whiteOrBlack');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');

  // A "small" top-left glow that quickly blends into the page background.
  const radius = Math.max(180, Math.min(width, height) * 0.55);
  const stops = [0, 0.18, 1];

  // `react-native-radial-gradient` is native-only; use a CSS fallback on web.
  if (Platform.OS === 'web') {
    return (
      <View
        pointerEvents="none"
        style={[
          styles.fill,
          {
            // Small circle at top-left.
            // RN-web supports backgroundImage passthrough.
            backgroundImage: `radial-gradient(circle at top left, ${whiteOrBlackColor} 0.01%, ${secondaryColor} 2%, ${backgroundColor} 4%, ${whiteOrBlackColor} 10%, ${backgroundColor} 25%, ${whiteOrBlackColor} 100%)`,
          } as any,
        ]}
      />
    );
  }

  // Native-only dependency: importing this module on web will crash.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const NativeRadialGradient = require('react-native-radial-gradient').default as ComponentType<any>;

  return (
    <NativeRadialGradient
      pointerEvents="none"
      style={styles.fill}
      // Match the web CSS radial-gradient sequence exactly.
      colors={[
        whiteOrBlackColor,
        secondaryColor,
        backgroundColor,
        whiteOrBlackColor,
        backgroundColor,
        whiteOrBlackColor,
      ]}
      stops={[0.0001, 0.02, 0.04, 0.1, 0.25, 1]}
      // Center at top-left corner.
      center={[0, 0]}
      radius={radius}
    />
  );
};

