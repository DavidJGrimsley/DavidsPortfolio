import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Image, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BackgroundGradient } from '@/components/Gradients';
import { InProgress } from '@/components/Categories/InProgress';
import { HighlightView } from '@/components/Categories/HighlightView';
import { HorizontalLinks } from '@/components/Categories/HorizontalLinks';
import { OtherSectionsLinks } from '@/components/Categories/OtherSectionsLinks';
import { Piece, Pieces, normalizePieces } from '@/types/portfolio';
import { FlashList } from '@shopify/flash-list';
import YoutubePlayer from 'react-native-youtube-iframe';
import rawPieces from '@json/pieces.json';
import { ThemedText } from '@/components/UI/ThemedText';

const piecesData: Pieces = normalizePieces(rawPieces);

type CategoryDetailWrapperProps = {
    category: 'mobile-apps' | 'game-design' | 'website-development' | 'software-development';
    renderExtraContent?: (piece: Piece) => React.ReactNode;
    enableScrollTracking?: boolean;
};

export function CategoryDetailWrapper({ 
    category, 
    renderExtraContent,
    enableScrollTracking = false 
}: CategoryDetailWrapperProps) {
    const { title } = useLocalSearchParams();
    const [data, setData] = useState<React.ReactElement | null>(null);
    const [, setPlaying] = useState(false);
    const [, setScrollY] = useState(0);
    const [, setNavVisible] = useState(true);

    const onStateChange = useCallback((state: string) => {
        if (state === 'ended') {
            setPlaying(false);
            Alert.alert('Video has ended');
        }
    }, []);

    const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
        if (!enableScrollTracking) return;
        
        const yOffset = event.nativeEvent.contentOffset.y;
        setScrollY(yOffset);
        setNavVisible(yOffset < 50);
        console.log('Scroll Y:', yOffset);
    }, [enableScrollTracking]);

    React.useEffect(() => {
        const element = piecesData[category].find((piece) => piece.title === title);
        
        if (element) {
            const page = (
                <View>
                    <ThemedText
                        headingLevel={1}
                        visualHeadingLevel={1}
                        className="detail-title font-londrina-shadow"
                        aria={element.displayTitle || element.title}
                    >
                        {element.displayTitle || element.title}
                    </ThemedText>
                    <Text className="detail-caption">{element.caption}</Text>
                    <View className="detail-image-container">
                        <Image source={{ uri: element.picture }} className="w-full h-full" resizeMode="contain" />
                    </View>
                    
                    {/* Render any extra category-specific content */}
                    {renderExtraContent && renderExtraContent(element)}
                    
                    {element.inProgress && <InProgress />}
                    
                    <Text className="detail-body mb-[1%]">{element.breakdown}</Text>
                    
                    <View className="justify-center items-center my-[2.5%]">
                        {element.youtubeID && (
                            <YoutubePlayer
                                height={Dimensions.get('window').width * 0.7 * 0.5625}
                                width={Dimensions.get('window').width * 0.7}
                                play={false}
                                videoId={element.youtubeID}
                                onChangeState={onStateChange}
                            />
                        )}
                    </View>
                    
                    <View className="my-[2%] bg-secondary rounded-[1%] p-[2.25%] w-full justify-around opacity-80 gap-[1%]">
                        {element.skillsUsed && (
                            <FlashList
                                data={element.skillsUsed}
                                ListHeaderComponent={<Text className="detail-section-header">Skills Used:</Text>}
                                renderItem={({ item }) => <Text className="detail-skill-item">{item}</Text>}
                                horizontal={false}
                                numColumns={3}
                                showsHorizontalScrollIndicator={false}
                            />
                        )}
                        
                        {element.skillsLearned && (
                            <FlashList
                                data={element.skillsLearned}
                                ListHeaderComponent={<Text className="detail-section-header">Skills Learned:</Text>}
                                renderItem={({ item }) => <Text className="detail-skill-item">{item}</Text>}
                                horizontal={false}
                                numColumns={3}
                                showsHorizontalScrollIndicator={false}
                            />
                        )}
                    </View>
                    
                    {(element.github || element.site || element.steam) && (
                        <HorizontalLinks github={element.github} site={element.site} steam={element.steam} />
                    )}
                    
                    {element.highlights && <HighlightView highlights={element.highlights} />}
                    {element.otherSections && <OtherSectionsLinks otherSections={element.otherSections} />}
                </View>
            );
            setData(page);
        } else {
            setData(null);
        }
    }, [title, category, renderExtraContent, onStateChange]);

    return (
        <ScrollView
            showsHorizontalScrollIndicator={false}
            className="bg-themed"
            contentContainerClassName="bg-themed"
            onScroll={enableScrollTracking ? handleScroll : undefined}
            scrollEventThrottle={enableScrollTracking ? 20 : undefined}
        >
            <BackgroundGradient />
            <View className="w-full max-w-[90%] self-center bg-transparent px-6 py-9 pb-12">
                {data}
            </View>
        </ScrollView>
    );
}


export async function generateStaticParamsForCategory(category: keyof Pieces): Promise<Record<string, string>[]> {
    const params: Record<string, string>[] = [];
    piecesData[category].forEach((element: Piece) => {
        params.push({ title: element.title });
    });
    return params;
}
