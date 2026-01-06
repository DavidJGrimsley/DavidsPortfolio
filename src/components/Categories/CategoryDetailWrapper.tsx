import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Image, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MobileDetailsBackgroundGradient } from '@/components/Gradients';
import { InProgress } from '@/components/Categories/InProgress';
import { HighlightView } from '@/components/Categories/HighlightView';
import { HorizontalLinks } from '@/components/Categories/HorizontalLinks';
import { OtherSectionsLinks } from '@/components/Categories/OtherSectionsLinks';
import { Piece, Pieces, normalizePieces } from '@/types/portfolio';
import { FlashList } from '@shopify/flash-list';
import YoutubePlayer from 'react-native-youtube-iframe';
import rawPieces from '@json/pieces.json';

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
    const [playing, setPlaying] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [navVisible, setNavVisible] = useState(true);

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
                    <Text className="text-[4%] md:text-[5%] text-left font-bold text-tint ml-[2%]">{element.displayTitle || element.title}</Text>
                    <Text className="text-[2%] text-right text-themed mr-[2%] ml-[2%] opacity-85">{element.caption}</Text>
                    <View className="flex-row justify-center items-center mx-[2%] my-[2%] w-full self-center h-[40%]">
                        <Image source={{ uri: element.picture }} className="w-full h-full" resizeMode="contain" />
                    </View>
                    
                    {/* Render any extra category-specific content */}
                    {renderExtraContent && renderExtraContent(element)}
                    
                    {element.inProgress && <InProgress />}
                    
                    <Text className="text-[2.2%] text-left text-themed mb-[1%]">{element.breakdown}</Text>
                    
                    <View className="justify-center items-center my-[2%]">
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
                    
                    <View className="my-[1%] bg-secondary rounded-[1%] p-[1.5%] w-full justify-around opacity-40">
                        {element.skillsUsed && (
                            <FlashList
                                data={element.skillsUsed}
                                ListHeaderComponent={<Text className="text-[3.2%] text-left font-bold text-accent">Skills Used:</Text>}
                                renderItem={({ item }) => <Text className="text-left text-[2.2%] text-themed font-bold">{item}</Text>}
                                horizontal={false}
                                numColumns={3}
                                showsHorizontalScrollIndicator={false}
                            />
                        )}
                        
                        {element.skillsLearned && (
                            <FlashList
                                data={element.skillsLearned}
                                ListHeaderComponent={<Text className="text-[3.2%] text-left font-bold text-accent">Skills Learned:</Text>}
                                renderItem={({ item }) => <Text className="text-left text-[2.2%] text-themed font-bold">{item}</Text>}
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
    }, [title, category, renderExtraContent]);

    return (
        <ScrollView
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="bg-themed"
            onScroll={enableScrollTracking ? handleScroll : undefined}
            scrollEventThrottle={enableScrollTracking ? 20 : undefined}
        >
            <View className="bg-themed">
                <MobileDetailsBackgroundGradient />
                <View className="flex-1 mx-[2%] my-[3%] w-[95%] max-w-[1200px] self-center justify-around">{data}</View>
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
