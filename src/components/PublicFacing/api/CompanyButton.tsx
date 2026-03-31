import React, { useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, type ImageSourcePropType, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ExternalLink } from '@/components/UI/ExternalLink';

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
  const burstBaseSize = 74;
  const shimmerWidth = 92;
  const shimmerOverscan = 34;
  const normalizedName = name.toLowerCase();

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

  const burstStyle = useAnimatedStyle(() => ({
    borderColor: withAlpha(primaryColor, 0.7),
    borderRadius: 999,
    borderWidth: interpolate(burst.value, [0, 1], [3.6, 1]),
    height: burstBaseSize,
    left: '50%',
    opacity: interpolate(burst.value, [0, 0.05, 0.65, 1], [0, 0.88, 0.52, 0]),
    position: 'absolute',
    top: '50%',
    transform: [{ scale: interpolate(burst.value, [0, 0.2, 0.65, 1], [0.3, 1.2, 3.7, 4.7]) }],
    marginLeft: -burstBaseSize / 2,
    marginTop: -burstBaseSize / 2,
    width: burstBaseSize,
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
    scale.value = withTiming(0.968, { duration: 110 });
    cancelAnimation(burst);
    burst.value = 0;
    burst.value = withSequence(
      withTiming(1, {
        duration: 980,
        easing: Easing.out(Easing.quad),
      }),
      withTiming(0, { duration: 180 })
    );
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withTiming(1.03, { duration: 180 }),
      withTiming(1, { duration: 180 })
    );
  };

  return (
    <Animated.View style={animatedScaleStyle}>
      <ExternalLink asChild href={href}>
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="link"
          className="relative h-[132px] items-center justify-center overflow-hidden rounded-[18px] border"
          onHoverIn={handleHoverIn}
          onHoverOut={handleHoverOut}
          onLayout={(event) => {
            cardWidth.value = event.nativeEvent.layout.width;
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={{
            backgroundColor: withAlpha(primaryColor, 0.3),
            borderColor: secondaryColor,
            borderCurve: 'continuous',
          }}
        >
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <Image
              source={imageSource}
              resizeMode="contain"
              style={logoStyle}
            />
          </View>

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

          <Animated.View
            pointerEvents="none"
            style={burstStyle}
          />

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
        </Pressable>
      </ExternalLink>
    </Animated.View>
  );
}
