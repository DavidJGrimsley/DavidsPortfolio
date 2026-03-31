import React, { useEffect, useMemo, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { openBrowserAsync } from 'expo-web-browser';
import { Image, Pressable, type ImageSourcePropType, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function withAlpha(hex: string, alpha: number) {
  const normalized = hex.replace('#', '').trim();
  if (normalized.length !== 6) {
    return hex;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type CompanyButtonProps = {
  accessibilityLabel: string;
  fontFamily: string;
  href: string;
  imageSource: ImageSourcePropType;
  name: string;
  primaryColor: string;
  secondaryColor: string;
};

export function CompanyButton({
  accessibilityLabel,
  fontFamily,
  href,
  imageSource,
  name,
  primaryColor,
  secondaryColor,
}: CompanyButtonProps) {
  const buttonHeight = 132;
  const imageSize = Math.round(buttonHeight * 1.04);
  const burstExpandMs = 1120;
  const burstReturnMs = 220;
  const navigateDelayMs = burstExpandMs + burstReturnMs;
  const burstBaseSize = 74;
  const shimmerWidth = 92;
  const shimmerOverscan = 34;
  const normalizedName = name.toLowerCase();
  const isNavigatingRef = useRef(false);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scale = useSharedValue(1);
  const shimmerX = useSharedValue(-shimmerWidth - shimmerOverscan);
  const shimmerOpacity = useSharedValue(0);
  const burst = useSharedValue(0);
  const cardWidth = useSharedValue(308);

  const animatedScaleStyle = useAnimatedStyle(() => ({
    width: '49%',
    transform: [{ scale: scale.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    borderRadius: 18,
    bottom: -28,
    left: 0,
    opacity: shimmerOpacity.value,
    overflow: 'hidden',
    position: 'absolute',
    top: -28,
    transform: [{ translateX: shimmerX.value }, { rotate: '18deg' }],
    width: shimmerWidth,
  }));

  const primaryRingStyle = useAnimatedStyle(() => ({
    borderColor: withAlpha(primaryColor, 0.82),
    borderRadius: 999,
    borderWidth: interpolate(burst.value, [0, 0.58, 1], [4, 2.1, 3], Extrapolation.CLAMP),
    height: burstBaseSize,
    left: '50%',
    marginLeft: -burstBaseSize / 2,
    marginTop: -burstBaseSize / 2,
    opacity: interpolate(burst.value, [0, 0.06, 0.58, 0.82, 1], [0, 0.94, 0.7, 0.42, 0], Extrapolation.CLAMP),
    position: 'absolute',
    shadowColor: primaryColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: interpolate(burst.value, [0, 0.12, 0.7, 1], [0, 0.8, 0.64, 0], Extrapolation.CLAMP),
    shadowRadius: interpolate(burst.value, [0, 1], [8, 30], Extrapolation.CLAMP),
    top: '50%',
    transform: [{ scale: interpolate(burst.value, [0, 0.58, 1], [0.3, 5.2, 0.38], Extrapolation.CLAMP) }],
    width: burstBaseSize,
  }));

  const secondaryRingStyle = useAnimatedStyle(() => {
    const secondaryPhase = interpolate(burst.value, [0.14, 1], [0, 1], Extrapolation.CLAMP);

    return {
      borderColor: withAlpha(secondaryColor, 0.82),
      borderRadius: 999,
      borderWidth: interpolate(secondaryPhase, [0, 0.7, 1], [3.3, 1.8, 2.6], Extrapolation.CLAMP),
      height: burstBaseSize,
      left: '50%',
      marginLeft: -burstBaseSize / 2,
      marginTop: -burstBaseSize / 2,
      opacity: interpolate(secondaryPhase, [0, 0.08, 0.7, 1], [0, 0.86, 0.5, 0], Extrapolation.CLAMP),
      position: 'absolute',
      shadowColor: secondaryColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: interpolate(secondaryPhase, [0, 0.1, 0.75, 1], [0, 0.8, 0.58, 0], Extrapolation.CLAMP),
      shadowRadius: interpolate(secondaryPhase, [0, 1], [7, 24], Extrapolation.CLAMP),
      top: '50%',
      transform: [{ scale: interpolate(secondaryPhase, [0, 0.7, 1], [0.2, 4.3, 0.32], Extrapolation.CLAMP) }],
      width: burstBaseSize,
    };
  });

  const contentFadeStyle = useAnimatedStyle(() => ({
    bottom: 0,
    left: 0,
    opacity: interpolate(burst.value, [0.58, 1], [1, 0.46], Extrapolation.CLAMP),
    position: 'absolute',
    right: 0,
    top: 0,
  }));

  const edgeWipeStyle = useAnimatedStyle(() => ({
    borderColor: withAlpha(primaryColor, 0.52),
    borderRadius: 18,
    borderWidth: interpolate(burst.value, [0.58, 1], [0, buttonHeight / 2], Extrapolation.CLAMP),
    bottom: 0,
    left: 0,
    opacity: interpolate(burst.value, [0.58, 1], [0, 0.92], Extrapolation.CLAMP),
    position: 'absolute',
    right: 0,
    top: 0,
  }));

  const labelStyle = useMemo(
    () => {
      if (normalizedName === 'higher') {
        return {
          color: primaryColor,
          fontFamily,
          fontSize: 60,
          lineHeight: 64,
          textAlign: 'center' as const,
          width: '96%' as const,
        };
      }

      if (normalizedName === 'identerest') {
        return {
          color: primaryColor,
          fontFamily,
          fontSize: 40,
          lineHeight: 44,
          textAlign: 'center' as const,
          width: '96%' as const,
        };
      }

      return {
        color: primaryColor,
        fontFamily,
        fontSize: 30,
        lineHeight: 34,
        textAlign: 'center' as const,
        width: '96%' as const,
      };
    },
    [fontFamily, normalizedName, primaryColor]
  );

  const logoStyle = useMemo(
    () => ({
      height: imageSize,
      opacity: 0.5,
      tintColor: secondaryColor,
      width: imageSize,
    }),
    [imageSize, secondaryColor]
  );

  const handleHoverIn = () => {
    cancelAnimation(shimmerX);
    cancelAnimation(shimmerOpacity);
    const start = -shimmerWidth - shimmerOverscan;
    const end = cardWidth.value + shimmerOverscan;

    shimmerX.value = start;
    shimmerOpacity.value = withTiming(0.7, { duration: 170 });
    shimmerX.value = withTiming(end, {
      duration: 980,
      easing: Easing.out(Easing.cubic),
    });
    shimmerOpacity.value = withSequence(
      withTiming(0.72, { duration: 160 }),
      withTiming(0.72, { duration: 620 }),
      withTiming(0, { duration: 200 })
    );
  };

  const handleHoverOut = () => {
    cancelAnimation(shimmerX);
    cancelAnimation(shimmerOpacity);
    shimmerOpacity.value = withTiming(0, { duration: 160 });
    shimmerX.value = -shimmerWidth - shimmerOverscan;
  };

  const handlePressIn = () => {
    if (isNavigatingRef.current) return;

    scale.value = withTiming(0.968, { duration: 110 });
    cancelAnimation(burst);
    burst.value = 0;
    burst.value = withSequence(
      withTiming(1, {
        duration: burstExpandMs,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(0, { duration: burstReturnMs })
    );
  };

  const handlePressOut = () => {
    if (isNavigatingRef.current) return;

    scale.value = withSequence(
      withTiming(1.03, { duration: 180 }),
      withTiming(1, { duration: 180 })
    );
  };

  const handlePress = () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    if (navigateTimerRef.current) {
      clearTimeout(navigateTimerRef.current);
      navigateTimerRef.current = null;
    }

    if (typeof window !== 'undefined') {
      // Pre-open a blank tab synchronously to preserve the user-gesture context
      // and avoid popup blockers, then navigate it after the animation finishes.
      const tab = window.open('', '_blank', 'noopener,noreferrer');
      navigateTimerRef.current = setTimeout(() => {
        navigateTimerRef.current = null;
        if (tab && !tab.closed) {
          tab.location.href = href;
        } else {
          // Fallback if the tab was blocked or closed before we navigated it
          window.open(href, '_blank', 'noopener,noreferrer');
        }
        isNavigatingRef.current = false;
      }, navigateDelayMs);
      return;
    }

    navigateTimerRef.current = setTimeout(() => {
      navigateTimerRef.current = null;
      void openBrowserAsync(href).finally(() => {
        isNavigatingRef.current = false;
      });
    }, navigateDelayMs);
  };

  useEffect(
    () => () => {
      if (navigateTimerRef.current) {
        clearTimeout(navigateTimerRef.current);
        navigateTimerRef.current = null;
      }
    },
    []
  );

  return (
    <Animated.View style={animatedScaleStyle}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="link"
        className="relative h-[132px] items-center justify-center overflow-hidden rounded-[18px] border"
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onLayout={(event) => {
          cardWidth.value = event.nativeEvent.layout.width;
        }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          backgroundColor: withAlpha(primaryColor, 0.3),
          borderColor: secondaryColor,
          borderCurve: 'continuous',
        }}
      >
        <Animated.View
          pointerEvents="none"
          style={shimmerStyle}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.98)', 'rgba(255,255,255,0)']}
            end={{ x: 1, y: 0.5 }}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            style={{
              bottom: 0,
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          />
        </Animated.View>

        <Animated.View pointerEvents="none" style={contentFadeStyle}>
          <View className="absolute inset-0 items-center justify-center">
            <Image
              source={imageSource}
              resizeMode="contain"
              style={logoStyle}
            />
          </View>

          <View pointerEvents="none" className="absolute inset-0 items-center justify-center px-2">
            <Text
              adjustsFontSizeToFit
              allowFontScaling={false}
              minimumFontScale={0.65}
              numberOfLines={1}
              style={labelStyle}
            >
              {name}
            </Text>
          </View>
        </Animated.View>

        <Animated.View pointerEvents="none" style={primaryRingStyle} />
        <Animated.View pointerEvents="none" style={secondaryRingStyle} />
        <Animated.View pointerEvents="none" style={edgeWipeStyle} />
      </Pressable>
    </Animated.View>
  );
}
