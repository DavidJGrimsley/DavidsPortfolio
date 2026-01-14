import MaskedView from '@react-native-masked-view/masked-view';
import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface FireTextProps {
  text: string;
  fontSize?: number;
  gifUrl?: string;
  intensity?: number;
}

export function FireText({
  text,
  fontSize = 60,
  gifUrl =
    'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExa29lY3prcTJwbDZlenY3dzdnOHY4aHJhM3R4NzczaHhyZWk1N2EwOCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/mRN4z5je2Ly6Mjvr0s/giphy.gif',
  intensity = 12,
}: FireTextProps) {
  const heightPx = Math.max(44, Math.round(fontSize * 1.65));

  const drift = useSharedValue(0);
  const flicker = useSharedValue(1);
  const jitter = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    flicker.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 90 }),
        withTiming(1.05, { duration: 70 }),
        withTiming(0.98, { duration: 110 }),
        withTiming(1.1, { duration: 80 })
      ),
      -1,
      true
    );

    jitter.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(-1, { duration: 140 }),
        withTiming(0.5, { duration: 110 }),
        withTiming(0, { duration: 130 })
      ),
      -1,
      true
    );
  }, [drift, flicker, jitter]);

  const imageStyle = useAnimatedStyle(() => {
    const y = (drift.value - 0.5) * (heightPx * 0.25);
    const x = jitter.value * Math.max(1, intensity * 0.2);
    return {
      transform: [{ translateX: x }, { translateY: y }, { scale: 1.2 }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const x = jitter.value * Math.max(0.5, intensity * 0.12);
    const y = (drift.value - 0.5) * (heightPx * 0.08);
    return {
      opacity: Math.min(1, Math.max(0.35, flicker.value)),
      transform: [{ translateX: x }, { translateY: y }, { scale: 1.01 }],
    };
  });

  const maskTextStyle = {
    fontSize,
    fontWeight: '900' as const,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    textAlign: 'center' as const,
    lineHeight: heightPx,
  };

  return (
    <View className="w-full items-center justify-center" style={{ height: heightPx }}>
      <Animated.Text
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            color: '#ff5a00',
            textShadowColor: 'rgba(255, 90, 0, 0.9)',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 18,
            includeFontPadding: false,
            ...maskTextStyle,
          },
          glowStyle,
        ]}
        numberOfLines={1}
      >
        {text}
      </Animated.Text>

      <MaskedView
        style={{ width: '100%', height: heightPx, alignItems: 'center', justifyContent: 'center' }}
        maskElement={
          <View style={{ width: '100%', height: heightPx, justifyContent: 'center' }}>
            <Text style={{ color: 'black', includeFontPadding: false, ...maskTextStyle }} numberOfLines={1}>
              {text}
            </Text>
          </View>
        }
      >
        <View style={{ width: '100%', height: heightPx, overflow: 'hidden' }}>
          <Animated.View style={[{ width: '100%', height: '100%' }, imageStyle]}>
            <Image
              source={{ uri: gifUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </Animated.View>
        </View>
      </MaskedView>
    </View>
  );
}
