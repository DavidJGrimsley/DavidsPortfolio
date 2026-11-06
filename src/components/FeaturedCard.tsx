import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { View, Pressable, Platform, Animated } from "react-native";
import { useRouter } from "expo-router";
import pieces from "@json/pieces.json";
import { Pieces, normalizePieces } from "@/types/portfolio";
import { PieceCard } from "@/components/Categories/PieceCard";
import HydratedIonicon from "@/components/UI/HydratedIonicon";
import { ThemedText } from "@/components/UI/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

const piecesData: Pieces = normalizePieces(pieces);

export function FeaturedCard({ data }: { data?: Partial<Pieces> } = {}) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [fadeAnim] = useState(() => new Animated.Value(1));
    const touchStartX = useRef<number | null>(null);

    const textColor = useThemeColor({}, 'text');
    const inverseTextColor = useThemeColor({}, 'whiteOrBlack');

    const sourceData = data || piecesData;

    const featured = useMemo(() => {
        const collected: { category: string; title: string; displayTitle?: string; caption?: string; gif?: string; picture?: string }[] = [];
        Object.keys(sourceData).forEach((category) => {
            sourceData[category]?.forEach((element) => {
                if (element.isFeatured) {
                    collected.push({
                        category,
                        title: element.title,
                        displayTitle: element.displayTitle,
                        caption: element.caption,
                        gif: element.gif,
                        picture: element.picture,
                    });
                }
            });
        });
        return collected;
    }, [sourceData]);

    const goToNext = useCallback(() => {
        if (featured.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, [featured.length]);

    const goToPrev = useCallback(() => {
        if (featured.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length);
    }, [featured.length]);

    const goToIndex = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    // Trigger subtle fade transition when currentIndex changes
    useEffect(() => {
        fadeAnim.setValue(0.7);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    }, [currentIndex, fadeAnim]);

    // 20-second auto-advance timer, resets when currentIndex changes or pauses when hovered
    useEffect(() => {
        if (isHovered || featured.length <= 1) return;

        const timer = setInterval(() => {
            goToNext();
        }, 20_000);

        return () => clearInterval(timer);
    }, [isHovered, featured.length, currentIndex, goToNext]);

    if (featured.length === 0) {
        return null;
    }

    // Single featured piece: render directly without carousel controls or timer
    if (featured.length === 1) {
        const item = featured[0];
        const imageSource = item.gif || item.picture;

        return (
            <View className="w-full items-center flex flex-row flex-wrap justify-center gap-x-[3%] gap-y-[4%]">
                <PieceCard
                    key={`${item.category}-${item.title}`}
                    title={item.displayTitle || item.title}
                    caption={item.caption}
                    imageSource={imageSource}
                    onPress={() => router.push(`/portfolio/${item.category}/${item.title}` as any)}
                    squareImage
                    horizontalOnLargeScreens
                    className="w-[90%] max-w-[320px] sm:w-[80%] sm:max-w-[440px] lg:w-[90%] lg:max-w-[760px] xl:max-w-[880px]"
                    titleClassName="featured-card-title"
                    captionClassName="featured-card-caption"
                />
            </View>
        );
    }

    // Multiple featured pieces: Carousel with minimal controls and swipe gesture support
    const currentItem = featured[currentIndex] || featured[0];
    const imageSource = currentItem.gif || currentItem.picture;

    const handleTouchStart = (e: any) => {
        touchStartX.current = e.nativeEvent?.pageX ?? null;
    };

    const handleTouchEnd = (e: any) => {
        if (touchStartX.current === null) return;
        const currentX = e.nativeEvent?.pageX ?? touchStartX.current;
        const diff = touchStartX.current - currentX;
        if (diff > 45) {
            goToNext();
        } else if (diff < -45) {
            goToPrev();
        }
        touchStartX.current = null;
    };

    return (
        <View
            testID="featured-carousel-container"
            className="w-full items-center flex flex-col justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onPointerEnter={() => setIsHovered(true)}
            onPointerLeave={() => setIsHovered(false)}
            {...(Platform.OS === 'web'
                ? {
                      onMouseEnter: () => setIsHovered(true),
                      onMouseLeave: () => setIsHovered(false),
                  }
                : {})}
        >
            <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
                <PieceCard
                    key={`${currentItem.category}-${currentItem.title}`}
                    title={currentItem.displayTitle || currentItem.title}
                    caption={currentItem.caption}
                    imageSource={imageSource}
                    onPress={() => router.push(`/portfolio/${currentItem.category}/${currentItem.title}` as any)}
                    squareImage
                    horizontalOnLargeScreens
                    className="w-[90%] max-w-[320px] sm:w-[80%] sm:max-w-[440px] lg:w-[90%] lg:max-w-[760px] xl:max-w-[880px]"
                    titleClassName="featured-card-title"
                    captionClassName="featured-card-caption"
                />
            </Animated.View>

            {/* Minimal controls beneath card */}
            <View className="flex-row items-center justify-center gap-4 mt-1 mb-3">
                <Pressable
                    testID="featured-carousel-prev"
                    accessibilityRole="button"
                    accessibilityLabel="Previous featured project"
                    onPress={goToPrev}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-2.5 rounded-full bg-themed border border-themed/20 shadow-sm active:opacity-70"
                >
                    <HydratedIonicon name="chevron-back" size={18} color={textColor} />
                </Pressable>

                <View className="flex-row items-center gap-2 px-1" accessibilityRole="tablist">
                    {featured.map((item, idx) => {
                        const isActive = idx === currentIndex;
                        return (
                            <Pressable
                                key={`${item.category}-${item.title}`}
                                testID={`featured-carousel-dot-${idx}`}
                                accessibilityRole="tab"
                                accessibilityLabel={`Go to featured project ${idx + 1} of ${featured.length}: ${item.displayTitle || item.title}`}
                                accessibilityState={{ selected: isActive }}
                                onPress={() => goToIndex(idx)}
                                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                                className={`h-2.5 rounded-full transition-all ${
                                    isActive ? 'w-6 bg-tint' : 'w-2.5 bg-themed border border-themed/30 opacity-60'
                                }`}
                            />
                        );
                    })}
                </View>

                <Pressable
                    testID="featured-carousel-next"
                    accessibilityRole="button"
                    accessibilityLabel="Next featured project"
                    onPress={goToNext}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full bg-tint shadow-sm active:opacity-80"
                >
                    <ThemedText inverse className="text-xs font-semibold tracking-wide">
                        Next
                    </ThemedText>
                    <HydratedIonicon name="chevron-forward" size={16} color={inverseTextColor} />
                </Pressable>
            </View>
        </View>
    );
}
