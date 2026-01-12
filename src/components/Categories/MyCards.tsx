import React, { useMemo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import pieces from "@json/pieces.json";
import { Pieces, normalizePieces } from "@/types/portfolio";
import { PieceCard } from "@/components/Categories/PieceCard";

const piecesData: Pieces = normalizePieces(pieces);

type MyCardsProps = {
    pageCategory: string;
};

export function MyCards({ pageCategory }: MyCardsProps) {
    const router = useRouter();

    const cards = useMemo(() => piecesData[pageCategory] ?? [], [pageCategory]);

    return (
        <View className="w-full">
            <View className="flex flex-row flex-wrap justify-center gap-x-[2%] w-full">
                {cards.map((element) => {
                    const badge = element.isFeatured ? "Featured" : element.inProgress ? "In Progress" : null;
                    const imageSource = element.gif || element.picture;

                    return (
                        <PieceCard
                            key={element.title}
                            title={element.displayTitle || element.title}
                            caption={element.caption}
                            imageSource={imageSource}
                            badgeText={badge ?? undefined}
                            onPress={() => router.push(`/portfolio/${pageCategory}/${element.title}` as any)}
                            className="w-full sm:w-[48%] lg:w-[31%]"
                        />
                    );
                })}
            </View>
        </View>
    );
}
