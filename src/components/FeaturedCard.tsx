import React, { useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import pieces from "@json/pieces.json";
import { Pieces, normalizePieces } from "@/types/portfolio";
import { PieceCard } from "@/components/Categories/PieceCard";

const piecesData: Pieces = normalizePieces(pieces);

export function FeaturedCard() {
    const router = useRouter();

    const featured = useMemo(() => {
        const collected: { category: string; title: string; displayTitle?: string; caption?: string; gif?: string; picture?: string }[] = [];
        Object.keys(piecesData).forEach((category) => {
            piecesData[category].forEach((element) => {
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
    }, []);

    return (
        <View className="w-full items-center flex flex-row flex-wrap justify-center gap-x-[3%] gap-y-[4%]">
                {featured.map((item) => {
                    const imageSource = item.gif || item.picture;

                    return (
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
                    );
                })}
        </View>
    );
}
