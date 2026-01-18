import React, { useCallback, useMemo, useState } from 'react';
import { View, ScrollView, Image, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BackgroundGradient } from '@/components/Gradients';
import { InProgress } from '@/components/Categories/InProgress';
import { HighlightView } from '@/components/Categories/HighlightView';
import { HorizontalLinks } from '@/components/Categories/HorizontalLinks';
import { OtherSectionsLinks } from '@/components/Categories/OtherSectionsLinks';
import { SeoHead } from '@/components/SEO/SeoHead';
import { Piece, Pieces, normalizePieces } from '@/types/portfolio';
import { FlashList } from '@shopify/flash-list';
import YoutubePlayer from 'react-native-youtube-iframe';
import rawPieces from '@json/pieces.json';
import { ThemedText } from '@/components/UI/ThemedText';
import { toAbsoluteUrl } from '@/constants/seo';

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
    const { title } = useLocalSearchParams<{ title?: string | string[] }>();
    const [, setPlaying] = useState(false);
    const [, setScrollY] = useState(0);
    const [, setNavVisible] = useState(true);

    const resolvedTitleParam = useMemo(() => {
        if (!title) return undefined;
        return Array.isArray(title) ? title[0] : title;
    }, [title]);

    const piece = useMemo(() => {
        if (!resolvedTitleParam) return undefined;
        return piecesData[category].find((p) => p.title === resolvedTitleParam);
    }, [category, resolvedTitleParam]);

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

    const seoTitle = piece ? (piece.displayTitle || piece.title) : 'Portfolio Piece';
    const seoDescription = piece
        ? (piece.caption || piece.breakdown || '').toString().slice(0, 300)
        : 'Portfolio detail page.';
    const seoPath = piece ? `/portfolio/${category}/${piece.title}` : `/portfolio/${category}`;
    const seoImage = piece?.picture ? toAbsoluteUrl(piece.picture) : undefined;

    const seoKeywords = useMemo(() => {
        if (!piece) return undefined;
        const raw = [
            'portfolio',
            'David Grimsley',
            category,
            ...(Array.isArray(piece.skillsUsed) ? piece.skillsUsed : []),
            ...(Array.isArray(piece.skillsLearned) ? piece.skillsLearned : []),
        ];
        const unique = Array.from(new Set(raw.map((k) => String(k).trim()).filter(Boolean)));
        return unique.slice(0, 35);
    }, [category, piece]);

    return (
        <>
            <SeoHead
                title={seoTitle}
                description={seoDescription}
                path={seoPath}
                image={seoImage}
                keywords={seoKeywords}
                type="article"
            />

            <ScrollView
                showsHorizontalScrollIndicator={false}
                className="bg-themed"
                contentContainerClassName="bg-themed"
                onScroll={enableScrollTracking ? handleScroll : undefined}
                scrollEventThrottle={enableScrollTracking ? 20 : undefined}
            >
                <BackgroundGradient />
                <View className="w-full max-w-[90%] self-center bg-transparent px-6 py-9 pb-12">
                    {piece ? (
                        <View>
                            <ThemedText
                                headingLevel={1}
                                visualHeadingLevel={1}
                                className="detail-title font-noto-serif-display text-center mb-[2%]"
                                aria={piece.displayTitle || piece.title}
                            >
                                {piece.displayTitle || piece.title}
                            </ThemedText>
                            <ThemedText className="detail-caption">{piece.caption}</ThemedText>
                            <View className="detail-image-container">
                                <Image source={{ uri: piece.picture }} className="w-full h-full" resizeMode="contain" />
                            </View>

                            {renderExtraContent ? renderExtraContent(piece) : null}
                            {piece.inProgress ? <InProgress /> : null}

                            <ThemedText className="detail-body mb-[1%]">{piece.breakdown}</ThemedText>

                            <View className="justify-center items-center my-[2.5%]">
                                {piece.youtubeID ? (
                                    <YoutubePlayer
                                        height={Dimensions.get('window').width * 0.7 * 0.5625}
                                        width={Dimensions.get('window').width * 0.7}
                                        play={false}
                                        videoId={piece.youtubeID}
                                        onChangeState={onStateChange}
                                    />
                                ) : null}
                            </View>

                            <View className="my-[2%] bg-secondary rounded-[1%] p-[2.25%] w-full justify-around opacity-80 gap-[1%]">
                                {piece.skillsUsed ? (
                                    <FlashList
                                        data={piece.skillsUsed}
                                        ListHeaderComponent={<ThemedText headingLevel={2} className="detail-section-header">Skills Used:</ThemedText>}
                                        renderItem={({ item }) => <ThemedText className="detail-skill-item">{item}</ThemedText>}
                                        horizontal={false}
                                        numColumns={3}
                                        showsHorizontalScrollIndicator={false}
                                    />
                                ) : null}

                                {piece.skillsLearned ? (
                                    <FlashList
                                        data={piece.skillsLearned}
                                        ListHeaderComponent={<ThemedText headingLevel={2} className="detail-section-header">Skills Learned:</ThemedText>}
                                        renderItem={({ item }) => <ThemedText className="detail-skill-item">{item}</ThemedText>}
                                        horizontal={false}
                                        numColumns={3}
                                        showsHorizontalScrollIndicator={false}
                                    />
                                ) : null}
                            </View>

                            {(piece.github || piece.site || piece.steam) ? (
                                <HorizontalLinks github={piece.github} site={piece.site} steam={piece.steam} />
                            ) : null}

                            {piece.highlights ? <HighlightView highlights={piece.highlights} /> : null}
                            {piece.otherSections ? <OtherSectionsLinks otherSections={piece.otherSections} /> : null}
                        </View>
                    ) : (
                        <View>
                            <ThemedText headingLevel={1} visualHeadingLevel={1} className="detail-title text-center mb-[2%]">
                                Not found
                            </ThemedText>
                            <ThemedText className="detail-body">This portfolio piece could not be located.</ThemedText>
                        </View>
                    )}
                </View>
            </ScrollView>
        </>
    );
}


export async function generateStaticParamsForCategory(category: keyof Pieces): Promise<Record<string, string>[]> {
    const params: Record<string, string>[] = [];
    piecesData[category].forEach((element: Piece) => {
        params.push({ title: element.title });
    });
    return params;
}
