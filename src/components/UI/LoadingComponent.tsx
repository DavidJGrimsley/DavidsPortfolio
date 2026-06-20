import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

import { ThemedText } from '@/components/UI/ThemedText';

type LoadingComponentProps = {
  label?: string;
};

export function LoadingComponent({ label }: LoadingComponentProps) {
  return (
    <View
      accessibilityLabel={label ?? 'Loading'}
      accessibilityRole="progressbar"
      className="w-full items-center justify-center py-10"
    >
      <View style={styles.animationFrame}>
        <LottieView
          source={require('~/assets/lottie/Cosmos.json')}
          autoPlay
          loop
          enableMergePathsAndroidForKitKatAndAbove
          resizeMode="contain"
          style={styles.animation}
        />
      </View>
      {label ? <ThemedText className="mt-2 opacity-70 text-center">{label}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  animation: {
    height: '100%',
    width: '100%',
  },
  animationFrame: {
    aspectRatio: 1,
    width: 180,
  },
});
