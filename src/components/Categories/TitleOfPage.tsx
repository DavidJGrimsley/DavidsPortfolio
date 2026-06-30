import React, { useEffect } from 'react';
import { Platform, Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    interpolateColor,
    useReducedMotion,
    type SharedValue,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

type TitleOfPageProps = {
    titleA?: string;
    titleB?: string;
    children?: React.ReactNode;
    startDelayMs?: number;
    scrollY?: SharedValue<number>;
};

const AnimatedText = Animated.createAnimatedComponent(Text);

export function TitleOfPage({
    titleA = 'David',
    titleB = 'Grimsley',
    children,
    startDelayMs = 0,
    scrollY,
}: TitleOfPageProps) {
    const textColor = useThemeColor({}, 'text');
    const secondaryColor = useThemeColor({}, 'secondary');
    const reduceMotion = useReducedMotion();
    const skipEntranceAnimation = Platform.OS === 'web' || reduceMotion;

    const enter = useSharedValue(skipEntranceAnimation ? 1 : 0);
    const colorShift = useSharedValue(skipEntranceAnimation ? 1 : 0);
    const contentEnter = useSharedValue(skipEntranceAnimation ? 1 : 0);

    useEffect(() => {
        if (skipEntranceAnimation) {
            enter.value = 1;
            contentEnter.value = 1;
            colorShift.value = 1;
            return;
        }

        const baseDelay = Math.max(0, startDelayMs);
        // 1) Title fades/slides in
        enter.value = withDelay(baseDelay + 220, withTiming(1, { duration: 1000 }));
        // 2) Content fades up after title
        contentEnter.value = withDelay(baseDelay + 1100, withTiming(1, { duration: 850 }));
        // 3) Second word shifts to secondary after content starts
        colorShift.value = withDelay(baseDelay + 1750, withTiming(1, { duration: 950 }));
    }, [enter, contentEnter, colorShift, skipEntranceAnimation, startDelayMs]);

    const containerStyle = useAnimatedStyle(() => {
        return {
            opacity: enter.value,
            transform: [{ translateY: (1 - enter.value) * -14 }],
        };
    });

    const contentStyle = useAnimatedStyle(() => {
        return {
            opacity: contentEnter.value,
            transform: [{ translateY: (1 - contentEnter.value) * 10 }],
        };
    });

    const spanStyle = useAnimatedStyle(() => {
        const color = interpolateColor(
            colorShift.value,
            [0, 1],
            [textColor, secondaryColor]
        );
        return {
            color,
        };
    });

    const shadowStyle = useAnimatedStyle(() => {
        if (!scrollY || reduceMotion) return {};
        return {
            transform: [{ translateY: scrollY.value * 1.3 }],
        };
    });

    return (
        <>
            <Animated.View style={containerStyle} className="main-title page-content">
                <ThemedText
                    headingLevel={1}
                    visualHeadingLevel={1}
                    className="main-title-text"
                    aria={`${titleA} ${titleB}`}
                >
                    {titleA}
                    {titleB ? (
                        <AnimatedText style={spanStyle} className="main-title-text-span">
                            {' '}
                            {titleB}
                        </AnimatedText>
                    ) : null}
                </ThemedText>
                <AnimatedText style={shadowStyle} className="main-title-shadow" accessible={false}>
                    {titleA}{titleB ? ` ${titleB}` : ''}
                </AnimatedText>
            </Animated.View>

            {children ? (
                <Animated.View style={contentStyle} className="w-full">
                    {children}
                </Animated.View>
            ) : null}
        </>
    );
}
