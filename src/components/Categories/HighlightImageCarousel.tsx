import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/UI/ThemedText';
import { portfolioImageFrame } from './portfolio-image-frame';

type HighlightImageCarouselProps = {
    pictures?: string[];
    descriptions?: string[];
    title?: string;
};

export function HighlightImageCarousel({ pictures, descriptions, title = 'Project screenshot' }: HighlightImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    if (!pictures || !Array.isArray(pictures) || pictures.length === 0) return null;

    const index = Math.min(currentIndex, pictures.length - 1);
    const description = descriptions?.[index] ?? `${title}, image ${index + 1} of ${pictures.length}`;
    return (
        <View style={{ width: '100%', maxWidth: 1100, alignItems: 'center', marginVertical: 12 }}>
            <View style={portfolioImageFrame}>
                <Image
                    source={{ uri: pictures[index] }}
                    accessibilityLabel={description}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                    contentFit="contain"
                    transition={300}
                />
            </View>
            {pictures.length > 1 && (
                <View className="flex-row flex-wrap justify-center gap-2 mt-3">
                    {pictures.map((_, idx) => (
                        <Pressable
                            key={idx}
                            accessibilityRole="button"
                            accessibilityLabel={`Show ${title} image ${idx + 1}`}
                            accessibilityState={{ selected: idx === index }}
                            onPress={() => setCurrentIndex(idx)}
                            className={idx === index ? 'bg-tint rounded-lg px-4 py-3' : 'bg-themed rounded-lg px-4 py-3'}
                        >
                            <ThemedText inverse={idx === index}>{idx + 1}</ThemedText>
                        </Pressable>
                    ))}
                </View>
            )}
            {descriptions?.[index] ? <ThemedText className="text-sm text-center mt-2 opacity-85">{description}</ThemedText> : null}
        </View>
    );
}
