import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    interpolateColor,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/UI/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

type TitleOfPageProps = {
    titleA?: string;
    titleB?: string;
    children?: React.ReactNode;
};

const AnimatedText = Animated.createAnimatedComponent(Text);

export function TitleOfPage({ titleA = 'David', titleB = 'Grimsley', children }: TitleOfPageProps) {
    const textColor = useThemeColor({}, 'text');
    const secondaryColor = useThemeColor({}, 'secondary');

    const enter = useSharedValue(0);
    const colorShift = useSharedValue(0);
    const contentEnter = useSharedValue(0);

    useEffect(() => {
        // 1) Title fades/slides in
        enter.value = withDelay(190, withTiming(1, { duration: 875 }));
        // 2) Content fades up after title
        contentEnter.value = withDelay(875, withTiming(1, { duration: 690 }));
        // 3) Second word shifts to secondary after content starts
        colorShift.value = withDelay(1315, withTiming(1, { duration: 750 }));
    }, [enter, contentEnter, colorShift]);

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
                <Text className="main-title-shadow" accessible={false}>
                    {titleA}{titleB ? ` ${titleB}` : ''}
                </Text>
            </Animated.View>

            {children ? (
                <Animated.View style={contentStyle} className="w-full flex-1">
                    {children}
                </Animated.View>
            ) : null}
        </>
    );
}
