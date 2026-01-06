import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Image, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MobileDetailsBackgroundGradient } from '@/components/Gradients';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { useThemeColor } from '@/hooks/useThemeColor';
import { InProgress } from '@/components/Categories/InProgress';
import { HighlightView } from '@/components/Categories/HighlightView';
import { HorizontalLinks } from '@/components/Categories/HorizontalLinks';
import { OtherSectionsLinks } from '@/components/Categories/OtherSectionsLinks';
import { Piece, Pieces, normalizePieces } from '@/types/portfolio';
import { FlashList } from '@shopify/flash-list';
import YoutubePlayer from 'react-native-youtube-iframe';
import rawPieces from '@json/pieces.json';
import { useMobileStyles } from '@/hooks/useMobileStyles';

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
    const mobileStyles = useMobileStyles();
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
                    <Text style={mobileStyles.title}>{element.displayTitle || element.title}</Text>
                    <Text style={mobileStyles.caption}>{element.caption}</Text>
                    <View style={mobileStyles.imageContainer}>
                        <Image source={{ uri: element.picture }} style={mobileStyles.image} resizeMode="contain" />
                    </View>
                    
                    {/* Render any extra category-specific content */}
                    {renderExtraContent && renderExtraContent(element)}
                    
                    {element.inProgress && <InProgress />}
                    
                    <Text style={mobileStyles.breakdown}>{element.breakdown}</Text>
                    
                    <View style={mobileStyles.YTView}>
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
                    
                    <View style={mobileStyles.listView}>
                        {element.skillsUsed && (
                            <FlashList
                                data={element.skillsUsed}
                                ListHeaderComponent={<Text style={mobileStyles.listHeader}>Skills Used:</Text>}
                                renderItem={({ item }) => <Text style={mobileStyles.skills}>{item}</Text>}
                                horizontal={false}
                                numColumns={3}
                                showsHorizontalScrollIndicator={false}
                            />
                        )}
                        
                        {element.skillsLearned && (
                            <FlashList
                                data={element.skillsLearned}
                                ListHeaderComponent={<Text style={mobileStyles.listHeader}>Skills Learned:</Text>}
                                renderItem={({ item }) => <Text style={mobileStyles.skills}>{item}</Text>}
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
    }, [title, mobileStyles, category, renderExtraContent]);

    return (
        <ScrollView
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={mobileStyles.scroll}
            onScroll={enableScrollTracking ? handleScroll : undefined}
            scrollEventThrottle={enableScrollTracking ? 20 : undefined}
        >
            <View style={mobileStyles.scroll}>
                <MobileDetailsBackgroundGradient />
                <View style={mobileStyles.page}>{data}</View>
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
