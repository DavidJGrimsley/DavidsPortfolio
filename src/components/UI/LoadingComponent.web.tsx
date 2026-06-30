import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/UI/ThemedText';

type LoadingComponentProps = {
  label?: string;
};

type LottieWebComponent = React.ComponentType<{
  animationData: object;
  autoplay?: boolean;
  loop?: boolean;
  style?: object;
}>;

const animationData = require('~/assets/lottie/Cosmos.json') as object;

export function LoadingComponent({ label }: LoadingComponentProps) {
  const isSSR = typeof window === 'undefined';
  const [reduceMotion, setReduceMotion] = useState(false);
  const [Lottie, setLottie] = useState<LottieWebComponent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) {
      setReduceMotion(false);
      return;
    }

    const updateMotionPreference = () => {
      setReduceMotion(Boolean(mediaQuery.matches));
    };

    updateMotionPreference();

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateMotionPreference);
      return () => mediaQuery.removeEventListener('change', updateMotionPreference);
    }

    mediaQuery.addListener(updateMotionPreference);
    return () => mediaQuery.removeListener(updateMotionPreference);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || reduceMotion) {
      return;
    }

    let cancelled = false;

    import('lottie-react')
      .then((module) => {
        if (!cancelled) {
          setLottie(() => module.default as LottieWebComponent);
        }
      })
      .catch(() => {
        // Keep the static fallback visible if the web animation bundle fails.
      });

    return () => {
      cancelled = true;
    };
  }, [reduceMotion]);

  const canAnimate = !isSSR && !reduceMotion && Lottie;

  return (
    <View
      accessibilityLabel={label ?? 'Loading'}
      accessibilityRole="progressbar"
      className="w-full items-center justify-center py-10"
    >
      <View style={styles.animationFrame}>
        {canAnimate ? (
          <Lottie animationData={animationData} autoplay loop style={styles.animation} />
        ) : (
          <View style={styles.placeholder} />
        )}
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
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: 180,
  },
  placeholder: {
    backgroundColor: 'rgba(169, 103, 16, 0.24)',
    borderRadius: 999,
    height: 28,
    width: 28,
  },
});
