import React from 'react';
import { View, Dimensions } from 'react-native';
import { Image } from 'expo-image';

type HighlightImageCarouselProps = {
    pictures?: string[];
};

export function HighlightImageCarousel({ pictures }: HighlightImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const imageWidth = screenWidth * 0.9;
    const imageHeight = Math.min(screenHeight * 0.5, imageWidth * 1.2);

    React.useEffect(() => {
        if (!pictures || !Array.isArray(pictures) || pictures.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % pictures.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [pictures]);

    if (!pictures || !Array.isArray(pictures) || pictures.length === 0) return null;

    return (
        <View style={{ width: '100%', alignItems: 'center', marginVertical: 4 }}>
            <Image 
                source={{ uri: pictures[currentIndex] }} 
                style={{ width: imageWidth, height: imageHeight, resizeMode: 'contain' }}
                contentFit="contain"
                transition={300}
            />
            {pictures.length > 1 && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                    {pictures.map((_, idx) => (
                        <View
                            key={idx}
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: 2,
                                backgroundColor: idx === currentIndex ? '#007bff' : '#ccc',
                                marginHorizontal: 4,
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}
